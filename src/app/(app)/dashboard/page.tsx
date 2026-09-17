import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { dueStatus, STATUS_LABEL, STATUS_STYLE, type DueStatus } from "@/lib/status";
import { rupiah, idDate } from "@/lib/format";

type Asset = {
  id: string;
  name: string;
  unit_no: string;
  category: string | null;
  next_due_date: string | null;
};

type Props = { searchParams: Promise<{ tab?: string }> };

const TABS: { key: DueStatus | "all"; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "due", label: "Menjelang due" },
  { key: "overdue", label: "Overdue" },
];

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tab: tabRaw } = await searchParams;
  const tab: DueStatus | "all" = TABS.find((t) => t.key === tabRaw)?.key ?? "all";

  const firstOfMonth = new Date();
  firstOfMonth.setUTCDate(1);
  firstOfMonth.setUTCHours(0, 0, 0, 0);

  const [{ data: assetsData }, { data: logsMonth }, { data: logsAll }] = await Promise.all([
    supabase.from("assets").select("id, name, unit_no, category, next_due_date").order("unit_no"),
    supabase
      .from("maintenance_logs")
      .select("asset_id, cost")
      .gte("created_at", firstOfMonth.toISOString()),
    supabase.from("maintenance_logs").select("asset_id, cost"),
  ]);

  const assets = (assetsData ?? []) as Asset[];
  const monthCost = (logsMonth ?? []).reduce((sum, l) => sum + Number(l.cost ?? 0), 0);

  const costByAsset = new Map<string, number>();
  for (const l of logsAll ?? []) {
    costByAsset.set(l.asset_id, (costByAsset.get(l.asset_id) ?? 0) + Number(l.cost ?? 0));
  }
  const topByMonth = new Map<string, number>();
  for (const l of logsMonth ?? []) {
    topByMonth.set(l.asset_id, (topByMonth.get(l.asset_id) ?? 0) + Number(l.cost ?? 0));
  }

  const statusOf = (a: Asset) => dueStatus(a.next_due_date);
  const overdue = assets.filter((a) => statusOf(a) === "overdue").length;
  const due = assets.filter((a) => statusOf(a) === "due").length;

  const topAssetId =
    [...topByMonth.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topAsset = assets.find((a) => a.id === topAssetId) ?? null;

  const visible = tab === "all" ? assets : assets.filter((a) => statusOf(a) === tab);

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
        <Link href="/dashboard?tab=due" className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-amber-600">{due}</div>
          <div className="text-xs text-slate-500">Menjelang due</div>
        </Link>
        <Link href="/dashboard?tab=overdue" className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{overdue}</div>
          <div className="text-xs text-slate-500">Overdue</div>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Σ biaya bulan ini</div>
          <div className="text-lg font-bold text-slate-800">{rupiah(monthCost)}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Top biaya bulan ini</div>
          <div className="text-lg font-bold text-slate-800">
            {topAsset ? topAsset.unit_no : "—"}
          </div>
          <div className="text-xs text-slate-400">
            {topAsset ? rupiah(topByMonth.get(topAssetId) ?? 0) : "belum ada log"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/dashboard" : `/dashboard?tab=${t.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map((a) => {
          const st = statusOf(a);
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
                  {a.next_due_date ? ` · due ${idDate(a.next_due_date)}` : ""}
                  <span className="ml-2 font-medium text-slate-700">
                    {costByAsset.has(a.id) ? rupiah(costByAsset.get(a.id)!) : "—"}
                  </span>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[st]}`}>
                {STATUS_LABEL[st]}
              </span>
            </Link>
          );
        })}
        {visible.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            {tab === "all" ? (
              <>
                Belum ada unit.{" "}
                <Link href="/assets/new" className="font-medium text-slate-800 underline">
                  Tambah unit pertama
                </Link>
              </>
            ) : (
              <>Tidak ada unit dengan status &quot;{(TABS.find((t) => t.key === tab)?.label)}&quot;.</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
