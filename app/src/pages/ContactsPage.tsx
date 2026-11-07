import { useCallback, useEffect, useState } from "react";
import { ActionMenu } from "../components/ui/ActionMenu";
import { RelationTagPicker } from "../components/ui/RelationTagPicker";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { Field, SideDrawer } from "../components/ui/SideDrawer";
import { useApp } from "../context/AppContext";
import { api, isTauri, type ContactRow } from "../lib/db";
import { formatYuan } from "../lib/money";
import { nameToPinyinFields } from "../lib/pinyin";

type Tab = "all" | "frequent" | "balance" | "stopped";

type FormMode =
  | { kind: "create" }
  | { kind: "rename"; contact: ContactRow }
  | { kind: "merge"; contact: ContactRow }
  | null;

type SameNameState = {
  name: string;
  same: ContactRow[];
};

export function ContactsPage() {
  const { bookId, relationTags, showToast, refreshAll, reloadMeta, openCreate } = useApp();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormMode>(null);
  const [name, setName] = useState("");
  const [relationTagId, setRelationTagId] = useState<number | null>(null);
  const [mergeKeepId, setMergeKeepId] = useState<number | "">("");
  const [sameName, setSameName] = useState<SameNameState | null>(null);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState<ContactRow | null>(null);
  const [profileTxs, setProfileTxs] = useState<Awaited<ReturnType<typeof api.listTransactions>>>([]);

  const load = useCallback(async () => {
    if (!isTauri() || bookId == null) return;
    const list = await api.listContacts(bookId, tab, q);
    setRows(list);
  }, [bookId, tab, q]);

  useEffect(() => {
    void load().catch((e) => showToast(String(e)));
  }, [load, showToast]);

  async function openProfile(c: ContactRow) {
    setProfile(c);
    if (!isTauri() || bookId == null) return;
    try {
      const list = await api.listTransactions(bookId);
      setProfileTxs(list.filter((tx) => tx.contact_id === c.id).slice(0, 8));
    } catch {
      setProfileTxs([]);
    }
  }

  function openCreateForm() {
    setForm({ kind: "create" });
    setName("");
    setRelationTagId(relationTags[0]?.id ?? null);
    setSameName(null);
    setErr("");
  }

  function openRename(c: ContactRow) {
    setForm({ kind: "rename", contact: c });
    setName(c.name);
    setRelationTagId(c.relation_tag_id);
    setSameName(null);
    setErr("");
  }

  function openMerge(c: ContactRow) {
    setForm({ kind: "merge", contact: c });
    setMergeKeepId("");
    setErr("");
  }

  function closeForm() {
    if (busy) return;
    setForm(null);
    setSameName(null);
    setErr("");
  }

  async function doCreate(force: boolean) {
    if (bookId == null || !isTauri()) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("请填写姓名");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const py = nameToPinyinFields(trimmed);
      await api.createContact({
        book_id: bookId,
        name: trimmed,
        ...py,
        relation_tag_id: relationTagId,
        force_new: force,
      });
      await load();
      showToast("已创建联系人");
      setForm(null);
      setSameName(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitCreate() {
    if (bookId == null || !isTauri()) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("请填写姓名");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const same = await api.findSameName(bookId, trimmed);
      if (same.length) {
        setSameName({ name: trimmed, same });
        setBusy(false);
        return;
      }
      await doCreate(false);
    } catch (e) {
      setErr(String(e));
      setBusy(false);
    }
  }

  async function submitRename() {
    if (form?.kind !== "rename" || bookId == null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("请填写姓名");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const c = form.contact;
      const py = nameToPinyinFields(trimmed);
      await api.updateContact(c.id, {
        book_id: bookId,
        name: trimmed,
        ...py,
        relation_tag_id: relationTagId ?? c.relation_tag_id,
        note: c.note,
        location: c.location,
      });
      await load();
      showToast("已改名");
      setForm(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function submitMerge() {
    if (form?.kind !== "merge" || bookId == null) return;
    const keep = Number(mergeKeepId);
    if (!keep) {
      setErr("请选择要保留的联系人");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.mergeContacts(bookId, keep, form.contact.id);
      await load();
      await refreshAll();
      showToast("已合并");
      setForm(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  const drawerTitle =
    form?.kind === "rename"
      ? "改名"
      : form?.kind === "merge"
        ? "合并联系人"
        : "新建联系人";

  return (
    <div className="flex h-full flex-col rounded-card bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">联系人</h1>
        <input
          className="input !w-52"
          placeholder="搜姓名/拼音/首字母"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary !h-9"
          onClick={openCreateForm}
        >
          + 新建
        </button>
      </div>
      <div className="mb-3 flex gap-2 text-sm">
        {(
          [
            ["all", "全部"],
            ["frequent", "常用"],
            ["balance", "有差额"],
            ["stopped", "已停用"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-3 py-1 ${
              tab === k ? "bg-primary-soft text-primary-dark" : "bg-page text-ink-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-ink-muted">还没有联系人</div>
            <p className="mt-1 text-sm text-ink-faint">
              记一笔时填写姓名会自动建档，也可以先手动新建。
            </p>
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={openCreateForm}
            >
              + 新建联系人
            </button>
          </div>
        ) : (
          rows.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-card border border-slate-100/90 bg-white px-3 py-3 transition hover:border-primary/20 hover:shadow-sm cursor-pointer"
              onClick={() => void openProfile(c)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-medium text-primary-dark">
                {c.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="truncate text-xs text-ink-muted">
                  {c.relation_name || "未标关系"}
                  {c.last_date ? ` · 上次 ${c.last_date}` : ""}
                  {c.name_initials ? ` · ${c.name_initials}` : ""}
                </div>
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-sm font-medium ${
                  c.balance_cents > 0
                    ? "bg-income-soft/80 text-income"
                    : c.balance_cents < 0
                      ? "bg-expense-soft/80 text-expense"
                      : "bg-page text-ink-muted"
                }`}
              >
                {formatYuan(c.balance_cents, true, c.balance_cents >= 0 ? "in" : "out")}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
              <ActionMenu
                items={[
                  {
                    label: "改名",
                    onClick: () => openRename(c),
                    disabled: busy,
                  },
                  {
                    label: c.is_stopped ? "启用" : "停用",
                    onClick: () => {
                      void (async () => {
                        setBusy(true);
                        try {
                          await api.setContactStopped(c.id, c.is_stopped !== 1);
                          await load();
                        } catch (e) {
                          showToast(String(e));
                        } finally {
                          setBusy(false);
                        }
                      })();
                    },
                  },
                  {
                    label: "合并",
                    onClick: () => openMerge(c),
                  },
                  {
                    label: "删除",
                    danger: true,
                    onClick: () => {
                      void (async () => {
                        const ok = await confirm({
                          title: `删除联系人「${c.name}」？`,
                          message: "将进入回收站，可恢复。",
                          confirmText: "删除",
                          danger: true,
                        });
                        if (!ok) return;
                        try {
                          await api.softDeleteContact(c.id);
                          await load();
                        } catch (e) {
                          showToast(String(e));
                        }
                      })();
                    },
                  },
                ]}
              />
              </div>
            </div>
          ))
        )}
      </div>

      <SideDrawer
        open={form != null}
        title={drawerTitle}
        subtitle={
          form?.kind === "merge"
            ? `将「${form.contact.name}」合并到保留的联系人，流水会迁移过去`
            : "Esc / 遮罩关闭"
        }
        onClose={closeForm}
        footer={
          form?.kind === "merge" ? (
            <>
              <button
                type="button"
                className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-slate-50"
                onClick={closeForm}
                disabled={busy}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-card bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => void submitMerge()}
              >
                确认合并
              </button>
            </>
          ) : form?.kind === "rename" ? (
            <>
              <button
                type="button"
                className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-slate-50"
                onClick={closeForm}
                disabled={busy}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-card bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => void submitRename()}
              >
                保存
              </button>
            </>
          ) : sameName ? null : (
            <>
              <button
                type="button"
                className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-slate-50"
                onClick={closeForm}
                disabled={busy}
              >
                取消
              </button>
              <button
                type="button"
                className="rounded-card bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => void submitCreate()}
              >
                创建
              </button>
            </>
          )
        }
      >
        {form?.kind === "merge" ? (
          <>
            <Field label="保留哪一位（对方留下，当前人并入）">
              <select
                className="input"
                value={mergeKeepId}
                onChange={(e) =>
                  setMergeKeepId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">请选择</option>
                {rows
                  .filter((r) => r.id !== form.contact.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.relation_name ? ` · ${r.relation_name}` : ""}
                    </option>
                  ))}
              </select>
            </Field>
            {err ? <p className="text-sm text-expense">{err}</p> : null}
          </>
        ) : sameName ? (
          <div className="space-y-3">
            <p className="text-sm text-ink">
              已有同名「{sameName.name}」共 {sameName.same.length} 人。请选择：
            </p>
            <ul className="rounded-card border border-slate-100 bg-page px-3 py-2 text-sm text-ink-muted">
              {sameName.same.map((c) => (
                <li key={c.id} className="py-1">
                  {c.name}
                  {c.relation_name ? ` · ${c.relation_name}` : ""}
                  {c.name_initials ? ` · ${c.name_initials}` : ""}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="rounded-card border border-slate-200 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                disabled={busy}
                onClick={() => {
                  showToast("已取消新建，可选用列表中已有联系人");
                  setForm(null);
                  setSameName(null);
                }}
              >
                选用已有（取消新建）
              </button>
              <button
                type="button"
                className="rounded-card bg-primary px-3 py-2.5 text-left text-sm text-white disabled:opacity-60"
                disabled={busy}
                onClick={() => void doCreate(true)}
              >
                仍要新建同名
              </button>
              <button
                type="button"
                className="rounded-card border border-primary/30 bg-primary-soft px-3 py-2.5 text-left text-sm text-primary-dark"
                disabled={busy}
                onClick={() => {
                  setSameName(null);
                  setForm(null);
                  showToast("请在列表中对两人执行「合并」");
                }}
              >
                去列表合并
              </button>
            </div>
            {err ? <p className="text-sm text-expense">{err}</p> : null}
          </div>
        ) : (
          <>
            <Field label="姓名 *">
              <input
                className="input"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：张三"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (form?.kind === "rename") void submitRename();
                    else void submitCreate();
                  }
                }}
              />
            </Field>
            <Field label="关系标签">
              <RelationTagPicker
                tags={relationTags}
                value={relationTagId}
                onChange={setRelationTagId}
                bookId={bookId}
                onTagsChange={reloadMeta}
              />
            </Field>
            {err ? <p className="text-sm text-expense">{err}</p> : null}
          </>
        )}
      </SideDrawer>

      <SideDrawer
        open={profile != null}
        title={profile?.name ?? "联系人"}
        subtitle="轻量画像 · 点记一笔可续写人情"
        onClose={() => setProfile(null)}
        footer={
          profile ? (
            <>
              <button
                type="button"
                className="rounded-card px-3 py-2 text-sm text-ink-muted hover:bg-slate-50"
                onClick={() => {
                  openRename(profile);
                  setProfile(null);
                }}
              >
                改名
              </button>
              <button
                type="button"
                className="rounded-card bg-primary px-4 py-2 text-sm text-white"
                onClick={() => {
                  openCreate({
                    contact_id: profile.id,
                    contact_name: profile.name,
                    relation_tag_id: profile.relation_tag_id,
                  });
                  setProfile(null);
                }}
              >
                记一笔
              </button>
            </>
          ) : null
        }
      >
        {profile ? (
          <div className="space-y-4">
            <div className="rounded-card border border-primary/15 bg-primary-soft/30 px-3 py-3 text-sm">
              <div className="text-xs text-primary-dark">
                {profile.relation_name || "未标关系"}
                {profile.name_initials ? ` · ${profile.name_initials}` : ""}
              </div>
              <div className="mt-1 text-lg font-semibold">
                余额{" "}
                <span
                  className={
                    profile.balance_cents > 0
                      ? "text-income"
                      : profile.balance_cents < 0
                        ? "text-expense"
                        : "text-ink"
                  }
                >
                  {formatYuan(
                    profile.balance_cents,
                    true,
                    profile.balance_cents >= 0 ? "in" : "out",
                  )}
                </span>
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                最近：
                {profile.last_date
                  ? `${profile.last_date} · ${
                      profile.last_direction === "out" ? "送礼" : "收礼"
                    } ${formatYuan(profile.last_amount_cents ?? 0)}`
                  : "尚无往来"}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-ink">最近往来</div>
              {profileTxs.length === 0 ? (
                <p className="text-sm text-ink-faint">还没有流水，记一笔开始吧。</p>
              ) : (
                <ul className="space-y-2">
                  {profileTxs.map((tx) => (
                    <li
                      key={tx.id}
                      className="flex items-center justify-between rounded-card border border-slate-100 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="text-ink-muted">
                          {tx.date_gregorian}
                          {tx.event_title ? ` · ${tx.event_title}` : ""}
                        </div>
                        <div className="text-xs text-ink-faint">
                          {tx.direction === "out" ? "送礼" : "收礼"}
                          {tx.side
                            ? ` · ${tx.side === "male" ? "男方" : tx.side === "female" ? "女方" : tx.side === "joint" ? "共同" : ""}`
                            : ""}
                        </div>
                      </div>
                      <span
                        className={
                          tx.direction === "in" ? "text-income font-medium" : "text-expense font-medium"
                        }
                      >
                        {formatYuan(tx.amount_cents, true, tx.direction === "out" ? "out" : "in")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </SideDrawer>

    </div>
  );
}
