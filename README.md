# WPS MCP Server

依据 `spec.md` 实现的本机 WPS MCP：MCP 负责文档路由、规则/变量生命周期；文档访问仍由 WPS JS API 执行。

## 架构

```text
Codex MCP (Streamable HTTP) → 127.0.0.1:18766/mcp
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

完整退出并重新启动 WPS Office，让 WPS 读取 `publish.xml`。打开 Writer、表格或演示文稿；Add-in 的任务面板页面连接服务后，状态显示当前文档。WPS MCP 工具栏的“显示连接状态”会打开状态窗格。

## 连接 Codex

一次性全局注册：

```bash
/Applications/ChatGPT.app/Contents/Resources/codex mcp add wps-mcp --url http://127.0.0.1:18766/mcp
```

用真实 Codex 对本项目做 MCP 探测：

```bash
/Applications/ChatGPT.app/Contents/Resources/codex exec -C "$PWD" \
  'Use the wps-mcp tools: list connected WPS documents and inspect the active document with document.get and a read-only wps.exec query. Do not modify documents.'
```

Codex 工具名：

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

## 安全边界

- `wps.exec` 和 Transform 会用 Acorn 做只读静态检查，拒绝对象赋值、`new`、删除、以及常见写入/修改 API 方法；这是 best-effort 检查，不是 JavaScript 沙箱，无法阻止被绕过的恶意代码。
- Render 是唯一有意允许文档修改的规则。JSAPI 代码在 WPS 宿主内执行，拥有 WPS 文档权限；只运行可信的 Agent 生成代码，Render 前确认目标范围与内容。
- WebSocket/HTTP 服务只监听 loopback，但本机其他进程仍可访问它；不要在公网/局域网端口暴露此服务。
- 所有 JSAPI 结果必须 JSON 可序列化；不要返回 WPS/COM 宿主对象。

## Skill 与 API 报告

- 渐进式披露技能：`.agents/skills/wps-api/SKILL.md`（同时安装至 `~/.agents/skills/wps-api/`）
- 每个报告 API 的成员清单、探测结果和使用说明：`.agents/skills/wps-api/references/`
- 重新从 `reports.zip` 生成 API 技能：`python3 scripts/generate-wps-api-skill.py`
- 提供的三个诊断报告采集自 UOS Linux ARM64 / WPS 12.0 Build 26885；它们不是当前 macOS 的兼容性证明。当前 Mac Codex/WPS 的运行验证记录见 `reports/macos-codex-validation.md`（部署完成后生成）。
