---
status: accepted
---

# 模型配置落在本机 config.json，用 ModelRuntime 在内存里注册 provider

会话需要一个 LLM。它不一定是 DeepSeek 官方 —— 也可能是本机的 llama.cpp / vLLM / Ollama，或内网的 OpenAI 兼容网关。决定：**模型配置（provider、baseUrl、密钥、模型参数、思考等级）单独存 `%APPDATA%\wps-mcp\config.json`**（`WPS_MCP_DATA_DIR` 可覆盖），服务端启动时用 `ModelRuntime.create({ modelsPath: null })` 建一个不落盘的模型运行时，再 `registerProvider()` 把用户填的端点注册进去，最后 `createAgentSession({ modelRuntime, model, noTools: "builtin" })`。

**不读也不写 `~/.pi/agent/`**（`models.json` / `settings.json` / `auth.json`），也**不要求用户装 pi CLI**。

## Considered Options

| | 做法 | 落选理由 |
|---|---|---|
| **A. 本机 config.json + 内存注册**（选中） | `ModelRuntime.create({modelsPath:null})` + `registerProvider()` | —— |
| B. 照搬 pi-web 的分栏编辑器 | 直接读写 `~/.pi/agent/models.json` + `settings.json` + `auth.json` | ① 耦合到 pi 的全局配置格式，pi 升版即漂移；② 与本项目既有的「数据都在 `%APPDATA%\wps-mcp`」冲突；③ 等于要求用户装了 pi（哪怕只是配置文件层面），而 `wps-mcp` 的定位是独立服务 |
| C. 只认环境变量 | `DEEPSEEK_API_KEY` 之类 | 非技术用户无法在界面里切换模型/端点；且无法配置本地推理端点（没有对应的约定环境变量） |

## Consequences

- **pi 的模型目录用不上，也不需要。** `modelsPath: null` + `allowModelNetwork: false` 之后，41 个内置 provider（含 `deepseek`）仍在，但 pi 的「联网刷新模型目录」「models.json 覆盖」两条路径被关掉。对本地推理模型（llama.cpp / vLLM 自建）本来就没有可用目录，这条损失为零。
- **provider id 固定为 `wps-custom`。** 单端点场景不需要多 provider 管理；用户在界面里改的是 `label`（显示名）而不是 id。省掉一整层「provider CRUD」。
- **密钥以明文存在本地 config.json 里。** 与 `state.json` 同级的信任级别（仅本机、不进 git）。界面里用密码框 + 眼睛，不显示明文回显。
- **表单字段直接对应 `ProviderConfigInput.models[]`。** 上下文长度 / 最大输出 / 推理 / 图片输入 / 兼容性这些字段不是一个自造的数据模型，而是 pi 的 `Model` 结构本身，没有转换层。
- **`agentDir` 必须显式指到数据目录。** 默认是 `~/.pi/agent`；不覆盖的话 pi 仍会去那儿找 extensions / skills / prompts，隔离就不彻底。
- **实测证据（2026-09-29，`pi-coding-agent@0.87.1`，Windows / Node 22.22.2）：**
  - `ModelRuntime.create({ modelsPath: null, allowModelNetwork: false, refreshOnCreate: false })` → 成功，`getProviders()` 返回 41 个内置 provider。
  - `registerProvider("wps-local", { baseUrl, apiKey, api, models: [...] })` → 全新 provider 注册成功，`getRegisteredProviderIds()` 返回 `["wps-local"]`。
  - `getModel("wps-local", "llama-3.1-8b")` → 返回完整 `Model`，自定义的 `contextWindow: 131072` / `maxTokens: 8192` / `baseUrl` 全部带回。
  - `createAgentSession({ modelRuntime, model, noTools: "builtin", customTools: [echo] })` → 会话创建成功，**agent 的工具清单恰好是 `["wps_echo"]`**，`read / bash / edit / write` 均不在其中。
  - 挂一个假的 OpenAI 兼容端点跑完整回路：模型返回 tool_call → `tool_execution_start` → 工具真的被执行 → `tool_execution_end` → 结果回灌第二轮 → `text_delta` → `agent_end`。全程无报错。
