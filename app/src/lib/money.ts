/** 元 ↔ 分；金额以整数分入库，避免浮点误差 */

export function yuanToCents(yuan: number | string): number {
  const n = typeof yuan === "string" ? Number(yuan.replace(/,/g, "").trim()) : yuan;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsToYuan(cents: number): number {
  return (cents || 0) / 100;
}

export function formatYuan(cents: number, withSign = false, direction?: "in" | "out"): string {
  const abs = Math.abs(centsToYuan(cents));
  const body = abs.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (!withSign) return `¥${body}`;
  const sign = direction === "out" || cents < 0 ? "−" : "+";
  return `${sign}¥${body}`;
}

export function parseYuanInput(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").replace(/¥/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
