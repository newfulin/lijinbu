import type { TxRow } from "./db";
import { centsToYuan, yuanToCents } from "./money";
import { normalizeSide, sideLabel } from "./side";

export const CSV_HEADERS = [
  "date",
  "direction",
  "amount",
  "contact_name",
  "relation",
  "member",
  "event",
  "festival",
  "payment_method",
  "gift_note",
  "note",
  "side",
] as const;

/** 中英列名别名 → 标准头 */
const HEADER_ALIASES: Record<string, string> = {
  date: "date",
  日期: "date",
  direction: "direction",
  类型: "direction",
  方向: "direction",
  amount: "amount",
  金额: "amount",
  contact_name: "contact_name",
  联系人: "contact_name",
  姓名: "contact_name",
  relation: "relation",
  关系: "relation",
  member: "member",
  成员: "member",
  event: "event",
  事件: "event",
  事由: "event",
  festival: "festival",
  节日: "festival",
  payment_method: "payment_method",
  支付: "payment_method",
  支付方式: "payment_method",
  gift_note: "gift_note",
  礼品: "gift_note",
  note: "note",
  备注: "note",
  side: "side",
  归属: "side",
  男女方: "side",
};

export type CsvImportRow = {
  lineNo: number;
  ok: boolean;
  error?: string;
  date: string;
  direction: "in" | "out";
  amount_cents: number;
  contact_name: string;
  relation: string | null;
  member: string | null;
  event: string | null;
  festival: string | null;
  payment_method: string | null;
  gift_note: string | null;
  note: string | null;
  side: string | null;
  skip: boolean;
};

function esc(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function dirOut(d: string): string {
  return d === "out" ? "送礼" : "收礼";
}

function dirIn(raw: string): "in" | "out" | null {
  const s = raw.trim().toLowerCase();
  if (["in", "收礼", "收", "收入"].includes(s)) return "in";
  if (["out", "送礼", "送", "支出"].includes(s)) return "out";
  return null;
}

const PAY_MAP: Record<string, string> = {
  现金: "cash",
  cash: "cash",
  微信: "wechat",
  wechat: "wechat",
  支付宝: "alipay",
  alipay: "alipay",
  转账: "bank",
  bank: "bank",
  其他: "other",
  other: "other",
};

export function txsToCsv(txs: TxRow[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const t of txs) {
    lines.push(
      [
        t.date_gregorian,
        dirOut(t.direction),
        String(centsToYuan(t.amount_cents)),
        t.contact_name,
        t.relation_name ?? "",
        t.member_name,
        t.event_title ?? "",
        t.festival_name ?? "",
        t.payment_method ?? "",
        t.gift_note ?? "",
        t.note ?? "",
        t.side ? sideLabel(t.side) : "",
      ]
        .map((x) => esc(String(x)))
        .join(","),
    );
  }
  return lines.join("\n");
}

/** 简易 CSV 行拆分（支持引号） */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQ = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function mapHeader(h: string): string {
  const key = h.trim().toLowerCase();
  const cn = h.trim();
  return HEADER_ALIASES[key] ?? HEADER_ALIASES[cn] ?? key;
}

export function parseCsvText(text: string): CsvImportRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length === 0) return [];
  const rawHeader = splitCsvLine(lines[0]).map((h) => h.trim());
  const header = rawHeader.map(mapHeader);
  const idx = (name: string) => header.indexOf(name);
  const hasHeader = CSV_HEADERS.some((h) => header.includes(h)) || header.includes("日期") || header.includes("联系人");
  // also detect if first cell looks like a date
  const firstLooksDate = /^\d{4}-\d{2}-\d{2}/.test(rawHeader[0] ?? "");
  const useHeader = hasHeader && !firstLooksDate;
  const dataLines = useHeader ? lines.slice(1) : lines;
  const get = (cols: string[], name: string, fallback = "") => {
    const i = idx(name);
    return i >= 0 ? (cols[i] ?? "").trim() : fallback;
  };

  return dataLines.map((line, i) => {
    const cols = splitCsvLine(line);
    const lineNo = i + (useHeader ? 2 : 1);
    const contact = get(cols, "contact_name") || (!useHeader ? cols[3]?.trim() : "") || "";
    const dirRaw = get(cols, "direction") || (!useHeader ? cols[1]?.trim() : "") || "";
    const amountRaw = get(cols, "amount") || (!useHeader ? cols[2]?.trim() : "") || "";
    const date = get(cols, "date") || (!useHeader ? cols[0]?.trim() : "") || "";
    const direction = dirIn(dirRaw);
    const amount = Number(amountRaw.replace(/,/g, ""));
    if (!contact) {
      return emptyBad(lineNo, "缺少联系人");
    }
    if (!direction) {
      return emptyBad(lineNo, "方向无效");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return emptyBad(lineNo, "金额无效");
    }
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return emptyBad(lineNo, "日期需 YYYY-MM-DD");
    }
    const payRaw = get(cols, "payment_method");
    const sideRaw = get(cols, "side");
    const side = sideRaw ? normalizeSide(sideRaw) || null : null;
    return {
      lineNo,
      ok: true,
      date: date.slice(0, 10),
      direction,
      amount_cents: yuanToCents(amount),
      contact_name: contact,
      relation: get(cols, "relation") || null,
      member: get(cols, "member") || null,
      event: get(cols, "event") || null,
      festival: get(cols, "festival") || null,
      payment_method: payRaw ? PAY_MAP[payRaw] ?? payRaw : null,
      gift_note: get(cols, "gift_note") || null,
      note: get(cols, "note") || null,
      side: side || null,
      skip: false,
    };
  });
}

function emptyBad(lineNo: number, error: string): CsvImportRow {
  return {
    lineNo,
    ok: false,
    error,
    date: "",
    direction: "in",
    amount_cents: 0,
    contact_name: "",
    relation: null,
    member: null,
    event: null,
    festival: null,
    payment_method: null,
    gift_note: null,
    note: null,
    side: null,
    skip: false,
  };
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
