import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api, isTauri, type GlobalHit } from "../lib/db";

type Props = {
  open: boolean;
  onClose: () => void;
  onPickContact: () => void;
};

export function GlobalSearch({ open, onClose, onPickContact }: Props) {
  const { bookId } = useApp();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<GlobalHit[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setHits([]);
  }, [open]);

  useEffect(() => {
    if (!open || !isTauri() || bookId == null) return;
    const t = window.setTimeout(() => {
      api.globalSearch(bookId, q).then(setHits).catch(() => setHits([]));
    }, 160);
    return () => window.clearTimeout(t);
  }, [q, open, bookId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-900/30 pt-[12vh]">
      <button type="button" className="absolute inset-0" aria-label="关闭" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-card bg-white p-4 shadow-xl">
        <input
          autoFocus
          className="input"
          placeholder="全局搜索 · 汉字 / 全拼 / 首字母"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
        <ul className="mt-3 max-h-72 overflow-auto text-sm">
          {hits.length === 0 ? (
            <li className="px-2 py-6 text-center text-ink-faint">输入关键词开始搜</li>
          ) : (
            hits.map((h) => (
              <li key={`${h.kind}-${h.id}`}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-card px-2 py-2 text-left hover:bg-primary-soft"
                  onClick={() => {
                    if (h.kind === "contact") onPickContact();
                    onClose();
                  }}
                >
                  <span className="text-xs text-ink-faint">
                    {h.kind === "contact" ? "人" : "流水"}
                  </span>
                  <span className="flex-1 font-medium">{h.title}</span>
                  <span className="text-xs text-ink-muted">{h.subtitle}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
