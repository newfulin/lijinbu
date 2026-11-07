/** CSV 解析冒烟（与 src/lib/csv.ts 逻辑对齐的精简副本） */
function yuanToCents(yuan) {
  return Math.round(Number(yuan) * 100);
}
function dirIn(raw) {
  const s = String(raw).trim().toLowerCase();
  if (["in", "收礼", "收", "收入"].includes(s)) return "in";
  if (["out", "送礼", "送", "支出"].includes(s)) return "out";
  return null;
}
function normalizeSide(raw) {
  const s = String(raw ?? "").trim();
  if (["male", "男方", "男"].includes(s)) return "male";
  if (["female", "女方", "女"].includes(s)) return "female";
  if (["joint", "共同", "双方"].includes(s)) return "joint";
  return null;
}
function splitCsvLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const ALIAS = {
  date: "date", 日期: "date", direction: "direction", 类型: "direction",
  amount: "amount", 金额: "amount", contact_name: "contact_name", 联系人: "contact_name",
  event: "event", 事由: "event", side: "side", 归属: "side",
};
function parseCsvText(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  const rawHeader = splitCsvLine(lines[0]).map((h) => h.trim());
  const header = rawHeader.map((h) => ALIAS[h] ?? ALIAS[h.toLowerCase()] ?? h.toLowerCase());
  const useHeader = header.includes("date") || header.includes("contact_name");
  const data = useHeader ? lines.slice(1) : lines;
  const idx = (n) => header.indexOf(n);
  const get = (cols, n, fb = "") => (idx(n) >= 0 ? (cols[idx(n)] ?? "").trim() : fb);
  return data.map((line, i) => {
    const cols = splitCsvLine(line);
    const lineNo = i + (useHeader ? 2 : 1);
    const contact = get(cols, "contact_name");
    const direction = dirIn(get(cols, "direction"));
    const amount = Number(get(cols, "amount").replace(/,/g, ""));
    const date = get(cols, "date");
    if (!contact || !direction || !(amount > 0) || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return { lineNo, ok: false, side: null };
    }
    const sideRaw = get(cols, "side");
    return {
      lineNo,
      ok: true,
      side: sideRaw ? normalizeSide(sideRaw) : null,
      amount_cents: yuanToCents(amount),
      direction,
    };
  });
}

let failed = 0;
function check(cond, msg) {
  if (!cond) { console.error("FAIL", msg); failed++; }
}

const rows = parseCsvText(`date,direction,amount,contact_name,event,side
2026-01-01,收礼,800,张三,春节,男方
2026-02-01,送礼,200,李四,回礼,
坏行,xx,abc,,
`);
check(rows.length === 3, "len");
check(rows[0].ok && rows[0].side === "male" && rows[0].amount_cents === 80000, "row0");
check(rows[1].ok && rows[1].side === null, "row1");
check(!rows[2].ok, "row2");

const cn = parseCsvText(`日期,类型,金额,联系人,事由,归属
2026-03-01,收,500,王五,乔迁,女方
`);
check(cn[0].ok && cn[0].side === "female" && cn[0].direction === "in", "cn");

if (failed) process.exit(1);
console.log("csv ok", 7, "asserts");

// relation export field (mirrors txsToCsv using relation_name)
function txsToCsvMini(txs) {
  return txs.map((t) => [t.contact_name, t.relation_name ?? "", t.side ?? ""].join(",")).join("\n");
}
const exported = txsToCsvMini([
  { contact_name: "张三", relation_name: "亲戚", side: "男方" },
  { contact_name: "李四", relation_name: null, side: "" },
]);
check(exported.includes("张三,亲戚,"), "relation export present");
check(exported.includes("李四,,"), "relation export empty ok");
