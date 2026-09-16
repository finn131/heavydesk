"use client";

import { useRouter } from "next/navigation";

export default function AppNotFound() {
  const router = useRouter();
  return (
    <div className="rounded-xl bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">Halaman tidak ditemukan</h2>
      <p className="mt-1 text-sm text-slate-500">Unit atau halaman yang kamu cari tidak ada.</p>
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="mt-4 min-h-11 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700"
      >
        Kembali ke Dashboard
      </button>
    </div>
  );
}
