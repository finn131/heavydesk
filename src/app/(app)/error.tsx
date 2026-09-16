"use client";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div className="rounded-xl bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">Terjadi kesalahan</h2>
      <p className="mt-1 text-sm text-slate-500">Coba muat ulang halaman ini.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 min-h-11 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700"
      >
        Coba lagi
      </button>
    </div>
  );
}
