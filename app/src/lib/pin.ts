/** 本地 PIN：SHA-256(salt:pin)，存 settings.pin_hash / pin_salt */

function bytesToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return bytesToHex(a.buffer);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const dig = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(dig);
}

export async function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  if (!pin || !salt || !expectedHash) return false;
  const got = await hashPin(pin, salt);
  return got === expectedHash;
}

export function isPinSet(settings: Record<string, unknown> | undefined | null): boolean {
  const h = settings?.pin_hash;
  if (typeof h !== "string") return false;
  const s = h.replace(/^"|"$/g, "").trim();
  return s.length > 0;
}

export function settingText(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v.replace(/^"|"$/g, "");
  if (typeof v === "number") return String(v);
  return fallback;
}

export function settingInt(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v.replace(/^"|"$/g, ""));
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

const SESSION_KEY = "lijinbu_pin_unlocked";

export function readSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSessionUnlocked(v: boolean) {
  try {
    if (v) sessionStorage.setItem(SESSION_KEY, "1");
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
