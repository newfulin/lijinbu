import { useCallback, useEffect, useMemo, useState } from "react";
import { Field, SideDrawer } from "../components/ui/SideDrawer";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { useApp } from "../context/AppContext";
import { api, isTauri, type ReminderRow } from "../lib/db";
import { ensureNotifyPermission } from "../lib/notify";

const TYPE_LABEL: Record<string, string> = {
  fixed_date: "指定日期",
  after_receive_days: "收礼后 N 天",
  before_festival_days: "节日前 N 天",
};

type ReminderType = "fixed_date" | "after_receive_days" | "before_festival_days";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function RemindersPage() {
  const { bookId, festivalTags, showToast, openCreate } = useApp();
  const confirm = useConfirm();
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [reminderType, setReminderType] = useState<ReminderType>("fixed_date");
  const [title, setTitle] = useState("还礼提醒");
  const [triggerDate, setTriggerDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [baseDate, setBaseDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [daysParam, setDaysParam] = useState("30");
  const [festivalTagId, setFestivalTagId] = useState<number | null>(null);
  const [festivalDate, setFestivalDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  const load = useCallback(async () => {
    if (!isTauri() || bookId == null) return;
    setRows(await api.listReminders(bookId));
  }, [bookId]);

  useEffect(() => {
    void load().catch((e) => showToast(String(e)));
  }, [load, showToast]);

  const upcoming = useMemo(
    () => rows.filter((r) => r.status === "upcoming" && (showDone || r.is_completed === 0)),
    [rows, showDone],
  );
  const overdue = useMemo(
    () => rows.filter((r) => r.status === "overdue"),
    [rows],
  );
  const completed = useMemo(
    () => rows.filter((r) => r.status === "completed"),
    [rows],
  );

  function openDrawer() {
    const today = new Date().toISOString().slice(0, 10);
    setReminderType("fixed_date");
    setTitle("还礼提醒");
    setTriggerDate(today);
    setBaseDate(today);
    setDaysParam("30");
    setFestivalTagId(festivalTags[0]?.id ?? null);
    setFestivalDate(today);
    setErr("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
  }

  async function submit() {
    if (bookId == null || !isTauri()) return;
    const t = title.trim() || "还礼提醒";
    let days_param: number | null = null;
    let festival_tag_id: number | null = null;
    let trigger_date = triggerDate;

    if (reminderType === "after_receive_days") {
      const n = Number(daysParam);
      if (!Number.isFinite(n) || n < 0) {
        setErr("请填写有效天数");
        return;
      }
      days_param = n;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(baseDate)) {
        setErr("请填写收礼日");
        return;
      }
      trigger_date = addDays(baseDate, n);
    } else if (reminderType === "before_festival_days") {
      const n = Number(daysParam);
      if (!Number.isFinite(n) || n < 0) {
        setErr("请填写有效天数");
        return;
      }
      days_param = n;
      festival_tag_id = festivalTagId;
      if (!festival_tag_id) {
        setErr("请选择节日");
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(festivalDate)) {
        setErr("请填写节日公历日期");
        return;
      }
      trigger_date = addDays(festivalDate, -Math.abs(n));
    } else {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(triggerDate)) {
        setErr("请填写触发日期");
        return;
      }
    }

    setSaving(true);
    setErr("");
    try {
      await api.createReminder({
        book_id: bookId,
        reminder_type: reminderType,
        trigger_date,
        days_param,
        title: t,
        festival_tag_id,
        is_important: false,
      });
      await ensureNotifyPermission();
      await load();
      showToast("已创建提醒");
      setDrawerOpen(false);
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  function Section({
    title: sectionTitle,
    items,
    danger,
  }: {
    title: string;
    items: ReminderRow[];
    danger?: boolean;
  }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <h2 className={`mb-2 text-sm font-medium ${danger ? "text-expense" : "text-ink"}`}>
          {sectionTitle}（{items.length}）
        </h2>
        <div className="space-y-2">
          {items.map((r) => (
            <div
              key={r.id}
              className={`flex flex-wrap items-center gap-2 rounded-card border px-3 py-3 text-sm ${
                danger ? "border-expense/20 bg-expense-soft/40" : "border-slate-100"
              }`}
            >
              <div className="min-w-[140px] font-medium">{r.title || "提醒"}</div>
              <span className="text-xs text-ink-faint">
                {TYPE_LABEL[r.reminder_type] ?? r.reminder_type}
              </span>
              <span className="text-ink-muted">
                {r.trigger_date}
                {r.snooze_until ? ` · 延至 ${r.snooze_until}` : ""}
              </span>
              {r.contact_name ? (
                <span className="text-ink-muted">{r.contact_name}</span>
              ) : null}
              {r.festival_name ? (
                <span className="text-primary text-xs">{r.festival_name}</span>
              ) : null}
              <div className="ml-auto flex gap-2">
                {r.is_completed === 0 ? (
                  <>
                    <button
                      type="button"
                      className="text-primary"
                      onClick={() =>
                        openCreate({
                          contact_id: r.contact_id,
                          contact_name: r.contact_name ?? "",
                          direction: "out",
                          event_title: r.title ?? "回礼",
                          amount_cents: r.amount_hint_cents ?? 0,
                        })
                      }
                    >
                      记还礼
                    </button>
                    <button
                      type="button"
                      className="text-ink-muted"
                      onClick={async () => {
                        await api.completeReminder(r.id);
                        await load();
                      }}
                    >
                      完成
                    </button>
                    <button
                      type="button"
                      className="text-ink-muted"
                      onClick={async () => {
                        await api.snoozeReminder(r.id, 3);
                        await load();
                        showToast("已延后 3 天");
                      }}
                    >
                      延后
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="text-expense"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "删除该提醒？",
                      confirmText: "删除",
                      danger: true,
                    });
                    if (!ok) return;
                    await api.deleteReminder(r.id);
                    await load();
                  }}
                >
                  删
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-card bg-card p-5 shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">提醒</h1>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />
          显示已完成
        </label>
        <button
          type="button"
          className="btn-primary !h-9"
          onClick={openDrawer}
        >
          + 新建提醒
        </button>
      </div>
      <p className="mb-4 text-xs text-ink-faint">
        说明：退出应用后不保证系统通知仍会送达；请以应用内列表为准。
      </p>
      <div className="min-h-0 flex-1 overflow-auto">
        <Section title="已逾期" items={overdue} danger />
        <Section title="即将到来" items={upcoming.filter((r) => r.is_completed === 0)} />
        {showDone ? <Section title="已完成" items={completed} /> : null}
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-ink-muted">暂时没有提醒</div>
            <p className="mt-1 text-sm text-ink-faint">
              设一个还礼日，重要的人情就不会忘掉。
            </p>
          </div>
        ) : null}
      </div>

      <SideDrawer
        open={drawerOpen}
        title="新建提醒"
        subtitle="选择类型并填写日期"
        onClose={closeDrawer}
        footer={
          <>
            <button
              type="button"
              className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-slate-50"
              onClick={closeDrawer}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-card bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
              disabled={saving}
              onClick={() => void submit()}
            >
              创建
            </button>
          </>
        }
      >
        <Field label="类型">
          <div className="flex flex-col gap-2">
            {(
              [
                ["fixed_date", "指定日期"],
                ["after_receive_days", "收礼后 N 天"],
                ["before_festival_days", "节日前 N 天"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`rounded-card px-3 py-2.5 text-left text-sm ${
                  reminderType === v
                    ? "bg-primary-soft font-medium text-primary-dark"
                    : "bg-page text-ink-muted hover:bg-slate-50"
                }`}
                onClick={() => {
                  setReminderType(v);
                  setDaysParam(v === "before_festival_days" ? "7" : "30");
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="标题">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="还礼提醒"
          />
        </Field>

        {reminderType === "fixed_date" ? (
          <Field label="触发日期">
            <input
              type="date"
              className="input"
              value={triggerDate}
              onChange={(e) => setTriggerDate(e.target.value)}
            />
          </Field>
        ) : null}

        {reminderType === "after_receive_days" ? (
          <>
            <Field label="收礼日">
              <input
                type="date"
                className="input"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
              />
            </Field>
            <Field label="收礼后几天">
              <input
                className="input"
                inputMode="numeric"
                value={daysParam}
                onChange={(e) => setDaysParam(e.target.value)}
              />
            </Field>
            <p className="text-xs text-ink-faint">
              将于 {addDays(baseDate || triggerDate, Number(daysParam) || 0)} 提醒
            </p>
          </>
        ) : null}

        {reminderType === "before_festival_days" ? (
          <>
            <Field label="节日">
              <select
                className="input"
                value={festivalTagId ?? ""}
                onChange={(e) =>
                  setFestivalTagId(e.target.value ? Number(e.target.value) : null)
                }
              >
                {festivalTags.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="节日公历日期">
              <input
                type="date"
                className="input"
                value={festivalDate}
                onChange={(e) => setFestivalDate(e.target.value)}
              />
            </Field>
            <Field label="提前几天">
              <input
                className="input"
                inputMode="numeric"
                value={daysParam}
                onChange={(e) => setDaysParam(e.target.value)}
              />
            </Field>
            <p className="text-xs text-ink-faint">
              将于{" "}
              {addDays(festivalDate || triggerDate, -Math.abs(Number(daysParam) || 0))}{" "}
              提醒
            </p>
          </>
        ) : null}

        {err ? <p className="text-sm text-expense">{err}</p> : null}
      </SideDrawer>
    </div>
  );
}
