# 礼金簿 · 交付摘要（DELIVERY）

**版本**：工程 `0.2.0`  
**日期**：2026-11-07  
**范围**：PRD F01–F20 分阶段 S0–S7 已落盘

## 启动

```bash
cd 06-ai-agent-workflow/lijinbu/app
./tauri.sh dev          # 开发
./tauri.sh build        # Mac release
```

说明书：`USER-HELP.md` · 构建：`BUILD.md` · 变更：`CHANGELOG.md`

## 产物路径（Mac release · 已构建）

- `app/src-tauri/target/release/bundle/macos/礼金簿.app`（约 8 MiB）
- `app/src-tauri/target/release/bundle/dmg/礼金簿_0.2.0_aarch64.dmg`（约 4.4 MiB）
- 可执行文件：`app/src-tauri/target/release/lijinbu`

Debug 验收包：

- `app/src-tauri/target/debug/bundle/macos/礼金簿.app`

## 干净路径验收

记一笔（收礼）→ 左栏「待还礼」可见该人。

## 已知限制（BLOCKERS）

- Mac/Win **未代码签名**：首次打开需「仍要打开」/ SmartScreen 放行
- 退出应用后**系统通知不保证**
- 实验 3D 依赖 optional `three`；安装失败则仅 2D 回退
- 部分 checklist 项依赖 CEO 手工抽检（见 `docs/FEATURE-CHECKLIST.md` 未勾项与 `BLOCKERS.md`）
- Win 安装包需在 Windows 机执行 `npx tauri build`（本机为 Mac 时仅文档化步骤）

## Checklist 未全绿说明

已实现但待手工点验的项（拼音/同名/回收站/记账细节等）保留在 FEATURE-CHECKLIST 中由抽检勾选；**不阻塞**本机 release 冒烟。无签名、跨机构建 Win 写入 BLOCKERS，不阻塞 Mac 交付。

## 禁止项复核

- 无居中记一笔 Modal（右侧抽屉）
- 无常驻 3D / 无 Three 画统计图
- 无红白主题、无卡通猫
- 默认启动不因缺 three 报错
