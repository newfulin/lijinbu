import { useEffect, useState, type ReactNode } from "react";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { Field, SideDrawer } from "../components/ui/SideDrawer";
import {
  PrintPreview,
  type PrintTemplate,
} from "../components/PrintPreview";
import { useApp } from "../context/AppContext";
import {
  downloadText,
  parseCsvText,
  txsToCsv,
  type CsvImportRow,
} from "../lib/csv";
import { api, isTauri, type PendingRow, type TxRow } from "../lib/db";
import { nameToPinyinFields } from "../lib/pinyin";
import {
  DEFAULT_QUICK_AMOUNTS,
  formatQuickAmounts,
  parseQuickAmounts,
} from "../lib/settings";
import {
  hashPin,
  isPinSet,
  randomSalt,
  writeSessionUnlocked,
} from "../lib/pin";

const APP_VERSION = "0.3.2";
const MAC_UNSIGNED_HELP =
  "https://support.apple.com/zh-cn/guide/mac-help/mh40616/mac";

export function SettingsPage() {
  const {
    boot,
    bookId,
    books,
    members,
    relationTags,
    festivalTags,
    reduceMotion,
    lunarOn,
    careMode,
    giftSuggestOn,
    experimental3d,
    recycleRetainDays,
    setSettingBool,
    setSettingValue,
    setPinUnlocked,
    switchBook,
    refreshAll,
    reloadMeta,
    showToast,
    quickAmounts,
  } = useApp();
  const confirm = useConfirm();

  const [msg, setMsg] = useState("");
  const [renameTarget, setRenameTarget] = useState<
    | { kind: "book"; id: number; name: string }
    | { kind: "member"; id: number; name: string }
    | null
  >(null);
  const [renameValue, setRenameValue] = useState("");
  const [newBook, setNewBook] = useState("");
  const [newMember, setNewMember] = useState("");
  const [newTag, setNewTag] = useState("");
  const [backups, setBackups] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<CsvImportRow[]>([]);
  const [quickEdit, setQuickEdit] = useState("");
  const [printTpl, setPrintTpl] = useState<PrintTemplate | null>(null);
  const [printPending, setPrintPending] = useState<PendingRow[]>([]);
  const [printTxs, setPrintTxs] = useState<TxRow[]>([]);
  const [pinDraft, setPinDraft] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [retainDraft, setRetainDraft] = useState(String(recycleRetainDays));

  useEffect(() => {
    setRetainDraft(String(recycleRetainDays));
  }, [recycleRetainDays]);

  useEffect(() => {
    setQuickEdit(formatQuickAmounts(quickAmounts));
  }, [quickAmounts]);

  const pinEnabled = isPinSet(boot?.settings);

  useEffect(() => {
    if (!isTauri()) return;
    void api.listBackups().then(setBackups).catch(() => undefined);
  }, []);

  async function handleOpenDir() {
    try {
      if (!isTauri()) {
        setMsg("请在桌面应用中打开");
        return;
      }
      await api.openDataFolder();
      setMsg("已请求打开数据目录");
    } catch (e) {
      setMsg(String(e));
    }
  }

  async function exportCsv() {
    if (!isTauri() || bookId == null) return;
    try {
      const txs = await api.listTransactions(bookId);
      const csv = txsToCsv(txs);
      downloadText(`lijinbu-export-${bookId}.csv`, csv);
      showToast(`已导出 ${txs.length} 条 CSV`);
    } catch (e) {
      showToast(String(e));
    }
  }

  async function onCsvFile(file: File) {
    const text = await file.text();
    const rows = parseCsvText(text).map((r) => ({
      ...r,
      skip: !r.ok,
    }));
    setCsvPreview(rows);
  }

  async function confirmCsvImport() {
    if (!isTauri() || bookId == null) return;
    const member = members.find((m) => m.is_default === 1) ?? members[0];
    if (!member) {
      showToast("请先创建成员");
      return;
    }
    const targets = csvPreview.filter((r) => r.ok && !r.skip);
    try {
      for (const r of targets) {
        const py = nameToPinyinFields(r.contact_name);
        let memberId = member.id;
        if (r.member) {
          const hit = members.find((m) => m.name === r.member);
          if (hit) memberId = hit.id;
        }
        let festivalId: number | null = null;
        if (r.festival) {
          const f = festivalTags.find((x) => x.name === r.festival);
          if (f) festivalId = f.id;
        }
        let relationId: number | null = null;
        if (r.relation) {
          let hit = relationTags.find((x) => x.name === r.relation);
          if (!hit) {
            hit = await api.createRelationTag(bookId, r.relation);
            await reloadMeta();
          }
          relationId = hit.id;
        }
        await api.createTransaction({
          book_id: bookId,
          contact_id: null,
          contact_name: r.contact_name,
          relation_tag_id: relationId,
          member_id: memberId,
          direction: r.direction,
          amount_cents: r.amount_cents,
          date_gregorian: r.date,
          event_title: r.event,
          festival_tag_id: festivalId,
          note: r.note,
          payment_method: r.payment_method,
          gift_note: r.gift_note,
          name_pinyin: py.name_pinyin,
          name_initials: py.name_initials,
          side: r.side,
        });
      }
      setCsvPreview([]);
      await refreshAll();
      showToast(`已导入 ${targets.length} 笔`);
    } catch (e) {
      showToast(String(e));
    }
  }

  async function doBackup() {
    if (!isTauri()) return;
    try {
      const info = await api.exportBackup();
      const list = await api.listBackups();
      setBackups(list);
      showToast(`备份完成 · ${info.tx_count} 笔流水`);
      setMsg(info.path);
    } catch (e) {
      showToast(String(e));
    }
  }

  async function doRestore(path: string) {
    const ok = await confirm({
      title: "从备份恢复？",
      message: "将覆盖当前全部数据，且不可撤销。",
      confirmText: "恢复",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.restoreBackupPath(path);
      await refreshAll();
      showToast("已从备份恢复");
    } catch (e) {
      showToast(String(e));
    }
  }

  async function doRestoreFile(file: File) {
    const ok = await confirm({
      title: "用所选文件恢复？",
      message: "将覆盖当前全部数据，且不可撤销。",
      confirmText: "恢复",
      danger: true,
    });
    if (!ok) return;
    try {
      const json = await file.text();
      await api.restoreBackupJson(json);
      await refreshAll();
      showToast("已从文件恢复");
    } catch (e) {
      showToast(String(e));
    }
  }

  async function openPrint(tpl: PrintTemplate) {
    if (!isTauri() || bookId == null) return;
    try {
      const [pending, txs] = await Promise.all([
        api.listPending(bookId, false),
        api.listTransactions(bookId),
      ]);
      setPrintPending(pending);
      setPrintTxs(txs);
      setPrintTpl(tpl);
    } catch (e) {
      showToast(String(e));
    }
  }

  const bookName = books.find((b) => b.id === bookId)?.name ?? "礼金簿";
  const csvOk = csvPreview.filter((r) => r.ok && !r.skip).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-card bg-card p-5 shadow-card">
        <h1 className="text-xl font-semibold text-ink">设置</h1>
        <p className="mt-1 text-sm text-ink-muted">账本 · 打印 · 导入导出 · 备份</p>
      </div>

      <Section title="账本">
        <ul className="mb-3 space-y-2">
          {books.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-2 rounded-card border border-slate-100 px-3 py-2 text-sm"
            >
              <span className="flex-1">
                {b.name}
                {b.id === bookId ? (
                  <span className="ml-2 text-xs text-primary">当前</span>
                ) : null}
              </span>
              {b.id !== bookId ? (
                <button
                  type="button"
                  className="text-primary"
                  onClick={() => void switchBook(b.id)}
                >
                  切换
                </button>
              ) : null}
              <button
                type="button"
                className="text-ink-muted"
                onClick={() => {
                  setRenameTarget({ kind: "book", id: b.id, name: b.name });
                  setRenameValue(b.name);
                }}
              >
                改名
              </button>
              <button
                type="button"
                className="text-expense"
                onClick={async () => {
                  const ok = await confirm({
                    title: `删除账本「${b.name}」？`,
                    message: "账本内数据将不可再切换查看（请确认已备份）。",
                    confirmText: "删除",
                    danger: true,
                  });
                  if (!ok) return;
                  try {
                    await api.deleteBook(b.id);
                    await refreshAll();
                  } catch (e) {
                    showToast(String(e));
                  }
                }}
              >
                删
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="新账本名称"
            value={newBook}
            onChange={(e) => setNewBook(e.target.value)}
          />
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white"
            onClick={async () => {
              if (!newBook.trim() || !isTauri()) return;
              const b = await api.createBook(newBook.trim());
              setNewBook("");
              await api.setActiveBook(b.id);
              await refreshAll();
              showToast("已新建账本");
            }}
          >
            新建
          </button>
        </div>
      </Section>

      <Section title="成员标签">
        <ul className="mb-3 space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-card border border-slate-100 px-3 py-2 text-sm"
            >
              <span className="flex-1">
                {m.name}
                {m.is_default === 1 ? (
                  <span className="ml-2 text-xs text-ink-faint">默认·不可删</span>
                ) : null}
              </span>
              <button
                type="button"
                className="text-ink-muted"
                onClick={() => {
                  setRenameTarget({ kind: "member", id: m.id, name: m.name });
                  setRenameValue(m.name);
                }}
              >
                改名
              </button>
              {m.is_default !== 1 ? (
                <button
                  type="button"
                  className="text-expense"
                  onClick={async () => {
                    try {
                      await api.deleteMember(m.id);
                      await reloadMeta();
                      showToast("已删除成员");
                    } catch (e) {
                      showToast(String(e));
                    }
                  }}
                >
                  删
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="新成员"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
          />
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white"
            onClick={async () => {
              if (!newMember.trim() || bookId == null || !isTauri()) return;
              await api.createMember(bookId, newMember.trim());
              setNewMember("");
              await reloadMeta();
            }}
          >
            添加
          </button>
        </div>
      </Section>

      <Section title="关系标签">
        <p className="mb-2 text-xs text-ink-muted">
          预设：亲戚/朋友/同事/同学/邻居/客户/其他；也可自定义。记一笔与联系人页用芯片选择。
        </p>
        <div className="mb-2 flex flex-wrap gap-2 text-sm">
          {relationTags.map((t) => (
            <span key={t.id} className="rounded-full bg-page px-3 py-1 text-ink-muted">
              {t.name}
              {t.is_system ? "" : " ·自定义"}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="自定义关系"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <button
            type="button"
            className="rounded-card border border-primary/40 px-3 py-2 text-sm text-primary"
            onClick={async () => {
              if (!newTag.trim() || bookId == null || !isTauri()) return;
              await api.createRelationTag(bookId, newTag.trim());
              setNewTag("");
              await reloadMeta();
            }}
          >
            添加
          </button>
        </div>
      </Section>

      <Section title="打印">
        <p className="mb-3 text-xs text-ink-muted">
          三模板 + 竖排传统礼簿；金额含中文大写；系统打印对话框可另存 PDF。
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["pending", "待还清单"],
              ["by_contact", "按人汇总"],
              ["timeline", "时间明细"],
              ["vertical", "竖排礼簿"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className="rounded-card border border-slate-200 px-3 py-2 text-sm"
              onClick={() => void openPrint(k)}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="常用金额">
        <p className="mb-2 text-xs text-ink-muted">
          记一笔金额下方的快捷 chips。用逗号分隔，如 200,300,500,600,800,1000
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            className="input flex-1"
            value={quickEdit}
            onChange={(e) => setQuickEdit(e.target.value)}
            placeholder={formatQuickAmounts(DEFAULT_QUICK_AMOUNTS)}
          />
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white"
            onClick={async () => {
              const nums = parseQuickAmounts(quickEdit);
              setQuickEdit(formatQuickAmounts(nums));
              await setSettingValue("quick_amounts", JSON.stringify(nums));
              showToast("已保存常用金额");
            }}
          >
            保存
          </button>
          <button
            type="button"
            className="rounded-card border border-slate-200 px-3 py-2 text-sm text-ink-muted"
            onClick={async () => {
              const nums = [...DEFAULT_QUICK_AMOUNTS];
              setQuickEdit(formatQuickAmounts(nums));
              await setSettingValue("quick_amounts", JSON.stringify(nums));
              showToast("已恢复默认");
            }}
          >
            恢复默认
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {parseQuickAmounts(quickEdit).map((n) => (
            <span
              key={n}
              className="rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary-dark"
            >
              {n}
            </span>
          ))}
        </div>
      </Section>

      <Section title="CSV 导入导出">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white"
            onClick={() => void exportCsv()}
          >
            导出 CSV
          </button>
          <label className="cursor-pointer rounded-card border border-slate-200 px-3 py-2 text-sm">
            选择 CSV 导入
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onCsvFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p className="mb-2 text-xs text-ink-muted">
          支持导出格式对称导入。列：date/日期, direction/类型, amount/金额, contact_name/联系人,
          event/事件, 以及可选 payment/成员/备注/归属(side)。当前仅 CSV（.xlsx 请先另存为 CSV）。
        </p>
        {csvPreview.length > 0 ? (
          <>
            <div className="mb-2 max-h-48 overflow-auto rounded border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-page text-ink-muted">
                  <tr>
                    <th className="px-2 py-1">行</th>
                    <th className="px-2 py-1">状态</th>
                    <th className="px-2 py-1">联系人</th>
                    <th className="px-2 py-1">金额分</th>
                    <th className="px-2 py-1">跳过</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((r, i) => (
                    <tr
                      key={r.lineNo}
                      className={r.ok ? "" : "bg-expense-soft/40"}
                    >
                      <td className="px-2 py-1">{r.lineNo}</td>
                      <td className="px-2 py-1">
                        {r.ok ? "OK" : r.error}
                      </td>
                      <td className="px-2 py-1">{r.contact_name || "—"}</td>
                      <td className="px-2 py-1">{r.ok ? r.amount_cents : "—"}</td>
                      <td className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={r.skip}
                          disabled={!r.ok}
                          onChange={(e) => {
                            const next = [...csvPreview];
                            next[i] = { ...r, skip: e.target.checked };
                            setCsvPreview(next);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="rounded-card bg-primary px-3 py-2 text-sm text-white"
              onClick={() => void confirmCsvImport()}
            >
              确认导入 {csvOk} 笔
            </button>
          </>
        ) : null}
      </Section>

      <Section title="完整备份 / 恢复">
        <p className="mb-3 text-xs text-expense">
          恢复会覆盖当前全部数据，操作前请确认。
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white"
            onClick={() => void doBackup()}
          >
            立即备份
          </button>
          <label className="cursor-pointer rounded-card border border-slate-200 px-3 py-2 text-sm">
            从文件恢复
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void doRestoreFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {backups.length > 0 ? (
          <ul className="space-y-2 text-xs">
            {backups.slice(0, 8).map((p) => (
              <li
                key={p}
                className="flex items-center gap-2 rounded border border-slate-100 px-2 py-2"
              >
                <span className="min-w-0 flex-1 truncate" title={p}>
                  {p.split("/").pop()}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-expense"
                  onClick={() => void doRestore(p)}
                >
                  恢复
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-faint">尚无本地备份</p>
        )}
      </Section>

      <Section title="数据">
        <p className="mb-3 break-all text-xs text-ink-muted">
          {boot?.data_dir || "未加载"}
        </p>
        <button
          type="button"
          onClick={() => void handleOpenDir()}
          className="rounded-card bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          打开数据目录
        </button>
        {msg ? <p className="mt-2 text-xs text-ink-muted break-all">{msg}</p> : null}
      </Section>

      <Section title="PIN 锁">
        <p className="mb-3 text-xs text-ink-muted">
          PIN 仅本地哈希存储（SHA-256 + salt）。设 PIN 后启动需解锁；关闭应用再开需重新输入。
        </p>
        {pinEnabled ? (
          <p className="mb-3 text-sm text-primary">已启用 PIN</p>
        ) : (
          <p className="mb-3 text-sm text-ink-muted">未设置 PIN</p>
        )}
        <div className="mb-2 flex gap-2">
          <input
            className="input flex-1"
            type="password"
            inputMode="numeric"
            placeholder="新 PIN（4–8 位建议）"
            value={pinDraft}
            onChange={(e) => setPinDraft(e.target.value)}
          />
          <input
            className="input flex-1"
            type="password"
            inputMode="numeric"
            placeholder="再输一次"
            value={pinConfirm}
            onChange={(e) => setPinConfirm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white"
            onClick={async () => {
              if (pinDraft.length < 4) {
                showToast("PIN 至少 4 位");
                return;
              }
              if (pinDraft !== pinConfirm) {
                showToast("两次 PIN 不一致");
                return;
              }
              const salt = randomSalt();
              const hash = await hashPin(pinDraft, salt);
              await setSettingValue("pin_salt", salt);
              await setSettingValue("pin_hash", hash);
              writeSessionUnlocked(true);
              setPinUnlocked(true);
              setPinDraft("");
              setPinConfirm("");
              showToast("PIN 已保存");
            }}
          >
            {pinEnabled ? "更新 PIN" : "设置 PIN"}
          </button>
          {pinEnabled ? (
            <>
              <button
                type="button"
                className="rounded-card border border-slate-200 px-3 py-2 text-sm"
                onClick={() => {
                  writeSessionUnlocked(false);
                  setPinUnlocked(false);
                  showToast("已锁定");
                }}
              >
                立即锁定
              </button>
              <button
                type="button"
                className="rounded-card border border-expense/40 px-3 py-2 text-sm text-expense"
                onClick={async () => {
                  const okPin = await confirm({
                    title: "清除 PIN？",
                    message: "下次启动将不再要求解锁。",
                    confirmText: "清除",
                    danger: true,
                  });
                  if (!okPin) return;
                  await setSettingValue("pin_hash", "");
                  await setSettingValue("pin_salt", "");
                  writeSessionUnlocked(true);
                  setPinUnlocked(true);
                  showToast("已清除 PIN");
                }}
              >
                清除 PIN
              </button>
            </>
          ) : null}
        </div>
      </Section>

      <Section title="回收站保留">
        <p className="mb-3 text-xs text-ink-muted">
          超过天数的软删记录将在启动时永久清理。填 0 表示不自动清理。
        </p>
        <div className="flex gap-2">
          <input
            className="input !w-28"
            type="number"
            min={0}
            max={3650}
            value={retainDraft}
            onChange={(e) => setRetainDraft(e.target.value)}
          />
          <span className="self-center text-sm text-ink-muted">天</span>
          <button
            type="button"
            className="rounded-card bg-primary px-3 py-2 text-sm text-white"
            onClick={async () => {
              const n = Math.max(0, Math.min(3650, Number(retainDraft) || 0));
              await setSettingValue("recycle_retain_days", String(n));
              setRetainDraft(String(n));
              showToast(`保留天数已设为 ${n}`);
            }}
          >
            保存
          </button>
        </div>
      </Section>

      <Section title="关于提醒">
        <p className="text-sm text-ink-muted leading-relaxed">
          系统通知仅在应用运行时尽量送达。<strong>退出应用后不保证通知</strong>
          ，请以「提醒」页列表为准。Mac 首次使用需允许通知权限。
        </p>
      </Section>

      <Section title="体验开关">
        <Toggle
          label="农历显示"
          checked={lunarOn}
          onChange={(v) => void setSettingBool("lunar_on", v)}
        />
        <Toggle
          label="减少动效"
          checked={reduceMotion}
          onChange={(v) => void setSettingBool("reduce_motion", v)}
        />
        <Toggle
          label="关怀模式 / 大字号"
          checked={careMode}
          onChange={(v) => void setSettingBool("care_mode_large_text", v)}
        />
        <Toggle
          label="实验性 3D 微缩庆祝（画面 S7）"
          checked={experimental3d}
          onChange={(v) => void setSettingBool("experimental_3d_celebrate", v)}
        />
        <Toggle
          label="回礼建议额"
          checked={giftSuggestOn}
          onChange={(v) => void setSettingBool("gift_suggest_on", v)}
        />
      </Section>

      <Section title="关于">
        <ul className="space-y-2 text-sm text-ink-muted">
          <li>
            当前版本{" "}
            <span className="text-ink font-semibold">版本 {APP_VERSION}</span>
            {" "}· 个人礼金管理（以此核对是否最新包）
          </li>
          <li>数据仅存本机，无云同步、无账号</li>
          <li>
            Mac 提示「无法打开，因为无法验证开发者」时：系统设置 → 隐私与安全性 → 仍要打开；或见
            <a
              className="ml-1 text-primary underline"
              href={MAC_UNSIGNED_HELP}
              target="_blank"
              rel="noreferrer"
            >
              Apple 说明
            </a>
          </li>
          <li>实验 3D 默认关闭；开启后画面将在 S7 接入，不影响记账</li>
        </ul>
      </Section>

      {printTpl ? (
        <PrintPreview
          template={printTpl}
          bookName={bookName}
          pending={printPending}
          txs={printTxs}
          onClose={() => setPrintTpl(null)}
        />
      ) : null}

      <SideDrawer
        open={renameTarget != null}
        title={renameTarget?.kind === "member" ? "成员改名" : "账本改名"}
        onClose={() => setRenameTarget(null)}
        footer={
          <>
            <button
              type="button"
              className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-slate-50"
              onClick={() => setRenameTarget(null)}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-card bg-primary px-4 py-2 text-sm text-white"
              onClick={async () => {
                if (!renameTarget || !renameValue.trim() || !isTauri()) return;
                try {
                  if (renameTarget.kind === "book") {
                    await api.renameBook(renameTarget.id, renameValue.trim());
                    await refreshAll();
                  } else {
                    await api.renameMember(renameTarget.id, renameValue.trim());
                    await reloadMeta();
                    await refreshAll();
                  }
                  setRenameTarget(null);
                  showToast("已改名");
                } catch (e) {
                  showToast(String(e));
                }
              }}
            >
              保存
            </button>
          </>
        }
      >
        <Field label="名称">
          <input
            className="input"
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
        </Field>
      </SideDrawer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-card bg-card p-5 shadow-card">
      <h2 className="mb-3 text-sm font-medium text-ink">{title}</h2>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="mb-2 flex items-center justify-between rounded-card border border-slate-100 px-3 py-2.5 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
