import { invoke } from "@tauri-apps/api/core";

export type BookRow = { id: number; name: string; is_archived: number };
export type MemberRow = {
  id: number;
  book_id: number;
  name: string;
  sort: number;
  is_default: number;
};
export type TagRow = {
  id: number;
  book_id: number;
  name: string;
  is_system: number;
  sort: number;
};
export type FestivalRow = {
  id: number;
  book_id: number;
  name: string;
  is_builtin: number;
  sort: number;
};
export type ContactRow = {
  id: number;
  book_id: number;
  name: string;
  name_pinyin: string | null;
  name_initials: string | null;
  relation_tag_id: number | null;
  relation_name: string | null;
  note: string | null;
  location: string | null;
  is_stopped: number;
  balance_cents: number;
  last_date: string | null;
  last_amount_cents: number | null;
  last_direction: string | null;
  settled: number;
};
export type ContactInput = {
  book_id: number;
  name: string;
  name_pinyin?: string | null;
  name_initials?: string | null;
  relation_tag_id?: number | null;
  note?: string | null;
  location?: string | null;
  force_new?: boolean;
};
export type PendingRow = {
  contact_id: number;
  contact_name: string;
  balance_cents: number;
  settled: boolean;
};
export type RecycleItem = {
  kind: string;
  id: number;
  title: string;
  deleted_at: string;
  amount_cents: number | null;
};
export type GlobalHit = {
  kind: string;
  id: number;
  title: string;
  subtitle: string;
};
export type ReminderRow = {
  id: number;
  book_id: number;
  contact_id: number | null;
  contact_name: string | null;
  transaction_id: number | null;
  reminder_type: string;
  trigger_date: string | null;
  days_param: number | null;
  amount_hint_cents: number | null;
  title: string | null;
  is_important: number;
  is_completed: number;
  completed_at: string | null;
  snooze_until: string | null;
  festival_tag_id: number | null;
  festival_name: string | null;
  status: "upcoming" | "overdue" | "completed" | string;
};
export type ReminderInput = {
  book_id: number;
  contact_id?: number | null;
  transaction_id?: number | null;
  reminder_type: "fixed_date" | "after_receive_days" | "before_festival_days" | string;
  trigger_date?: string | null;
  days_param?: number | null;
  amount_hint_cents?: number | null;
  title?: string | null;
  is_important?: boolean;
  festival_tag_id?: number | null;
};
export type StatsQuery = {
  book_id: number;
  year: number;
  member_id?: number | null;
  relation_tag_id?: number | null;
};
export type StatsResult = {
  year: number;
  in_cents: number;
  out_cents: number;
  net_cents: number;
  count: number;
  pending_count: number;
  monthly: { month: string; in_cents: number; out_cents: number; net_cents: number }[];
  by_relation: { relation_name: string; in_cents: number; out_cents: number }[];
  table_rows: {
    label: string;
    in_cents: number;
    out_cents: number;
    net_cents: number;
    count: number;
  }[];
};
export type YearReport = {
  book_name: string;
  year: number;
  generated_at: string;
  lunar_note: string;
  in_cents: number;
  out_cents: number;
  net_cents: number;
  count: number;
  top_receive: { contact_id: number; contact_name: string; amount_cents: number }[];
  top_give: { contact_id: number; contact_name: string; amount_cents: number }[];
  top_pending: { contact_id: number; contact_name: string; amount_cents: number }[];
  festival_dist: { festival_name: string; count: number; amount_cents: number }[];
  pending_count: number;
  pending_total_cents: number;
};
export type TxRow = {
  id: number;
  book_id: number;
  contact_id: number;
  contact_name: string;
  member_id: number;
  member_name: string;
  direction: "in" | "out" | string;
  amount_cents: number;
  date_gregorian: string;
  event_title: string | null;
  festival_tag_id: number | null;
  festival_name: string | null;
  note: string | null;
  payment_method: string | null;
  gift_note: string | null;
  relation_tag_id: number | null;
  relation_name: string | null;
  /** male | female | joint | null */
  side: string | null;
};
export type SummaryCard = {
  month_in_cents: number;
  month_out_cents: number;
  year_in_cents: number;
  year_out_cents: number;
  total_count: number;
  contact_count: number;
  pending_count: number;
};
export type TxInput = {
  book_id: number;
  contact_id: number | null;
  contact_name: string;
  relation_tag_id: number | null;
  member_id: number;
  direction: "in" | "out";
  amount_cents: number;
  date_gregorian: string;
  event_title: string | null;
  festival_tag_id: number | null;
  note: string | null;
  payment_method: string | null;
  gift_note: string | null;
  create_reminder?: boolean;
  name_pinyin?: string | null;
  name_initials?: string | null;
  force_new_contact?: boolean;
  side?: string | null;
};
export type BootstrapInfo = {
  data_dir: string;
  db_path: string;
  books: BookRow[];
  active_book_id: number;
  default_member_name: string;
  settings: Record<string, unknown>;
};
export type BackupInfo = {
  path: string;
  exported_at: string;
  tx_count: number;
};

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export const api = {
  getBootstrap: () => invoke<BootstrapInfo>("get_bootstrap"),
  openDataFolder: () => invoke("open_data_folder"),
  listBooks: () => invoke<BookRow[]>("list_books"),
  createBook: (name: string) => invoke<BookRow>("create_book", { name }),
  renameBook: (id: number, name: string) => invoke("rename_book", { id, name }),
  deleteBook: (id: number) => invoke("delete_book", { id }),
  setActiveBook: (id: number) => invoke("set_active_book", { id }),
  listMembers: (bookId: number) => invoke<MemberRow[]>("list_members", { bookId }),
  createMember: (bookId: number, name: string) =>
    invoke<MemberRow>("create_member", { bookId, name }),
  renameMember: (id: number, name: string) => invoke("rename_member", { id, name }),
  deleteMember: (id: number) => invoke("delete_member", { id }),
  listRelationTags: (bookId: number) =>
    invoke<TagRow[]>("list_relation_tags", { bookId }),
  createRelationTag: (bookId: number, name: string) =>
    invoke<TagRow>("create_relation_tag", { bookId, name }),
  listFestivalTags: (bookId: number) =>
    invoke<FestivalRow[]>("list_festival_tags", { bookId }),
  listContacts: (bookId: number, tab: string, q: string) =>
    invoke<ContactRow[]>("list_contacts", { bookId, tab, q }),
  searchContacts: (bookId: number, q: string) =>
    invoke<ContactRow[]>("search_contacts", { bookId, q }),
  findSameName: (bookId: number, name: string) =>
    invoke<ContactRow[]>("find_same_name", { bookId, name }),
  createContact: (input: ContactInput) =>
    invoke<ContactRow>("create_contact", { input }),
  updateContact: (id: number, input: ContactInput) =>
    invoke<ContactRow>("update_contact", { id, input }),
  setContactStopped: (id: number, stopped: boolean) =>
    invoke("set_contact_stopped", { id, stopped }),
  softDeleteContact: (id: number) => invoke("soft_delete_contact", { id }),
  mergeContacts: (bookId: number, keepId: number, mergeId: number) =>
    invoke("merge_contacts", { bookId, keepId, mergeId }),
  listPending: (bookId: number, includeSettled = false) =>
    invoke<PendingRow[]>("list_pending", { bookId, includeSettled }),
  settleContact: (bookId: number, contactId: number) =>
    invoke("settle_contact", { bookId, contactId }),
  unsettleContact: (bookId: number, contactId: number) =>
    invoke("unsettle_contact", { bookId, contactId }),
  listRecycle: (bookId: number) =>
    invoke<RecycleItem[]>("list_recycle", { bookId }),
  restoreRecycle: (kind: string, id: number) =>
    invoke("restore_recycle", { kind, id }),
  purgeRecycle: (kind: string, id: number) =>
    invoke("purge_recycle", { kind, id }),
  globalSearch: (bookId: number, q: string) =>
    invoke<GlobalHit[]>("global_search", { bookId, q }),
  listTransactions: (
    bookId: number,
    direction?: string,
    q?: string,
    festivalTagId?: number | null,
    side?: string | null,
  ) =>
    invoke<TxRow[]>("list_transactions", {
      bookId,
      direction,
      q,
      festivalTagId: festivalTagId ?? null,
      side: side ?? null,
    }),
  createTransaction: (input: TxInput) =>
    invoke<TxRow>("create_transaction", { input }),
  updateTransaction: (id: number, input: TxInput) =>
    invoke<TxRow>("update_transaction", { id, input }),
  softDeleteTransaction: (id: number) =>
    invoke("soft_delete_transaction", { id }),
  listReminders: (bookId: number) =>
    invoke<ReminderRow[]>("list_reminders", { bookId }),
  createReminder: (input: ReminderInput) =>
    invoke<ReminderRow>("create_reminder", { input }),
  completeReminder: (id: number) => invoke("complete_reminder", { id }),
  snoozeReminder: (id: number, days: number) =>
    invoke("snooze_reminder", { id, days }),
  deleteReminder: (id: number) => invoke("delete_reminder", { id }),
  createFestivalTag: (bookId: number, name: string) =>
    invoke<FestivalRow>("create_festival_tag", { bookId, name }),
  renameFestivalTag: (id: number, name: string) =>
    invoke("rename_festival_tag", { id, name }),
  deleteFestivalTag: (id: number) => invoke("delete_festival_tag", { id }),
  getSummary: (bookId: number) => invoke<SummaryCard>("get_summary", { bookId }),
  getStats: (query: StatsQuery) => invoke<StatsResult>("get_stats", { query }),
  getYearReport: (bookId: number, year: number) =>
    invoke<YearReport>("get_year_report", { bookId, year }),
  getSettings: () => invoke<Record<string, unknown>>("get_settings"),
  setSetting: (key: string, valueJson: string) =>
    invoke("set_setting", { key, valueJson }),
  exportBackup: () => invoke<BackupInfo>("export_backup"),
  listBackups: () => invoke<string[]>("list_backups"),
  restoreBackupPath: (path: string) => invoke("restore_backup_path", { path }),
  restoreBackupJson: (json: string) => invoke("restore_backup_json", { json }),
  purgeExpiredRecycle: (days: number) =>
    invoke<number>("purge_expired_recycle", { days }),
};

export const getBootstrap = api.getBootstrap;
export const openDataFolder = api.openDataFolder;
