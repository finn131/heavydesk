export type DueStatus = "ok" | "due" | "overdue" | "none";

const DAYS_WARN = 7;

export function dueStatus(nextDueDate: string | null | undefined): DueStatus {
  if (!nextDueDate) return "none";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(`${nextDueDate}T00:00:00`);
  const diff = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  if (diff < 0) return "overdue";
  if (diff <= DAYS_WARN) return "due";
  return "ok";
}

export const STATUS_LABEL: Record<DueStatus, string> = {
  ok: "Aman",
  due: "Menjelang due",
  overdue: "Overdue",
  none: "Belum terjadwal",
};

export const STATUS_STYLE: Record<DueStatus, string> = {
  ok: "bg-emerald-100 text-emerald-700",
  due: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  none: "bg-slate-100 text-slate-500",
};
