# 助手面板落地设计方案（会话 + 变量管理）

> 2026-09-30 后续记录：[规范对照检查](ui-spec-audit-2026-09-30.md)、[修复与复查](ui-fix-validation-2026-09-30.md)。下文保留原阶段记录。

> 2026-09-29 实现与审计更新：P0–P2 已落地，实际取舍、修正与验收边界见 [审计与验收报告](ui-audit-and-validation.md)。下文保留原设计推演；以报告及当前代码为准。

> 目标：把 `docs/ui-prototype.html` 的原型变成真页面，挂进 WPS 任务窗格。
> 前提约束：**项目整体保持简洁** —— 不加前端框架、不加构建步骤、不复制第二条执行路径。
> 本文只谈"要动哪些地方"，不含排期。

---

## 0. 结论速览

| 层 | 要不要改 | 改动量 | 说明 |
|---|---|---|---|
| 数据模型 | **小改** | +2 个可选字段组 | Render 已有 `code`；缺"执行元数据"和"来源区域" |
| MCP 工具（8 个） | **不改语义** | 0 | 重算/重写/读值全部复用现有工具 |
| 领域层重构 | **必须** | 机械搬移 | 工具实现从 MCP 注册里提到 `src/tools.ts`，MCP / pi / UI 三处共用 |
| 会话引擎 | **新增** | 内嵌 pi SDK | `@earendil-works/pi-coding-agent`，多一组重依赖（ADR-0001） |
| 模型配置 | **新增** | 设置页 + `config.json` | 支持任意 OpenAI 兼容端点；配置全程不碰 `~/.pi/`（ADR-0004） |
| 服务端 `src/server.ts` | **新增** | +2 个面 | ① 面向 UI 的只读状态接口 ② 会话流（SSE） |
| Add-in `addon/` | **中改** | 新页面 + 2 个 ribbon 按钮 | 任务窗格复用、页面白名单 |
| 只读守卫 | 不改 | 0 | 仍是唯一"能不能改文档"的判据 |
| 选区实时性 | **不用改** | 0 | 复用现有 2.5s 心跳，暂不需要事件订阅 |

一句话：**这次不是加功能，是把已有的 8 个工具和已有的 Add-in 通道，换一个面向人的前端。**

---

## 1. 几个让实现变简单的事实（先确认再动手）

1. **同源**：任务窗格页面、`/mcp`、`/ws` 都由 `127.0.0.1:18766` 提供（`src/server.ts:404-417` 的 addin 静态路由）。
   → 页面调接口不需要跨域、不需要第二端口、不需要额外鉴权模型。
2. **`Render.code` 已经存在**（`src/server.ts:45-50`）。
   → 原型里"点 › 展开看 render 的 code"**不需要数据模型改动**，只是 `variable.get` 目前没把它吐出来（`src/server.ts:304` 只映射了 `renderId/targetDocumentId/description`）。
3. **Add-in 每 2.5s 上报全量文档状态**，其中已含 `selection`（`addon/main.js:188-193`、`src/server.ts:436-451`）。
   → `@` 引用里的"当前选区"、"工作表"、"页码"不需要新写事件订阅，把这批数据暴露给 UI 即可（2.5s 陈旧度对引用选择器完全够用）。
4. **pi 的模型运行时可以不落盘、不联网**（实测，见 §9.4）。
   → `ModelRuntime.create({ modelsPath: null, allowModelNetwork: false })` 之后，41 个内置 provider 仍在，但 pi 不读 `~/.pi/agent/models.json`、不拉网络目录；用户自定义的端点用 `registerProvider()` 在内存里注册。**这是"不要求用户装 pi、不碰他的 pi 配置"能成立的原因**。

---

## 2. 架构总览（现状 → 目标）

```
现在：
  [MCP 客户端] ──stdio/HTTP──> server.ts ──ws──> [隐藏 addon 页] ──> WPS 文档
                                                （status.html 只在 ribbon 手动打开）

目标（内嵌 pi，ADR-0001 / ADR-0002）：

                        src/tools.ts   ← 「能改文档」的唯一执行层（8 个纯函数）
                              ▲
        ┌─────────────┬───────┴────────┬────────────────────┐
        │             │                │                    │
  [MCP 客户端]    内嵌 pi          /api/chat (SSE)    /api/state (只读)
  stdio / HTTP   customTools        会话流              /api/actions (写入)
        │             │                │                    │
        └─────────────┴────────────────┴────────────────────┘
                              │
                          server.ts ──ws──> [隐藏 addon 页] ──> WPS 文档
                                                              （唯一执行者）
```

四个入口都是同一批函数的薄包装，**不存在第二条执行路径**。

新增的两个面（都在现有 HTTP 服务里）：

| 面 | 方法 | 用途 | 只读？ |
|---|---|---|---|
| `/api/state` | GET | 变量列表（含值/类型/来源/Render+code/执行元数据）+ 文档注册表（含选区） | ✅ 只读 |
| `/api/chat` | POST + SSE | 会话：发一条消息，流式回思考/工具/答复 | ✅（写文档仍走 Render 工具） |
| `/api/actions` | POST | 变量页按钮：`{op:'transform'\|'render', variableId, renderId?}` → 调 `src/tools.ts` | ❌ 写入（`render` 是唯一的破坏性动作） |
| `/api/config` | GET / POST | 读写模型配置（`config.json`）；`GET` 时**不回传明文密钥**，只回 `hasKey` | ❌ 只改本机配置，不碰文档 |
| `/api/config/test` | POST | 用表单里的参数试连一次（GET `/models` 或最小对话） | ✅ 只读 |

三个面都只是 `src/tools.ts` 的薄包装，**不新开执行路径**。

---

## 3. 逐层改造清单

### 3.1 领域层：把工具实现从 MCP 注册里提出来（建议做）

现状：8 个工具的处理函数是 `createMcpServer()` 里的闭包（`src/server.ts:210-350`），外部拿不到。
如果 UI 想要"重写 render_001"，要么说 JSON-RPC，要么复制一份逻辑 —— 后者是**第二条执行路径**，必然漂移。

建议的形态（零行为变化，纯搬移）：

```
src/tools.ts     // 8 个纯函数：listDocuments() / getVariable(id) / runTransform(id) / runRender(id, renderId?) …
src/server.ts    // createMcpServer(): 每个工具 5 行薄包装 → 调 tools.ts
                 // httpHandler():  /api/* → 调同一批函数
src/agent.ts     // 内嵌 pi 的 customTools 包装（同调 tools.ts）+ 会话事件转 SSE
```

这样"能改文档"的地方永远只有 `runRender` 一个入口，守卫与审计不会分叉。

### 3.2 数据模型：只补两块，都向后兼容

```ts
type ExecutionMeta = { at: string; durationMs: number };   // ISO 时间 + 耗时

type Variable = {
  variableId: string; name: string; description?: string;
  value?: unknown; hasValue?: boolean;
  sourceRef?: string;                 // ← 新增（可选）：如 "销售数据!A1:B13"，创建时由 Agent 填
  transform: Transform;               // Transform 里再加 lastRun?: ExecutionMeta
  renders: Render[];                  // Render 里再加 lastRun?: ExecutionMeta
};
```

- **执行元数据（必需）**：原型里的"上次重算 15:31:04 / 耗时 2.1s"、"上次写入 18:06:43（0.7s）"现在**没有任何地方存**。`variable.transform` / `variable.render` 执行时顺手写回并按既有 `persist()` 落盘（`state.json`）。
- **来源区域（已定：加可选入参）**：`transform.create` 加 `sourceRef?: z.string()` → `Transform.sourceRef`，`variable.get` / `/api/state` 透传。Agent 创建变量时顺手填 `"销售数据!A1:B13"`；工具描述里写明格式约定，避免十个变量十种写法。
  - **不**复用 `Transform.description` 这个死字段（`src/server.ts:42` 定义、`:303` 透传、**无人写入**）。它确实与 `Render.description`（写入位置）构成对称，但 `description` 三个含义的歧义在 `CONTEXT.md` 里已被 flag，再让它装机器可解析的地址会把特例变成常态。
  - `Transform.description` 的后续处理（删掉 / 保留）留到实现时顺手清理，不阻塞本方案。
- **变量类型/大小（不落盘）**：`表格 11×2` / `数值 770,450` / `数值 6.9%` 全部由 `value` 推导（数组 → 行×列，数字 → 千分位/百分比）。服务端或前端算都行，**不要进 state.json**，否则值一改就要同步。

### 3.3 服务端：`/api/state`（约 40 行）

一次给出 UI 需要的全部，避免前端拼 N+1 次调用：

```jsonc
{
  "documents": [ { "documentId":"doc_xlsx_1", "name":"销售数据.xlsx", "type":"spreadsheet",
                   "connected":true, "activeSheet":"销售数据", "selection":{"address":"A1:B13"} } ],
  "variables": [ {
    "variableId":"var_001", "name":"部门销售额", "description":"…",
    "sourceRef":"销售数据!A1:B13", "sourceDocumentId":"doc_xlsx_1",
    "hasValue":true, "value":[…],
    "transform":{ "transformId":"transform_001", "lastRun":{"at":"…","durationMs":2110} },
    "renders":[ { "renderId":"render_001", "targetDocumentId":"doc_ppt_1",
                  "description":"第 3 页 ·「销售图」柱状图", "code":"…",
                  "lastRun":{"at":"…","durationMs":700} } ]
  } ]
}
```

要点：`Transform.code` 与 `Render.code` **只在 `/api/state` 里给**，不动 `variable.get` 的输出契约（MCP 客户端看到的还是精简版，避免把大段代码灌进模型上下文）。

### 3.4 服务端：`/api/chat`（会话）

只有这一块是真新增功能。引擎已定：**内嵌 pi SDK**（§4 决策 1 / ADR-0001）。

**pi 的真实事件名（实测，不是猜的）** —— `session.subscribe(cb)` 收到的是 `AgentSessionEvent`，一次完整「工具往返」的实测序列如下（2026-09-29，`pi-coding-agent@0.87.1`，假 OpenAI 端点跑通）：

```
agent_start                    ← 整轮开始
  turn_start                   ← 一次模型调用的开始（一轮里可能有多次）
    message_start
    message_update              ← 内部再按 assistantMessageEvent.type 细分：
        toolcall_start             · toolcall_delta  · toolcall_end
        text_start                 · text_delta     · text_end
        thinking_start             · thinking_delta · thinking_end   （推理模型才有）
    message_end
    tool_execution_start        ← { toolName, args }
    tool_execution_end          ← { toolName, isError, result }
  turn_end                     ← 这次模型调用结束
  turn_start …                 ← 工具结果回灌，模型再来一次
agent_end                      ← { willRetry } 整轮结束
agent_settled
```

**转 SSE 时的映射**（前端按这套渲染，不为「真实数据」再设计一次）：

| SSE 事件（推给前端） | pi 来源 | 对应原型里的渲染块 |
|---|---|---|
| `turn.start` | `agent_start` | 新回合开始 |
| `thinking.delta` | `message_update` 且 `assistantMessageEvent.type === 'thinking_delta'` | 思考块（增量） |
| `tool.start` | `tool_execution_start`（`toolName` / `args` 已完整） | 工具卡 · 执行中 |
| `tool.result` | `tool_execution_end`（`toolName` / `isError`） | 工具卡 · 完成 |
| `text.delta` | `message_update` 且 `... === 'text_delta'` | 最终答复（增量） |
| `turn.end` | `agent_end`（含 `willRetry`） | 收尾（用量 / 停止原因） |
| `error` | 监听回调里抛出的异常 | 错误条 |

三点注意：

- **思考块无需额外开兼容。** `deepseek` provider 自带 `compat.thinkingFormat: "deepseek"` + `requiresReasoningContentOnAssistantMessages: true`，思考增量直接来。自建端点走 `compat.thinkingFormat` 手配（设置页「高级」里有）。
- **`turn_start` / `turn_end` 是模型调用粒度，不是回合粒度。** 一轮里工具往返几次就有几对；原型的「过程分组」想按模型调用切分就用它，想整轮聚合就用 `agent_start` / `agent_end`。
- **工具参数在 `tool_execution_start` 时已完整**，不用自己拼 `toolcall_delta` 的流式片段。

其余事件（`compaction_start/end`、`auto_retry_start/end`、`queue_update`、`entry_appended`、`thinking_level_changed`…）按需映射，先只做上表这 7 条。

配套的两件小事：

- **`refs` 结构化传参**：UI 里 `@` 出来的是 chip，不能退化成纯文本。消息体带 `refs:[{kind:'sel'|'doc'|'var'|'render', id, label}]`，服务端把它翻成明确的上下文段（"当前选区 = 销售数据.xlsx!A1:B13，已含表头"），**不让模型猜 id**。
- **只读守卫约束注入**：Agent 生成的 Transform/WPS 代码必须过 `assertReadOnlyCode`（`i++`、`o.a=1`、`new Date()`、`await` 一律被拦）。把这份禁令写进 system prompt，并在被拦时把守卫报错回灌给模型自我修复（重试上限 2 次）。这套约束的权威描述在 skill `wps-mcp-binding` §3。

### 3.5 Add-in：`addon/`

| 项 | 现状 | 改动 |
|---|---|---|
| 入口页 | `index.html` 27 行，隐藏的连接页 | 保留不动（它是执行器 + 心跳） |
| 新 UI 页 | 无 | 新增 `taskpane.html` / `taskpane.css` / `taskpane.js`（原型拆开即可，纯静态、零构建） |
| 任务窗格复用 | `main.js:181` 每次 `CreateTaskPane` 都新建 | `PluginStorage` 缓存 pane ID + `GetTaskPane(id)` 复用；两个入口带参数 `?page=chat` / `?page=vars` |
| ribbon | 只有「显示连接状态」一个按钮 | 加「助手面板」「变量管理」（对应原型左侧那条假 ribbon） |
| 静态白名单 | `server.ts:404` 只认 `index.html/main.js/manifest.xml/ribbon.xml` | 扩到新页面（改成"目录白名单 + 扩展名校验"，**保持不穿越目录**这条不变） |
| MCP 配置 | `mcp.json` 里的 server 名 | 若改过端口/路径需同步；否则不用动 |

### 3.6 UI：数据来源与动作映射

| 界面元素 | 数据/动作来源 |
|---|---|
| 变量卡、类型、来源、描述 | `GET /api/state` |
| 重算（单卡） | `variable.transform(variableId)` |
| 重写（单卡全部 / 单条） | `variable.render(variableId, renderId?)` |
| 全部重算 / 全部重写 | 前端串行循环（N 很小）——**服务端不做批量接口**，避免出现第三条执行路径 |
| Render 展开看 code | `/api/state` 里的 `renders[].code` |
| 取值预览、选区 | `variable.get` / `document.get`（或 `/api/state` 缓存） |
| 会话 | `POST /api/chat`（SSE） |
| 模型配置（设置页） | `GET` / `POST /api/config`；测试连接 `POST /api/config/test`（见 §9） |
| 连接状态、已注册文档 | `GET /api/state`（或轻量 `/health`，`server.ts:389` 已有） |

---

## 4. 需要拍板的设计点

### 决策 1：会话页的 Agent 怎么接 —— ✅ 定案：内嵌 pi SDK（ADR-0001）

`@earendil-works/pi-coding-agent@0.87.1`（MIT）跑在 `wps-mcp` 进程内：`createAgentSession()` 起会话，`session.subscribe()` 的事件直接转 SSE 推给任务窗格。

落选项及理由：

| 落选 | 理由 |
|---|---|
| 自研 tool-calling loop | 要自己维护循环 / 重试 / 上下文裁剪；pi 白送会话持久化与上下文压缩 |
| 子进程跑 pi CLI | 要求跑 `wps-mcp` 的机器装了 pi —— 本机 Windows 没有（pi 在 Mac mini 的容器里）；多一层进程生命周期 |

两个强制项：

- `createAgentSession({ noTools: "builtin" })` —— **必须关掉** pi 默认的 `read / write / edit / bash`，同时保留 `customTools`。不写等于把 shell 和全盘写权限交给模型。
  - ⚠️ **不要用 `tools: []`**。`tools` 是白名单语义（「只启用列出的名字」），空数组会把 8 个自定义工具一起关掉；`noTools: "builtin"` 才是官方为这个场景提供的开关（实测见 §9.4）。
- `agentDir` 显式指到本机数据目录（默认是 `~/.pi/agent`）。不覆盖的话 pi 仍会去那儿找 extensions / skills / prompts，隔离不彻底。
- 工具用 `customTools` 直挂（见决策 2）。

模型本身从哪来（DeepSeek 官方还是自建端点）见 §9。

已接受的代价：多一组重依赖 —— pi-coding-agent 直连 20 个包，经 `pi-ai` 传递引入 `@anthropic-ai/sdk` / `openai` / `@google/genai` / `@aws-sdk/client-bedrock-runtime`，外加原生模块 `@silvia-odwyer/photon-node`。附带好处：`pi-ai` 自带 `http-proxy-agent` / `https-proxy-agent`，出站代理有官方支持。

（可选，降级为 P3）**外部 Agent 进度镜像**值得顺手做：所有工具调用必经 `server.ts`，广播一条就能让「我在外部 Agent 里驱动 WPS」时抽屉里实时可见。约 20 行。

### 决策 2：内嵌 pi 拿工具走 customTools 直挂，不走 MCP 自连 —— ✅ 定案（ADR-0001）

`customTools` 直接包装 `src/tools.ts` 的导出函数，进程内函数调用。**不**让内嵌的 pi 通过 HTTP 连自己的 `/mcp`：

- MCP 桥接多一跳 HTTP + JSON，连接/重连/超时生命周期要自己管；
- pi 的 MCP 默认把工具收进**一个 proxy 工具** —— 会话里只看到 `mcp` 一个名字、看不到 `variable.transform`，而「看得见 Agent 在调什么」正是这个界面存在的理由；
- `pi.registerMcpServer()` 是 2026-09-29 才进主干的，官方 `ExtensionAPI` 文档里还没有它。

**对外 MCP 不拆**：一份 `src/tools.ts` + 两个薄包装入口（MCP 注册给外部客户端，`customTools` 给内嵌 pi）。

### 决策 2b：UI 调服务端 —— ✅ 查询走新增 HTTP，写入复用同一批函数

- **查询类**（变量列表、文档注册表、选区）→ 新增只读 `GET /api/state`，一次聚合，避免前端 N+1 次往返。
- **写入类**（重算 / 重写）→ 调同一批函数（见 §3.6），不新开执行路径。
- 前端**不**直连 `/mcp` 说 JSON-RPC：`/mcp` 是 `sessionIdGenerator: undefined` 的无状态传输（`src/server.ts:374`），前端要自己处理初始化/会话语义，而且拿不到一次性聚合。

⚠️ 未决：变量页那两个按钮具体打哪个端点 —— 独立的 `POST /api/actions`，还是并入会话（让 pi 去调工具）？见 §7。

### 决策 3：写文档不设二次确认 —— ✅ 定案（ADR-0003）

Render 是唯一的破坏性动作（`variable.render` 的注解就是 `destructiveHint: true` + `idempotentHint: false`，且 Render 脚本完全不过只读守卫）。**结论：会话里由 Agent 触发的写入直接执行，不弹确认卡。**

- 否决 A（工具级暂停确认）：SSE 是单向的，挂起工具要再加回执端点 + 超时策略，为一个低频事件引入新控制回路。
- 否决 C（回合级计划确认）：计划的自然语言描述与 Render 代码实际干的事可能不一致，用不可靠信号做安全检查。
- 人点按钮的写入本来就不确认 —— 现在两者在**阻断行为上一致**，只在来源标注上区分。

**这条对协议的影响**：`/api/chat` 的 SSE 是**纯单向流**，不需要任何客户端回执端点。代价转移到别处 —— 工具调用卡必须完整呈现写入事实（目标文档 / 写入位置 / `renderId` / 耗时），**"看得见"是"不拦"的前提**。降级的卡片会让这条决策失去合理性。

---

## 5. 明确不做的（保持简洁的边界）

- ❌ 不引入 React / Vue / Vite / TS 前端构建链，也不用 `pi-web-ui` 组件包（ADR-0002）—— 原型就是最终骨架的形态，拆成 `addon/taskpane.*` 直接托管同源静态文件。
- ❌ 不新增 MCP 工具、不新增"删除 Variable / 删除 Render"（现有设计里本就没有删除接口，UI 也不该成为第一个）。
- ❌ 不在前端复制任何业务逻辑（重算/重写一律回落工具）。
- ❌ 不给 `state.json` 加"可推导"的字段（类型/大小、来源名称都由 `value` 和注册表推导）。
- ❌ 不做选区事件订阅（心跳 2.5s 够用；真嫌慢再加，那时只动 `addon/main.js` 一处）。
- ❌ 不做多会话管理（P0 单会话即可；要持久化再加 `sessions.json`）。
- ❌ 不做 provider CRUD / 模型目录发现 / OAuth / 读写 `models.json`（ADR-0004）—— 一次只要配一个端点，一层表单足够；真出现"多端点切换"的需求再说。
- ❌ 不落盘 pi 的任何全局配置（不碰 `~/.pi/`），也不要求用户装 pi CLI。

---

## 6. 建议分期

| 期 | 内容 | 依赖 |
|---|---|---|
| **P0 骨架** | 领域函数提取 + `/api/state` + `taskpane.html` 变量页 + 任务窗格复用 + ribbon 两个按钮 | 无（不碰 Agent，能立刻用"重算/重写"） |
| **P1 会话** | `config.json` + 设置页（内置 / 自定义端点）+ 内嵌 pi + `/api/chat` + SSE 事件 + `refs` 传参 + 守卫约束注入 + 守卫报错自修复 | 决策 1/2/7/8（已定）→ ADR-0001 / 0004 |
| **P2 闭环** | 执行元数据落盘 + 工具卡写入事实完整化（目标/位置/renderId/耗时）+ 会话里 `@` 引用的实时数据接进 `document.get` | P0/P1 |
| **P3 增强** | 外部 Agent 进度镜像、多会话 | 决策 2c |

---

## 7. 决策状态

| # | 决策点 | 状态 |
|---|---|---|
| 1 | Agent 接法 | ✅ **内嵌 pi SDK**（`@earendil-works/pi-coding-agent`）→ ADR-0001 |
| 2 | 内嵌 pi 的工具挂载 | ✅ **`customTools` 直挂 `src/tools.ts`**，不走 MCP 自连 → ADR-0001 |
| 2b | UI 查询 / 写入怎么到服务端 | ✅ 查询走新增 `GET /api/state`，写入复用同一批函数；❓按钮端点待定 |
| 2c | 变量页按钮走哪条路 | ✅ 独立 `POST /api/actions` → 直接调 `src/tools.ts`，不绕会话（点按钮不该被模型理解一轮） |
| 3 | 前端形态 | ✅ **自研静态页面**（原型拆成 `addon/taskpane.*`），不引入框架/构建链/`pi-web-ui` → ADR-0002 |
| 4 | `sourceRef`（来源区域） | ✅ **加可选入参** `transform.create({ sourceRef? })` → `Transform.sourceRef`，由 Agent 创建时填（如 `"销售数据!A1:B13"`）；`variable.get` / `/api/state` 透传。不复活 `Transform.description` 那个死字段 |
| 5 | 会话历史 | 🟡 交给 pi 的 `SessionManager`（默认落盘），不再自研 `sessions.json` |
| 6 | 写文档二次确认 | ✅ **不确认**（信任 Agent），SSE 保持纯单向 → ADR-0003 |
| 7 | pi 用哪个模型 / 密钥从哪来 | ✅ 模型与密钥都存本机 `config.json`；DeepSeek 是内置 provider，也可注册**任意 OpenAI 兼容端点** → ADR-0004 / §9 |
| 8 | 模型配置页的形态 | ✅ **最简配置页 + 自定义端点**：单表单双模式（内置 / 自定义），字段直落 `config.json`，不做 provider CRUD → §9 |

已落定的决策写进了 `docs/adr/`：`0001-embed-pi-sdk-with-direct-tools.md`、`0002-self-authored-static-ui.md`、`0003-no-confirmation-before-agent-writes.md`、`0004-model-config-in-local-config-json.md`。

---

## 8. 参考：pi-web 的模型配置页（实测）

当时参考了官方在线 demo 真实渲染的 4 张截图。历史截图已从工作区移除，可从清理前的 Git 提交查看；下面保留实测文字说明。

### 8.1 它的位置与壳

配置页是**主界面底部工具栏 →「模型」按钮**打开的一个**模态对话框**，对话框顶部是页签：`常规 / 模型 / 技能 / 子代理 / 插件`。对话框底部右侧一个主按钮「保存」。

页签内是**左右分栏**：左侧是对象树，右侧是选中对象的详情。

### 8.2 左侧树

```
ChatGPT Plus/Pro        （OAuth 登录的服务商）
DeepSeek                （内置服务商，已配 key）
claude-gateway          （自定义服务商，展开后是它的模型）
  claude-opus-5      [开关]
  claude-sonnet-5    [开关]
  claude-haiku-4-5   [开关]
  + 模型
─────────────────────
+ 添加 Provider
```

built-in 服务商是**逐模型开关**；自定义服务商在树里直接列出模型。

### 8.3 右侧详情：三种对象三种页

**① 服务商详情（自定义 provider）** — 顶部 `PROVIDER` 标签 + 右上角〔启用开关〕〔删除〕

| 字段 | 说明 |
|---|---|
| Provider 名称 | 可改名，改名后出现「重命名」按钮 |
| Base URL | `https://api.example.com/v1` |
| API Key | **密码框 + 眼睛切换**；占位符写明三种写法：`ENV_VAR_NAME, !shell-command, or literal key`；帮助文字「Prefix with `!` to run a shell command, or use an env var name」 |
| API | 下拉，默认 `openai-completions`（选项：`openai-completions` / `openai-responses` / `anthropic-messages` / `google-generative-ai`） |
| Headers | 可增删的 key/value 列表；帮助文字「Added to every request from this provider (e.g. User-Agent). Useful for gateways with bot detection.」 |
| — | 〔导入模型…〕按钮：按 Base URL **自动发现**可用模型，带搜索过滤 + 多选（显示上限 300），不必手写模型清单 |

**② API Key 详情（内置 provider）** — 顶部 `API KEY` + 右上角 `● 已登录`〔断开连接〕

- 换 key：`Enter new key to replace...` 密码框 + 眼睛 + 〔保存〕
- **用量**：`API calls / Total balance / Granted balance / Topped-up balance`，右上角"更新于 19:18"。deepseek 这栏显示的是 **CNY 余额（DeepSeek 账户余额 API）**
- **可用模型**：右上角 `已启用 2/2` + 〔全部开启〕〔全部关闭〕〔刷新模型目录〕；每行是 `显示名 / model-id` + 开关

**③ 模型详情（自定义 provider 的模型）** — 顶部 `模型` + 右上角〔测试〕〔移除〕

| 区块 | 字段 |
|---|---|
| — | `ID *` / `Name`（旁边〔填入模型信息〕＋ 来源 `models.dev ↗` 链接） |
| 能力 | ☑ 推理 / 思考　☑ 图片输入 |
| 模型规格 | 上下文窗口（tokens）/ 最大输出 tokens；（右上角〔编辑价格〕） |
| 每百万 TOKENS 价格 | 输入 / 输出 / 缓存读取 / 缓存写入 |
| 高级设置 | API 覆盖下拉（`— 默认 / none —`）、模型级 Headers、**兼容性**、**思考等级映射** |

**高级设置 → 兼容性**里有两条开关，其中第一条直接叫：

- **「DeepSeek 思考兼容」** → 写入 `compat: { thinkingFormat: "deepseek", requiresReasoningContentOnAssistantMessages: true }`
- 「使用 developer role 传递系统提示词」→ `supportsDeveloperRole`

**思考等级映射**是 `off / minimal / low / medium / high / xhigh / max` 七行，每行三态单选 `Default / Disabled / Custom`。

### 8.4 它的存储与语义（读源码 + ADR-0004）

- 服务商/模型清单写在 **`~/.pi/agent/models.json`**（页头副标题直接显示这个路径）
- 启用开关写在 **`~/.pi/agent/settings.json`** 的 `enabledModels`（`--models` 的 minimatch 白名单，可选 `:thinkingLevel` 后缀）；横幅文案就是 `~/.pi/agent/settings.json · enabledModels 20/104`
- 凭据在 `~/.pi/agent/auth.json`
- 浏览器**从不自己拼 pattern**：`/api/models/enabled` 只收意图（`{op:"models"|"provider"|"clear"}`）并返回解析后的视图 —— pattern 语义只存在于 SDK 解析器里
- 它的 ADR-0004 记录了一个可直接引用的实证：**pi 把 `deepseek-v4-flash` 改名成了 `deepseek-flash`**，枚举式白名单因此留下死条目、而新模型仍是关的 —— 这是"写 glob 而不是枚举"的理由

### 8.5 对本项目的取舍（已定案 → §9）

pi-web 这套是**面向 pi 全局配置的完整 CRUD 编辑器**，覆盖三个存储文件、三种对象页、模型发现、用量查询。对 wps-mcp 而言有两点不同：

1. **模型可以不是内置 provider 的。** DeepSeek 官方只需一个 key（`baseUrl`、两个模型、`compat` 都由 `deepseekProvider()` 自带）；但用户也可能指本机的 llama.cpp / vLLM / 内网网关 —— 那条路要手填 `baseUrl`、模型 id、上下文长度、兼容性。两条路都**不需要 models.json**。
2. **wps-mcp 有自己的数据目录**（`%APPDATA%\wps-mcp`，可用 `WPS_MCP_DATA_DIR` 覆盖），与 `~/.pi/` 是两回事；本项目也不该假定用户装了 pi CLI。

所以「参考它的配置页」不等于「照搬它的 CRUD」。真正值得搬的是它的**交互形态**（密码框+眼睛、连接状态徽标、余额/用量、模型开关、兼容性开关的呈现方式）和**分栏壳**，而不是它的数据面。

**定案**：砍到单表单 + 双模式（内置 / 自定义），字段直落本机 `config.json`，provider id 不让用户填 —— 详见 §9。**分栏壳也没搬**：一层字段用不着一棵树。

所以「参考它的配置页」不等于「照搬它的 CRUD」。真正值得搬的是它的**交互形态**（密码框+眼睛、连接状态徽标、余额/用量、模型开关、兼容性开关的呈现方式）和**分栏壳**，而不是它的数据面。

---

## 9. 模型配置页（决策 7 / 8 定案）

### 9.1 一句话

**一个表单，两种模式**：DeepSeek 官方（内置 provider，只填 key）或自定义 OpenAI 兼容端点（llama.cpp / vLLM / Ollama / 内网网关，全字段手填）。配置存本机 `config.json`，服务端启动时读它 → 在内存里注册进 `ModelRuntime` → 起会话。**全程不碰 `~/.pi/`，也不要求装 pi CLI**（ADR-0004）。

原型里已经有这一页：抽屉第三个页签「设置」（`docs/ui-prototype.html`）。

### 9.2 存什么（`%APPDATA%\wps-mcp\config.json`）

```jsonc
{
  "kind": "builtin",                 // "builtin" | "custom"
  "label": "DeepSeek 官方",           // 界面显示名
  "baseUrl": "",                     // kind=custom 时必填
  "api": "openai-completions",       // 多数兼容端点用这个
  "apiKey": "sk-…",
  "model": {
    "id": "deepseek-flash",
    "name": "deepseek-flash",
    "contextWindow": 1000000,
    "maxTokens": 65536,
    "reasoning": true,
    "vision": true
  },
  "compat": { "thinkingFormat": "", "maxTokensField": "" },  // 空 = 按 baseUrl 自动探测
  "headers": {},                     // 额外请求头，可选
  "thinkingLevel": "off"
}
```

- 这个 `model` 结构**就是 pi 的 `Model` 字段本身**，没有中间层 —— 表单里填什么，`registerProvider` 就收到什么。
- `kind=builtin` 时 `model` 由 pi 内置目录填充（界面只读展示，下拉切 `deepseek-flash` / `deepseek-v4-pro`）。
- 密钥明文存本地 —— 与 `state.json` 同级信任级别，不进 git、不上传。
- **provider id 不由用户填**：内置固定 `deepseek`，自定义固定 `wps-custom`。单端点场景不需要多 provider 管理，省掉一整层 CRUD。

### 9.3 接入骨架

```ts
// src/agent.ts
import { ModelRuntime, createAgentSession, SessionManager, SettingsManager }
  from "@earendil-works/pi-coding-agent";

const runtime = await ModelRuntime.create({
  modelsPath: null,           // 不读 ~/.pi/agent/models.json
  allowModelNetwork: false,   // 不联网刷新模型目录
  refreshOnCreate: false,
});

const cfg = readConfig();     // %APPDATA%\wps-mcp\config.json

if (cfg.kind === "builtin") {
  await runtime.setRuntimeApiKey("deepseek", cfg.apiKey);      // 内置 provider 只塞 key
  model = runtime.getModel("deepseek", cfg.model.id);
} else {
  runtime.registerProvider("wps-custom", {                     // 自建端点整条注册
    name: cfg.label,
    baseUrl: cfg.baseUrl,
    apiKey: cfg.apiKey,
    api: cfg.api,
    headers: cfg.headers,
    models: [{
      ...cfg.model,
      input: cfg.model.vision ? ["text", "image"] : ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      compat: cfg.compat,
    }],
  });
  model = runtime.getModel("wps-custom", cfg.model.id);
}

const { session } = await createAgentSession({
  agentDir: path.join(DATA_DIR, "pi"),   // 不碰 ~/.pi/agent
  modelRuntime: runtime,
  model,
  thinkingLevel: cfg.thinkingLevel,
  noTools: "builtin",                    // 关 read/bash/edit/write，保留 customTools
  customTools: buildWpsTools(),          // src/tools.ts 的 8 个
  sessionManager: SessionManager.inMemory(),
  settingsManager: SettingsManager.inMemory({}),
});
```

### 9.4 实测结论（2026-09-29，`pi-coding-agent@0.87.1` / Windows / Node 22.22.2）

| 验证项 | 结果 |
|---|---|
| `ModelRuntime.create({ modelsPath: null })` | ✅ 成功；`getProviders()` 返回 **41** 个内置 provider，未读 models.json |
| 内置 `deepseek-flash` 可见性 | ✅ `api=openai-completions` `ctx=1000000` `baseUrl=https://api.deepseek.com` `reasoning=true` |
| `registerProvider("wps-local", {...})` 注册**全新** provider | ✅ 成功，`getRegisteredProviderIds()` = `["wps-local"]` |
| `getModel("wps-local", "llama-3.1-8b")` | ✅ 返回完整 `Model`，自定义 `ctx=131072` / `maxTokens=8192` / `baseUrl` 全部带回 |
| `createAgentSession({ noTools: "builtin", customTools: [echo] })` | ✅ 成功；**agent 工具清单恰好 `["wps_echo"]`**，read/bash/edit/write 均不在其中 |
| 假 OpenAI 端点跑完整工具回路 | ✅ tool_call → `tool_execution_start` → 工具真的执行 → `tool_execution_end` → 结果回灌 → 第二轮 → `text_delta` → `agent_end`，全程零报错 |

⚠️ 版本差异提醒：官方 `programmatic-usage.md` 里的 `AuthStorage.setRuntimeApiKey()` 在 0.87.1 **不存在**（该方法属于 `ModelRuntime`）；文档也没有 `noTools` 这个字段。**以 `dist/core/*.d.ts` 为准**，别照抄网页文档。

### 9.5 界面形态

原型 `docs/ui-prototype.html` 的设置页已经按这个数据面实现（纯静态、零构建）：

- 顶部「当前生效」摘要（provider / model / 上下文 / 思考等级）+ 会话页模型胶囊实时同步
- 服务商分段：`DeepSeek 官方` ⇄ `自定义 / OpenAI 兼容`
- 连接区：名称、Base URL、API Key（密码框 + 眼睛）
- 模型区：内置模式下拉选模型（上下文/输出/能力只读）；自定义模式手填 ID、显示名、**上下文长度**、**最大输出**、推理/图片开关
- 「高级」折叠：API 协议、**思考格式**（llama.cpp / vLLM / Qwen 各自的思考参数写法）、输出上限字段名、额外 Headers
- 思考等级：`off / minimal / low / medium / high / xhigh / max` 七档
- 测试连接（原型里是模拟往返）+ 保存（写 config.json 并同步会话页胶囊）

对照 pi-web 的配置页（§8）：**搬了交互形态，没搬数据面** —— 没有服务商 CRUD、没有 models.json、没有模型发现、没有 OAuth，字段直接落在自己的 config.json 上。

---

## 附：现状事实索引（核对用）

| 事实 | 位置 |
|---|---|
| Render 已有 `code` 字段 | `src/server.ts:45-50` |
| `variable.get` 未返回 `code` | `src/server.ts:304` |
| 只读守卫只在 query 模式生效 | `src/server.ts:192-193` |
| Render 执行传变量值给代码 | `src/server.ts:341` |
| 静态资源白名单（4 个固定文件名） | `src/server.ts:395-409` |
| WS 消息：register / documents / request / response | `src/server.ts:430-458` |
| Add-in 心跳（2.5s）与执行通道 | `addon/main.js:144-169, 188-193` |
| 任务窗格当前打开 status.html | `addon/main.js:181` |
| ribbon 目前只有一个按钮 | `addon/ribbon.xml:6` |
