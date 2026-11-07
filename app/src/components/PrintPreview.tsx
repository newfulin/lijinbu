import { formatYuan } from "../lib/money";
import { rmbUppercaseFromCents } from "../lib/rmb";
import type { PendingRow, TxRow } from "../lib/db";

export type PrintTemplate = "pending" | "by_contact" | "timeline" | "vertical";

type ContactAgg = {
  name: string;
  in_cents: number;
  out_cents: number;
  net_cents: number;
  count: number;
};

type Props = {
  template: PrintTemplate;
  bookName: string;
  pending: PendingRow[];
  txs: TxRow[];
  onClose: () => void;
};

export function PrintPreview({ template, bookName, pending, txs, onClose }: Props) {
  const title =
    template === "pending"
      ? "待还清单"
      : template === "by_contact"
        ? "按人汇总"
        : template === "timeline"
          ? "时间明细"
          : "竖排传统礼簿";

  const byContact = aggregateByContact(txs);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/40">
      <button type="button" className="absolute inset-0" aria-label="关闭" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-3xl flex-col bg-white shadow-xl print:max-w-none print:shadow-none">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 print:hidden">
          <h2 className="mr-auto text-lg font-semibold">{title}</h2>
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-1.5 text-sm text-white"
            onClick={handlePrint}
          >
            打印 / 另存 PDF
          </button>
          <button
            type="button"
            className="rounded-card border border-slate-200 px-3 py-1.5 text-sm"
            onClick={onClose}
          >
            关闭
          </button>
        </header>

        <div id="print-sheet" className="flex-1 overflow-auto p-6 text-sm">
          <div className="mb-4 border-b border-slate-200 pb-3">
            <div className="text-xs text-ink-muted">礼金簿 · {bookName}</div>
            <h1 className="mt-1 text-xl font-semibold">{title}</h1>
            <div className="mt-1 text-xs text-ink-faint">
              生成于 {new Date().toISOString().slice(0, 10)}
            </div>
          </div>

          {template === "pending" ? (
            <PendingTable rows={pending} />
          ) : null}
          {template === "by_contact" ? (
            <ByContactTable rows={byContact} />
          ) : null}
          {template === "timeline" ? (
            <TimelineTable txs={txs} />
          ) : null}
          {template === "vertical" ? (
            <VerticalBook txs={txs} bookName={bookName} />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function PendingTable({ rows }: { rows: PendingRow[] }) {
  const open = rows.filter((r) => !r.settled);
  if (open.length === 0) {
    return <p className="text-ink-faint">暂无待还</p>;
  }
  return (
    <table className="print-table w-full text-left">
      <thead>
        <tr>
          <th>联系人</th>
          <th>待还差额</th>
          <th>大写</th>
        </tr>
      </thead>
      <tbody>
        {open.map((r) => (
          <tr key={r.contact_id}>
            <td>{r.contact_name}</td>
            <td>{formatYuan(r.balance_cents)}</td>
            <td className="text-ink-muted">{rmbUppercaseFromCents(r.balance_cents)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ByContactTable({ rows }: { rows: ContactAgg[] }) {
  if (rows.length === 0) return <p className="text-ink-faint">暂无数据</p>;
  return (
    <table className="print-table w-full text-left">
      <thead>
        <tr>
          <th>联系人</th>
          <th>收礼</th>
          <th>送礼</th>
          <th>净额</th>
          <th>笔数</th>
          <th>净额大写</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>{r.name}</td>
            <td>{formatYuan(r.in_cents)}</td>
            <td>{formatYuan(r.out_cents)}</td>
            <td>{formatYuan(r.net_cents, true, r.net_cents >= 0 ? "in" : "out")}</td>
            <td>{r.count}</td>
            <td className="text-ink-muted">
              {rmbUppercaseFromCents(Math.abs(r.net_cents))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TimelineTable({ txs }: { txs: TxRow[] }) {
  if (txs.length === 0) return <p className="text-ink-faint">暂无流水</p>;
  return (
    <table className="print-table w-full text-left">
      <thead>
        <tr>
          <th>日期</th>
          <th>类型</th>
          <th>联系人</th>
          <th>事由</th>
          <th>金额</th>
          <th>大写</th>
          <th>支付</th>
        </tr>
      </thead>
      <tbody>
        {txs.map((t) => (
          <tr key={t.id}>
            <td>{t.date_gregorian}</td>
            <td>{t.direction === "out" ? "送礼" : "收礼"}</td>
            <td>{t.contact_name}</td>
            <td>{t.event_title || t.festival_name || "—"}</td>
            <td>{formatYuan(t.amount_cents)}</td>
            <td className="text-ink-muted">{rmbUppercaseFromCents(t.amount_cents)}</td>
            <td>{t.payment_method || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VerticalBook({ txs, bookName }: { txs: TxRow[]; bookName: string }) {
  const rows = txs.slice(0, 40);
  return (
    <div className="vertical-book">
      <div className="mb-4 text-center text-base font-semibold tracking-[0.3em]">
        {bookName} · 人情礼簿
      </div>
      {rows.length === 0 ? (
        <p className="text-center text-ink-faint">暂无记录</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {rows.map((t) => (
            <div key={t.id} className="vertical-entry border border-slate-300 px-2 py-3">
              <div className="writing-vertical text-sm leading-relaxed">
                <div>{t.date_gregorian}</div>
                <div className="mt-2 font-medium">{t.contact_name}</div>
                <div className="mt-2">
                  {t.direction === "out" ? "送" : "收"}
                  {formatYuan(t.amount_cents).replace("¥", "")}元
                </div>
                <div className="mt-2 text-xs text-ink-muted">
                  {rmbUppercaseFromCents(t.amount_cents)}
                </div>
                {t.event_title || t.festival_name ? (
                  <div className="mt-2 text-xs">{t.event_title || t.festival_name}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-ink-faint">仅供个人备忘，非财务凭证</p>
    </div>
  );
}

function aggregateByContact(txs: TxRow[]): ContactAgg[] {
  const map = new Map<string, ContactAgg>();
  for (const t of txs) {
    const cur = map.get(t.contact_name) ?? {
      name: t.contact_name,
      in_cents: 0,
      out_cents: 0,
      net_cents: 0,
      count: 0,
    };
    if (t.direction === "out") cur.out_cents += t.amount_cents;
    else cur.in_cents += t.amount_cents;
    cur.count += 1;
    cur.net_cents = cur.in_cents - cur.out_cents;
    map.set(t.contact_name, cur);
  }
  return [...map.values()].sort((a, b) => Math.abs(b.net_cents) - Math.abs(a.net_cents));
}
