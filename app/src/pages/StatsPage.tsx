import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api, isTauri, type StatsResult, type YearReport } from "../lib/db";
import { formatYuan } from "../lib/money";
import { YearReportView } from "./YearReportView";

/** 色觉友好：蓝 / 琥珀，不只靠红绿 */
const COLOR_IN = "#0D9488";
const COLOR_OUT = "#D97706";
const PIE_COLORS = ["#0D9488", "#2563EB", "#D97706", "#7C3AED", "#64748B", "#DB2777"];

export function StatsPage() {
  const { bookId, members, relationTags, showToast } = useApp();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [memberId, setMemberId] = useState<number | "">("");
  const [relationId, setRelationId] = useState<number | "">("");
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [report, setReport] = useState<YearReport | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isTauri() || bookId == null) return;
    setLoading(true);
    try {
      const s = await api.getStats({
        book_id: bookId,
        year,
        member_id: memberId === "" ? null : memberId,
        relation_tag_id: relationId === "" ? null : relationId,
      });
      setStats(s);
    } catch (e) {
      showToast(String(e));
    } finally {
      setLoading(false);
    }
  }, [bookId, year, memberId, relationId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const barData = useMemo(
    () =>
      (stats?.monthly ?? []).map((m) => ({
        name: `${m.month}月`,
        收礼: m.in_cents / 100,
        送礼: m.out_cents / 100,
      })),
    [stats],
  );

  const lineData = useMemo(
    () =>
      (stats?.monthly ?? []).map((m) => ({
        name: `${m.month}月`,
        净额: m.net_cents / 100,
      })),
    [stats],
  );

  const pieData = useMemo(
    () =>
      (stats?.by_relation ?? []).map((r) => ({
        name: r.relation_name,
        value: (r.in_cents + r.out_cents) / 100,
      })),
    [stats],
  );

  async function openReport() {
    if (bookId == null || !isTauri()) return;
    try {
      const r = await api.getYearReport(bookId, year);
      setReport(r);
    } catch (e) {
      showToast(String(e));
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto">
      <div className="rounded-card bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <h1 className="text-xl font-semibold">统计</h1>
            <p className="mt-1 text-sm text-ink-muted">2D 图表 · 与往来同年汇总误差为 0</p>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">年份</span>
            <input
              className="input !w-28"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || thisYear)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">成员</span>
            <select
              className="input !w-36"
              value={memberId}
              onChange={(e) =>
                setMemberId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">全部</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">关系</span>
            <select
              className="input !w-36"
              value={relationId}
              onChange={(e) =>
                setRelationId(e.target.value === "" ? "" : Number(e.target.value))
              }
            >
              <option value="">全部</option>
              {relationTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className={`rounded-card px-3 py-2 text-sm ${
                view === "chart" ? "bg-primary text-white" : "border border-slate-200"
              }`}
              onClick={() => setView("chart")}
            >
              图表
            </button>
            <button
              type="button"
              className={`rounded-card px-3 py-2 text-sm ${
                view === "table" ? "bg-primary text-white" : "border border-slate-200"
              }`}
              onClick={() => setView("table")}
            >
              数据表
            </button>
            <button
              type="button"
              className="rounded-card bg-primary px-3 py-2 text-sm text-white"
              onClick={() => void openReport()}
            >
              生成 {year} 年人情报告
            </button>
          </div>
        </div>
      </div>

      {loading || !stats ? (
        <div className="rounded-card bg-card p-8 text-center text-ink-muted shadow-card">
          {loading ? "加载中…" : "暂无数据"}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <SumCard label="今年收礼" value={formatYuan(stats.in_cents)} />
            <SumCard label="今年送礼" value={formatYuan(stats.out_cents)} />
            <SumCard
              label="净额"
              value={formatYuan(stats.net_cents, true, stats.net_cents >= 0 ? "in" : "out")}
            />
            <SumCard label="往来笔数" value={String(stats.count)} />
            <SumCard label="当前待还" value={`${stats.pending_count} 人`} />
          </div>

          {view === "chart" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="收礼 vs 送礼（按月）">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="收礼" fill={COLOR_IN} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="送礼" fill={COLOR_OUT} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="月度净额">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="净额"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="按关系标签收支占比" className="lg:col-span-2">
                {pieData.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-ink-faint">
                    暂无关系分布
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>
          ) : (
            <div className="rounded-card bg-card p-5 shadow-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-page text-ink-muted">
                  <tr>
                    <th className="px-3 py-2">月份</th>
                    <th className="px-3 py-2">收礼</th>
                    <th className="px-3 py-2">送礼</th>
                    <th className="px-3 py-2">净额</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.table_rows.length ? stats.table_rows : stats.monthly.map((m) => ({
                    label: `${stats.year}-${m.month}`,
                    in_cents: m.in_cents,
                    out_cents: m.out_cents,
                    net_cents: m.net_cents,
                    count: 0,
                  }))).map((r) => (
                    <tr key={r.label} className="border-t border-slate-50">
                      <td className="px-3 py-2">{r.label}</td>
                      <td className="px-3 py-2">{formatYuan(r.in_cents)}</td>
                      <td className="px-3 py-2">{formatYuan(r.out_cents)}</td>
                      <td className="px-3 py-2">{formatYuan(r.net_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {report ? <YearReportView report={report} onClose={() => setReport(null)} /> : null}
    </div>
  );
}

function SumCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card bg-card p-4 shadow-card ${className}`}>
      <h2 className="mb-3 text-sm font-medium text-ink">{title}</h2>
      {children}
    </div>
  );
}
