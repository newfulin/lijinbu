import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  isTauri,
  type BookRow,
  type BootstrapInfo,
  type FestivalRow,
  type MemberRow,
  type SummaryCard,
  type TagRow,
  type TxInput,
  type TxRow,
} from "../lib/db";
import {
  isPinSet,
  readSessionUnlocked,
  settingInt,
} from "../lib/pin";
import { asBool, parseQuickAmounts } from "../lib/settings";

type MotionFlash = {
  direction: "in" | "out";
  amountCents: number;
  key: number;
} | null;

type DraftTx = Partial<TxInput> & { id?: number };

type AppCtx = {
  ready: boolean;
  error: string;
  boot: BootstrapInfo | null;
  bookId: number | null;
  books: BookRow[];
  members: MemberRow[];
  relationTags: TagRow[];
  festivalTags: FestivalRow[];
  txs: TxRow[];
  summary: SummaryCard | null;
  txTab: "all" | "in" | "out";
  txQuery: string;
  festivalFilterId: number | null;
  setFestivalFilterId: (id: number | null) => void;
  sideFilter: string;
  setSideFilter: (s: string) => void;
  quickAmounts: number[];
  reduceMotion: boolean;
  lunarOn: boolean;
  careMode: boolean;
  giftSuggestOn: boolean;
  experimental3d: boolean;
  recycleRetainDays: number;
  pinUnlocked: boolean;
  setPinUnlocked: (v: boolean) => void;
  toast: string;
  motion: MotionFlash;
  draft: DraftTx | null;
  drawerOpen: boolean;
  refreshAll: () => Promise<void>;
  setTxTab: (t: "all" | "in" | "out") => void;
  setTxQuery: (q: string) => void;
  switchBook: (id: number) => Promise<void>;
  openCreate: (prefill?: Partial<TxInput>) => void;
  openEdit: (tx: TxRow) => void;
  closeDrawer: () => void;
  saveTx: (input: TxInput, opts?: { keepOpen?: boolean }) => Promise<void>;
  deleteTx: (id: number) => Promise<void>;
  setSettingBool: (key: string, value: boolean) => Promise<void>;
  setSettingValue: (key: string, valueJson: string) => Promise<void>;
  showToast: (msg: string) => void;
  reloadMeta: () => Promise<void>;
};

const Ctx = createContext<AppCtx | null>(null);

const emptySummary: SummaryCard = {
  month_in_cents: 0,
  month_out_cents: 0,
  year_in_cents: 0,
  year_out_cents: 0,
  total_count: 0,
  contact_count: 0,
  pending_count: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [boot, setBoot] = useState<BootstrapInfo | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [relationTags, setRelationTags] = useState<TagRow[]>([]);
  const [festivalTags, setFestivalTags] = useState<FestivalRow[]>([]);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [summary, setSummary] = useState<SummaryCard | null>(null);
  const [txTab, setTxTab] = useState<"all" | "in" | "out">("all");
  const [txQuery, setTxQuery] = useState("");
  const [festivalFilterId, setFestivalFilterId] = useState<number | null>(null);
  const [sideFilter, setSideFilter] = useState<string>("");
  const [toast, setToast] = useState("");
  const [motion, setMotion] = useState<MotionFlash>(null);
  const [draft, setDraft] = useState<DraftTx | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(() => readSessionUnlocked());

  const bookId = boot?.active_book_id ?? null;
  const reduceMotion = asBool(boot?.settings?.reduce_motion, false);
  const lunarOn = asBool(boot?.settings?.lunar_on, true);
  const careMode = asBool(boot?.settings?.care_mode_large_text, false);
  const giftSuggestOn = asBool(boot?.settings?.gift_suggest_on, true);
  const quickAmounts = parseQuickAmounts(boot?.settings?.quick_amounts);
  const experimental3d = asBool(boot?.settings?.experimental_3d_celebrate, false);
  const recycleRetainDays = settingInt(boot?.settings?.recycle_retain_days, 30);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const reloadMeta = useCallback(async () => {
    if (!isTauri() || bookId == null) return;
    const [m, r, f] = await Promise.all([
      api.listMembers(bookId),
      api.listRelationTags(bookId),
      api.listFestivalTags(bookId),
    ]);
    setMembers(m);
    setRelationTags(r);
    setFestivalTags(f);
  }, [bookId]);

  const refreshAll = useCallback(async () => {
    if (!isTauri()) {
      setBoot({
        data_dir: "(浏览器预览 · 无本地库)",
        db_path: "",
        books: [{ id: 1, name: "我的礼簿", is_archived: 0 }],
        active_book_id: 1,
        default_member_name: "我",
        settings: {
          lunar_on: true,
          reduce_motion: false,
          care_mode_large_text: false,
        },
      });
      setMembers([{ id: 1, book_id: 1, name: "我", sort: 0, is_default: 1 }]);
      setRelationTags([
        { id: 1, book_id: 1, name: "亲戚", is_system: 1, sort: 0 },
        { id: 2, book_id: 1, name: "同事", is_system: 1, sort: 1 },
        { id: 3, book_id: 1, name: "同学", is_system: 1, sort: 2 },
        { id: 4, book_id: 1, name: "其他", is_system: 1, sort: 3 },
      ]);
      setFestivalTags([]);
      setTxs([]);
      setSummary(emptySummary);
      setReady(true);
      return;
    }
    const info = await api.getBootstrap();
    setBoot(info);
    const bid = info.active_book_id;
    const dir = txTab === "all" ? undefined : txTab;
    const sideArg =
      sideFilter === ""
        ? null
        : sideFilter === "none"
          ? "none"
          : sideFilter;
    const [m, r, f, list, sum] = await Promise.all([
      api.listMembers(bid),
      api.listRelationTags(bid),
      api.listFestivalTags(bid),
      api.listTransactions(bid, dir, txQuery || undefined, festivalFilterId, sideArg),
      api.getSummary(bid),
    ]);
    setMembers(m);
    setRelationTags(r);
    setFestivalTags(f);
    setTxs(list);
    setSummary(sum);
    setReady(true);
  }, [txTab, txQuery, festivalFilterId, sideFilter]);

  useEffect(() => {
    refreshAll().catch((e) => {
      setError(String(e));
      setReady(true);
    });
  }, [refreshAll]);

  useEffect(() => {
    document.documentElement.classList.toggle("care-mode", careMode);
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [careMode, reduceMotion]);

  useEffect(() => {
    if (!boot) return;
    if (!isPinSet(boot.settings)) {
      setPinUnlocked(true);
    }
  }, [boot]);

  useEffect(() => {
    if (!isTauri() || !ready || bookId == null) return;
    const days = recycleRetainDays;
    if (days <= 0) return;
    void api.purgeExpiredRecycle(days).catch(() => undefined);
  }, [ready, bookId, recycleRetainDays]);

  const switchBook = useCallback(
    async (id: number) => {
      if (!isTauri()) return;
      await api.setActiveBook(id);
      await refreshAll();
      showToast("已切换账本");
    },
    [refreshAll, showToast],
  );

  const openCreate = useCallback(
    (prefill?: Partial<TxInput>) => {
      const defMember = members.find((m) => m.is_default === 1) ?? members[0];
      setDraft({
        contact_id: null,
        contact_name: "",
        relation_tag_id: relationTags[0]?.id ?? null,
        member_id: defMember?.id ?? 0,
        direction: "in",
        amount_cents: 0,
        date_gregorian: new Date().toISOString().slice(0, 10),
        event_title: "",
        festival_tag_id: null,
        note: "",
        payment_method: null,
        gift_note: "",
        create_reminder: false,
        side: null,
        ...prefill,
      });
      setDrawerOpen(true);
    },
    [members, relationTags],
  );

  const openEdit = useCallback((tx: TxRow) => {
    setDraft({
      id: tx.id,
      contact_id: tx.contact_id,
      contact_name: tx.contact_name,
      relation_tag_id: tx.relation_tag_id,
      member_id: tx.member_id,
      direction: tx.direction === "out" ? "out" : "in",
      amount_cents: tx.amount_cents,
      date_gregorian: tx.date_gregorian,
      event_title: tx.event_title ?? "",
      festival_tag_id: tx.festival_tag_id,
      note: tx.note ?? "",
      payment_method: tx.payment_method,
      gift_note: tx.gift_note ?? "",
      create_reminder: false,
      side: tx.side ?? null,
    });
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDraft(null);
  }, []);

  const saveTx = useCallback(
    async (input: TxInput, opts?: { keepOpen?: boolean }) => {
      if (!isTauri() || bookId == null) {
        showToast("请在桌面应用中保存");
        return;
      }
      const payload = { ...input, book_id: bookId };
      const editingId = draft?.id;
      const row = editingId
        ? await api.updateTransaction(editingId, payload)
        : await api.createTransaction(payload);
      if (!reduceMotion) {
        setMotion({
          direction: row.direction === "out" ? "out" : "in",
          amountCents: row.amount_cents,
          key: Date.now(),
        });
        const ms = experimental3d ? 1500 : 800;
        window.setTimeout(() => setMotion(null), ms);
      }
      showToast(editingId ? "已更新" : "已记一笔");
      await refreshAll();
      if (opts?.keepOpen) {
        setDraft((prev) =>
          prev
            ? {
                ...prev,
                id: undefined,
                amount_cents: 0,
                event_title: "",
                note: "",
                gift_note: "",
              }
            : prev,
        );
      } else {
        closeDrawer();
      }
    },
    [
      bookId,
      draft?.id,
      reduceMotion,
      experimental3d,
      refreshAll,
      showToast,
      closeDrawer,
    ],
  );

  const deleteTx = useCallback(
    async (id: number) => {
      if (!isTauri()) return;
      await api.softDeleteTransaction(id);
      showToast("已移入回收站");
      await refreshAll();
    },
    [refreshAll, showToast],
  );

  const setSettingBool = useCallback(
    async (key: string, value: boolean) => {
      if (!isTauri()) return;
      await api.setSetting(key, value ? "true" : "false");
      await refreshAll();
    },
    [refreshAll],
  );

  const setSettingValue = useCallback(
    async (key: string, valueJson: string) => {
      if (!isTauri()) return;
      await api.setSetting(key, valueJson);
      await refreshAll();
    },
    [refreshAll],
  );

  const value = useMemo<AppCtx>(
    () => ({
      ready,
      error,
      boot,
      bookId,
      books: boot?.books ?? [],
      members,
      relationTags,
      festivalTags,
      txs,
      summary,
      txTab,
      txQuery,
      festivalFilterId,
      setFestivalFilterId,
      sideFilter,
      setSideFilter,
      quickAmounts,
      reduceMotion,
      lunarOn,
      careMode,
      giftSuggestOn,
      experimental3d,
      recycleRetainDays,
      pinUnlocked,
      setPinUnlocked,
      toast,
      motion,
      draft,
      drawerOpen,
      refreshAll,
      setTxTab,
      setTxQuery,
      switchBook,
      openCreate,
      openEdit,
      closeDrawer,
      saveTx,
      deleteTx,
      setSettingBool,
      setSettingValue,
      showToast,
      reloadMeta,
    }),
    [
      ready,
      error,
      boot,
      bookId,
      members,
      relationTags,
      festivalTags,
      txs,
      summary,
      txTab,
      txQuery,
      festivalFilterId,
      sideFilter,
      quickAmounts,
      reduceMotion,
      lunarOn,
      careMode,
      giftSuggestOn,
      experimental3d,
      recycleRetainDays,
      pinUnlocked,
      toast,
      motion,
      draft,
      drawerOpen,
      refreshAll,
      switchBook,
      openCreate,
      openEdit,
      closeDrawer,
      saveTx,
      deleteTx,
      setSettingBool,
      setSettingValue,
      showToast,
      reloadMeta,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
