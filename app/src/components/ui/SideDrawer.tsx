import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
};

/** 右侧应用内抽屉，风格对齐 RecordDrawer */
export function SideDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClass = "w-[420px] max-w-[480px] min-w-[360px]",
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="关闭遮罩"
        className="ui-fade-in absolute inset-0 bg-slate-900/30"
        onClick={onClose}
      />
      <aside
        className={`ui-drawer-in relative z-10 flex h-full flex-col bg-white shadow-xl ${widthClass}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            {subtitle ? (
              <p className="text-xs text-ink-muted">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-ink-muted hover:bg-slate-50"
          >
            关闭
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
