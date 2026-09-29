# WPS MCP Server

依据 `spec.md` 实现的本机 WPS MCP：MCP 负责文档路由、规则/变量生命周期；文档访问仍由 WPS JS API 执行。

## 架构

```text
MCP Client (Streamable HTTP) → 127.0.0.1:18766/mcp
                                   │
WPS JS Add-in (ET/WPP/WPS) → WebSocket /ws
                                   │
                             WPS JS API
```

服务只绑定 `127.0.0.1`。变量及规则保存在 `~/Library/Application Support/wps-mcp/state.json`；WPS 文档注册信息只保存在内存中，Add-in 断开后标记为不可用。

## macOS 部署

要求 Node.js 20+。项目根目录运行：

```bash
npm ci
npm run build
scripts/install-macos-service.sh
scripts/install-macos-addin.sh
```

脚本会安装用户级 LaunchAgent `com.local.wps-mcp`，并向 WPS `publish.xml` 追加 ET/WPP/WPS 三个本地 JS Add-in；已有的加载项条目会保留，并先备份到 `publish.xml.backup-before-wps-mcp`。服务启动后可检查：

```bash
curl http://127.0.0.1:18766/health
curl http://127.0.0.1:18766/addins/et/
```

完整退出并重新启动 WPS Office。macOS 安装脚本会更新 `publish.xml`；Writer 还会在 `authaddin.json` 中登记 `wps` 主机的启用状态。打开 Writer、表格或演示文稿；Add-in 的任务面板页面连接服务后，状态显示当前文档。WPS MCP 工具栏的“显示连接状态”会打开状态窗格。

## 接入 MCP 客户端

服务启动后，可在支持 **MCP Streamable HTTP** 的客户端中添加服务器：

- 名称：`wps-mcp`（客户端内的显示名称，可自定义）
- 传输方式：`Streamable HTTP`
- URL：`http://127.0.0.1:18766/mcp`

客户端配置格式因产品而异，请按其 MCP 配置说明填写上述传输方式和 URL。服务仅监听本机 loopback，因此 MCP 客户端需运行在能访问该本机地址的环境中。

该服务向客户端提供以下 MCP 工具：

- `workspace.list_documents`
- `document.get(documentId)`
- `wps.exec(documentId, code)`
- `transform.create(variableName, description?, sourceDocumentId, code)`
- `render.create(variableId, targetDocumentId, description?, code)`
- `variable.get(variableId)`
- `variable.transform(variableId)`
- `variable.render(variableId, renderId?)`

## 标准流程

1. `workspace.list_documents` → 选定唯一 `documentId`。
2. `document.get`、`wps.exec` 调查工作表、选区、幻灯片、形状或文字结构。
3. `transform.create` 保存只读提取代码；调用 `variable.transform`，检查 JSON 值。
4. `render.create` 保存目标文档修改代码；检查绑定后调用 `variable.render`。
5. 可用 `variable.get` 查看最近值和所有规则。

## 自动化测试

常规测试使用模拟 Add-in，只验证 MCP/WebSocket 桥接，不代表 WPS JS API 的真实兼容性：

```bash
npm test
```

macOS 上可显式运行真实 WPS ET/WPP 冒烟测试：

```bash
npm run test:wps-live
# 可用 WPS_LIVE_PORT 指定独立端口，默认 18767；不能使用生产端口 18766
WPS_LIVE_PORT=18767 npm run test:wps-live
```

该命令要求 WPS Office 已安装、**测试开始前完全退出 WPS**，且独立测试端口未被占用。它会启动测试端口上的隔离 MCP 服务和临时状态目录、生成可丢弃的 `.xlsx`/`.pptx` 测试文件，并临时让 Add-in 的 WebSocket/MCP 流量走测试端口。WPS 已注册的 Add-in 页面仍由其原有地址提供静态资源；测试结束会还原 `addon/main.js`。测试会经真实 MCP/Add-in 执行只读查询、ET 公式/格式写入与读回、WPP 文本框/文字/几何属性写入与读回，并把修改保存到临时副本。退出时清理临时数据。若 WPS 未正常退出，临时文件会保留并打印路径，避免删除仍被 WPS 使用的文件。

Writer 使用独立命令；测试前需完全退出 WPS，且测试端口未占用、已注册 Add-in 的静态资源服务 `18766` 可用：

```bash
npm run test:wps-writer-live
```

该命令在隔离端口启动真实 Writer 测试，临时将 Add-in WebSocket 指向测试服务，并把 Add-in 文档枚举限制为本次临时 DOCX。它检查文档/表格读取、Render 插入文本并读回、保存和关闭临时副本；结束后关闭本次启动的 WPS、还原 Add-in 配置并清理临时数据。普通 `npm test` 不会启动 WPS。若 Add-in 未连接、测试文件未注册、运行时版本不匹配或 API 断言失败，真实测试应失败，不能按 mock 通过处理。

## 安全边界

- `wps.exec` 和 Transform 会用 Acorn 做只读静态检查，拒绝对象赋值、`new`、删除、以及常见写入/修改 API 方法；这是 best-effort 检查，不是 JavaScript 沙箱，无法阻止被绕过的恶意代码。
- Render 是唯一有意允许文档修改的规则。JSAPI 代码在 WPS 宿主内执行，拥有 WPS 文档权限；只运行可信的 Agent 生成代码，Render 前确认目标范围与内容。
- WebSocket/HTTP 服务只监听 loopback，但本机其他进程仍可访问它；不要在公网/局域网端口暴露此服务。
- 所有 JSAPI 结果必须 JSON 可序列化；不要返回 WPS/COM 宿主对象。

## Skill 与 API 报告

- 渐进式披露技能：`.agents/skills/wps-api/SKILL.md`（同时安装至 `~/.agents/skills/wps-api/`）
- 每个报告 API 的成员清单、探测结果和使用说明：`.agents/skills/wps-api/references/`
- 重新从 `reports.zip` 生成 API 技能：`python3 scripts/generate-wps-api-skill.py`
- 提供的三个诊断报告采集自 UOS Linux ARM64 / WPS 12.0 Build 26885；它们不是当前 macOS 的兼容性证明。一次 macOS 联调记录见 [`reports/macos-codex-validation.md`](reports/macos-codex-validation.md)：其中 Codex 只是当时使用的测试客户端/工具，报告中的客户端限制不构成项目运行依赖。
- 2026-09-29 的真实 WPS 冒烟记录：[ET/WPP](reports/macos-live-et-wpp-smoke-2026-09-29.md)、[Writer](reports/macos-live-writer-smoke-2026-09-29.md)。
