import { useMemo } from "react";
import { ActionMenu } from "../components/ui/ActionMenu";
import { Avatar } from "../components/ui/Avatar";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { MiniSparkline } from "../components/ui/MiniSparkline";
import { useApp } from "../context/AppContext";
import { formatLunar } from "../lib/lunar";
import { formatYuan } from "../lib/money";
import { shiftChordLabel } from "../lib/platform";
import { sideLabel } from "../lib/side";

const PAY_LABEL: Record<string, string> = {
  cash: "现金",
  wechat: "微信",
  alipay: "支付宝",
  bank: "转账",
  other: "其他",
};

type Props = {
  onBatch?: () => void;
  onOpenSettings?: () => void;
};

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

/** 从流水生成 sparkline：按日净额（近若干点） */
function sparkSeries(
  txs: { date_gregorian: string; direction: string; amount_cents: number }[],
  mode: "month" | "year",
): number[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const curMonth = `${y}-${m}`;
  const map = new Map<string, number>();
  for (const tx of txs) {
    const d = tx.date_gregorian;
    if (mode === "month") {
      if (!d.startsWith(curMonth)) continue;
      const k = dayKey(d);
      const signed = tx.direction === "in" ? tx.amount_cents : -tx.amount_cents;
      map.set(k, (map.get(k) ?? 0) + signed);
    } else {
      if (!d.startsWith(String(y))) continue;
      const k = monthKey(d);
      const signed = tx.direction === "in" ? tx.amount_cents : -tx.amount_cents;
      map.set(k, (map.get(k) ?? 0) + signed);
    }
  }
  const keys = [...map.keys()].sort();
  if (keys.length < 2) return [];
  return keys.map((k) => map.get(k) ?? 0);
}

export function WanglaiPage({ onBatch, onOpenSettings }: Props) {
  const {
    txs,
    summary,
    txTab,
    setTxTab,
    txQuery,
    setTxQuery,
    festivalFilterId,
    setFestivalFilterId,
    festivalTags,
    openEdit,
    deleteTx,
    lunarOn,
    openCreate,
    sideFilter,
    setSideFilter,
  } = useApp();
  const confirm = useConfirm();
  const festName = festivalTags.find((f) => f.id === festivalFilterId)?.name;

  const monthNet =
    (summary?.month_in_cents ?? 0) - (summary?.month_out_cents ?? 0);
  const yearNet =
    (summary?.year_in_cents ?? 0) - (summary?.year_out_cents ?? 0);

  const monthSpark = useMemo(() => sparkSeries(txs, "month"), [txs]);
  const yearSpark = useMemo(() => sparkSeries(txs, "year"), [txs]);

  return (
    <div className="flex h-full gap-4">
      <section className="flex min-w-0 flex-1 flex-col rounded-card bg-card p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">往来记录</h1>
            <p className="mt-1 text-sm text-ink-muted">
              人情往来一目了然 · 点行可编辑
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBatch ? (
              <button
                type="button"
                className="rounded-full border border-primary/35 px-3 py-1.5 text-sm text-primary transition hover:bg-primary-soft"
                onClick={onBatch}
                title={shiftChordLabel("V")}
              >
                批量录入
              </button>
            ) : null}
            {onOpenSettings ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-ink-muted transition hover:bg-slate-50"
                onClick={onOpenSettings}
                title="导入 CSV 在设置页"
              >
                导入 CSV
              </button>
            ) : null}
            <input
              className="input !h-9 !w-44 !rounded-full"
              placeholder="搜索联系人/事由"
              value={txQuery}
              onChange={(e) => setTxQuery(e.target.value)}
            />
            {festivalFilterId != null ? (
              <button
                type="button"
                className="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary-dark"
                onClick={() => setFestivalFilterId(null)}
              >
                节日：{festName ?? festivalFilterId} ×
              </button>
            ) : null}
            {(["all", "in", "out"] as const).map((tab) => {
              const label = tab === "all" ? "全部" : tab === "in" ? "收礼" : "送礼";
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTxTab(tab)}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    txTab === tab
                      ? "bg-primary-soft text-primary-dark"
                      : "bg-page text-ink-muted hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
            <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden />
            {(
              [
                ["", "归属·全部"],
                ["male", "男方"],
                ["female", "女方"],
                ["joint", "共同"],
                ["none", "不区分"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v || "all-side"}
                type="button"
                onClick={() => setSideFilter(v)}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  sideFilter === v
                    ? "bg-primary-soft text-primary-dark"
                    : "bg-page text-ink-muted hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-card border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-page/95 text-ink-muted backdrop-blur-sm">
              <tr>
                {["日期", "类型", "联系人", "事件", "金额", ""].map((c) => (
                  <th key={c || "a"} className="px-3 py-3 font-medium whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-20 text-center">
                    <div className="text-ink-muted">还没有往来记录</div>
                    <p className="mt-1 text-sm text-ink-faint">
                      先记一笔收礼或送礼，人情账就从这里开始。
                    </p>
                    <button
                      type="button"
                      className="btn-primary mt-4"
                      onClick={() => openCreate()}
                    >
                      + 记一笔
                    </button>
                  </td>
                </tr>
              ) : (
                txs.map((tx) => {
                  const isIn = tx.direction === "in";
                  const pay = tx.payment_method
                    ? PAY_LABEL[tx.payment_method] ?? tx.payment_method
                    : "";
                  const extra = [pay, tx.member_name, tx.gift_note, tx.note]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <tr
                      key={tx.id}
                      className="border-t border-slate-50 transition hover:bg-primary-soft/25 cursor-pointer"
                      onClick={() => openEdit(tx)}
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div>{tx.date_gregorian}</div>
                        {lunarOn ? (
                          <div className="text-[11px] text-ink-faint">
                            {formatLunar(tx.date_gregorian)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isIn
                              ? "bg-income-soft text-income"
                              : "bg-expense-soft text-expense"
                          }`}
                        >
                          {isIn ? "收礼" : "送礼"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={tx.contact_name || "?"} />
                          <span className="font-medium">{tx.contact_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-ink-muted">
                          <span>{tx.event_title || tx.festival_name || "—"}</span>
                          {tx.side ? (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-ink-muted">
                              {sideLabel(tx.side)}
                            </span>
                          ) : null}
                        </div>
                        {extra ? (
                          <div className="mt-0.5 truncate text-[11px] text-ink-faint">
                            {extra}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-sm font-medium ${
                            isIn
                              ? "bg-income-soft/80 text-income"
                              : "bg-expense-soft/80 text-expense"
                          }`}
                        >
                          {formatYuan(tx.amount_cents, true, isIn ? "in" : "out")}
                        </span>
                      </td>
                      <td
                        className="px-3 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionMenu
                          items={[
                            {
                              label: "编辑",
                              onClick: () => openEdit(tx),
                            },
                            {
                              label: "删除",
                              danger: true,
                              onClick: () => {
                                void (async () => {
                                  const ok = await confirm({
                                    title: "删除这笔往来？",
                                    message: "删除后进入回收站，可随时恢复。",
                                    confirmText: "删除",
                                    danger: true,
                                  });
                                  if (ok) void deleteTx(tx.id);
                                })();
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-ink-faint">共 {txs.length} 条记录</div>
      </section>

      <aside className="flex w-[260px] shrink-0 flex-col gap-3">
        <SummaryCard
          title="本月收支"
          net={monthNet}
          hint={`收 ${formatYuan(summary?.month_in_cents ?? 0)} · 支 ${formatYuan(summary?.month_out_cents ?? 0)}`}
          spark={monthSpark}
        />
        <SummaryCard
          title="今年收支"
          net={yearNet}
          hint={`收礼 ${formatYuan(summary?.year_in_cents ?? 0)} · 送礼 ${formatYuan(summary?.year_out_cents ?? 0)}`}
          spark={yearSpark}
        />
        <div className="card-lift p-4">
          <div className="mb-3 text-sm font-medium text-ink">往来概览</div>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li className="flex justify-between">
              <span>往来人数</span>
              <span className="font-medium text-ink">{summary?.contact_count ?? 0} 人</span>
            </li>
            <li className="flex justify-between">
              <span>待还粗算</span>
              <span className="font-medium text-amber-600">
                {summary?.pending_count ?? 0} 人
              </span>
            </li>
            <li className="flex justify-between">
              <span>总笔数</span>
              <span className="font-medium text-primary">{summary?.total_count ?? 0}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({
  title,
  net,
  hint,
  spark,
}: {
  title: string;
  net: number;
  hint: string;
  spark: number[];
}) {
  const positive = net >= 0;
  const value = formatYuan(Math.abs(net), true, positive ? "in" : "out");
  return (
    <div className="card-lift p-4">
      <div className="text-sm text-ink-muted">{title}</div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          positive ? "text-income" : "text-expense"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-faint">{hint}</div>
      {spark.length >= 2 ? (
        <MiniSparkline values={spark} positive={positive} />
      ) : null}
    </div>
  );
}
