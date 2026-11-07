import { useEffect, useState } from "react";
import { BatchPastePanel } from "./components/BatchPastePanel";
import { GlobalSearch } from "./components/GlobalSearch";
import { AppShell } from "./components/layout/AppShell";
import { RecordDrawer } from "./components/ledger/RecordDrawer";
import { SaveMotion } from "./components/ledger/SaveMotion";
import { PinLockGate } from "./components/PinLockGate";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { AppProvider, useApp } from "./context/AppContext";
import { isTauri } from "./lib/db";
import { notifyDueReminders } from "./lib/notify";
import { ContactsPage } from "./pages/ContactsPage";
import { FestivalsPage } from "./pages/FestivalsPage";
import { PendingPage } from "./pages/PendingPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RecycleBinPage } from "./pages/RecycleBinPage";
import { RemindersPage } from "./pages/RemindersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { WanglaiPage } from "./pages/WanglaiPage";
import type { NavKey } from "./types";

const PAGE_META: Record<NavKey, { title: string; note?: string }> = {
  wanglai: { title: "往来" },
  contacts: { title: "联系人" },
  pending: { title: "待还礼" },
  stats: { title: "统计" },
  reminders: { title: "提醒" },
  festivals: { title: "节日" },
  recycle: { title: "回收站" },
  settings: { title: "设置" },
};

function AppInner() {
  const [nav, setNav] = useState<NavKey>("wanglai");
  const [searchOpen, setSearchOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const { ready, error, openCreate, bookId, showToast } = useApp();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openCreate();
      }
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        setBatchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCreate]);

  useEffect(() => {
    if (!ready || !isTauri() || bookId == null) return;
    void notifyDueReminders(bookId)
      .then((n) => {
        if (n > 0) showToast(`有 ${n} 条提醒需要关注`);
      })
      .catch(() => undefined);
  }, [ready, bookId, showToast]);

  function renderPage() {
    if (nav === "wanglai") {
      return (
        <WanglaiPage
          onBatch={() => setBatchOpen(true)}
          onOpenSettings={() => setNav("settings")}
        />
      );
    }
    if (nav === "contacts") return <ContactsPage />;
    if (nav === "pending") {
      return <PendingPage onOpenSettings={() => setNav("settings")} />;
    }
    if (nav === "stats") return <StatsPage />;
    if (nav === "reminders") return <RemindersPage />;
    if (nav === "festivals") {
      return (
        <FestivalsPage
          onFilterWanglai={() => setNav("wanglai")}
          onOpenPrint={() => setNav("settings")}
        />
      );
    }
    if (nav === "recycle") return <RecycleBinPage />;
    if (nav === "settings") return <SettingsPage />;
    const meta = PAGE_META[nav];
    return <PlaceholderPage title={meta.title} note={meta.note} />;
  }

  return (
    <PinLockGate>
      <AppShell
        active={nav}
        onNavigate={setNav}
        onRecord={() => openCreate()}
        onSearch={() => setSearchOpen(true)}
      >
        {!ready ? (
          <div className="text-sm text-ink-muted">加载中…</div>
        ) : error ? (
          <div className="rounded-card border border-expense/30 bg-expense-soft p-4 text-sm text-expense">
            启动失败：{error}
          </div>
        ) : (
          renderPage()
        )}
      </AppShell>
      <RecordDrawer />
      <SaveMotion />
      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onPickContact={() => setNav("contacts")}
      />
      <BatchPastePanel open={batchOpen} onClose={() => setBatchOpen(false)} />
    </PinLockGate>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <AppInner />
      </ConfirmProvider>
    </AppProvider>
  );
}
