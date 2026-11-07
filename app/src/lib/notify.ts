import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { api, isTauri, type ReminderRow } from "./db";

export async function ensureNotifyPermission(): Promise<boolean> {
  if (!isTauri()) return false;
  let granted = await isPermissionGranted();
  if (!granted) {
    const p = await requestPermission();
    granted = p === "granted";
  }
  return granted;
}

/** 启动时对逾期/今日提醒发系统通知（应用在前台时） */
export async function notifyDueReminders(bookId: number): Promise<number> {
  if (!isTauri()) return 0;
  const ok = await ensureNotifyPermission();
  if (!ok) return 0;
  const rows = await api.listReminders(bookId);
  const due = rows.filter(
    (r) => r.is_completed === 0 && (r.status === "overdue" || isToday(r)),
  );
  for (const r of due.slice(0, 5)) {
    sendNotification({
      title: "礼金簿提醒",
      body: r.title || `${r.contact_name ?? "提醒"} · ${r.trigger_date ?? ""}`,
    });
  }
  return due.length;
}

function isToday(r: ReminderRow): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const d = r.snooze_until || r.trigger_date;
  return d === today;
}
