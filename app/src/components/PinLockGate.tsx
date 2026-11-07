import { useState, type ReactNode } from "react";
import { useApp } from "../context/AppContext";
import {
  isPinSet,
  settingText,
  verifyPin,
  writeSessionUnlocked,
} from "../lib/pin";

type Props = { children: ReactNode };

export function PinLockGate({ children }: Props) {
  const { boot, ready, pinUnlocked, setPinUnlocked } = useApp();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const needLock = ready && isPinSet(boot?.settings) && !pinUnlocked;

  if (!needLock) return <>{children}</>;

  async function unlock() {
    const salt = settingText(boot?.settings?.pin_salt);
    const hash = settingText(boot?.settings?.pin_hash);
    const ok = await verifyPin(pin, salt, hash);
    if (!ok) {
      setErr("PIN 不正确");
      return;
    }
    writeSessionUnlocked(true);
    setPinUnlocked(true);
    setPin("");
    setErr("");
  }

  return (
    <div className="flex h-full min-h-app items-center justify-center bg-page p-6">
      <div className="w-full max-w-sm rounded-card bg-card p-6 shadow-card">
        <h1 className="text-xl font-semibold">礼金簿已锁定</h1>
        <p className="mt-2 text-sm text-ink-muted">输入 PIN 解锁本地数据</p>
        <input
          className="input mt-4 tracking-[0.4em]"
          type="password"
          inputMode="numeric"
          autoFocus
          placeholder="••••"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void unlock();
          }}
        />
        {err ? <p className="mt-2 text-sm text-expense">{err}</p> : null}
        <button
          type="button"
          className="mt-4 w-full rounded-card bg-primary py-2.5 text-sm font-medium text-white"
          onClick={() => void unlock()}
        >
          解锁
        </button>
      </div>
    </div>
  );
}
