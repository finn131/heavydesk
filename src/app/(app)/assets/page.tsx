import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { dueStatus, STATUS_LABEL, STATUS_STYLE } from "@/lib/status";

type Asset = { id: string; name: string; unit_no: string; category: string | null; next_due_date: string | null };

export default async function AssetsPage() {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Unit</h1>
          <p className="text-sm text-slate-500">Semua unit armada ({assets.length}).</p>
        </div>
        <Link
          href="/assets/new"
          className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Unit
        </Link>
      </div>

      <div className="space-y-2">
        {assets.map((a) => {
          const st = dueStatus(a.next_due_date);
          return (
            <Link
              key={a.id}
              href={`/assets/${a.id}`}
              className="block rounded-xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-800">
                  {a.unit_no} · {a.name}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[st]}`}>
                  {STATUS_LABEL[st]}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {a.category ?? "—"}
                {a.next_due_date ? ` · jadwal servis ${a.next_due_date}` : ""}
              </div>
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
