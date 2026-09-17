import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csvField(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return /[\s,"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/assets/[id]/export">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("unit_no")
    .eq("id", id)
    .single();
  if (assetError || !asset) {
    return NextResponse.json({ error: "asset not found" }, { status: 404 });
  }

  const { data: logs } = await supabase
    .from("maintenance_logs")
    .select("created_at, log_type, hm, cost, notes")
    .eq("asset_id", id)
    .order("created_at", { ascending: false });

  const rows = (logs ?? []).map((l) =>
    [
      l.created_at.slice(0, 10),
      l.log_type === "perbaikan" ? "Perbaikan" : "Rutin",
      l.hm,
      l.cost,
      l.notes,
    ]
      .map(csvField)
      .join(","),
  );

  const body = ["\uFEFFTanggal,Jenis,HM,Biaya,Catatan", ...rows].join("\n");
  const filename = `${asset.unit_no.replace(/[^a-zA-Z0-9_-]/g, "-")}-maintenance.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
