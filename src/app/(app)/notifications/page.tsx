import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { markAllReadAction } from "./actions";
import { idDate } from "@/lib/format";

type Notif = { id: string; message: string; read: boolean; created_at: string };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: all } = await supabase
    .from("notifications")
    .select("id, message, read, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (all ?? []) as Notif[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Bell className="h-5 w-5" />
          Notifikasi
        </h1>
        {notifications.length > 0 && (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="flex min-h-11 items-center gap-1 rounded-lg bg-slate-800 px-3 text-sm font-medium text-white hover:bg-slate-700"
            >
              <CheckCheck className="h-4 w-4" />
              Tandai dibaca
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
          Belum ada notifikasi.
        </p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl bg-white p-4 shadow-sm ${n.read ? "" : "border-l-4 border-amber-400"}`}
            >
              <p className={`text-sm ${n.read ? "text-slate-600" : "font-medium text-slate-800"}`}>
                {n.message}
              </p>
              <p className="mt-1 text-xs text-slate-400">{idDate(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
