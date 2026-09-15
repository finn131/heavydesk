import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { dueStatus, STATUS_LABEL, STATUS_STYLE } from "@/lib/status";

type Asset = { id: string; name: string; unit_no: string; category: string | null; next_due_date: string | null };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("assets")
    .select("id, name, unit_no, category, next_due_date")
    .order("unit_no");

  const assets = (data ?? []) as Asset[];
  const byStatus = (s: ReturnType<typeof dueStatus>) =>
    assets.filter((a) => dueStatus(a.next_due_date) === s);
  const due = byStatus("due").length;
  const overdue = byStatus("overdue").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan armada.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/assets" className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-slate-800">{assets.length}</div>
          <div className="text-xs text-slate-500">Unit</div>
        </Link>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{due}</div>
          <div className="text-xs text-slate-500">Menjelang due</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{overdue}</div>
          <div className="text-xs text-slate-500">Overdue</div>
        </div>
      </div>

      <div className="space-y-2">
        {assets.slice(0, 6).map((a) => {
          const st = dueStatus(a.next_due_date);
          return (
            <Link
              key={a.id}
              href={`/assets/${a.id}`}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
            >
              <div>
                <div className="font-semibold text-slate-800">
                  {a.unit_no} · {a.name}
                </div>
                <div className="text-xs text-slate-500">
                  {a.category ?? "—"}
                  {a.next_due_date ? ` · due ${a.next_due_date}` : ""}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[st]}`}>
                {STATUS_LABEL[st]}
              </span>
            </Link>
          );
        })}
        {assets.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Belum ada unit.{" "}
            <Link href="/assets/new" className="font-medium text-slate-800 underline">
              Tambah unit pertama
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
