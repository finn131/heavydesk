export const CATEGORIES = [
  "excavator",
  "loader",
  "bulldozer",
  "crane",
  "forklift",
  "dump truck",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];
