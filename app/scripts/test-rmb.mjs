/** node scripts/test-rmb.mjs */
const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const UNITS = ["", "拾", "佰", "仟"];
const BIG = ["", "万", "亿"];

function sectionToChinese(n) {
  if (n === 0) return "";
  const str = String(n);
  let s = "";
  let zero = false;
  for (let i = 0; i < str.length; i++) {
    const d = Number(str[i]);
    const unit = UNITS[str.length - 1 - i];
    if (d === 0) zero = true;
    else {
      if (zero) s += "零";
      s += DIGITS[d] + unit;
      zero = false;
    }
  }
  return s;
}

function integerToChinese(n) {
  if (n === 0) return "零";
  const parts = [];
  let x = n;
  while (x > 0) {
    parts.push(x % 10000);
    x = Math.floor(x / 10000);
  }
  let out = "";
  let needZero = false;
  for (let i = parts.length - 1; i >= 0; i--) {
    const sec = parts[i];
    if (sec === 0) {
      needZero = out.length > 0;
      continue;
    }
    if (needZero || (out.length > 0 && sec < 1000)) out += "零";
    out += sectionToChinese(sec) + BIG[i];
    needZero = false;
  }
  return out;
}

function rmbUppercase(yuan) {
  if (!Number.isFinite(yuan)) return "零元整";
  const abs = Math.abs(yuan);
  const centsTotal = Math.round(abs * 100);
  const yuanInt = Math.floor(centsTotal / 100);
  const jiao = Math.floor((centsTotal % 100) / 10);
  const fen = centsTotal % 10;
  let out = integerToChinese(yuanInt) + "元";
  if (jiao === 0 && fen === 0) out += "整";
  else {
    if (jiao > 0) out += DIGITS[jiao] + "角";
    else if (fen > 0) out += "零";
    if (fen > 0) out += DIGITS[fen] + "分";
  }
  return out;
}

const cases = [
  [0, "零元整"],
  [10.5, "壹拾元伍角"],
  [200, "贰佰元整"],
  [800, "捌佰元整"],
  [1000, "壹仟元整"],
  [10000, "壹万元整"],
  [1.01, "壹元零壹分"],
  [0.1, "零元壹角"],
  [10008, "壹万零捌元整"],
];

let failed = 0;
for (const [y, expect] of cases) {
  const got = rmbUppercase(y);
  if (got !== expect) {
    console.error("FAIL", y, "got", got, "expect", expect);
    failed++;
  }
}
if (failed) process.exit(1);
console.log("rmb ok", cases.length, "asserts");
