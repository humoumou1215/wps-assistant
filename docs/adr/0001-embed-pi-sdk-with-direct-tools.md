---
status: accepted
---

# 内嵌 pi SDK 作为会话引擎，工具直挂不走 MCP

任务窗格的会话页需要一个能把「思考 / 工具调用 / 答复」流式吐出来的 Agent 引擎。决定把 pi 作为库嵌进 `wps-mcp` 进程：用 `@earendil-works/pi-coding-agent@0.87.1`（MIT）的 `createAgentSession()` 起会话，`session.subscribe()` 的事件直接转成 SSE 推给任务窗格；pi 要用的工具用 `customTools` **直挂** `src/tools.ts` 里同一批函数，**不**让内嵌的 pi 反过来通过 HTTP 连自己的 `/mcp`。

## Considered Options

**引擎三选一：**

| | 做法 | 落选理由 |
|---|---|---|
| **A. 内嵌 pi SDK**（选中） | 进程内 `createAgentSession()` | —— |
| B. 自研 tool-calling loop | 自己写循环 + 重试 + 上下文裁剪 | 事件粒度可控，但这些全要自己维护；pi 白送会话持久化、上下文压缩、重试 |
| C. 子进程跑 pi CLI | `pi --rpc` / `--output-format stream-json`，父进程转事件 | 要求跑 `wps-mcp` 的机器装了 pi —— 本机（Windows）没装，pi 在 Mac mini 的容器里；多一层进程生命周期 |

**工具挂载二选一：**

| | 做法 | 落选理由 |
|---|---|---|
| **A. `customTools` 直挂**（选中） | 进程内函数调用，包装 `src/tools.ts` | —— |
| B. MCP 桥接（pi 连回 `127.0.0.1:18766/mcp`） | 天然与外部 MCP 客户端的工具定义一致 | ① 进程内自连，多一跳 HTTP + JSON 序列化；② 连接/重连/超时生命周期要自己管；③ pi 的 MCP 默认把工具收进**一个 proxy 工具**，会话里只看到 `mcp` 一个名字、看不到 `variable.transform` —— 而「看得见 Agent 在调什么」正是这个界面存在的理由；④ `pi.registerMcpServer()` 是 2026-09-29 才进主干的，官方 `ExtensionAPI` 文档还没有它 |

## Consequences

- **多一组重依赖。** `@earendil-works/pi-coding-agent` 直连 20 个包，经 `pi-ai` 传递引入 `@anthropic-ai/sdk` / `openai` / `@google/genai` / `@aws-sdk/client-bedrock-runtime`，以及原生模块 `@silvia-odwyer/photon-node`。这是本项目为「简洁」开的最大一次例外，已知并接受。
  - 附带好处：`pi-ai` 自带 `http-proxy-agent` / `https-proxy-agent`，出站代理（`127.0.0.1:7890`）有官方支持，不用自己塞。
- **必须显式关掉 pi 的默认工具。** pi 默认给模型 `read / write / edit / bash`。用 `createAgentSession({ noTools: "builtin" })` 关掉它们 —— 这个开关的语义是「禁用内置工具，**保留** extension / customTools」，实测确认（见 ADR-0004 的证据段）。**不要**写成 `tools: []`：`tools` 是白名单语义（只启用列出的名字），空数组会把自定义工具一起关掉。
- **8 个工具实现必须抽到 `src/tools.ts`。** MCP 注册、内嵌 pi 的 `customTools`、UI 的动作入口三处都要调同一批函数。这是硬前提而非可选项 —— 否则「能改文档」的入口会分叉，只读守卫与审计随之分叉。
- **对外 MCP 不拆。** 一份 `src/tools.ts`，两个薄包装入口：MCP 注册给外部客户端，`customTools` 给内嵌 pi。不合并成一个。
