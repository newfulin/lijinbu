# 礼金簿 · Cursor 一包开工

给「布」用的完整开发包：打开后把 `CURSOR_MASTER.md` 整份贴进 Cursor Agent，即可从空仓库做到 Win + Mac 安装包，**不必再做产品决策**。

## 三步开工

### 1. 放进空仓库

任选其一：

- **整包拷入**：把本文件夹 `lijinbu-for-cursor/` 内全部内容复制到一个**空的** Git 仓库根目录；或  
- **只放规格**：至少把 `docs/`、`assets/`、`CURSOR_MASTER.md`、`prompts/`、`seed/` 放进仓库根（推荐保留本 README）。

然后：

```bash
cd <你的仓库根>
git init   # 若尚未初始化
```

本机需已装好：**Node.js（建议 LTS）**、**Rust**（Tauri 2）、以及目标平台的打包依赖（Windows / macOS 各自一套）。

### 2. 用 Cursor 打开仓库根目录

确认能看到：

- `CURSOR_MASTER.md`
- `docs/PRD.md`
- `assets/style-01-wanglai.jpg`、`assets/style-02-contacts-reminders.jpg`
- `prompts/M0`～`M4`
- `seed/sample-data.md`

### 3. 粘贴总指令并跑

1. 打开 Cursor **Agent / Composer**
2. **整份复制** `CURSOR_MASTER.md`（从标题到文末）
3. 粘贴发送，让 Agent **连续执行 M0 → M4**，直到安装说明与包产物就绪

Agent 应按里程碑自检后继续；产品问题已全部锁定，**不要再问你选型**。若上下文过短，可改为按顺序单独粘贴：

`prompts/M0-scaffold.md` → `M1` → `M2` → `M3` → `M4`

但仍以 `CURSOR_MASTER.md` 为优先（一次跑通）。

## 包内结构

```
lijinbu-for-cursor/
  README.md                 ← 你正在看的说明
  CURSOR_MASTER.md          ← ★ 唯一建议整份粘贴给 Cursor 的总指令
  docs/
    PRD.md                  ← 完整规格（唯一产品真相源）
    FEATURE-CHECKLIST.md    ← F01–F20 验收勾选
  assets/
    style-01-wanglai.jpg    ← 往来主界面视觉基准
    style-02-contacts-reminders.jpg
  prompts/
    M0-scaffold.md … M4-polish-packaging.md
  seed/
    sample-data.md          ← 手工验收样例数据
```

## 已锁定（摘要）

记一笔 = 右侧抽屉；待还 = 累计收 − 累计支 > 0；关系标签 + 金额快选 + 农历；左栏统计 + 年报；P0+P1+P2 全做；默认 CSS/2D 动效；实验性 3D 默认关；关怀大字要、红白主题不要；Tauri 2 + SQLite；主色 `#0D9488`。

详情见 `docs/PRD.md` §1。冲突以 PRD 为准。

## 交付物预期（M4 结束）

- 可运行桌面应用（Win + Mac）
- Windows：exe / zip 绿包说明；Mac：dmg 说明
- 一页用户说明书（Markdown）
- `CHANGELOG.md`
- §10 / `FEATURE-CHECKLIST.md` 尽量全绿

---

*版本对齐 PRD v1.1 · 锁定日 2026-11-03（Asia/Shanghai）*
