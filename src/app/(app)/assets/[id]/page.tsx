import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, SquarePen, Plus, Wrench } from "lucide-react";
import QRPanel from "@/components/QRPanel";
import DeleteAssetButton from "@/components/DeleteAssetButton";
import { dueStatusHm, STATUS_LABEL, STATUS_STYLE } from "@/lib/status";
import { deleteAssetAction } from "../actions";
import { rupiah } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };
type Asset = {
  id: string;
  name: string;
  unit_no: string;
  category: string | null;
  hm_initial: number | null;
  next_due_hm: number | null;
  next_due_date: string | null;
};
type LogRow = {
  id: string;
  created_at: string;
  log_type: string;
  hm: number | null;
  cost: number | null;
  notes: string | null;
  photos: { storage_path: string }[] | null;
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
      .select("id, name, unit_no, category, hm_initial, next_due_hm, next_due_date")
      .eq("id", id)
      .single(),
    supabase
      .from("maintenance_logs")
      .select("id, created_at, log_type, hm, cost, notes, photos(storage_path)")
      .eq("asset_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const asset = assetRaw.data as Asset | null;
  if (!asset) redirect("/assets");

  const logs = (logsRaw.data ?? []) as LogRow[];
  const totalCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const currentHm = logs.find((l) => l.hm != null)?.hm ?? asset.hm_initial ?? 0;
  const st = dueStatusHm(asset.next_due_date, asset.next_due_hm, currentHm);

  const photoPaths = [...new Set(logs.flatMap((l) => l.photos ?? []).map((p) => p.storage_path))];
  const signed: Record<string, string> = {};
  if (photoPaths.length > 0) {
    const { data } = await supabase.storage.from("fotos").createSignedUrls(photoPaths, 3600);
    for (const s of data ?? []) if (s.signedUrl && s.path) signed[s.path] = s.signedUrl;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/assets" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <Link
          href={`/assets/${asset.id}/log/new`}
          className="flex min-h-11 items-center gap-1 rounded-lg bg-slate-800 px-3 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Catat Servis
        </Link>
      </div>

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
              <dd className="text-slate-800">{currentHm.toLocaleString("id-ID")} HM</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Jadwal servis</dt>
              <dd className="text-slate-800">
                {asset.next_due_date ?? "belum"}
                {asset.next_due_hm != null && ` · ${asset.next_due_hm.toLocaleString("id-ID")} HM`}
              </dd>
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

      <div className="rounded-xl bg-white p-5 shadow-sm" id="riwayat">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Wrench className="h-4 w-4 text-slate-400" />
          Riwayat Servis
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada riwayat servis.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {l.log_type === "perbaikan" ? "Perbaikan" : "Rutin"}
                    </span>
                    <div className="mt-1 font-medium text-slate-800">{l.notes || "Servis"}</div>
                    <div className="text-xs text-slate-500">
                      {l.created_at.slice(0, 10)} · {l.hm != null ? `${l.hm.toLocaleString("id-ID")} HM` : "HM —"}
                    </div>
                  </div>
                  <span className="whitespace-nowrap font-medium text-slate-800">{rupiah(l.cost ?? 0)}</span>
                </div>
                {l.photos && l.photos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {l.photos.map((p) =>
                      signed[p.storage_path] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.storage_path}
                          src={signed[p.storage_path]}
                          alt="Foto servis"
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      ) : null,
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
