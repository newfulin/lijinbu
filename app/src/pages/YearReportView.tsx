import { formatLunar } from "../lib/lunar";
import type { YearReport } from "../lib/db";
import { formatYuan } from "../lib/money";

type Props = {
  report: YearReport;
  onClose: () => void;
};

export function YearReportView({ report, onClose }: Props) {
  const lunar = formatLunar(report.generated_at) || report.lunar_note;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/40">
      <button type="button" className="absolute inset-0" aria-label="关闭" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl print:max-w-none print:shadow-none">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 print:hidden">
          <h2 className="mr-auto text-lg font-semibold">{report.year} 年人情报告</h2>
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

        <div id="year-report-print" className="flex-1 space-y-6 overflow-auto p-6 text-sm">
          <section className="rounded-card border border-primary/20 bg-primary-soft/30 p-6 text-center">
            <div className="text-xs text-primary">礼金簿 · 年度人情报告</div>
            <h1 className="mt-2 text-2xl font-semibold text-ink">{report.book_name}</h1>
            <p className="mt-1 text-ink-muted">
              {report.year} 年 · 生成于 {report.generated_at}
              {lunar ? `（农历 ${lunar}）` : ""}
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-ink">总览</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card label="收礼" value={formatYuan(report.in_cents)} />
              <Card label="送礼" value={formatYuan(report.out_cents)} />
              <Card label="净额" value={formatYuan(report.net_cents, true, report.net_cents >= 0 ? "in" : "out")} />
              <Card label="笔数" value={String(report.count)} />
            </div>
          </section>

          <TopList title="收礼 Top5" rows={report.top_receive} />
          <TopList title="送礼 Top5" rows={report.top_give} />
          <TopList title="待还差额 Top5" rows={report.top_pending} />

          <section>
            <h3 className="mb-2 font-semibold text-ink">事由 / 节日分布</h3>
            {report.festival_dist.length === 0 ? (
              <p className="text-ink-faint">暂无分布数据</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-page text-ink-muted">
                  <tr>
                    <th className="px-2 py-2">项目</th>
                    <th className="px-2 py-2">笔数</th>
                    <th className="px-2 py-2">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {report.festival_dist.map((f) => (
                    <tr key={f.festival_name} className="border-t border-slate-50">
                      <td className="px-2 py-2">{f.festival_name}</td>
                      <td className="px-2 py-2">{f.count}</td>
                      <td className="px-2 py-2">{formatYuan(f.amount_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-ink">待还摘要</h3>
            <p className="text-ink-muted">
              当前待还 {report.pending_count} 人，合计差额{" "}
              {formatYuan(report.pending_total_cents)}（不含已视为已还）
            </p>
          </section>

          <footer className="border-t border-slate-100 pt-4 text-xs text-ink-faint">
            本报告仅供个人备忘，不构成任何法律或财务证明。数据来自本机礼金簿。
          </footer>
        </div>
      </aside>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-slate-100 p-3">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function TopList({
  title,
  rows,
}: {
  title: string;
  rows: { contact_name: string; amount_cents: number }[];
}) {
  return (
    <section>
      <h3 className="mb-2 font-semibold text-ink">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-ink-faint">暂无数据</p>
      ) : (
        <ol className="space-y-1">
          {rows.map((r, i) => (
            <li key={`${title}-${r.contact_name}-${i}`} className="flex justify-between">
              <span>
                {i + 1}. {r.contact_name}
              </span>
              <span className="font-medium">{formatYuan(r.amount_cents)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
