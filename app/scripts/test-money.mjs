/** 纯 Node 冒烟：node scripts/test-money.mjs（无需 vitest） */
function yuanToCents(yuan) {
  const n = typeof yuan === "string" ? Number(String(yuan).replace(/,/g, "").trim()) : yuan;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
function centsToYuan(cents) {
  return (cents || 0) / 100;
}

const cases = [
  [800, 80000],
  ["500", 50000],
  ["1,000", 100000],
  [0.1, 10],
  [10.55, 1055],
];
let failed = 0;
for (const [y, expect] of cases) {
  const got = yuanToCents(y);
  if (got !== expect) {
    console.error("FAIL yuanToCents", y, got, expect);
    failed++;
  }
}
if (centsToYuan(80000) !== 800) {
  console.error("FAIL centsToYuan");
  failed++;
}
if (failed) {
  process.exit(1);
}
console.log("money ok", cases.length + 1, "asserts");
