const DEFAULT = [200, 300, 500, 600, 800, 1000];
function parseQuickAmounts(raw) {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string") {
    const s = raw.trim().replace(/^"|"$/g, "");
    if (s.startsWith("[")) {
      try { const j = JSON.parse(s); if (Array.isArray(j)) arr = j; } catch { arr = s.split(/[,，\s]+/); }
    } else if (!s) arr = [];
    else arr = s.split(/[,，\s]+/);
  }
  const nums = arr.map((x) => (typeof x === "number" ? x : Number(String(x).trim()))).filter((n) => Number.isFinite(n) && n > 0).map((n) => Math.round(n));
  return nums.length ? [...new Set(nums)] : [...DEFAULT];
}
let failed = 0;
function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) { console.error("FAIL", msg, a, b); failed++; }
}
eq(parseQuickAmounts("200,300,500"), [200, 300, 500], "csv");
eq(parseQuickAmounts("[600, 800]"), [600, 800], "json");
eq(parseQuickAmounts(""), DEFAULT, "default");
if (failed) process.exit(1);
console.log("quick ok", 3, "asserts");
