import { useCallback, useEffect, useState } from "react";
import { Field, SideDrawer } from "../components/ui/SideDrawer";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { useApp } from "../context/AppContext";
import { api, isTauri, type FestivalRow } from "../lib/db";

type Props = {
  onFilterWanglai: () => void;
  onOpenPrint?: () => void;
};

type FormMode =
  | { kind: "create" }
  | { kind: "rename"; fest: FestivalRow }
  | null;

export function FestivalsPage({ onFilterWanglai, onOpenPrint }: Props) {
  const {
    bookId,
    festivalTags,
    reloadMeta,
    setFestivalFilterId,
    showToast,
  } = useApp();
  const confirm = useConfirm();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [form, setForm] = useState<FormMode>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const loadCounts = useCallback(async () => {
    if (!isTauri() || bookId == null) return;
    const map: Record<number, number> = {};
    for (const f of festivalTags) {
      const txs = await api.listTransactions(bookId, undefined, undefined, f.id);
      map[f.id] = txs.length;
    }
    setCounts(map);
  }, [bookId, festivalTags]);

  useEffect(() => {
    void loadCounts().catch(() => undefined);
  }, [loadCounts]);

  function openCreate() {
    setForm({ kind: "create" });
    setName("");
    setErr("");
  }

  function openRename(f: FestivalRow) {
    setForm({ kind: "rename", fest: f });
    setName(f.name);
    setErr("");
  }

  function closeForm() {
    if (busy) return;
    setForm(null);
  }

  async function submit() {
    if (bookId == null || !isTauri()) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("请填写节日名称");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      if (form?.kind === "rename") {
        await api.renameFestivalTag(form.fest.id, trimmed);
        showToast("已改名");
      } else {
        await api.createFestivalTag(bookId, trimmed);
        showToast("已添加节日");
      }
      await reloadMeta();
      setForm(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-card bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">节日</h1>
        <button
          type="button"
          className="rounded-card border border-slate-200 px-3 py-2 text-sm text-ink-muted"
          onClick={() => {
            setFestivalFilterId(null);
            onFilterWanglai();
          }}
        >
          清除筛选
        </button>
        {onOpenPrint ? (
          <button
            type="button"
            className="rounded-card border border-slate-200 px-3 py-2 text-sm text-ink-muted"
            onClick={onOpenPrint}
          >
            打印
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-card bg-primary px-3 py-2 text-sm text-white"
          onClick={openCreate}
        >
          + 自定义
        </button>
      </div>
      <p className="mb-3 text-sm text-ink-muted">
        内置节日不可删；点「筛选往来」跳转往来页；「打印」进入设置打印模板。
      </p>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {festivalTags.map((f: FestivalRow) => (
          <div
            key={f.id}
            className="flex items-center gap-3 rounded-card border border-slate-100 px-3 py-3 text-sm"
          >
            <div className="min-w-[100px] font-medium">{f.name}</div>
            <span className="text-xs text-ink-faint">
              {f.is_builtin ? "内置" : "自定义"}
            </span>
            <span className="text-ink-muted">{counts[f.id] ?? 0} 笔往来</span>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                className="text-primary"
                onClick={() => {
                  setFestivalFilterId(f.id);
                  onFilterWanglai();
                }}
              >
                筛选往来
              </button>
              {!f.is_builtin ? (
                <>
                  <button
                    type="button"
                    className="text-ink-muted"
                    onClick={() => openRename(f)}
                  >
                    改名
                  </button>
                  <button
                    type="button"
                    className="text-expense"
                    onClick={async () => {
                      const ok = await confirm({
                        title: `删除节日「${f.name}」？`,
                        confirmText: "删除",
                        danger: true,
                      });
                      if (!ok) return;
                      try {
                        await api.deleteFestivalTag(f.id);
                        await reloadMeta();
                      } catch (e) {
                        showToast(String(e));
                      }
                    }}
                  >
                    删
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <SideDrawer
        open={form != null}
        title={form?.kind === "rename" ? "节日改名" : "自定义节日"}
        onClose={closeForm}
        footer={
          <>
            <button
              type="button"
              className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-slate-50"
              onClick={closeForm}
              disabled={busy}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-card bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => void submit()}
            >
              保存
            </button>
          </>
        }
      >
        <Field label="名称 *">
          <input
            className="input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：订婚"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </Field>
        {err ? <p className="text-sm text-expense">{err}</p> : null}
      </SideDrawer>
    </div>
  );
}
