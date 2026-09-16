import { createClient } from "@/lib/supabase/server";
import { Cog, ScanLine, LayoutDashboard, LogOut, Bell } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "./actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, role, org:organizations(name)")
      .eq("id", data.user.id)
      .single(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .or(`user_id.eq.${data.user.id},user_id.is.null`),
  ]);

  const profileTyped = profile as { name: string | null; role: string; org: { name: string } | null } | null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-800">
            <Cog className="h-5 w-5 text-slate-500" />
            HeavyDesk
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/assets"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              <Cog className="h-4 w-4" />
              <span className="hidden sm:inline">Unit</span>
            </Link>
            <Link
              href="/scan"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </Link>

            <Link
              href="/notifications"
              className="relative ml-1 flex items-center rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              title="Notifikasi"
            >
              <Bell className="h-4 w-4" />
              {count ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              ) : null}
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Keluar"
                className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-500 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </nav>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-2 text-xs text-slate-500">
          {profileTyped?.org?.name ?? "—"} · {profileTyped?.role === "admin" ? "Admin" : "Operator"}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}
