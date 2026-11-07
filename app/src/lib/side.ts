/** 流水归属 side：male=男方 | female=女方 | joint=共同 | null/空=不区分 */

export type SideValue = "male" | "female" | "joint" | "";

export const SIDE_OPTIONS: { value: SideValue; label: string }[] = [
  { value: "", label: "不区分" },
  { value: "male", label: "男方" },
  { value: "female", label: "女方" },
  { value: "joint", label: "共同" },
];

export function sideLabel(side: string | null | undefined): string {
  if (!side) return "不区分";
  const hit = SIDE_OPTIONS.find((o) => o.value === side);
  return hit?.label ?? "不区分";
}

export function normalizeSide(raw: string | null | undefined): SideValue {
  const s = (raw ?? "").trim();
  if (s === "male" || s === "男方" || s === "男") return "male";
  if (s === "female" || s === "女方" || s === "女") return "female";
  if (s === "joint" || s === "共同" || s === "双方") return "joint";
  return "";
}
