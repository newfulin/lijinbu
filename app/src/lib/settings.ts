export function asBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.replace(/^"|"$/g, "");
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return fallback;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function shouldAnimate(reduceMotionSetting: boolean): boolean {
  return !reduceMotionSetting && !prefersReducedMotion();
}


/** 常用金额 chips，设置键 quick_amounts。默认 200,300,500,600,800,1000 */
export const DEFAULT_QUICK_AMOUNTS = [200, 300, 500, 600, 800, 1000];

export function parseQuickAmounts(raw: unknown): number[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string") {
    const s = raw.trim().replace(/^"|"$/g, "");
    if (s.startsWith("[")) {
      try {
        const j = JSON.parse(s);
        if (Array.isArray(j)) arr = j;
      } catch {
        arr = s.split(/[,，\s]+/);
      }
    } else {
      arr = s.split(/[,，\s]+/);
    }
  }
  const nums = arr
    .map((x) => (typeof x === "number" ? x : Number(String(x).trim())))
    .filter((n) => Number.isFinite(n) && n > 0)
    .map((n) => Math.round(n));
  return nums.length ? [...new Set(nums)] : [...DEFAULT_QUICK_AMOUNTS];
}

export function formatQuickAmounts(nums: number[]): string {
  return nums.join(",");
}
