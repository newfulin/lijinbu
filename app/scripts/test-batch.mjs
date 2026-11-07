/** node scripts/test-batch.mjs */
const DIR_IN = /^(收礼|收入|收|in)$/i;
const DIR_OUT = /^(送礼|支出|送|out)$/i;

function parseAmount(tok) {
  const n = Number(String(tok).replace(/[,￥¥元]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseBatchLine(raw, lineNo) {
  const trimmed = raw.trim();
  const base = {
    lineNo,
    raw: trimmed,
    ok: false,
    contact_name: "",
    direction: "in",
    amount_yuan: 0,
    event_title: null,
    skip: false,
  };
  if (!trimmed || trimmed.startsWith("#")) {
    return { ...base, ok: false, error: "空行", skip: true };
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { ...base, error: "至少需要「姓名 金额」" };
  const name = parts[0];
  let direction = "in";
  let amountIdx = 1;
  let eventStart = 2;
  if (parts.length >= 3 && (DIR_IN.test(parts[1]) || DIR_OUT.test(parts[1]))) {
    direction = DIR_OUT.test(parts[1]) ? "out" : "in";
    amountIdx = 2;
    eventStart = 3;
  }
  const amount = parseAmount(parts[amountIdx] ?? "");
  if (amount == null) return { ...base, contact_name: name, error: "金额无效" };
  const eventParts = parts.slice(eventStart);
  return {
    ...base,
    ok: true,
    contact_name: name,
    direction,
    amount_yuan: amount,
    event_title: eventParts.length ? eventParts.join(" ") : null,
  };
}

function parseBatchText(text) {
  return text
    .split(/\r?\n/)
    .map((line, i) => parseBatchLine(line, i + 1))
    .filter((r) => !(r.skip && r.error === "空行"));
}

const sample = `周八 800
吴九 收礼 500 结婚
郑十 送礼 200 探望
坏数据abc`;

const rows = parseBatchText(sample);
const ok = rows.filter((r) => r.ok);
const bad = rows.filter((r) => !r.ok);
let failed = 0;
if (ok.length !== 3) {
  console.error("expect 3 ok, got", ok.length);
  failed++;
}
if (bad.length !== 1) {
  console.error("expect 1 bad, got", bad.length);
  failed++;
}
if (ok[2]?.direction !== "out" || ok[2]?.amount_yuan !== 200) {
  console.error("郑十 parse fail", ok[2]);
  failed++;
}
if (failed) process.exit(1);
console.log("batch ok", rows.length, "rows");
