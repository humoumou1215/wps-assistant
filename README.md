# WPS MCP Server

依据 `docs/spec.md` 实现的本机 WPS MCP：MCP 负责文档路由、规则/变量生命周期；文档访问仍由 WPS JS API 执行。

## 一眼看懂

不想先读文档？先用浏览器打开 [`docs/show-me-wps-mcp.html`](docs/show-me-wps-mcp.html)：一页讲清 8 个 Tool、Transform / Variable / Render 三条规则、读与写的护栏，以及各部分的职责边界。

## 架构

```text
MCP Client (Streamable HTTP) → 127.0.0.1:18766/mcp
                                   │
WPS JS Add-in (ET/WPP/WPS) → WebSocket /ws
                                   │
                             WPS JS API
```

服务只绑定 `127.0.0.1`。变量及规则保存在 `~/Library/Application Support/wps-mcp/state.json`；WPS 文档注册信息只保存在内存中，Add-in 断开后标记为不可用。

状态目录按平台选择，可用 `WPS_MCP_DATA_DIR` 覆盖：macOS 为 `~/Library/Application Support/wps-mcp`，Windows 为 `%APPDATA%\wps-mcp`，其他平台为 `$XDG_CONFIG_HOME/wps-mcp`。

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

## Windows 部署

要求 Node.js 20+，WPS Office 已安装。Windows 没有 LaunchAgent，服务在终端前台运行即可：

```bash
npm ci
npm run build
node scripts/install-addin.mjs --dry-run   # 先预览将要写入的 publish.xml
node scripts/install-addin.mjs             # 注册 ET/WPP/WPS 三个本地 Add-in
npm start                                  # 前台启动桥接服务（stdio + HTTP + WebSocket）
```

`scripts/install-addin.mjs` 是跨平台的，对应 macOS 的 `install-macos-addin.sh`：只增删自己的 `WpsMcp*` 条目，其他加载项条目原样保留，首次修改前备份到 `publish.xml.backup-before-wps-mcp`；若 `publish.xml` 缺少 `</jsplugins>` 会拒绝写入。可用 `--uninstall` 移除，或用环境变量覆盖端口与状态：

> 两者的差异：`install-macos-addin.sh` 还会写入 Writer 宿主所需的 `authaddin.json` 记录，并在检测到 WPS 正在运行时拒绝安装。`install-addin.mjs` 目前**只处理 `publish.xml`**、不做运行中检测 —— Windows 下 Writer 宿主是否能仅凭 `publish.xml` 加载尚未实测。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `WPS_MCP_PORT` | `18766` | 服务端口，需与 `publish.xml` 中的 URL 一致 |
| `WPS_MCP_ADDIN_ENABLE` | `enable_dev` | Add-in 的 `enable` 属性 |
| `WPS_MCP_ADDINS_DIR` | `%APPDATA%\kingsoft\wps\jsaddons` | 加载项目录 |

注册完成后**完全退出并重新启动 WPS Office**（托盘图标也要退出），再打开表格/演示/文字；`publish.xml` 中的地址指向运行中的服务，所以服务要先启动。验证：

```bash
curl http://127.0.0.1:18766/health
curl http://127.0.0.1:18766/addins/et/      # 返回 Add-in 任务面板 HTML
```

本地调试不依赖真实 WPS 宿主时，可用内置的模拟 Add-in harness 跑通全部 8 个 Tool 与错误分支：

```bash
npm start              # 另开一个终端
npm run debug:local    # 连接两个模拟 Add-in（表格 + 演示），执行完整流程并打印 PASS/FAIL
```

harness 只验证 MCP/WebSocket/桥接层，**不代表** WPS JS API 的真实兼容性；真实宿主下的 API 行为仍需按下方“自动化测试”在做实机验证。

## 运行日志

服务默认向 **stderr** 和 `<数据目录>/logs/wps-mcp.log` 写入 JSON Lines 日志，每行一条事件。Windows 默认路径为 `%APPDATA%\wps-mcp\logs\wps-mcp.log`；macOS 为 `~/Library/Application Support/wps-mcp/logs/wps-mcp.log`。stdout 保留给 MCP stdio 协议。原启动脚本的 stdout/stderr 重定向仍有效。

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `WPS_MCP_LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` / `silent`；非法值回退到 `info` |
| `WPS_MCP_LOG_DIR` | `<数据目录>/logs` | 自定义日志目录 |
| `WPS_MCP_LOG_FILE` | `1` | 设为 `0` 关闭文件日志，保留 stderr |
| `WPS_MCP_LOG_MAX_BYTES` | `10485760` | 每个文件上限，默认 10 MiB，最小 1 KiB |
| `WPS_MCP_LOG_MAX_FILES` | `5` | 保留文件总数，含当前文件；最多 100 个 |

轮转文件为 `wps-mcp.log.1` 至 `.4`，`.1` 为最近归档；超过保留数量会删除最旧文件。文件写入异步串行执行；目录不可写时会向 stderr 报告 `logger.file_unavailable`，本进程继续使用 stderr。写入队列最多容纳 1000 条，满时仅丢弃新增记录的文件副本并报告 `logger.queue_full`；stderr 仍输出。SIGINT/SIGTERM（平台支持时）和致命异常退出前会等待日志落盘，最多 2 秒；强制结束进程不能保证队列落盘。

日志覆盖服务启动/退出、Add-in 连接、文档注册、配置操作、HTTP 请求、聊天轮次、模型用量、工具调用及 WPS RPC。按 `requestId` → `turnId` → `toolCallId` → `rpcId` 关联；外部 MCP 工具调用不含 `turnId`，stdio 调用不含 HTTP `requestId`。HTTP 响应包含 `x-request-id`。正常 GET/静态资源/健康检查只在 `debug` 记录，失败及 POST 请求在默认级别可见。

默认只记录操作元信息、稳定 ID、耗时、状态和错误码，不记录聊天正文、文档名称/路径/内容、执行代码、工具参数或结果、请求头与 URL 查询参数。已保存 API Key、自定义 Header 值及连接测试中的临时凭据会脱敏；即使 `debug` 也不启用内容日志。`pi/sessions` 中原有的会话历史仍独立保存，不受运行日志的脱敏和轮转设置管理。

Windows 查看最近日志：

```powershell
Get-Content "$env:APPDATA\wps-mcp\logs\wps-mcp.log" -Tail 30 -Wait
```

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

- `wps.exec` 和 Transform 会用 Acorn 做只读静态检查（`src/readonly-guard.ts`），拒绝成员赋值、`new`、`delete`、以及常见写入/修改 API 方法。检查是**纯语法**的：它按节点类型与属性名匹配，不区分文档对象与本地对象 —— `const o = {}; o.a = 1`、`let i = 0; i++`、`new Date()` 同样被拒；方法黑名单按属性名匹配，因此本地对象上叫 `copy`/`sort` 的属性也会被拒。这是 best-effort 检查，不是 JavaScript 沙箱，无法阻止被绕过的恶意代码。
- 违规会**一次报全**：错误信息列出每条的 `kind`、行列号与源码行，结构化数据在 `error.details.violations`。判据模块可被外部工具直接 import（不必抄一份带漂移风险的副本）。
- Render 是唯一有意允许文档修改的规则。JSAPI 代码在 WPS 宿主内执行，拥有 WPS 文档权限；只运行可信的 Agent 生成代码，Render 前确认目标范围与内容。
- WebSocket/HTTP 服务只监听 loopback，但本机其他进程仍可访问它；不要在公网/局域网端口暴露此服务。
- 所有 JSAPI 结果必须 JSON 可序列化；不要返回 WPS/COM 宿主对象。

## Skill 与 API 报告

- 渐进式披露技能：`skills/wps-api/SKILL.md`（WorkBuddy 用户级安装位置为 `~/.workbuddy/skills/wps-api/`，需手工复制，仓库内没有安装脚本）
- 每个报告 API 的成员清单、探测结果和使用说明：`skills/wps-api/references/`
- 重新从诊断报告包生成 API 技能：`python3 scripts/generate-wps-api-skill.py <reports.zip>`（报告包目前不在工作区，可用 `git show HEAD:reports.zip > reports.zip` 取回）
- 提供的三个诊断报告采集自 UOS Linux ARM64 / WPS 12.0 Build 26885；它们不是当前 macOS 的兼容性证明。一次 macOS 联调记录见 [`docs/macos-codex-validation.md`](docs/macos-codex-validation.md)：其中 Codex 只是当时使用的测试客户端/工具，报告中的客户端限制不构成项目运行依赖。
- 2026-09-29 的真实 WPS 冒烟记录：[ET/WPP](docs/macos-live-et-wpp-smoke-2026-09-29.md)、[Writer](docs/macos-live-writer-smoke-2026-09-29.md)。

## 助手任务窗格

启动服务后，在 WPS 的「WPS MCP」选项卡选择「助手面板」或「变量管理」。也可以用浏览器打开 [任务窗格](http://127.0.0.1:18766/addon/taskpane.html)。首次使用在「设置」中填写模型配置并测试连接：支持 DeepSeek 内置目录和自定义 OpenAI 兼容端点（completions / responses）。需要 Node.js 22.19 或更高版本。

- 会话支持流式回复、思考过程、工具执行详情、停止生成，以及 `@` 文档、选区快照、变量和 Render 引用。
- 变量管理支持搜索、源文档筛选、取值与脚本预览、单条/全部重算和重写。操作失败会显示具体原因；停止生成不回滚已经完成的写入。
- `config.json` 和 `state.json` 存在 `WPS_MCP_DATA_DIR` 指定的数据目录；默认目录与原服务一致。API Key 仅在服务端保存，读取配置只返回存在标记。更换端点时不会自动沿用旧密钥与请求头。
- 单会话历史由 pi 保存在数据目录下的 `pi/sessions`，重新打开页面或重启服务后可恢复。内嵌 Agent 只挂载八个 WPS 工具，关闭内置文件/终端工具和外部资源自动发现，不读取 `~/.pi`。
- 新建绑定保存文档路径到稳定 ID 的映射，重连后恢复关联。旧版绑定没有历史路径映射时，不会猜测它对应的新文档；需要重新创建绑定。文件移动或另存为新路径也被视为新文档。

开发验证：`npm test` 覆盖 MCP、UI API、完整 Agent 工具往返、配置隐私、取消与重启恢复；`npm run test:wps-live` 验证真实 ET/WPP 和任务窗格复用；`npm run test:wps-writer-live` 验证真实 Writer。真人式浏览器验证记录见 [审计与验收报告](docs/ui-audit-and-validation.md)。
