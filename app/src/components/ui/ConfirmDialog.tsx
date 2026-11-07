import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ConfirmOpts = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmCtx);
  if (!fn) {
    return async (opts) => window.confirm(opts.message || opts.title);
  }
  return fn;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOpts>({ title: "" });
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function finish(v: boolean) {
    setOpen(false);
    resolver.current?.(v);
    resolver.current = null;
  }

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmCtx.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="关闭遮罩"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => finish(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="ui-drawer-in relative z-10 w-full max-w-sm rounded-card bg-white p-5 shadow-xl"
          >
            <h3 id="confirm-title" className="text-base font-semibold text-ink">
              {opts.title}
            </h3>
            {opts.message ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{opts.message}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-card px-3 py-2 text-sm text-ink-muted transition hover:bg-slate-50"
                onClick={() => finish(false)}
              >
                {opts.cancelText ?? "取消"}
              </button>
              <button
                type="button"
                className={`rounded-card px-4 py-2 text-sm font-medium text-white transition ${
                  opts.danger
                    ? "bg-expense hover:bg-red-700"
                    : "bg-primary hover:bg-primary-dark"
                }`}
                onClick={() => finish(true)}
                autoFocus
              >
                {opts.confirmText ?? "确定"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmCtx.Provider>
  );
}
