"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, Camera } from "lucide-react";
import { createLogAction, type LogFormState } from "../../../actions";

type Props = { params: Promise<{ id: string }> };

export default function NewLogPage({ params }: Props) {
  const { id } = use(params);
  const [state, action, pending] = useActionState(createLogAction.bind(null, id), {} satisfies LogFormState);

  return (
    <div className="space-y-4">
      <Link href={`/assets/${id}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Wrench className="h-5 w-5" />
          Catat Servis
        </h1>
        <p className="text-sm text-slate-500">Simpan pemeliharaan untuk unit ini.</p>
      </div>

      <form action={action} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="log_type" className="block text-sm font-medium text-slate-700">
            Jenis servis
          </label>
          <select
            id="log_type"
            name="log_type"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="rutin">Rutin (jadwal)</option>
            <option value="perbaikan">Perbaikan</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="hm" className="block text-sm font-medium text-slate-700">
            Jam meter saat ini (HM)
          </label>
          <input
            id="hm"
            name="hm"
            type="number"
            inputMode="numeric"
            required
            min={0}
            step="any"
            placeholder="cth: 8420"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="cost" className="block text-sm font-medium text-slate-700">
            Biaya (Rp)
          </label>
          <input
            id="cost"
            name="cost"
            type="number"
            inputMode="numeric"
            min={0}
            step="any"
            placeholder="0"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            Catatan / pekerjaan
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="cth: Ganti filter oli, cek selang hidrolik"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="photos" className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Camera className="h-4 w-4" />
            Foto (opsional, max 5MB/foto)
          </label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full min-h-11 rounded-lg bg-slate-800 px-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan Servis"}
        </button>
      </form>
    </div>
  );
}
