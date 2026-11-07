export type NavKey =
  | "wanglai"
  | "contacts"
  | "pending"
  | "stats"
  | "reminders"
  | "festivals"
  | "recycle"
  | "settings";

export type BookRow = {
  id: number;
  name: string;
  is_archived: number;
};
