# WPS Assistant

[![CI](https://github.com/humoumou1215/wps-assistant/actions/workflows/ci.yml/badge.svg)](https://github.com/humoumou1215/wps-assistant/actions/workflows/ci.yml)
[![Security](https://github.com/humoumou1215/wps-assistant/actions/workflows/security.yml/badge.svg)](https://github.com/humoumou1215/wps-assistant/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

WPS Assistant 是运行在本机的 WPS AI 助手。可以在 WPS 任务窗格里用自然语言调查当前打开的表格、演示和文字文档，创建可重复执行的数据绑定规则，也可以由外部 MCP 客户端接入。

核心流程是 **Transform → Variable → Render**：Transform 只读提取源文档数据，保存为 JSON 值，再由 Render 写入目标文档。Agent 负责调查、生成或修正规则并验证结果；后续在变量页显式重算和重写，直接执行已保存规则，无需再次请求模型。源数据变化不会自动触发更新。

详细功能、接口和维护流程以唯一规范 [`docs/spec.md`](docs/spec.md) 为准；参与开发见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 当前能力与架构

- 内嵌 pi Agent，支持多会话、上下文压缩、Slash Commands 和会话资源查看。
- 引用文档、当前选区、固定选区、Variable 或 Render；保存本轮实际使用的位置快照。
- 持久化 Variable、一个 Transform 和多个 Render，支持更新规则、重算、重写及删除定义。
- 表格、演示、Writer 的明确位置导航；实际可用性取决于当前 WPS 宿主能力。
- DeepSeek 内置模型目录和自定义 OpenAI 兼容 completions / responses 端点。
- 原生托盘免安装包、本地 MCP 配置引导与接口调试页面。

```text
WPS 任务窗格 → /api/chat → 内嵌 pi Agent ──┐
                                         ├→ 共用十个 wps_* 工具
外部 MCP 客户端 → /mcp 或 stdio ───────────┘
                                                   ↓
                                              WebSocket /ws
                                                   ↓
                                               WPS Add-in
                                                   ↓
                                               WPS JS API
```

服务只监听 `127.0.0.1`，与 WPS 运行在同一台机器。执行按 `documentId` 路由并提供绑定文档对象 `wpsDocument`。免安装版原生托盘负责服务生命周期、注册和页面入口；界面中的 **WPS MCP** 选项卡及 `wps-mcp` 包名/数据目录保留当前内部命名。

## 免安装使用

要求预先安装支持 JS Add-in 的 WPS Office。macOS 解压后运行 `WPS Assistant.app`；Windows 保留完整解压文件夹并运行 `wps-assistant.exe`。包内自带 Node 与生产依赖，无需预装 Node、npm 或 Rust。

首次启动前完全退出 WPS（包括托盘进程）。程序注册 ET / WPP / Writer Add-in 并启动桥接服务，随后重新打开 WPS，在 **WPS MCP** 选项卡打开「助手面板」。在「设置」配置模型、测试连接并保存；已有规则的重算/重写无需模型。

托盘提供助手、变量、模型设置、MCP 调试/配置引导、服务启停、日志和注册修复入口。隔离网络中本地服务与规则可以运行，需要 AI 时模型端点仍须可达。系统要求、升级与签名边界见 [SPEC 免安装桌面程序](docs/spec.md#portable-desktop)。

## 源码开发部署

要求 Node.js **22.19.0 或更高版本**，以及支持 JS Add-in 的 WPS Office。完全退出 WPS 后，在仓库根目录执行：

```bash
# macOS
npm run install:macos
```

```powershell
# Windows
npm run install:windows
```

脚本安装依赖、构建、注册三个宿主 Add-in、启动后台 HTTP 服务并检查资源。更新代码后执行同一命令重新部署，再打开 WPS 验证加载。macOS 使用用户级 LaunchAgent，Windows 使用后台 Node 进程；参数、备份和重启约定见 [SPEC 开发部署](docs/spec.md#development-deployment)。

开发检查与免安装包构建：

```bash
npm ci
npm run check
npm test
# 需对应平台 Rust 和本机编译工具，详见 SPEC
npm run build:portable
```

常规测试使用模拟 Add-in，不代表真实 WPS API 验收。固定报告绑定样例见 [`test/samples/`](test/samples/README.md)，验收要求见 [SPEC](docs/spec.md#live-validation)。工作流与版本发布见 [维护约定](docs/spec.md#automation)。

## 首次使用与规则更新

服务运行且 Add-in 在线后，也可在本机浏览器打开 [助手任务窗格](http://127.0.0.1:18766/addon/taskpane.html)。浏览器页面操作已连接的 WPS 文档，仍需 Add-in 在线。

输入 `@` 引用文档或选区并说明任务；Agent 调查文档、保存 Transform、验证重算值、保存 Render 并执行写入，然后独立回读结果。后续在变量页重算和重写；纠正已有规则时原位更新，保留变量与 Render ID。删除定义保留已写入文档的内容。会话、命令、引用、批量操作、三类文档定位和日志排查见 [SPEC 本机服务与任务窗格](docs/spec.md#runtime-and-taskpane)。

数据默认位于 macOS 的 `~/Library/Application Support/wps-mcp` 或 Windows 的 `%APPDATA%\wps-mcp`，可用 `WPS_MCP_DATA_DIR` 覆盖。模型凭据保存在本机 `config.json`；会话历史可能包含文档数据。存储与日志约定见 [SPEC](docs/spec.md#277-数据目录与持久化)。

## 接入 MCP 客户端

已运行服务可使用 **Streamable HTTP**：名称 `wps-mcp`（可自定义），URL `http://127.0.0.1:18766/mcp`。自定义 `WPS_MCP_PORT` 时使用实际端口。

源码部署和免安装后台服务设置 `WPS_MCP_TRANSPORT=http`。若由客户端使用 stdio 启动 `node <仓库绝对路径>/dist/src/server.js`，保留默认 stdio 传输，并先停止该端口的已有服务；HTTP 桥接和 `/mcp` 仍会启动。客户端需能够访问 WPS 所在机器的本机地址。

服务启动后可打开 [MCP 配置引导](http://127.0.0.1:18766/addon/mcp-guide.html) 和 [MCP 接口调试](http://127.0.0.1:18766/addon/mcp-debug.html)，也可从设置、连接状态页或托盘进入。前者提供 Codex、Claude Code、WorkBuddy 的配置和验证步骤；后者调用真实 `/mcp`，执行 `wps_run_render` 会修改文档。说明和验证边界见 [SPEC](docs/spec.md#local-mcp-pages)。

十个 `wps_*` 工具供内嵌 Agent 和外部 MCP 共用，完整参数见 [SPEC 工具定义](docs/spec.md#22-当前-mcp-tool-定义)。`create` / `update` 保存定义，`run` 执行规则；WPS API 不在 MCP 层重复封装，具体使用参考 [`skills/wps-api/`](skills/wps-api/SKILL.md)。

## 当前边界

只读查询和 Transform 使用静态语法守卫，文档修改通过 Render；守卫及文档 ID/位置描述均不构成 JavaScript 权限沙箱，只运行可信代码。Render 可能部分成功，已完成写入不自动回滚；Agent 须在写入后独立回读，原生图表必须核实当前宿主可写路径。当前不提供自动同步、Undo/Redo、规则版本管理或复杂依赖图，详见 [SPEC](docs/spec.md#21-当前不做的内容)。

代码目录导航见 [SPEC 目录职责](docs/spec.md#repository-layout)。
