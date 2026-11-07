import type { ReactNode } from "react";
import type { NavKey } from "../../types";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type Props = {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  onRecord: () => void;
  onSearch: () => void;
  children: ReactNode;
};

export function AppShell({
  active,
  onNavigate,
  onRecord,
  onSearch,
  children,
}: Props) {
  return (
    <div className="flex h-full min-h-app min-w-app bg-page text-ink">
      <Sidebar active={active} onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onRecord={onRecord} onSearch={onSearch} />
        <main className="min-h-0 flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}
