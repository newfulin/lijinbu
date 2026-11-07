import type { ReactNode } from "react";
import type { NavKey } from "../../types";
import { useApp } from "../../context/AppContext";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const NAV: { key: NavKey; label: string; icon: ReactNode }[] = [
  {
    key: "wanglai",
    label: "往来",
    icon: (
      <Icon>
        <path d="M9 5h11M9 12h11M9 19h11" />
        <path d="M4 5.2h.01M4 12h.01M4 18.8h.01" strokeWidth="2.4" />
      </Icon>
    ),
  },
  {
    key: "contacts",
    label: "联系人",
    icon: (
      <Icon>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.8 19c.7-3 2.8-4.6 5.2-4.6S13.5 16 14.2 19" />
        <circle cx="17.2" cy="9.2" r="2.2" />
        <path d="M16.2 14.2c1.7.2 3.1 1.2 3.6 2.8" />
      </Icon>
    ),
  },
  {
    key: "pending",
    label: "待还礼",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.8v4.6l2.8 1.7" />
      </Icon>
    ),
  },
  {
    key: "stats",
    label: "统计",
    icon: (
      <Icon>
        <path d="M5 19V10M11 19V5M17 19v-6" />
        <path d="M3.5 19h17" />
      </Icon>
    ),
  },
  {
    key: "reminders",
    label: "提醒",
    icon: (
      <Icon>
        <path d="M7.2 10.2a4.8 4.8 0 0 1 9.6 0c0 3.6 1.4 5 1.4 5H5.8s1.4-1.4 1.4-5Z" />
        <path d="M10.2 18.4a1.8 1.8 0 0 0 3.6 0" />
      </Icon>
    ),
  },
  {
    key: "festivals",
    label: "节日",
    icon: (
      <Icon>
        <rect x="4.5" y="6.5" width="15" height="13" rx="2.2" />
        <path d="M8.5 3.8v3.2M15.5 3.8v3.2M4.5 11h15" />
      </Icon>
    ),
  },
  {
    key: "recycle",
    label: "回收站",
    icon: (
      <Icon>
        <path d="M5 7.2h14" />
        <path d="M9.2 7.2V5.6h5.6v1.6" />
        <path d="M8 7.2l.9 11.2h6.2L16 7.2" />
      </Icon>
    ),
  },
  {
    key: "settings",
    label: "设置",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="2.8" />
        <path d="M12 4v2.4M12 17.6V20M5.6 6.4l1.7 1.7M16.7 15.9l1.7 1.7M4 12h2.4M17.6 12H20M5.6 17.6l1.7-1.7M16.7 8.1l1.7-1.7" />
      </Icon>
    ),
  },
];

function GiftLogo() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-sm ring-2 ring-primary-soft/80">
      <svg viewBox="0 0 32 32" className="h-5 w-5 text-white" fill="none" aria-hidden>
        <rect x="6" y="14" width="20" height="12" rx="2" fill="currentColor" opacity="0.95" />
        <rect x="5" y="10" width="22" height="5" rx="1.5" fill="currentColor" />
        <rect x="14.5" y="10" width="3" height="16" fill="#CCFBF1" />
        <path
          d="M16 10c-2.2-3.2-5.5-3.2-5.5-1.2S13.5 11 16 10c2.2-3.2 5.5-3.2 5.5-1.2S18.5 11 16 10Z"
          fill="#CCFBF1"
        />
      </svg>
    </div>
  );
}

type Props = {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
};

export function Sidebar({ active, onNavigate }: Props) {
  const { books, bookId, switchBook, boot } = useApp();
  const displayName = boot?.default_member_name ?? "我";

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-slate-200/70 bg-page">
      <div className="px-5 pb-2 pt-6">
        <div className="flex items-center gap-2.5">
          <GiftLogo />
          <div>
            <div className="text-base font-semibold text-ink">礼金簿</div>
            <div className="text-xs text-ink-muted">个人礼金管理</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <label className="mb-1 block px-1 text-[11px] text-ink-faint">当前礼簿</label>
        <select
          className="input !border-slate-200/80 !bg-white !py-2"
          value={bookId ?? ""}
          onChange={(e) => void switchBook(Number(e.target.value))}
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-card px-3 py-2.5 text-left text-sm transition ${
                isActive
                  ? "bg-white font-medium text-primary-dark shadow-sm ring-1 ring-slate-100"
                  : "text-ink-muted hover:bg-white/70"
              }`}
            >
              <span className={isActive ? "text-primary" : "text-ink-faint"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/70 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-medium text-primary-dark shadow-sm ring-1 ring-slate-100">
            {displayName.slice(0, 1) || "我"}
          </div>
          <div>
            <div className="text-sm font-medium text-ink">{displayName}</div>
            <div className="text-xs text-ink-faint">个人版</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
