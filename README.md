# WPS MCP Server

依据 `spec.md` 实现的本机 WPS MCP：MCP 负责文档路由、规则/变量生命周期；文档访问仍由 WPS JS API 执行。

## 一眼看懂

不想先读文档？先用浏览器打开 [`doc/show-me-wps-mcp.html`](doc/show-me-wps-mcp.html)：一页讲清 8 个 Tool、Transform / Variable / Render 三条规则、读与写的护栏，以及各部分的职责边界。

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

完整退出并重新启动 WPS Office，让 WPS 读取 `publish.xml`。打开 Writer、表格或演示文稿；Add-in 的任务面板页面连接服务后，状态显示当前文档。WPS MCP 工具栏的“显示连接状态”会打开状态窗格。

## Windows 部署

要求 Node.js 20+，WPS Office 已安装。Windows 没有 LaunchAgent，服务在终端前台运行即可：

```bash
npm ci
npm run build
node scripts/install-addin.mjs --dry-run   # 先预览将要写入的 publish.xml
node scripts/install-addin.mjs             # 注册 ET/WPP/WPS 三个本地 Add-in
npm start                                  # 前台启动桥接服务（stdio + HTTP + WebSocket）
```

`scripts/install-addin.mjs` 是跨平台的，等价于 macOS 的 `install-macos-addin.sh`：只增删自己的 `WpsMcp*` 条目，其他加载项条目原样保留，首次修改前备份到 `publish.xml.backup-before-wps-mcp`；若 `publish.xml` 缺少 `</jsplugins>` 会拒绝写入。可用 `--uninstall` 移除，或用环境变量覆盖端口与状态：

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

该命令要求 WPS Office 已安装、**测试开始前完全退出 WPS**，且独立测试端口未被占用。它会在 `publish.xml` 中临时加入 ET/WPP 测试加载项、启动隔离的 MCP 服务和临时状态目录、生成可丢弃的 `.xlsx`/`.pptx` 测试文件，再通过 macOS 打开文件并等待真实 Add-in 注册。测试会经真实 MCP/Add-in 执行只读查询、ET 公式/格式写入与读回、WPP 文本框/文字/几何属性写入与读回，并把修改保存到临时副本。退出时恢复原 `publish.xml` 并清理临时数据。若 WPS 未正常退出，临时文件会保留并打印路径，避免删除仍被 WPS 使用的文件。

此套件不测试 Writer；普通 `npm test` 不会启动 WPS。若 Add-in 未连接、测试文件未注册、运行时版本不匹配或 API 断言失败，真实测试应失败，不能按 mock 通过处理。

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
- 提供的三个诊断报告采集自 UOS Linux ARM64 / WPS 12.0 Build 26885；它们不是当前 macOS 的兼容性证明。一次 macOS 联调记录见 [`doc/macos-codex-validation.md`](doc/macos-codex-validation.md)：其中 Codex 只是当时使用的测试客户端/工具，报告中的客户端限制不构成项目运行依赖。
