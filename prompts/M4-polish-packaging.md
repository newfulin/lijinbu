# M4 · 打磨、实验 3D 通路、双端打包、说明书

**目标**：F12 交付；视觉与快捷键走查；实验性 3D dynamic import；清单与文档收尾。

**前置**：M3 完成。读 PRD §2.5 实验 3D、§10 Done Checklist、F12。

**完成后**：写交付摘要；更新 `docs/FEATURE-CHECKLIST.md` 勾选；**无需再问用户产品问题**。本包开发流程结束。

---

## 任务

1. **视觉走查**  
   - 对照两张 jpg：主色、圆角、侧栏、表格、pill、联系人卡、空态。  
   - 禁止项复核：无居中记一笔 Modal、无常驻 3D、无红白主题、无卡通猫。  

2. **快捷键与无障碍**  
   - ⌘/Ctrl+K、N、S、Esc、可选 Shift+V。  
   - 关怀模式再测表格可滚动。  

3. **实验性 3D（案头礼簿微缩）**  
   - **仅当** settings ON 且未减少动效且无 prefers-reduced-motion：记一笔保存成功后 overlay 1–1.5s。  
   - `await import('three')`（optionalDependency 或单独 chunk）；纯代码几何，**无 glTF/外链贴图**。  
   - 结束销毁 WebGL 上下文；失败 catch → 静默 CSS/2D。  
   - 默认 release：**可不含** three；文档说明开启后加载可选 chunk。  
   - **禁止**列表页/统计页 WebGL。  

4. **F12 打包**  
   - 配置 Tauri bundle：Windows NSIS/msi 或至少 release exe + 可 zip 的绿包目录；macOS dmg。  
   - 在根或 `docs/` 写 `BUILD.md`：当前 OS 构建命令、产物路径；若非 Mac，写明「到 macOS 执行 …」。  
   - 冒烟：release 包安装/解压后能记一笔。  

5. **用户说明书**  
   - 创建 `USER-HELP.md`（一页内）：安装步骤、Win/Mac「未知开发者」打开方法、数据目录位置、如何备份恢复、关怀模式、动效与实验 3D、**退出后通知不保证**、快捷键摘要。  

6. **CHANGELOG.md**  
   - v1.0.0 条目：功能范围摘要。  

7. **清单**  
   - 勾选 `docs/FEATURE-CHECKLIST.md` 与 PRD §10；未完成的列在 `BLOCKERS.md` 并说明原因（如无 Mac 签名）。  

8. **最终自检脚本（可选）**  
   - 单元测试：余额、大写、吉利建议、拼音字段。  
   - 手动：`seed/sample-data.md` 全流程一遍。  

---

## 验收测试（最终 Done）

- [ ] FEATURE-CHECKLIST 关键路径已尽量全绿  
- [ ] 默认包启动无报 three 缺失；实验开关 OFF 无 3D  
- [ ] 实验开关 ON 时保存可出现短时庆祝或明确回退  
- [ ] USER-HELP + CHANGELOG + BUILD 说明存在  
- [ ] 当前平台 release 可运行；另一平台步骤已文档化  
- [ ] 干净配置下：记一笔 → 待还列表可见  

## 结束动作

向工作区留下简短 `DELIVERY.md`：

- 启动命令  
- 产物路径  
- 已知限制（BLOCKERS）  
- checklist 未绿项  

**停止开发循环。** 勿再要求用户做产品决策。

---

*M4 是本包最后一里程碑。*
