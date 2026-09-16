"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-800">404</h1>
      <p className="mt-2 text-sm text-slate-500">Halaman tidak ditemukan.</p>
      <Link href="/dashboard" className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
        Kembali ke Dashboard
      </Link>
    </main>
  );
}
