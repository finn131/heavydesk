"use client";

import { useActionState } from "react";
import { createAssetAction, type AssetFormState } from "../actions";
import { CATEGORIES } from "@/lib/categories";

export default function NewAssetPage() {
  const [state, action, pending] = useActionState(createAssetAction, {} satisfies AssetFormState);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Unit Baru</h1>
        <p className="text-sm text-slate-500">Daftarkan alat berat ke armada.</p>
      </div>

      <form action={action} className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nama unit
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="cth: Excavator PC200"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="unit_no" className="block text-sm font-medium text-slate-700">
            Nomor unit
          </label>
          <input
            id="unit_no"
            name="unit_no"
            type="text"
            required
            placeholder="cth: EX-01"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Kategori
          </label>
          <select
            id="category"
            name="category"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">— pilih —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="hm_initial" className="block text-sm font-medium text-slate-700">
            Jam meter awal (HM)
          </label>
          <input
            id="hm_initial"
            name="hm_initial"
            type="number"
            inputMode="numeric"
            min={0}
            step="any"
            defaultValue={0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan Unit"}
        </button>
      </form>
    </div>
  );
}
