import { useCallback, useEffect, useState } from "react";
import { PrintPreview } from "../components/PrintPreview";
import { useApp } from "../context/AppContext";
import { api, isTauri, type PendingRow } from "../lib/db";
import { suggestGiftCents, suggestGiftYuan } from "../lib/giftSuggest";
import { formatYuan } from "../lib/money";

type Props = {
  onOpenSettings?: () => void;
};

export function PendingPage({ onOpenSettings: _onOpenSettings }: Props) {
  const { bookId, books, giftSuggestOn, openCreate, showToast, refreshAll } =
    useApp();
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [showSettled, setShowSettled] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const bookName = books.find((b) => b.id === bookId)?.name ?? "礼金簿";

  const load = useCallback(async () => {
    if (!isTauri() || bookId == null) return;
    setRows(await api.listPending(bookId, showSettled));
  }, [bookId, showSettled]);

  useEffect(() => {
    void load().catch((e) => showToast(String(e)));
  }, [load, showToast]);

  return (
    <div className="flex h-full flex-col rounded-card bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">待还礼</h1>
        <button
          type="button"
          className="rounded-card border border-slate-200 px-3 py-1.5 text-sm"
          onClick={() => setPrintOpen(true)}
        >
          打印待还清单
        </button>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={showSettled}
            onChange={(e) => setShowSettled(e.target.checked)}
          />
          含已视为已还
        </label>
      </div>
      <p className="mb-3 text-sm text-ink-muted">
        规则：累计收礼 − 累计送礼 &gt; 0；「视为已还」只打标不删流水
      </p>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-ink-muted">目前没有待还礼</div>
            <p className="mt-1 text-sm text-ink-faint">收大于支的人情会出现在这里，方便你择日回礼。</p>
          </div>
        ) : (
          rows.map((r) => {
            const suggestYuan = suggestGiftYuan(r.balance_cents);
            return (
              <div
                key={r.contact_id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-slate-100 px-4 py-3"
              >
                <div className="min-w-[120px] font-medium">{r.contact_name}</div>
                <div className="text-primary font-semibold">
                  差额 {formatYuan(r.balance_cents)}
                </div>
                {giftSuggestOn && !r.settled ? (
                  <div className="text-sm text-ink-muted">
                    建议回礼 ¥{suggestYuan.toLocaleString("zh-CN")}
                  </div>
                ) : null}
                {r.settled ? (
                  <span className="rounded-full bg-page px-2 py-0.5 text-xs text-ink-faint">
                    已视为已还
                  </span>
                ) : null}
                <div className="ml-auto flex flex-wrap gap-2 text-sm">
                  {!r.settled ? (
                    <>
                      <button
                        type="button"
                        className="rounded-card bg-primary px-3 py-1.5 text-white"
                        onClick={() =>
                          openCreate({
                            contact_id: r.contact_id,
                            contact_name: r.contact_name,
                            direction: "out",
                            amount_cents: giftSuggestOn
                              ? suggestGiftCents(r.balance_cents)
                              : r.balance_cents,
                            event_title: "回礼",
                          })
                        }
                      >
                        记还礼
                      </button>
                      <button
                        type="button"
                        className="rounded-card border border-slate-200 px-3 py-1.5"
                        onClick={async () => {
                          if (bookId == null) return;
                          await api.settleContact(bookId, r.contact_id);
                          await load();
                          await refreshAll();
                          showToast("已视为已还");
                        }}
                      >
                        视为已还
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded-card border border-slate-200 px-3 py-1.5"
                      onClick={async () => {
                        if (bookId == null) return;
                        await api.unsettleContact(bookId, r.contact_id);
                        await load();
                        await refreshAll();
                        showToast("已取消视为已还");
                      }}
                    >
                      取消视为已还
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {printOpen ? (
        <PrintPreview
          template="pending"
          bookName={bookName}
          pending={rows}
          txs={[]}
          onClose={() => setPrintOpen(false)}
        />
      ) : null}
    </div>
  );
}
