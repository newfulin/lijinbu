import { chordLabel } from "../../lib/platform";

type Props = {
  onRecord: () => void;
  onSearch: () => void;
};

export function Topbar({ onRecord, onSearch }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-5 backdrop-blur-sm">
      <button type="button" onClick={onSearch} className="search-pill text-left">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-ink-faint"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16.5 16.5 20 20" />
        </svg>
        <span className="flex-1 truncate">搜索联系人、流水、拼音…</span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-ink-faint">
          {chordLabel("K")}
        </span>
      </button>
      <button type="button" onClick={onRecord} className="btn-primary shrink-0">
        <span className="text-base leading-none">+</span>
        记一笔
      </button>
    </header>
  );
}
