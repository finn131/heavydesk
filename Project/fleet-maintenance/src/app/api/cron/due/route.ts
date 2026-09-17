import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DUE_WINDOW_DAYS = 7;

function wibDay(date: Date): string {
  return new Date(date.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const secret = process.env.VERCEL_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = wibDay(new Date());

  const windowDate = new Date();
  windowDate.setUTCHours(0, 0, 0, 0);
  windowDate.setUTCDate(windowDate.getUTCDate() + DUE_WINDOW_DAYS);

  const { data: assets, error } = await supabase
    .from("assets")
    .select("id, org_id, unit_no, next_due_date")
    .not("next_due_date", "is", null)
    .lte("next_due_date", windowDate.toISOString().slice(0, 10));

  if (error) {
    console.error("cron: assets query failed", error.message);
    return NextResponse.json({ error: "internal", detail: error.message }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("notifications")
    .select("org_id, message")
    .gte("created_at", `${today}T00:00:00+07:00`);

  const seen = new Set((existing ?? []).map((n) => `${n.org_id}:${n.message}`));

  const rows = (assets ?? []).flatMap((a) => {
    const overdue = a.next_due_date < today;
    const diff = Math.round(
      (new Date(`${a.next_due_date}T00:00:00Z`).getTime() -
        new Date(`${today}T00:00:00Z`).getTime()) /
        86_400_000,
    );
    const message = overdue
      ? `${a.unit_no} overdue sejak ${a.next_due_date}`
      : `${a.unit_no} due dalam ${diff} hari (${a.next_due_date})`;
    if (seen.has(`${a.org_id}:${message}`)) return [];
    seen.add(`${a.org_id}:${message}`);
    return [{ org_id: a.org_id, user_id: null, message }];
  });

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("notifications").insert(rows);
    if (insertError) {
      console.error("cron: insert failed", insertError.message);
      return NextResponse.json({ error: "internal", detail: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ inserted: rows.length });
}
