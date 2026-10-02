# WPS MCP Server

[![CI](https://github.com/humoumou1215/wps-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/humoumou1215/wps-mcp/actions/workflows/ci.yml)
[![Security](https://github.com/humoumou1215/wps-mcp/actions/workflows/security.yml/badge.svg)](https://github.com/humoumou1215/wps-mcp/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

开发与贡献见 [CONTRIBUTING.md](CONTRIBUTING.md)，CI、依赖维护和版本发布见 [自动化维护指南](docs/automation.md)。

通过本机桥接服务，让 AI 读取和修改当前打开的 WPS 表格、演示与文字文档。可以在 WPS 的助手面板里直接对话，也可以让外部 MCP 客户端接入；文档访问由 WPS Add-in 在真实宿主中执行 WPS JS API。

核心流程是 **Transform → Variable → Render**：保存只读提取规则，得到 JSON 值，再按已保存的规则写入目标文档。创建绑定可以由 Agent 完成；之后在变量面板执行重算或重写，直接运行规则，无需再次请求模型。设计约束见 [`docs/spec.md`](docs/spec.md)。

## 一眼看懂

用浏览器打开 [`docs/show-me-wps-mcp.html`](docs/show-me-wps-mcp.html)：一页了解两种使用入口、核心工具、Transform / Variable / Render、读写边界和运行日志。GitHub 的 HTML 文件页显示源代码，克隆仓库后可直接打开本地 HTML 预览。

## 环境要求

- Node.js **22.19.0 或更高版本**，与 `package.json` 的 `engines` 一致。
- 本机安装支持 JS Add-in 的 WPS Office；桥接服务与 WPS 必须运行在同一台机器上。
- 内置助手需要在「设置」中配置模型；支持 DeepSeek 内置目录和自定义 OpenAI 兼容端点（completions / responses）。模型请求按配置发送到对应服务商。

## 架构

```text
WPS 助手面板 → /api/chat → 内嵌 pi Agent ──┐
                                        ├→ 共用 10 个工具 → WebSocket /ws → WPS Add-in → WPS JS API
外部 MCP 客户端 → /mcp 或 stdio ──────────┘
```

服务只绑定 `127.0.0.1`。内嵌 Agent 直接调用共用工具实现；外部客户端通过 MCP 调用。两种入口共用文档、变量和规则状态。Add-in 报告当前打开的文档，服务以 `documentId` 路由到对应宿主；断开的文档会标记为不可用。

数据目录可用 `WPS_MCP_DATA_DIR` 覆盖：macOS 为 `~/Library/Application Support/wps-mcp`，Windows 为 `%APPDATA%\wps-mcp`，其他平台为 `$XDG_CONFIG_HOME/wps-mcp`（未设置时为 `~/.config/wps-mcp`）。

| 数据 | 位置 | 用途 |
| --- | --- | --- |
| 变量与规则 | `state.json` | 最近变量值、Transform / Render 代码及文档身份映射 |
| 模型配置 | `config.json` | 模型、协议、API Key 和额外 Headers |
| 助手会话 | `pi/sessions/` | 消息、工具执行详情和轮次元数据 |
| 运行日志 | `logs/wps-mcp.log` | 操作元信息、链路 ID、耗时与错误码；按大小轮转 |

实时连接与选区保存在内存中，重启后由 Add-in 重新上报。会话历史可能包含文档数据，与运行日志的脱敏、轮转设置分别管理。

## macOS 部署

安装前完全退出 WPS。项目根目录运行：

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

重新启动 WPS Office。macOS 安装脚本会更新 `publish.xml`；Writer 还会在 `authaddin.json` 中登记 `wps` 主机的启用状态。打开 Writer、表格或演示文稿，在「WPS MCP」选项卡选择「助手面板」或「变量管理」；「显示连接状态」打开状态窗格。

## Windows 部署

安装前完全退出 WPS（包括托盘）。Windows 可在 PowerShell 中前台启动 HTTP 模式：

```powershell
npm ci
npm run build
node scripts/install-addin.mjs --dry-run   # 先预览将要写入的 publish.xml
node scripts/install-addin.mjs             # 注册 ET/WPP/WPS 三个本地 Add-in
$env:WPS_MCP_TRANSPORT = "http"
npm start                                  # HTTP / MCP / WebSocket；保持此终端运行
```

`scripts/install-addin.mjs` 是跨平台的，对应 macOS 的 `install-macos-addin.sh`：只增删自己的 `WpsMcp*` 条目，其他加载项条目原样保留，首次修改前备份到 `publish.xml.backup-before-wps-mcp`；若 `publish.xml` 缺少 `</jsplugins>` 会拒绝写入。可用 `--uninstall` 移除，或用环境变量覆盖端口与状态：

> 两者的差异：`install-macos-addin.sh` 还会写入 Writer 宿主所需的 `authaddin.json` 记录，并在检测到 WPS 正在运行时拒绝安装。`install-addin.mjs` 目前**只处理 `publish.xml`**、不做运行中检测 —— Windows 下 Writer 宿主是否能仅凭 `publish.xml` 加载尚未实测。

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `WPS_MCP_PORT` | `18766` | 服务端口，需与 `publish.xml` 中的 URL 一致 |
| `WPS_MCP_TRANSPORT` | `stdio` | 设为 `http` 只启动 HTTP MCP；两种模式都有本机 HTTP 和 WebSocket |
| `WPS_MCP_DATA_DIR` | 平台数据目录 | 覆盖配置、变量、会话及默认日志的存放目录 |
| `WPS_MCP_ADDIN_ENABLE` | `enable_dev` | Add-in 的 `enable` 属性 |
| `WPS_MCP_ADDINS_DIR` | `%APPDATA%\kingsoft\wps\jsaddons` | 加载项目录 |

注册完成后**完全退出并重新启动 WPS Office**（托盘图标也要退出），再打开表格/演示/文字；`publish.xml` 中的地址指向运行中的服务，所以服务要先启动。验证：

```bash
curl http://127.0.0.1:18766/health
curl http://127.0.0.1:18766/addins/et/      # 返回 Add-in 任务面板 HTML
```

本地调试不依赖真实 WPS 宿主时，可用内置的模拟 Add-in harness 跑通创建、读取、执行工具与错误分支：

```bash
npm start              # 另开一个终端
npm run debug:local    # 连接两个模拟 Add-in（表格 + 演示），执行完整流程并打印 PASS/FAIL
```

harness 只验证 MCP/WebSocket/桥接层，**不代表** WPS JS API 的真实兼容性；真实宿主下的 API 行为仍需按下方“自动化测试”在做实机验证。

更新代码后先运行 `npm run build`，再重启桥接服务；修改助手页面后重新加载面板。已在默认端口运行的 Windows 桥接可用 `scripts/restart-local-bridge.ps1` 检查和重启：

```powershell
.\scripts\restart-local-bridge.ps1 -CheckOnly
.\scripts\restart-local-bridge.ps1
```

脚本核对端口所属进程、会话空闲状态及变量数据目录，保留已保存配置和规则。自定义目录或端口时传入 `-DataDirectory`、`-Port`；重启后 Add-in 会重新连接。

## 助手任务窗格

服务启动且 Add-in 已连接后，在 WPS 的「WPS MCP」选项卡选择「助手面板」。首次使用在「设置」填写模型配置、测试连接并保存。也可以通过本机浏览器打开 [任务窗格](http://127.0.0.1:18766/addon/taskpane.html)；浏览器页面操作的是已连接的 WPS 文档，仍需 WPS Add-in 在线。

- **会话**：流式回复、Markdown、思考过程、工具参数/结果/耗时、Token 与上下文用量、停止生成，以及重载后的会话恢复。
- **命令**：在输入区键入 `/`，按命令名、描述或拼音筛选；`↑↓` 选择、`Tab` / `Enter` 填入、`Esc` 收起，再按 `Enter` 执行。支持 `/auto-compact`、`/clone`、`/compact [说明]`、`/copy`、`/name 名称`、`/reload`、`/session`、`/sessions`、`/new`，以及已安装技能的 `/skill:名称 [任务]`。
- **多会话**：点击或右键顶部「会话」（位于「系统」左侧，键盘可用 `Shift+F10`），打开会话菜单，选择、新建、归档、恢复或删除会话。删除第一次点击后显示「确认」，再次点击才删除。会话历史、名称、当前选择和归档状态保存在本机；切换时保留当前面板各会话的未发送草稿。生成或压缩期间不能切换、归档、删除；多个面板会同步当前会话。
- **引用**：输入 `@` 引用文档、当前选区、固定选区、变量或 Render，支持中文、全拼和拼音首字母搜索。引用标签不显示前导 `@`，直接显示完整文件名、工作表与地址，或 PPT 页码、对象名称与选中文字；文字范围紧凑显示为「3起2字」，点击标签可预览详细位置和内容。当前选区跟随所选文档中的选择，在发送时重新读取最新位置；固定选区保留引用时的位置，移动选区或切换工作表不会改变它，单元格内容仍可更新。输入框标签开头的 pin 图标可点击切换类型：倾斜空心表示活动，直立实心表示固定，悬停显示状态和操作说明。切换使用 SVG 和 CSS 旋转、位移动画，并遵循系统「减少动态效果」设置。每条消息保存实际使用的位置，历史消息的引用不会随之后的选择变化。表格支持不连续区域，每个区域独立预览前 5 行 × 6 列，最多预览 6 个区域；PPT 局部文字保留起点和长度，Writer 保留字符范围或插入点。更新选区采集代码后，需重新启动 WPS 加载新版 Add-in。变量与 Render 候选跟随变量页的「展示当前 / 展示全部」模式，模式记住并同步到同源的其他面板；搜索框和源文档标签只影响变量列表。
- **选区校验**：文字引用最多携带 2000 字符预览，截断会明确提示，完整坐标始终保留；读取全文时按坐标分段读取。活动引用请求只发送文档标识，不重复上传旧选中文字。PPT 局部文字缺少对象身份或起点/长度、Writer 缺少范围或正文类型、表格缺少明确工作表和地址时拒绝引用。固定的是地址或字符偏移；插行、删除前文等结构修改后，应重新选择并引用需要的内容。
- **变量**：默认「展示当前」，只展示源文档或任一 Render 目标文档在线的变量；「展示全部」可查看本机历史变量。统计和全部重算/重写使用当前模式的范围，搜索及源文档标签只筛选列表；批量操作跳过离线源/目标，重写还会跳过没有当前值的变量。卡片始终保留全部 Render，离线绑定标注「已断开」。变量和每条 Render 均可原位点击「删除」再点「确认」；点击外部取消，只删除本机定义和绑定，保留文档已写入内容。多条 Render 分别报告成功与失败；停止生成不回滚已完成的写入。
- **设置**：DeepSeek 内置目录、自定义模型和协议、思考等级、兼容参数、额外 Headers。配置修订检查防止旧面板覆盖新配置；发生冲突时加载最新配置。更换端点不会自动沿用旧密钥与请求头；读取配置只返回凭据存在标记。

变量页的表格来源区域和 Render 目标区域支持单击定位：切换到对应工作簿、工作表，滚动并选中单元格区域。定位不执行重算或重写。来源使用 `sourceRef`；新建表格 Render 时填写 `targetRef`（例如 `Summary!A1:B4`，带空格的工作表用 `'Sales Data'!A1:B4`）。旧 Render 的描述中只有一个明确区域时也可定位；缺失或含多个区域时不猜测目的地。离线文档的定位按钮禁用，目标工作表被删除等错误会显示在窗格中。目前支持表格区域，文字和演示位置暂不支持。

同一桥接服务共用当前选中的助手会话，同时只运行一个聊天轮次、会话管理或配置操作。服务启动时自动将项目 `skills/`（包含参考资料）安装到应用数据目录的 `pi/skills/`，通过安装清单更新随项目提供的文件、清理已撤下的内置文件，并保留其他已安装技能及用户新增资料。清单建立前遗留的文件不会被推断为内置文件后删除。内嵌 Agent 加载该目录中的技能，挂载十个 WPS 工具和一个仅限技能目录的 `read` 工具，按需读取技能正文和参考资料；终端、通用文件写入和外部资源自动发现保持关闭，不读取 `~/.pi`。

会话顶部提供「系统」「技能」「工具」入口，可查看当前会话实际使用的完整系统提示词、已安装技能的描述和正文，以及启用工具的说明与参数定义。查看这些资源无需填写 API Key，也不会请求模型。

新建绑定会保存文档路径到稳定 ID 的映射，重连后恢复关联。旧版绑定没有历史路径映射时需重新创建；文件移动或另存为新路径也被视为新文档。规则仅在显式重算/重写时执行，当前没有自动监听文件变化或定时同步。

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

macOS 查看最近日志：

```bash
tail -n 30 -f "$HOME/Library/Application Support/wps-mcp/logs/wps-mcp.log"
```

排查时先检查 `/health` 的连接数与文档数，再用 `x-request-id` 查找对应 `http.end`，沿 `toolCallId` / `rpcId` 定位失败。`tool.end` 会记录 `success`、`errorCode` 及失败 Render 数量；`rpc.failed` 标记超时。模型或工具的详细业务结果仍在助手会话中查看。

## 接入 MCP 客户端

服务启动后，可在支持 **MCP Streamable HTTP** 的客户端中添加服务器：

- 名称：`wps-mcp`（客户端内的显示名称，可自定义）
- 传输方式：`Streamable HTTP`
- URL：`http://127.0.0.1:18766/mcp`

如客户端使用 stdio，应由客户端启动 `node <仓库绝对路径>/dist/src/server.js`，保留默认 `WPS_MCP_TRANSPORT=stdio`；该进程同样占用本机桥接端口，须先停止该端口已有的服务。stdout 仅输出 MCP 协议，日志写入 stderr 和文件。

客户端配置格式因产品而异，请按其 MCP 配置说明填写上述传输方式和 URL。服务仅监听本机 loopback，因此 MCP 客户端需运行在能访问该本机地址的环境中。

该服务向客户端提供以下 MCP 工具：

MCP 和内嵌 pi 会话使用相同的工具名，统一为 `wps_` 前缀的小写 snake_case；`create` / `update` 保存定义，`run` 执行代码或规则。升级后请重启桥接服务，并让 MCP 客户端重新发现工具。已保存会话中的旧名称在恢复显示和发送模型上下文时兼容转换，原始历史记录保留。

- `wps_list_documents`
- `wps_get_document(documentId)`
- `wps_run_readonly_code(documentId, code)`
- `wps_create_variable(variableName, description?, sourceDocumentId, sourceRef?, code)`
- `wps_update_variable(variableId, variableName?, description?, sourceDocumentId?, sourceRef?, code?)`
- `wps_create_render(variableId, targetDocumentId, targetRef?, description?, code)`
- `wps_update_render(variableId, renderId, targetDocumentId?, targetRef?, description?, code?)`
- `wps_get_variable(variableId)`
- `wps_run_transform(variableId)`
- `wps_run_render(variableId, renderId?)`

## 标准流程

1. `wps_list_documents` → 选定唯一 `documentId`。
2. `wps_get_document`、`wps_run_readonly_code` 调查工作表、选区、幻灯片、形状或文字结构。
3. `wps_create_variable` 保存只读提取代码；调用 `wps_run_transform`，检查 JSON 值。
4. `wps_create_render` 保存目标文档修改代码；检查绑定后调用 `wps_run_render`。
5. 可用 `wps_get_variable` 查看最近值、是否有值，以及所有规则的完整代码和执行时间。

用户纠正规则时，先 `wps_get_variable` 读取原定义，再调用 `wps_update_variable` 或 `wps_update_render` 修改原规则；变量 ID、规则 ID 和已有 Render 绑定保持不变。至少提供一个更新字段；省略字段保持原值，`description`、`sourceRef` 和 `targetRef` 可传 `null` 清除。

更新只保存规则，不执行 WPS 代码。Transform 代码、来源文档或源区域改变后会清除旧值和上次重算时间，必须先 `wps_run_transform` 重算成功，再 `wps_run_render` 写入；只改名称或描述保留当前值。Render 改变后清除该规则的上次执行时间，使用 `wps_run_render(variableId, renderId)` 单独执行更新后的规则。更新不会撤销已有文档写入，也不会自动清除旧目标位置。保留原文档绑定时，即使文档离线也可编辑规则；显式指定新的来源或目标文档时，该文档必须在线。

## 自动化测试

常规测试覆盖 MCP、模拟 Add-in、完整 Agent 工具往返、任务面板渲染与 API、配置隐私和冲突、取消、部分写入与重启恢复，以及日志轮转/脱敏/链路关联、stdio 输出隔离和 RPC 超时清理。测试不会启动真实 WPS：

```bash
npm test
```

2026-09-30 当前代码通过 37 项常规测试；模拟宿主通过不代表 WPS JS API 的真实兼容性。真实宿主需运行以下显式测试。

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

- `wps_run_readonly_code` 和 Transform 会用 Acorn 做只读静态检查（`src/readonly-guard.ts`），拒绝成员赋值、`new`、`delete`、以及常见写入/修改 API 方法。检查是**纯语法**的：它按节点类型与属性名匹配，不区分文档对象与本地对象 —— `const o = {}; o.a = 1`、`let i = 0; i++`、`new Date()` 同样被拒；方法黑名单按属性名匹配，因此本地对象上叫 `copy`/`sort` 的属性也会被拒。这是 best-effort 检查，不是 JavaScript 沙箱，无法阻止被绕过的恶意代码。
- 违规会**一次报全**：错误信息列出每条的 `kind`、行列号与源码行，结构化数据在 `error.details.violations`。判据模块可被外部工具直接 import（不必抄一份带漂移风险的副本）。
- 内嵌助手每个聊天轮次最多消耗 3 次只读守卫违规额度，按模型轮次计数；同一模型轮次中的多个违规调用只消耗一次，用尽后中断。每次聊天重新计数；外部 MCP 工具本身不施加这份 Agent 重试额度。
- Render 是正式的文档修改入口。JSAPI 代码在 WPS 宿主内执行，拥有 WPS 文档权限；只运行可信代码。用户已请求的写入会在核实目标和位置后执行，不增加重复确认步骤；执行结果可能部分成功，也没有自动回滚。
- WebSocket/HTTP 服务只监听 loopback，但本机其他进程仍可访问它；不要在公网/局域网端口暴露此服务。
- 所有 JSAPI 结果必须 JSON 可序列化；不要返回 WPS/COM 宿主对象。

## Skill 与 API 报告

- 渐进式披露技能：`skills/wps-api/SKILL.md`（WorkBuddy 用户级安装位置为 `~/.workbuddy/skills/wps-api/`，需手工复制，仓库内没有安装脚本）
- 每个报告 API 的成员清单、探测结果和使用说明：`skills/wps-api/references/`
- 重新从诊断报告包生成 API 技能：`python3 scripts/generate-wps-api-skill.py <reports.zip>`；报告包需另行提供，当前检出的仓库不附带该文件。
- 提供的三个诊断报告采集自 UOS Linux ARM64 / WPS 12.0 Build 26885；它们不是当前 macOS 的兼容性证明。一次 macOS 联调记录见 [`docs/macos-codex-validation.md`](docs/macos-codex-validation.md)：其中 Codex 只是当时使用的测试客户端/工具，报告中的客户端限制不构成项目运行依赖。
- 2026-09-29 的真实 WPS 冒烟记录：[ET/WPP](docs/macos-live-et-wpp-smoke-2026-09-29.md)、[Writer](docs/macos-live-writer-smoke-2026-09-29.md)。

## 代码导航

| 路径 | 职责 |
| --- | --- |
| `src/server.ts` | MCP、HTTP、WebSocket 和进程生命周期 |
| `src/tools.ts` | 十个工具、文档路由、WPS RPC、变量与规则持久化 |
| `src/api.ts` / `src/agent.ts` | 面板 API、内嵌 Agent、聊天与工具事件 |
| `src/config.ts` / `src/paths.ts` | 模型配置、凭据和平台数据目录 |
| `src/logger.ts` | 结构化日志、异步写入、轮转、脱敏和上下文关联 |
| `src/readonly-guard.ts` / `src/guard-budget.ts` | 只读语法检查与按模型轮次计算的重试额度 |
| `addon/` | WPS 宿主桥接、Ribbon、助手面板和视图渲染 |
| `skills/wps-api/` | 自动安装到内嵌 Agent，同时可供外部 Agent 使用的 WPS API 技能与参考资料 |
| `scripts/` / `test/` | 安装、重启、调试、常规与真实 WPS 测试 |

浏览器验证记录见 [初期审计与验收报告](docs/ui-audit-and-validation.md)、[2026-09-30 规范对照检查](docs/ui-spec-audit-2026-09-30.md)和[修复复查记录](docs/ui-fix-validation-2026-09-30.md)。

复杂文档与跨文件语义映射的手工测试素材见 [`test/pressure/`](test/pressure/README.md)。仓库只保存合成数据生成器、场景说明和评阅答案；Office 产物默认生成到已忽略的 `.dev/pressure-test/`。
