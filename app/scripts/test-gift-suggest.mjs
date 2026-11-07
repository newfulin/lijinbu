function suggestGiftYuan(balanceCents) {
  if (balanceCents <= 0) return 0;
  const yuan = Math.ceil(balanceCents / 100);
  const LUCKY = [200, 300, 500, 600, 800, 900, 1000, 1200, 1600, 1800, 2000, 2800, 3000, 6600, 8800];
  for (const n of LUCKY) if (n >= yuan) return n;
  let x = Math.ceil(yuan / 100) * 100;
  for (let i = 0; i < 50; i++) {
    if (/[689]/.test(String(x))) return x;
    x += 100;
  }
  return x;
}

const cases = [
  [60000, 600],
  [30000, 300],
  [1, 200],
  [0, 0],
  [100000, 1000],
];
let failed = 0;
for (const [cents, expect] of cases) {
  const got = suggestGiftYuan(cents);
  if (got !== expect) {
    console.error("FAIL", cents, got, expect);
    failed++;
  }
}
if (failed) process.exit(1);
console.log("giftSuggest ok", cases.length);
