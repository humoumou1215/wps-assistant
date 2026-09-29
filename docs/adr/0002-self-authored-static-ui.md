---
status: accepted
---

# 任务窗格界面自研静态页面，不引入前端框架与组件包

任务窗格（会话 + 变量管理）用一份手写的 HTML/CSS/JS 静态页面实现，由现有 HTTP 服务同源托管。**不**引入 React / Vue / Vite 之类的框架与构建链，**也不**采用 pi 官方的 `@earendil-works/pi-web-ui` 组件包。`docs/ui-prototype.html`（2062 行：CSS 600 / HTML 134 / JS 1318）拆成 `addon/taskpane.{html,css,js}` 即成品骨架，不重画。

## Considered Options

| | 做法 | 落选理由 |
|---|---|---|
| **A. 自研静态**（选中） | 原型拆分，纯静态、零构建、零运行时依赖 | —— |
| B. 自研 + 只搬 `pi-web-ui` 的 token 层 | 抄它的 `:root` 变量段（shadcn 命名 + `--syntax-*` 色板）替换自研变量名 | 收益只是「命名与上游同源、可 diff」，却引入需要定期跟上游对账的 vendored 片段；而原型的设计语言本来就是从 pi-web 源码手工对齐过的，不差这一层 |
| C. 引入 `pi-web-ui` 组件包 | 直接用官方 `ChatPanel` | ① 入口 `dist/index.js` 是 ESM，**没有 UMD/IIFE**，`<script>` 直引不可行；② peerDeps 要求 `lit@^3.3.1` + `@mariozechner/mini-lit` → **必须上打包器**；③ 依赖里 `xlsx` 指向 `https://cdn.sheetjs.com/...tgz`（非 npm registry），代理/内网环境安装会失败；④ **架构反向**：它的 Agent 跑在浏览器里、API key 存浏览器 IndexedDB、自带 CORS proxy 与 `ApiKeyPromptDialog`，而本项目的 pi 跑在 `wps-mcp` 服务端进程内（必须经 `src/tools.ts` 才能触达 WPS Add-in），页面只消费 SSE —— 适配它等于对着它的核心假设改；⑤ 它自带的 JavaScript REPL 工具在本场景不该存在 |

## Consequences

- **上游界面改版不会自动跟进。** 设计语言靠 `docs/ui-prototype.html` 手工对齐 pi-web；对上游的每一次跟进都是一次显式改动，而不是版本号 +1。
- **`addon/` 保持「拷进去就能跑」的形态**：无 `node_modules`、无打包产物、无 sourcemap。代价是 CSS 600 行与 JS 1300 行要自己维护。
- 这条决策与 ADR-0001（服务端内嵌 pi）是配套的：正因为 Agent 在服务端，界面才只剩「渲染事件 + 触发动作」两件事，手写静态页足够。
