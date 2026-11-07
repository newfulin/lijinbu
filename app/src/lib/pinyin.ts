import { pinyin } from "pinyin-pro";

export function nameToPinyinFields(name: string): {
  name_pinyin: string;
  name_initials: string;
} {
  const n = name.trim();
  if (!n) return { name_pinyin: "", name_initials: "" };
  const full = pinyin(n, { toneType: "none", type: "array" })
    .join("")
    .toLowerCase()
    .replace(/\s+/g, "");
  const initials = pinyin(n, { pattern: "first", toneType: "none", type: "array" })
    .join("")
    .toLowerCase()
    .replace(/\s+/g, "");
  return { name_pinyin: full, name_initials: initials };
}

export function matchPinyinQuery(
  q: string,
  name: string,
  pinyinFull?: string | null,
  initials?: string | null,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (name.includes(q.trim())) return true;
  if (pinyinFull?.toLowerCase().includes(needle)) return true;
  if (initials?.toLowerCase().includes(needle)) return true;
  return false;
}
