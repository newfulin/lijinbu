# M0 · 壳与设计基线

**目标**：可运行的 Tauri 2 + React + TS + Tailwind 空壳；导航与记一笔抽屉占位对齐样式图；SQLite 最小 schema；**不含业务闭环**。

**前置**：已读 `docs/PRD.md` §1–§5、§9 M0；打开 `assets/style-01-wanglai.jpg`。

**完成后**：自检下方验收 → `git commit -m "M0: scaffold shell + sqlite + nav"` → **自动开始** `prompts/M1-core-ledger.md`，勿询问用户。

---

## 建议目录结构

```
(仓库根或 app/)
  package.json
  src-tauri/          # Tauri 2
  src/
    main.tsx
    App.tsx
    styles/globals.css   # token CSS 变量
    components/
      layout/Sidebar.tsx
      layout/Topbar.tsx
      layout/AppShell.tsx
      ledger/RecordDrawer.tsx   # 占位抽屉
    pages/
      WanglaiPage.tsx           # 往来骨架
      ContactsPage.tsx
      PendingPage.tsx
      StatsPage.tsx             # 占位
      RemindersPage.tsx
      FestivalsPage.tsx
      SettingsPage.tsx
      RecycleBinPage.tsx        # 可先挂设置路由
    lib/
      db.ts                     # SQLite 访问封装
      theme.ts
    hooks/
  # 本开发包 docs/ assets/ 保留在仓库可访问位置
```

---

## 任务（按序）

1. **初始化项目**  
   - `npm create tauri-app`（或等价）选 React + TypeScript。  
   - 接入 Tailwind；配置内容路径。  
   - 设计 token（CSS 变量或 tailwind theme）：  
     - primary `#0D9488`  
     - bg `#F7F8FA`  
     - card `#FFFFFF`  
     - radius `12px`  
     - income 软绿 / expense 软红  
     - 间距 8 倍数  

2. **窗口**  
   - 默认约 1280×800；最小 **1100×720**。  

3. **AppShell**  
   - 左栏：Logo「礼金簿」+ 副标「个人礼金管理」；当前礼簿下拉（先静态/单本）；导航项：往来（默认）、联系人、待还礼、**统计**、提醒、节日、设置；底「个人版」。  
   - 顶栏：搜索框占位（⌘/Ctrl+K 可先绑定空命令）；主色实心按钮「+ 记一笔」。  
   - 中区：路由对应页面占位。  
   - 往来页：大白卡表格骨架 + 右侧三张摘要卡（数字先 `--` 或 0），气质对齐 style-01。  

4. **RecordDrawer 占位**  
   - 顶栏按钮打开；**右侧**滑出；宽 **420–480px**；半透明遮罩点击可关；**禁止**用居中 Dialog 当记一笔。  
   - 内放表单字段标签占位即可（下一里程碑接逻辑）。  

5. **SQLite**  
   - 库文件落在 Tauri `app_data_dir`（或文档目录），路径可配置。  
   - 迁移创建表（可一次迁完 PRD §5 全表，字段 nullable 先行）：  
     `books, members, contacts, relation_tags, transactions, festival_tags, reminders, contact_settle_marks, settings`  
   - 必含：`contacts.name_pinyin/name_initials/deleted_at`；`transactions.payment_method/gift_note/deleted_at/amount_cents`。  
   - Seed：1 本账本「我的礼簿」；成员「我」`is_default`；系统关系标签 亲戚/同事/同学/其他；内置节日标签若干。  

6. **依赖策略**  
   - **不要**把 `three` 写进必选 dependencies（可晚于 M4 再 optional）。  
   - 图表库可等 M3 再加。  

7. **设置页占位**  
   - 「打开数据目录」按钮（调用 shell open）。  
   - 列出将有的开关名称（农历、减少动效、实验 3D、关怀模式、回礼建议）— 可先不接线。  

8. **文档**  
   - 根 `README.md` 补充：`npm i`、`npm run tauri dev` 启动方式（勿删本包 README 时可另写 `APP-README.md`）。  

---

## 验收测试

- [ ] `tauri dev`（或当前平台等价）能开窗  
- [ ] 左栏可切换到「统计」等占位页  
- [ ] 「记一笔」= 右侧抽屉，宽度 roughly 420–480，非 Modal  
- [ ] 往来骨架有表头区 + 右栏三卡，主色按钮可见  
- [ ] SQLite 文件已生成；重启后 seed 账本仍在  
- [ ] `package.json` 无强制 `three` 依赖  

## 阻塞

写 `BLOCKERS.md` 后尽量用占位 UI 继续；能跑前端则先跑前端。

---

**M0 完成后立即打开并执行 `prompts/M1-core-ledger.md`。**
