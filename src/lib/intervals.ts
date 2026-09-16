export const SERVICE_INTERVALS: Record<string, { hm: number; days: number }> = {
  excavator: { hm: 500, days: 90 },
  loader: { hm: 500, days: 90 },
  bulldozer: { hm: 500, days: 90 },
  crane: { hm: 250, days: 180 },
  forklift: { hm: 250, days: 90 },
  "dump truck": { hm: 250, days: 180 },
  "motor grader": { hm: 500, days: 90 },
  other: { hm: 500, days: 90 },
};

export const DEFAULT_INTERVAL = { hm: 500, days: 90 };

export function computeNextDue(
  base: { hm: number; date: string },
  category: string | null
): { dueHm: number | null; dueDate: string } {
  const iv = (category && SERVICE_INTERVALS[category]) || DEFAULT_INTERVAL;
  const d = new Date(base.date);
  d.setUTCDate(d.getUTCDate() + iv.days);
  return { dueHm: base.hm + iv.hm, dueDate: d.toISOString().slice(0, 10) };
}