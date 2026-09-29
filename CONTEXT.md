# wps-mcp

把 WPS 文档当作数据源与写入目标的 MCP 服务：Agent 通过它把「算出来的值」绑定进文档。

## Language

### 通道与界面

**Add-in**:
运行在 WPS 进程内的加载项，是本服务里唯一能读写文档的执行者。
_Avoid_: 插件端、客户端、frontend

**任务窗格（Task Pane）**:
WPS 里承载本服务界面的右侧停靠面板，本身只是一个网页。
_Avoid_: 侧边栏、抽屉、panel

**会话（Session）**:
用户与助手持续交流的一段上下文。
_Avoid_: 对话、聊天记录

**轮次（Turn）**:
会话中一次「用户发言 → 助手完成响应」的完整过程。
_Avoid_: 回合、消息

### 绑定三件套

**Variable（变量）**:
一个具名的值，是本服务里唯一被持久化追踪的对象。
_Avoid_: 字段、参数、结果

**Transform（变换）**:
属于某个 Variable 的只读脚本，从源文档算出该 Variable 的值。
_Avoid_: 计算、查询、公式

**Render（渲染）**:
属于某个 Variable 的写入脚本，把该 Variable 的值写进目标文档。
_Avoid_: 写入规则、输出、绑定

**重算（Recalculate）**:
执行一个 Variable 的 Transform 的动作。
_Avoid_: 刷新、更新、同步

**重写（Rewrite）**:
执行一个 Variable 的 Render（单条或全部）的动作。
_Avoid_: 渲染、刷新、写入

### 模型与端点

**模型配置（Model Config）**:
本服务用哪个模型、连哪个端点、用什么密钥的那份本机设置（`config.json`）。
_Avoid_: 模型设置、偏好、settings

**内置服务商（Built-in Provider）**:
端点地址、模型清单、兼容性参数都由 pi 自带，用户只需提供密钥的服务商（当前是 DeepSeek）。
_Avoid_: 官方模型、预设

**自定义端点（Custom Endpoint）**:
参数全部由用户填的 OpenAI 兼容服务 —— 本机 llama.cpp / vLLM / Ollama，或内网网关。
_Avoid_: 第三方模型、私有模型

**思考等级（Thinking Level）**:
控制模型推理投入程度的档位：`off / minimal / low / medium / high / xhigh / max`。
_Avoid_: 推理强度、思考深度

### 引用与约束

**选区（Selection）**:
文档中当前被用户选中的区域，可作为引用对象被助手读到。
_Avoid_: 高亮、range、光标

**源区域（Source Ref）**:
Variable 的值取自源文档的哪一块区域。
_Avoid_: 数据源、来源文件

**只读守卫（Read-only Guard）**:
判定一段脚本能否在只读通道执行的规则。
_Avoid_: 沙箱、校验器

## Relationships

- 一个 **Variable** 有且只有一个 **Transform**
- 一个 **Variable** 有零个或多个 **Render**
- 一个 **Transform** 从一个**文档**读出值；一个 **Render** 向一个**文档**写入值
- **重算**作用于 **Transform**；**重写**作用于 **Render**
- **Add-in** 承载 **任务窗格**；**会话**与变量管理都发生在**任务窗格**里
- 一份**模型配置**要么指向一个**内置服务商**，要么指向一个**自定义端点**；**会话**跑在它选定的那个模型上

## Example dialogue

> **用户:** 「把这张表按部门汇总，写到汇报 PPT 第 3 页」
> **助手:** 建一个 **Variable**（部门销售额），**Transform** 从 `销售数据!A1:B13` 算值，再挂一条 **Render** 指向 PPT 第 3 页。
> **用户:** 「下季度数据到了，我要更新」
> **助手:** 源数据变了就**重算**；PPT 那边也要跟着变就连**重写**一起做。

## Flagged ambiguities

- 「重写」曾被读成「重新创建 Render 规则」—— 已定：**重写 = 执行 Render**；创建规则叫「新建 Render」。
- **description 有三个不同含义，不可互换**：`Variable.description` 是语义描述（「已剔除合计行」）；`Render.description` 是写入位置（「第 3 页 ·「销售图」」）；`Transform.description` 是已定义但从未被写入的字段。
- 「文档」既指 WPS 里打开的文件，也指注册表里的条目 —— 讨论时优先说「已注册文档」。
- 「Render」在本项目里是名词（一条规则）；它的动词形式一律说**重写**。
