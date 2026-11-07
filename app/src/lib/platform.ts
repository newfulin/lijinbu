/** 跨平台快捷键文案（Mac ⌘ / Windows·Linux Ctrl） */
export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const plat = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
    ?.platform;
  const p = `${plat || ""} ${navigator.platform || ""} ${ua}`;
  return /Mac|iPhone|iPad|iPod/i.test(p);
}

/** 修饰键短标签：⌘ 或 Ctrl */
export function modKeyLabel(): string {
  return isApplePlatform() ? "⌘" : "Ctrl";
}

/** 如 ⌘K / Ctrl+K */
export function chordLabel(...keys: string[]): string {
  const mod = modKeyLabel();
  const rest = keys.join(isApplePlatform() ? "" : "+");
  if (isApplePlatform()) return `${mod}${rest}`;
  return `${mod}+${rest}`;
}

/** Shift 组合：⌘⇧V / Ctrl+Shift+V */
export function shiftChordLabel(...keys: string[]): string {
  if (isApplePlatform()) return `⌘⇧${keys.join("")}`;
  return `Ctrl+Shift+${keys.join("+")}`;
}
