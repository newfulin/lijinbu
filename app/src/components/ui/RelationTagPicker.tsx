import { useState } from "react";
import { api, isTauri, type TagRow } from "../../lib/db";

type Props = {
  tags: TagRow[];
  value: number | null;
  onChange: (id: number | null) => void;
  bookId: number | null;
  onTagsChange?: () => void | Promise<void>;
};

export function RelationTagPicker({
  tags,
  value,
  onChange,
  bookId,
  onTagsChange,
}: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function addCustom() {
    const name = customName.trim();
    if (!name || bookId == null || !isTauri()) return;
    setBusy(true);
    setErr("");
    try {
      const tag = await api.createRelationTag(bookId, name);
      await onTagsChange?.();
      onChange(tag.id);
      setCustomName("");
      setCustomOpen(false);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-page text-ink-muted hover:bg-slate-100"
              }`}
              onClick={() => onChange(t.id)}
            >
              {t.name}
              {!t.is_system ? (
                <span className={active ? "opacity-80" : "text-ink-faint"}> ·自</span>
              ) : null}
            </button>
          );
        })}
        <button
          type="button"
          className={`rounded-full border border-dashed px-3 py-1.5 text-xs transition ${
            customOpen
              ? "border-primary text-primary"
              : "border-slate-300 text-ink-muted hover:border-primary/50 hover:text-primary"
          }`}
          onClick={() => setCustomOpen((v) => !v)}
        >
          + 自定义
        </button>
      </div>
      {customOpen ? (
        <div className="flex gap-2">
          <input
            className="input flex-1 !h-9"
            autoFocus
            placeholder="如：发小、战友"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addCustom();
              }
            }}
          />
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white disabled:opacity-60"
            disabled={busy || !customName.trim()}
            onClick={() => void addCustom()}
          >
            添加
          </button>
        </div>
      ) : null}
      {err ? <p className="text-xs text-expense">{err}</p> : null}
    </div>
  );
}
