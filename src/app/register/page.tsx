"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, {} satisfies RegisterState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form action={action} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold text-slate-800">Register HeavyDesk</h1>

        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nama
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        {state.info && (
          <p className="text-sm text-emerald-600">{state.info}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full min-h-11 rounded-lg bg-slate-800 px-3 text-sm text-white font-medium hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "Mendaftar..." : "Register"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <a href="/login" className="text-slate-800 underline">
            Login
          </a>
        </p>
      </form>
    </main>
  );
}
