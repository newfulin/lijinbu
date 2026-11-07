import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useConfirm } from "../ui/ConfirmDialog";
import { RelationTagPicker } from "../ui/RelationTagPicker";
import { useApp } from "../../context/AppContext";
import { api, isTauri, type ContactRow, type TxInput } from "../../lib/db";
import { suggestGiftYuan } from "../../lib/giftSuggest";
import { chordLabel } from "../../lib/platform";
import { formatLunar } from "../../lib/lunar";
import { centsToYuan, formatYuan, parseYuanInput, yuanToCents } from "../../lib/money";
import { nameToPinyinFields } from "../../lib/pinyin";
import { SIDE_OPTIONS, type SideValue } from "../../lib/side";

const PAYMENTS: { value: string; label: string }[] = [
  { value: "cash", label: "现金" },
  { value: "wechat", label: "微信" },
  { value: "alipay", label: "支付宝" },
  { value: "bank", label: "转账" },
  { value: "other", label: "其他" },
];

export function RecordDrawer() {
  const {
    drawerOpen,
    draft,
    closeDrawer,
    saveTx,
    bookId,
    members,
    relationTags,
    festivalTags,
    lunarOn,
    giftSuggestOn,
    quickAmounts,
    reloadMeta,
  } = useApp();
  const confirm = useConfirm();

  const [contactName, setContactName] = useState("");
  const [contactId, setContactId] = useState<number | null>(null);
  const [relationTagId, setRelationTagId] = useState<number | null>(null);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [amountText, setAmountText] = useState("");
  const [date, setDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [festivalTagId, setFestivalTagId] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<number>(0);
  const [payment, setPayment] = useState<string>("");
  const [giftNote, setGiftNote] = useState("");
  const [note, setNote] = useState("");
  const [createReminder, setCreateReminder] = useState(false);
  const [side, setSide] = useState<SideValue>("");
  const [insight, setInsight] = useState<ContactRow | null>(null);
  const [suggestions, setSuggestions] = useState<ContactRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [sameNameHits, setSameNameHits] = useState<ContactRow[] | null>(null);
  const [pendingKeepOpen, setPendingKeepOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen || !draft) return;
    setContactName(draft.contact_name ?? "");
    setContactId(draft.contact_id ?? null);
    setRelationTagId(draft.relation_tag_id ?? relationTags[0]?.id ?? null);
    setDirection(draft.direction === "out" ? "out" : "in");
    setAmountText(
      draft.amount_cents && draft.amount_cents > 0
        ? String(centsToYuan(draft.amount_cents))
        : "",
    );
    setDate(draft.date_gregorian ?? new Date().toISOString().slice(0, 10));
    setEventTitle(draft.event_title ?? "");
    setFestivalTagId(draft.festival_tag_id ?? null);
    setMemberId(draft.member_id ?? members.find((m) => m.is_default)?.id ?? 0);
    setPayment(draft.payment_method ?? "");
    setGiftNote(draft.gift_note ?? "");
    setNote(draft.note ?? "");
    setCreateReminder(!!draft.create_reminder);
    const s = (draft.side as SideValue) || "";
    setSide(s === "male" || s === "female" || s === "joint" ? s : "");
    setDirty(false);
    setErr("");
    setSameNameHits(null);
    setInsight(null);
  }, [drawerOpen, draft, members, relationTags]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void submit(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, dirty, contactName, amountText, direction, date, memberId]);

  useEffect(() => {
    if (!drawerOpen || !isTauri() || bookId == null) return;
    const q = contactName.trim();
    const t = window.setTimeout(() => {
      api.searchContacts(bookId, q).then(setSuggestions).catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(t);
  }, [contactName, drawerOpen, bookId]);

  useEffect(() => {
    if (!drawerOpen || !isTauri() || bookId == null) {
      setInsight(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      if (contactId != null) {
        const list = await api.searchContacts(bookId, contactName.trim() || "");
        if (cancelled) return;
        const found = list.find((c) => c.id === contactId);
        if (found) {
          setInsight(found);
          return;
        }
        // fallback: list all via empty might be heavy; use suggestions
        const fromSug = suggestions.find((c) => c.id === contactId);
        setInsight(fromSug ?? null);
        return;
      }
      const name = contactName.trim();
      if (!name) {
        setInsight(null);
        return;
      }
      const exact = suggestions.find((c) => c.name === name);
      setInsight(exact ?? null);
    };
    void run().catch(() => {
      if (!cancelled) setInsight(null);
    });
    return () => {
      cancelled = true;
    };
  }, [drawerOpen, contactId, contactName, suggestions, bookId]);

  const lunar = useMemo(
    () => (lunarOn && date ? formatLunar(date) : ""),
    [lunarOn, date],
  );

  if (!drawerOpen) return null;

  function markDirty() {
    setDirty(true);
  }

  async function requestClose() {
    if (dirty) {
      const ok = await confirm({
        title: "放弃未保存的内容？",
        message: "关闭后当前填写不会保存。",
        confirmText: "关闭",
        danger: true,
      });
      if (!ok) return;
    }
    closeDrawer();
  }

  function buildInput(forceNew = false): TxInput | null {
    if (!contactName.trim()) {
      setErr("请填写联系人");
      return null;
    }
    const yuan = parseYuanInput(amountText);
    if (yuan == null) {
      setErr("请填写有效金额");
      return null;
    }
    if (!memberId) {
      setErr("请选择成员");
      return null;
    }
    if (bookId == null) {
      setErr("未选择账本");
      return null;
    }
    const py = nameToPinyinFields(contactName);
    return {
      book_id: bookId,
      contact_id: contactId,
      contact_name: contactName.trim(),
      relation_tag_id: relationTagId,
      member_id: memberId,
      direction,
      amount_cents: yuanToCents(yuan),
      date_gregorian: date,
      event_title: eventTitle.trim() || null,
      festival_tag_id: festivalTagId,
      note: note.trim() || null,
      payment_method: payment || null,
      gift_note: giftNote.trim() || null,
      create_reminder: createReminder,
      side: side || null,
      name_pinyin: py.name_pinyin,
      name_initials: py.name_initials,
      force_new_contact: forceNew,
    };
  }

  async function finishSave(keepOpen: boolean, forceNew: boolean, forcedContactId?: number) {
    const input = buildInput(forceNew);
    if (!input) return;
    if (forcedContactId != null) input.contact_id = forcedContactId;
    await saveTx(input, { keepOpen });
    setDirty(false);
    setSameNameHits(null);
    if (keepOpen) {
      setAmountText("");
      setEventTitle("");
      setNote("");
      setGiftNote("");
    }
  }

  async function submit(keepOpen: boolean) {
    setSaving(true);
    setErr("");
    try {
      if (contactId == null && bookId != null && isTauri()) {
        const same = await api.findSameName(bookId, contactName.trim());
        if (same.length > 0) {
          setSameNameHits(same);
          setPendingKeepOpen(keepOpen);
          setSaving(false);
          return;
        }
      }
      await finishSave(keepOpen, false);
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function resolveSameName(choice: "use" | "new" | "cancel") {
    if (choice === "cancel") {
      setSameNameHits(null);
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (choice === "use" && sameNameHits?.[0]) {
        const hit = sameNameHits[0];
        setContactId(hit.id);
        setContactName(hit.name);
        await finishSave(pendingKeepOpen, false, hit.id);
      } else if (choice === "new") {
        await finishSave(pendingKeepOpen, true);
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="关闭遮罩"
        className="ui-fade-in absolute inset-0 bg-slate-900/30"
        onClick={() => void requestClose()}
      />
      <aside
        className="ui-drawer-in relative z-10 flex h-full w-[460px] max-w-[480px] min-w-[420px] flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="记一笔"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {draft?.id ? "编辑一笔" : "记一笔"}
            </h2>
            <p className="text-xs text-ink-muted">{chordLabel("S")} 保存 · Esc 关闭</p>
          </div>
          <button
            type="button"
            onClick={() => void requestClose()}
            className="rounded-lg px-2 py-1 text-ink-muted hover:bg-slate-50"
          >
            关闭
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {sameNameHits ? (
            <div className="rounded-card border border-primary/20 bg-primary-soft/40 p-4 space-y-3">
              <div className="text-sm font-medium text-ink">
                已有同名联系人「{contactName.trim()}」
              </div>
              <ul className="text-sm text-ink-muted">
                {sameNameHits.map((c) => (
                  <li key={c.id}>
                    {c.name}
                    {c.relation_name ? ` · ${c.relation_name}` : ""}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="rounded-card bg-primary px-3 py-2 text-sm text-white disabled:opacity-60"
                  disabled={saving}
                  onClick={() => void resolveSameName("use")}
                >
                  使用已有
                </button>
                <button
                  type="button"
                  className="rounded-card border border-slate-200 px-3 py-2 text-sm hover:bg-white disabled:opacity-60"
                  disabled={saving}
                  onClick={() => void resolveSameName("new")}
                >
                  仍要新建同名
                </button>
                <button
                  type="button"
                  className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-white"
                  disabled={saving}
                  onClick={() => void resolveSameName("cancel")}
                >
                  取消
                </button>
              </div>
            </div>
          ) : null}
          <Field label="联系人 *">
            <input
              className="input"
              value={contactName}
              onChange={(e) => {
                setContactName(e.target.value);
                setContactId(null);
                markDirty();
              }}
              placeholder="姓名，可搜索已有"
            />
            {suggestions.length > 0 && (
              <ul className="mt-1 max-h-36 overflow-auto rounded-card border border-slate-100 bg-white text-sm shadow-card">
                {suggestions.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left hover:bg-primary-soft"
                      onClick={() => {
                        setContactName(c.name);
                        setContactId(c.id);
                        if (c.relation_tag_id) setRelationTagId(c.relation_tag_id);
                        markDirty();
                        setSuggestions([]);
                      }}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          <Field label="关系标签">
            <RelationTagPicker
              tags={relationTags}
              value={relationTagId}
              onChange={(id) => {
                setRelationTagId(id);
                markDirty();
              }}
              bookId={bookId}
              onTagsChange={reloadMeta}
            />
          </Field>

          {insight ? (
            <div className="rounded-card border border-primary/20 bg-primary-soft/40 px-3 py-3 text-sm">
              <div className="mb-1 text-xs font-medium text-primary-dark">人情概览 · {insight.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-ink">
                <span>
                  历史净额{" "}
                  <strong
                    className={
                      insight.balance_cents > 0
                        ? "text-income"
                        : insight.balance_cents < 0
                          ? "text-expense"
                          : ""
                    }
                  >
                    {formatYuan(insight.balance_cents, true, insight.balance_cents >= 0 ? "in" : "out")}
                  </strong>
                </span>
                <span className="text-ink-muted">
                  最近一笔{" "}
                  {insight.last_date
                    ? `${insight.last_date} · ${
                        insight.last_direction === "out" ? "送礼" : "收礼"
                      } ${formatYuan(insight.last_amount_cents ?? 0)}`
                    : "尚无"}
                </span>
                {giftSuggestOn && insight.balance_cents > 0 ? (
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => {
                      setAmountText(String(suggestGiftYuan(insight.balance_cents)));
                      setDirection("out");
                      markDirty();
                    }}
                  >
                    建议回礼 ¥{suggestGiftYuan(insight.balance_cents).toLocaleString("zh-CN")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          <Field label="归属（婚礼两边）">
            <div className="flex flex-wrap gap-2">
              {SIDE_OPTIONS.map((o) => (
                <button
                  key={o.value || "none"}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    side === o.value
                      ? "bg-primary text-white"
                      : "bg-page text-ink-muted hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    setSide(o.value);
                    markDirty();
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="类型">
            <div className="flex gap-2">
              {(
                [
                  ["in", "收礼"],
                  ["out", "送礼"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  className={`flex-1 rounded-card py-2 text-sm ${
                    direction === v
                      ? v === "in"
                        ? "bg-income-soft text-income"
                        : "bg-expense-soft text-expense"
                      : "bg-page text-ink-muted"
                  }`}
                  onClick={() => {
                    setDirection(v);
                    markDirty();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="金额 *">
            <input
              className="input"
              inputMode="decimal"
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value);
                markDirty();
              }}
              placeholder="元"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {quickAmounts.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    amountText === String(n)
                      ? "bg-primary text-white"
                      : "bg-primary-soft text-primary-dark hover:bg-primary/20"
                  }`}
                  onClick={() => {
                    setAmountText(String(n));
                    markDirty();
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>

          <Field label="日期">
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                markDirty();
              }}
            />
            {lunar ? (
              <p className="mt-1 text-xs text-ink-muted">农历 {lunar}</p>
            ) : null}
          </Field>

          <Field label="事由 / 事件">
            <input
              className="input"
              value={eventTitle}
              onChange={(e) => {
                setEventTitle(e.target.value);
                markDirty();
              }}
            />
          </Field>

          <Field label="节日标签">
            <select
              className="input"
              value={festivalTagId ?? ""}
              onChange={(e) => {
                setFestivalTagId(e.target.value ? Number(e.target.value) : null);
                markDirty();
              }}
            >
              <option value="">无</option>
              {festivalTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="成员">
            <select
              className="input"
              value={memberId}
              onChange={(e) => {
                setMemberId(Number(e.target.value));
                markDirty();
              }}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="支付方式">
            <select
              className="input"
              value={payment}
              onChange={(e) => {
                setPayment(e.target.value);
                markDirty();
              }}
            >
              <option value="">不填</option>
              {PAYMENTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="礼品">
            <input
              className="input"
              value={giftNote}
              onChange={(e) => {
                setGiftNote(e.target.value);
                markDirty();
              }}
              placeholder="可选，实物礼品描述"
            />
          </Field>

          <Field label="备注">
            <input
              className="input"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                markDirty();
              }}
            />
          </Field>

          <label className="flex items-center justify-between rounded-card border border-slate-100 px-3 py-2.5 text-sm">
            <span>创建还礼提醒</span>
            <input
              type="checkbox"
              checked={createReminder}
              onChange={(e) => {
                setCreateReminder(e.target.checked);
                markDirty();
              }}
            />
          </label>

          {err ? <p className="text-sm text-expense">{err}</p> : null}
        </div>

        <footer className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            className="rounded-card border border-slate-200 px-3 py-2.5 text-sm text-ink-muted"
            onClick={() => void requestClose()}
          >
            取消
          </button>
          <button
            type="button"
            className="rounded-card border border-primary/30 px-3 py-2.5 text-sm text-primary"
            disabled={saving}
            onClick={() => void submit(true)}
          >
            保存并继续
          </button>
          <button
            type="button"
            className="flex-1 rounded-card bg-primary py-2.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={saving}
            onClick={() => void submit(false)}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
