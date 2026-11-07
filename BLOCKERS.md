# 礼金簿 · BLOCKERS

## 已解除（2026-11-07）

### B1 · npm 依赖无法安装 — **已解决**

- **现象**：`registry.npmmirror.com` 报 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`
- **解法**：在 `app/` 下执行  
  `npm install --registry=https://registry.npmmirror.com --strict-ssl=false`  
  部分包（如 `three` / `@types/three`）镜像 403 时改用 `registry.npmjs.org`
- **验证**：前端 `npm run build` 通过；debug / release 均可构建

### B2 · S0–S6 功能缺口 — **已由 S0–S7 代码落盘**

- 功能按 `STAGES.md` 已实现；剩余为手工抽检勾选，非代码阻塞

---

## 当前已知限制（不阻塞本机 Mac 交付）

### U1 · 未代码签名

- Mac：首次打开需「仍要打开」；见 `USER-HELP.md`
- Win：SmartScreen 可能拦截未签名 exe
- **原因**：无 Apple/Windows 开发者证书；一人公司 MVP 不强制

### U2 · 退出后通知不保证

- 产品设计如此；设置与说明书已写明

### U3 · Windows 安装包 / 免安装绿包未在本机产出

- 当前开发机为 macOS aarch64；**不能**在本机打出可信 Win 原生包
- 需在 Windows 执行 `npx tauri build`（免安装= zip `lijinbu.exe`；安装包= NSIS）
- 步骤与编码说明见 `BUILD.md`；**不阻塞** Mac dmg 交付

### U4 · 实验 3D optional

- `three` 为 optionalDependency + dynamic import；安装失败时仅回退 2D，不影响记账
- 默认开关 OFF，启动不加载 three chunk

### U5 · 手工抽检未全勾

- `docs/FEATURE-CHECKLIST.md` 中部分 F01–F08/F15–F17 等项代码已实现，待 CEO 按 `TESTING.md` 点验后勾选
- **不阻塞** release 冒烟路径：记一笔 → 待还可见
