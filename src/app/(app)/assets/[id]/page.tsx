import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SquarePen } from "lucide-react";
import QRPanel from "@/components/QRPanel";
import DeleteAssetButton from "@/components/DeleteAssetButton";
import { dueStatus, STATUS_LABEL, STATUS_STYLE } from "@/lib/status";
import { deleteAssetAction } from "../actions";
import { rupiah } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };
type Asset = {
  id: string;
  name: string;
  unit_no: string;
  category: string | null;
  hm_initial: number | null;
  hm_current: number | null;
  next_due_date: string | null;
};

export default async function AssetDetailPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const [assetRaw, logsRaw] = await Promise.all([
    supabase
      .from("assets")
      .select("id, name, unit_no, category, hm_initial, hm_current, next_due_date, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("maintenance_logs")
      .select("service_date, description, cost")
      .eq("asset_id", id)
      .order("service_date", { ascending: false }),
  ]);

  const asset = assetRaw.data as Asset | null;
  if (!asset) redirect("/assets");

  const logs = (logsRaw.data ?? []) as { service_date: string; description: string; cost: number | null }[];
  const totalCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const st = dueStatus(asset.next_due_date);

  return (
    <div className="space-y-4">
      <Link href="/assets" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <div className="flex items-start justify-between rounded-xl bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">
              {asset.unit_no} · {asset.name}
            </h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[st]}`}>
              {STATUS_LABEL[st]}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Kategori</dt>
              <dd className="text-slate-800">{asset.category ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Jam meter</dt>
              <dd className="text-slate-800">{(asset.hm_current ?? asset.hm_initial ?? 0).toLocaleString("id-ID")} HM</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Jadwal servis</dt>
              <dd className="text-slate-800">{asset.next_due_date ?? "belum"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Total biaya servis</dt>
              <dd className="font-medium text-slate-800">{rupiah(totalCost)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Riwayat servis</dt>
              <dd className="text-slate-800">{logs.length}×</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <SquarePen className="h-4 w-4 text-slate-400" />
          QR Unit
        </h2>
        <QRPanel assetId={asset.id} label={asset.unit_no} />
      </div>

      <div className="flex justify-end">
        <DeleteAssetButton action={deleteAssetAction.bind(null, asset.id)} />
      </div>

      {logs.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Riwayat Servis</h2>
          <ul className="space-y-2 text-sm">
            {logs.map((l, i) => (
              <li key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div>
                  <div className="font-medium text-slate-800">{l.description || "Servis"}</div>
                  <div className="text-xs text-slate-500">{l.service_date}</div>
                </div>
                <span className="text-slate-800">{rupiah(l.cost ?? 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
