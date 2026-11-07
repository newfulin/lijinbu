/** 批量粘贴行解析：张三 800 / 李四 500 结婚 / 王五 收礼 1000 满月 */

export type BatchRow = {
  lineNo: number;
  raw: string;
  ok: boolean;
  error?: string;
  contact_name: string;
  direction: "in" | "out";
  amount_yuan: number;
  event_title: string | null;
  skip: boolean;
};

const DIR_IN = /^(收礼|收入|收|in)$/i;
const DIR_OUT = /^(送礼|支出|送|out)$/i;

function parseAmount(tok: string): number | null {
  const n = Number(String(tok).replace(/[,￥¥元]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parseBatchLine(raw: string, lineNo: number): BatchRow {
  const trimmed = raw.trim();
  const base: BatchRow = {
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
  if (parts.length < 2) {
    return { ...base, error: "至少需要「姓名 金额」" };
  }

  const name = parts[0];
  let direction: "in" | "out" = "in";
  let amountIdx = 1;
  let eventStart = 2;

  if (parts.length >= 3 && (DIR_IN.test(parts[1]) || DIR_OUT.test(parts[1]))) {
    direction = DIR_OUT.test(parts[1]) ? "out" : "in";
    amountIdx = 2;
    eventStart = 3;
  }

  const amount = parseAmount(parts[amountIdx] ?? "");
  if (amount == null) {
    return { ...base, contact_name: name, error: "金额无效" };
  }

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

export function parseBatchText(text: string): BatchRow[] {
  return text
    .split(/\r?\n/)
    .map((line, i) => parseBatchLine(line, i + 1))
    .filter((r) => !(r.skip && r.error === "空行"));
}
