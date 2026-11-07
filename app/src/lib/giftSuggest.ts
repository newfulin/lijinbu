/**
 * 回礼建议：以待还余额（分）为基数，向上取近吉利整百/整十。
 * 优先含 6/8/9 的整百；否则抬到下一整百。
 */

const LUCKY_HUNDREDS = [200, 300, 500, 600, 800, 900, 1000, 1200, 1600, 1800, 2000, 2800, 3000, 6600, 8800];

export function suggestGiftYuan(balanceCents: number): number {
  if (balanceCents <= 0) return 0;
  const yuan = Math.ceil(balanceCents / 100);
  for (const n of LUCKY_HUNDREDS) {
    if (n >= yuan) return n;
  }
  // 更大：抬到下一含 6/8/9 的整百
  let x = Math.ceil(yuan / 100) * 100;
  for (let i = 0; i < 50; i++) {
    const s = String(x);
    if (/[689]/.test(s)) return x;
    x += 100;
  }
  return x;
}

export function suggestGiftCents(balanceCents: number): number {
  return suggestGiftYuan(balanceCents) * 100;
}
