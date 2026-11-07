# 礼金簿 · 构建说明（BUILD）

## 本机要求

- Node.js LTS
- Rust（本仓库可用 `../calendar-planner` 本地 toolchain，经 `app/tauri.sh`）
- macOS：Xcode Command Line Tools（正式签名需完整 Xcode + 开发者账号，当前未强制）

## 日常开发

```bash
cd 06-ai-agent-workflow/lijinbu/app
npm install --registry=https://registry.npmmirror.com --strict-ssl=false
# 若 three / 部分包 403，改用：
# npm install --registry=https://registry.npmjs.org --strict-ssl=false
chmod +x tauri.sh
./tauri.sh dev
```

## Mac · Release（当前平台）

```bash
cd 06-ai-agent-workflow/lijinbu/app
npm run build
./tauri.sh build
```

### 产物路径（相对 `app/`）

| 产物 | 路径 |
|------|------|
| 可执行文件 | `src-tauri/target/release/lijinbu` |
| 应用包 | `src-tauri/target/release/bundle/macos/礼金簿.app` |
| DMG | `src-tauri/target/release/bundle/dmg/礼金簿_*.dmg` |

Debug 包（开发验收）：

```bash
./tauri.sh build --debug
# → src-tauri/target/debug/bundle/macos/礼金簿.app
```

## Windows · 免安装包 / 安装包（必须在 Windows 上打）

> **本开发机是 macOS aarch64，不能在本机交叉编译出可信的 Win 原生包。**  
> 需要一台 Windows 10/11（x64 或 arm64 与目标一致）或 CI Windows runner。  
> Tauri 2 **没有**单独的 `portable` bundle 名；「免安装绿包」= 把 release 目录里的 `lijinbu.exe`（前端已嵌入）打成 zip。

### 本机前置（Windows）

1. [Node.js LTS](https://nodejs.org/)
2. [Rust](https://rustup.rs/)（默认 MSVC toolchain）
3. [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)：勾选「使用 C++ 的桌面开发」
4. **WebView2 Runtime**（Win10/11 多数已自带；缺则装 Evergreen）  
   https://developer.microsoft.com/microsoft-edge/webview2/

### 命令（在仓库 `app/` 下）

```bat
cd 06-ai-agent-workflow\lijinbu\app
npm install --registry=https://registry.npmmirror.com --strict-ssl=false
npm run build
npx tauri build
```

只要 NSIS 安装包、不要 MSI 时可：

```bat
npx tauri build --bundles nsis
```

### 产物（相对 `app/`）

| 用途 | 典型路径 | 说明 |
|------|----------|------|
| **免安装绿包** | `src-tauri\target\release\lijinbu.exe` | 单文件即可跑（资源已嵌入）；建议 zip 成 `礼金簿_0.3.x_win_portable.zip` 分发 |
| NSIS 安装包 | `src-tauri\target\release\bundle\nsis\礼金簿_*_x64-setup.exe`（名称以实际为准） | 当前用户安装；安装器语言含简体中文（`bundle.windows.nsis`） |
| MSI | `...\bundle\msi\*.msi` | 仅当 `--bundles` 含 msi / targets=all 时 |

绿包制作示例：

```bat
cd src-tauri\target\release
powershell Compress-Archive -Path lijinbu.exe -DestinationPath 礼金簿_0.3.2_win_portable.zip -Force
```

用户解压后双击 `lijinbu.exe`。未签名时 SmartScreen 可能拦截 →「更多信息 → 仍要运行」。

### 配置位置

`app/src-tauri/tauri.conf.json` → `bundle.windows.nsis`（`installMode: currentUser`，语言 `SimpChinese`）。

### 交叉编译说明

- Mac → Win：**不推荐**（需 Windows 链接器、WebView2 头、签名与跑通验证都困难）。
- 可行路径：Windows 实体机 / 虚拟机 / GitHub Actions `windows-latest` 跑上述命令。

### Windows 编码与路径（已在源码侧处理）

- CSV 导出带 **UTF-8 BOM**，导入去 BOM；Excel 打开中文列不乱码。
- 备份 JSON 写 **UTF-8 BOM**，恢复时去 BOM。
- 数据目录用 `dirs::data_dir()` → `%APPDATA%\com.aicompany.lijinbu\`（Path API，无手写分隔符）。
- 快捷键文案按平台显示 Ctrl（Mac 仍显示 ⌘）。
- 字体栈含 Microsoft YaHei UI / YaHei。

仍须在 **真 Windows** 上再验：记一笔、CSV 用 Excel 打开/另存再导入、打开数据目录、中文路径用户名、SmartScreen。

## GitHub Actions 打 Win 绿包

仓库内工作流：`.github/workflows/windows-portable.yml`

1. 将本仓库推到 GitHub（仅礼金簿源码仓）。
2. Actions → **Windows portable zip** → Run workflow（或 push 到 `main` 且改动 `app/`）。
3. 跑完后下载 Artifact：
   - `lijinbu-windows-portable` → `礼金簿_<version>_win_portable.zip`（内含 `lijinbu.exe`）
   - 可选 `lijinbu-windows-nsis` → 安装包

本机 Mac **不会**产出 Win exe；编码与路径适配见上一节。

## 实验 3D（three）


- `three` 为 **optionalDependency**；主路径 `await import('three')`，失败静默回退 CSS/2D。
- 默认关闭「实验性 3D」时，启动不依赖 three。
- 若 optional 安装失败，开启实验开关后仅回退 2D 动效，不影响记账。

## 冒烟

Release 打开后：记一笔收礼 → 待还礼页应能看到该联系人差额。
