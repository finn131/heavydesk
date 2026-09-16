"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-800">Terjadi kesalahan</h1>
      <p className="mt-2 text-sm text-slate-500">Silakan coba lagi.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 min-h-11 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700"
      >
        Coba lagi
      </button>
    </main>
  );
}
