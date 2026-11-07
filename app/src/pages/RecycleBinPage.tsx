import { useConfirm } from "../components/ui/ConfirmDialog";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api, isTauri, type RecycleItem } from "../lib/db";
import { formatYuan } from "../lib/money";

export function RecycleBinPage() {
  const { bookId, recycleRetainDays, showToast, refreshAll } = useApp();
  const confirm = useConfirm();
  const [rows, setRows] = useState<RecycleItem[]>([]);

  const load = useCallback(async () => {
    if (!isTauri() || bookId == null) return;
    setRows(await api.listRecycle(bookId));
  }, [bookId]);

  useEffect(() => {
    void load().catch((e) => showToast(String(e)));
  }, [load, showToast]);

  return (
    <div className="flex h-full flex-col rounded-card bg-card p-5 shadow-card">
      <h1 className="mb-4 text-xl font-semibold">回收站</h1>
      <p className="mb-3 text-sm text-ink-muted">
        软删流水/联系人可恢复；永久删除需二次确认。当前保留{" "}
        <span className="text-ink">{recycleRetainDays}</span> 天
        {recycleRetainDays > 0 ? "（超时自动清理）" : "（不自动清理）"}
        ，可在设置修改。
      </p>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-ink-faint">回收站为空</div>
        ) : (
          rows.map((r) => (
            <div
              key={`${r.kind}-${r.id}`}
              className="flex items-center gap-3 rounded-card border border-slate-100 px-3 py-3 text-sm"
            >
              <span className="rounded-full bg-page px-2 py-0.5 text-xs text-ink-faint">
                {r.kind === "transaction" ? "流水" : "联系人"}
              </span>
              <div className="min-w-0 flex-1 truncate font-medium">{r.title}</div>
              {r.amount_cents != null ? (
                <span className="text-ink-muted">{formatYuan(r.amount_cents)}</span>
              ) : null}
              <span className="text-xs text-ink-faint">{r.deleted_at}</span>
              <button
                type="button"
                className="text-primary"
                onClick={async () => {
                  await api.restoreRecycle(r.kind, r.id);
                  await load();
                  await refreshAll();
                  showToast("已恢复");
                }}
              >
                恢复
              </button>
              <button
                type="button"
                className="text-expense"
                onClick={async () => {
                  const ok = await confirm({
                    title: "永久删除？",
                    message: "不可恢复，请谨慎。",
                    confirmText: "永久删除",
                    danger: true,
                  });
                  if (!ok) return;
                  await api.purgeRecycle(r.kind, r.id);
                  await load();
                  showToast("已永久删除");
                }}
              >
                永久删
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
