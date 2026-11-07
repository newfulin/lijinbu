# 礼金簿 · 应用工程（app）

Tauri 2 + React + TypeScript + Tailwind。规格见上级目录 `docs/PRD.md`、`STAGES.md`。

## 环境

- Node.js LTS
- Rust（本仓库可复用 `../calendar-planner` 下的本地 toolchain，经 `./tauri.sh`）

## 启动

```bash
cd 06-ai-agent-workflow/lijinbu/app
npm install
chmod +x tauri.sh
./tauri.sh dev
```

等价：`npm run tauri -- dev`（需本机 `rustc`/`cargo` 已在 PATH）。

前端单独预览（无 SQLite 原生能力时会降级提示）：

```bash
npm run dev
```

## 数据目录

SQLite 落在系统应用数据目录下的 `com.aicompany.lijinbu/lijinbu.db`。  
设置页可「打开数据目录」。

## 阶段

进度见 `../STAGES.md` · 交付见 `../DELIVERY.md` · 阻塞见 `../BLOCKERS.md`。

**S0–S7 已完成（v1）**。Release：

```bash
./tauri.sh build
# → src-tauri/target/release/bundle/dmg/礼金簿_0.2.0_aarch64.dmg
```

单测：`npm run test:s7`

说明书：`../USER-HELP.md` · 构建：`../BUILD.md`
