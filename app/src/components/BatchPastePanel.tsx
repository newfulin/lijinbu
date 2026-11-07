import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { parseBatchText, type BatchRow } from "../lib/batchParse";
import { api, isTauri } from "../lib/db";
import { yuanToCents } from "../lib/money";
import { nameToPinyinFields } from "../lib/pinyin";

type Props = {
  open: boolean;
  onClose: () => void;
};

const SAMPLE = `周八 800
吴九 收礼 500 结婚
郑十 送礼 200 探望`;

export function BatchPastePanel({ open, onClose }: Props) {
  const { bookId, members, refreshAll, showToast } = useApp();
  const [text, setText] = useState(SAMPLE);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [saving, setSaving] = useState(false);

  const previewed = rows.length > 0;
  const okCount = useMemo(() => rows.filter((r) => r.ok && !r.skip).length, [rows]);

  if (!open) return null;

  function doPreview() {
    const parsed = parseBatchText(text).map((r) => ({
      ...r,
      skip: !r.ok,
    }));
    setRows(parsed);
  }

  async function confirmWrite() {
    if (!isTauri() || bookId == null) return;
    const member = members.find((m) => m.is_default === 1) ?? members[0];
    if (!member) {
      showToast("请先创建成员");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const targets = rows.filter((r) => r.ok && !r.skip);
    if (targets.length === 0) {
      showToast("没有可写入的行");
      return;
    }
    setSaving(true);
    try {
      for (const r of targets) {
        const py = nameToPinyinFields(r.contact_name);
        await api.createTransaction({
          book_id: bookId,
          contact_id: null,
          contact_name: r.contact_name,
          relation_tag_id: null,
          member_id: member.id,
          direction: r.direction,
          amount_cents: yuanToCents(r.amount_yuan),
          date_gregorian: today,
          event_title: r.event_title,
          festival_tag_id: null,
          note: null,
          payment_method: null,
          gift_note: null,
          name_pinyin: py.name_pinyin,
          name_initials: py.name_initials,
        });
      }
      await refreshAll();
      showToast(`已写入 ${targets.length} 笔`);
      onClose();
    } catch (e) {
      showToast(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex justify-end bg-slate-900/40">
      <button type="button" className="absolute inset-0" aria-label="关闭" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-xl">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <h2 className="mr-auto text-lg font-semibold">批量粘贴录入</h2>
          <button
            type="button"
            className="rounded-card border border-slate-200 px-3 py-1.5 text-sm"
            onClick={onClose}
          >
            关闭
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-auto p-5 text-sm">
          <p className="text-ink-muted">
            每行一种：<code>张三 800</code> · <code>李四 500 结婚</code> ·{" "}
            <code>王五 收礼 1000 满月</code>
          </p>
          <textarea
            className="input min-h-[160px] !h-auto py-2 font-mono text-xs"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setRows([]);
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-card border border-slate-200 px-3 py-2"
              onClick={doPreview}
            >
              预览解析
            </button>
            {previewed ? (
              <button
                type="button"
                className="rounded-card bg-primary px-3 py-2 text-white disabled:opacity-50"
                disabled={saving || okCount === 0}
                onClick={() => void confirmWrite()}
              >
                {saving ? "写入中…" : `确认写入 ${okCount} 笔`}
              </button>
            ) : null}
          </div>
          {previewed ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-page text-ink-muted">
                <tr>
                  <th className="px-2 py-2">行</th>
                  <th className="px-2 py-2">状态</th>
                  <th className="px-2 py-2">联系人</th>
                  <th className="px-2 py-2">方向</th>
                  <th className="px-2 py-2">金额</th>
                  <th className="px-2 py-2">事由</th>
                  <th className="px-2 py-2">跳过</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={`${r.lineNo}-${i}`}
                    className={`border-t ${r.ok ? "border-slate-50" : "bg-expense-soft/40"}`}
                  >
                    <td className="px-2 py-2">{r.lineNo}</td>
                    <td className="px-2 py-2">
                      {r.ok ? (
                        <span className="text-income">OK</span>
                      ) : (
                        <span className="text-expense">{r.error ?? "错误"}</span>
                      )}
                    </td>
                    <td className="px-2 py-2">{r.contact_name || "—"}</td>
                    <td className="px-2 py-2">{r.ok ? (r.direction === "out" ? "送礼" : "收礼") : "—"}</td>
                    <td className="px-2 py-2">{r.ok ? r.amount_yuan : "—"}</td>
                    <td className="px-2 py-2">{r.event_title || "—"}</td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={r.skip}
                        disabled={!r.ok}
                        onChange={(e) => {
                          const next = [...rows];
                          next[i] = { ...r, skip: e.target.checked };
                          setRows(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
