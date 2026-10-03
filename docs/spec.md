# WPS Report Assistant MCP Server SPEC

本文汇总工具规范、已采纳的架构决策、仓库维护流程和项目术语。

- 工具规范与数据模型：第 1–23 章。
- [架构决策](#architecture-decisions)：第 24 章，包含 ADR-0001 至 ADR-0004。
- [仓库与自动化维护](#automation)：第 25 章，包含 CI、安全检查、开发部署和真实 WPS 验收。
- [免安装桌面程序](#portable-desktop)：第 25.6 节，包含原生托盘、首次注册、离线资源和构建。
- [本地 MCP 调试与配置引导](#local-mcp-pages)：第 25.5 节，包含页面入口、客户端配置和验证边界。
- [项目术语与关系](#project-context)：第 26 章，包含命名约定、关系约束、对话示例和易混淆含义。

## 1. 目标

实现一个 MCP Server，使 Agent 能够通过自然语言完成以下工作：

1. 查询当前可操作的 WPS 文档。
2. 查询指定 WPS 文档中的内容和结构。
3. 创建变量的 `transform` 规则。
4. 创建变量的 `render` 规则。
5. 执行 `transform`，从源文档中提取变量。
6. 执行 `render`，将变量写入目标文档。

整体数据流：

```text
用户自然语言
    ↓
Agent
    ↓
MCP Server
    ↓
WPS Add-in
    ↓
WPS JS API
```

绑定关系：

```text
Variable
├── Transform
│   └── 从 WPS 文档读取数据
│
└── Render
    └── 将 Variable.value 写入目标 WPS 文档
```

Agent 负责创建规则。

规则创建完成之后，正常的数据同步过程不需要 Agent 参与：

```text
源文档变化
    ↓
执行 Transform
    ↓
Variable.value 更新
    ↓
执行 Render
    ↓
目标文档更新
```

---

# 2. 核心原则

## 2.1 MCP 不重复封装 WPS API

不设计：

```text
getRange()
getCell()
getChart()
setText()
setChartData()
```

之类大量 MCP Tool。

Agent 直接生成 WPS JS API 代码。

MCP Server 只负责：

```text
代码保存
代码执行
文档路由
Variable 管理
Transform 管理
Render 管理
```

---

## 2.2 查询与修改分离

所有文档查询通过：

```text
wps_run_readonly_code
```

执行。

`wps_run_readonly_code` 原则上只允许查询。

所有修改文档的操作必须通过：

```text
wps_run_render
```

执行。

即：

```text
wps_run_readonly_code
    → 查询

transform
    → 查询 / 计算

render
    → 修改文档
```

---

# 3. 系统结构

```text
┌─────────────────────┐
│        Agent        │
└──────────┬──────────┘
           │
           │ MCP
           ▼
┌─────────────────────┐
│     MCP Server      │
│                     │
│ Document Registry   │
│ Variable Store      │
│ Transform Store     │
│ Render Store        │
└──────────┬──────────┘
           │
           │ WebSocket / RPC
           ▼
┌─────────────────────┐
│     WPS Add-in      │
│                     │
│   WPS JS API        │
└─────────────────────┘
```

一个 MCP Server 可以同时连接多个 WPS Add-in 实例。

例如：

```text
MCP Server

├── Excel Add-in
│   ├── 销售数据.xlsx
│   └── 成本数据.xlsx
│
└── PPT Add-in
    └── 经营汇报.pptx
```

MCP Server 必须维护当前可操作文档列表。

---

# 4. MCP Tools

当前提供 10 个 Tool（在第一版 8 个工具上增加规则更新）：

```text
Workspace
└── wps_list_documents

Document
├── wps_get_document
└── wps_run_readonly_code

Definition
├── wps_create_variable
├── wps_update_variable
├── wps_create_render
└── wps_update_render

Variable
├── wps_get_variable
├── wps_run_transform
└── wps_run_render
```

## 已有规则的更新

| 工具 | 必填参数 | 可更新字段 |
| --- | --- | --- |
| `wps_update_variable` | `variableId` | `variableName`、`description`（变量描述）、`sourceDocumentId`、`sourceRef`、`code` |
| `wps_update_render` | `variableId`、`renderId` | `targetDocumentId`、`targetRef`（写入区域）、`description`、`code` |

至少提供一个更新字段；省略字段保持原值，`description`、`sourceRef` 和 `targetRef` 可用 `null` 清除。更新保留变量 ID、规则 ID 和其他 Render 绑定，只保存定义，不执行 WPS 代码；同一变量的更新、执行与面板删除串行处理，保存失败保留原定义。

Transform 的代码、来源文档或源区域变化会清除旧值（`hasValue=false`）及上次重算时间，必须先 `wps_run_transform` 重算才能重写。只修改名称或变量描述保留当前值。Render 的代码、目标或位置描述变化会清除该 Render 的上次执行时间，之后用明确 `renderId` 调用 `wps_run_render`；已有文档内容不会自动撤销或清除。

纠正规则前通过 `wps_get_variable` 读取完整定义。其响应包含 `hasValue`、Transform/Render 的 `code` 和可选 `lastRun`；无有效值时省略 `value`。保留原文档绑定的更新可离线保存；显式指定来源或目标文档时验证其在线状态。

---

# 5. wps_list_documents

## 5.1 用途

查询当前 MCP Server 已连接、Agent 可以访问的所有 WPS 文档。

这是 Agent 开始任务后通常首先调用的接口。

## 5.2 Request

无参数。

```json
{}
```

## 5.3 Response

```json
{
  "documents": [
    {
      "documentId": "doc_excel_001",
      "type": "spreadsheet",
      "name": "销售数据.xlsx",
      "path": "D:\\report\\销售数据.xlsx",
      "connected": true
    },
    {
      "documentId": "doc_ppt_001",
      "type": "presentation",
      "name": "经营汇报.pptx",
      "path": "D:\\report\\经营汇报.pptx",
      "connected": true
    }
  ]
}
```

## 5.4 字段

```ts
interface DocumentSummary {
  documentId: string;

  type:
    | "spreadsheet"
    | "presentation"
    | "writer";

  name: string;

  path?: string;

  connected: boolean;
}
```

`documentId` 由 MCP Server 分配。

Agent 后续所有文档操作都应该使用 `documentId`，不能依赖文件名作为唯一标识。

---

# 6. wps_get_document

## 6.1 用途

查询一个文档的基础状态。

主要用于 Agent 获取：

```text
文档类型
文档名称
当前 Sheet / Slide
当前选区
```

## 6.2 Request

```json
{
  "documentId": "doc_excel_001"
}
```

## 6.3 Spreadsheet Response 示例

```json
{
  "documentId": "doc_excel_001",
  "type": "spreadsheet",
  "name": "销售数据.xlsx",
  "path": "D:\\report\\销售数据.xlsx",

  "activeSheet": "销售数据",

  "selection": {
    "sheet": "销售数据",
    "address": "A1:B10"
  }
}
```

## 6.4 Presentation Response 示例

```json
{
  "documentId": "doc_ppt_001",
  "type": "presentation",
  "name": "经营汇报.pptx",
  "path": "D:\\report\\经营汇报.pptx",

  "activeSlide": 3,

  "selection": {
    "type": "shape",
    "shapeNames": [
      "销售图"
    ]
  }
}
```

---

# 7. wps_run_readonly_code

## 7.1 用途

让 Agent 在指定 WPS 文档中执行查询代码。

Agent 直接编写 WPS JS API。

主要用于调查：

```text
Workbook
Worksheet
Range

Presentation
Slide
Shape
Chart

Writer Document

当前选区
格式
文本
数据
对象结构
```

## 7.2 Request

```ts
interface WpsExecRequest {
  documentId: string;
  code: string;
}
```

示例：

```json
{
  "documentId": "doc_excel_001",
  "code": "const sheet = wpsDocument.Worksheets.Item('销售数据'); return sheet.Range('A1:B10').Value2;"
}
```

## 7.3 Response

成功：

```json
{
  "success": true,
  "result": [
    ["部门", "销售额"],
    ["华东", 120000],
    ["华南", 98000]
  ]
}
```

失败：

```json
{
  "success": false,
  "error": {
    "code": "WPS_EXEC_ERROR",
    "message": "Worksheet 销售数据 does not exist"
  }
}
```

## 7.4 约束

`wps_run_readonly_code` 第一版只用于查询。

不允许 Agent 通过 `wps_run_readonly_code` 修改文档。

例如以下行为应该禁止：

```js
range.Value2 = ...
shape.TextFrame.TextRange.Text = ...
shape.Delete()
slide.Shapes.Add...
```

文档修改统一通过 Render。

### 7.4.1 违规报告策略

静态检查一次列出**全部**违规，而不是遇到第一处就抛出。报文给出总数，并逐条带 `kind`、行列号、源码行、成因与可行改写；同一份结构化数据同时挂在错误的 `details.violations` 上。

这是刻意设计：`wps_run_readonly_code` 的失败信息是 Agent 修正代码的**唯一依据**，一次只报一处会把一次修正拆成多轮往返（"改一处 → 报一处 → 再改一处"）。实现上由 `analyzeReadOnlyCode()` 收集全部违规、`assertReadOnlyCode()` 统一抛出。

### 7.4.2 判据的单一来源

检查逻辑集中在 `src/readonly-guard.ts`，由 `src/tools.ts` 的查询、变量创建/更新和 Transform 执行路径自动调用。内嵌 Agent 没有终端或通用本机文件读取工具，不依赖其他技能或离线检查脚本；`read` 只读取已安装技能文本。Agent 根据工具返回的一次性全部违规修正代码，不能用拼接成员名绕过拒绝。CI 直接测试同一套判据，避免散落副本静默过时。

检查是纯语法层面的，**按节点类型与属性名匹配，不区分文档对象与本地对象**：

- 成员赋值一律拒绝，与属性名无关（`o.a = 1` 与 `Range('A1').Value2 = 1` 同一条规则）；
- 方法黑名单按属性名匹配，因此在本地普通对象上使用同名属性（`copy`、`sort`、`replace`）同样被拒绝；
- `new` 一律拒绝，`new Date()`、`new Map()` 也不例外。

---

# 8. wps_create_variable

## 8.1 用途

创建一个 Variable 和它对应的 Transform。

Transform 是一段 WPS JS API JavaScript。

它的职责：

```text
读取源 WPS 文档
        ↓
计算 / 整理数据
        ↓
return 可序列化结果
        ↓
保存到 Variable.value
```

## 8.2 Request

```ts
interface TransformCreateRequest {
  variableName: string;

  description?: string;

  sourceDocumentId: string;

  code: string;
}
```

示例：

```json
{
  "variableName": "部门销售额",
  "description": "读取销售数据工作表中的部门和销售额",
  "sourceDocumentId": "doc_excel_001",
  "code": "const sheet = wpsDocument.Worksheets.Item('销售数据'); const rows = sheet.Range('A2:B100').Value2; return rows.filter(row => row[0]).map(row => ({ department: String(row[0]), sales: Number(row[1]) }));"
}
```

## 8.3 Response

```json
{
  "success": true,
  "variableId": "var_001",
  "transformId": "transform_001"
}
```

## 8.4 注意

`wps_create_variable`：

```text
只创建规则
不执行规则
```

创建完成后 Agent 应调用：

```text
wps_run_transform
```

验证 Transform 是否正确。

---

# 9. wps_create_render

## 9.1 用途

给 Variable 创建一个 Render。

Render 是一段 JavaScript。

Render 可以访问：

```js
variable
```

其中：

```js
variable.value
```

就是 Transform 最近一次执行得到的数据。

## 9.2 Request

```ts
interface RenderCreateRequest {
  variableId: string;

  targetDocumentId: string;

  description?: string;

  code: string;
}
```

例如：

```json
{
  "variableId": "var_001",
  "targetDocumentId": "doc_ppt_001",
  "description": "将部门销售额更新到第3页销售图",
  "code": "const data = variable.value; const slide = wpsDocument.Slides.Item(3); const chart = slide.Shapes.Item('销售图').Chart; /* update chart */ return { updated: true };"
}
```

## 9.3 Response

```json
{
  "success": true,
  "renderId": "render_001"
}
```

## 9.4 注意

`wps_create_render`：

```text
只保存 Render
不实际修改 WPS 文档
```

需要调用：

```text
wps_run_render
```

才真正执行。

---

# 10. wps_get_variable

## 10.1 用途

查询 Variable 当前状态。

## 10.2 Request

```json
{
  "variableId": "var_001"
}
```

## 10.3 Response

```json
{
  "variableId": "var_001",

  "name": "部门销售额",

  "value": [
    {
      "department": "华东",
      "sales": 120000
    },
    {
      "department": "华南",
      "sales": 98000
    }
  ],

  "transform": {
    "transformId": "transform_001",
    "sourceDocumentId": "doc_excel_001",
    "description": "读取销售数据工作表中的部门销售额"
  },

  "renders": [
    {
      "renderId": "render_001",
      "targetDocumentId": "doc_ppt_001",
      "description": "更新第3页销售图"
    }
  ]
}
```

---

# 11. wps_run_transform

## 11.1 用途

执行 Variable 的 Transform。

流程：

```text
wps_run_transform(var_001)

        ↓

查找 var_001

        ↓

取得 transform_001

        ↓

找到 sourceDocumentId

        ↓

找到对应 WPS Add-in

        ↓

执行 transform.code

        ↓

取得 return value

        ↓

保存 variable.value
```

## 11.2 Request

```json
{
  "variableId": "var_001"
}
```

## 11.3 Response

```json
{
  "success": true,

  "variableId": "var_001",

  "value": [
    {
      "department": "华东",
      "sales": 120000
    },
    {
      "department": "华南",
      "sales": 98000
    }
  ]
}
```

失败：

```json
{
  "success": false,
  "error": {
    "code": "TRANSFORM_EXECUTION_ERROR",
    "message": "Cannot read property Value2"
  }
}
```

---

# 12. wps_run_render

## 12.1 用途

执行 Variable 的 Render，将 Variable 当前值写入目标 WPS 文档。

## 12.2 Request

支持执行指定 Render：

```json
{
  "variableId": "var_001",
  "renderId": "render_001"
}
```

也可以执行 Variable 的所有 Render：

```json
{
  "variableId": "var_001"
}
```

## 12.3 执行环境

查询、Transform、Render 统一提供 `wpsDocument`：Add-in 根据 MCP Server 从 `documentId` 得到的注册 `documentKey`，在 Workbooks/Presentations/Documents 中解析原生文档对象。查询对应请求文档，Transform 对应绑定源文档，Render 对应绑定目标文档。每次执行重新解析，不自动激活文档或改变选区；找不到匹配对象时失败，不回退到另一个活动文档。

新代码优先从 `wpsDocument` 访问 Worksheets/Slides/Content/Range/Tables。Application 和 wps 仍用于宿主 API 并兼容旧规则，但 ActiveWorkbook/ActivePresentation/ActiveDocument/ActiveSheet/Selection 不保证属于绑定文档；旧规则若仍依赖活动对象，应原位更新代码。选区内容按引用快照中的明确坐标从绑定对象读取。`wpsDocument` 是执行上下文参数，不新增工具参数或持久化字段，也不是限制代码访问其他文档的沙箱。

Render 执行时必须提供：

```js
variable
```

例如：

```js
variable = {
  id: "var_001",

  name: "部门销售额",

  value: [
    {
      department: "华东",
      sales: 120000
    }
  ]
}
```

Render Code：

```js
const data = variable.value;

const slide =
  wpsDocument
    .Slides.Item(3);

const shape =
  slide.Shapes.Item("销售图");

// 使用 WPS JS API 更新图表

return {
  updated: true,
  count: data.length
};
```

## 12.4 Response

```json
{
  "success": true,

  "variableId": "var_001",

  "renders": [
    {
      "renderId": "render_001",
      "success": true,
      "result": {
        "updated": true,
        "count": 3
      }
    }
  ]
}
```

---

# 13. Variable 数据模型

```ts
interface Variable {
  id: string;

  name: string;

  description?: string;

  value?: unknown;

  transform: Transform;

  renders: Render[];
}
```

---

# 14. Transform 数据模型

```ts
interface Transform {
  id: string;

  variableId: string;

  sourceDocumentId: string;

  description?: string;

  code: string;
}
```

一个 Variable 第一版只有一个 Transform。

---

# 15. Render 数据模型

```ts
interface Render {
  id: string;

  variableId: string;

  targetDocumentId: string;

  description?: string;

  code: string;
}
```

一个 Variable 可以有多个 Render：

```text
Variable
    │
    ├── Render → PPT 第3页图表
    │
    ├── Render → PPT 第7页文本
    │
    └── Render → Excel 汇总表
```

---

# 16. Document Registry

MCP Server 必须维护当前连接的 WPS 文档。

Add-in 连接 MCP Server 后注册自身。

例如：

```json
{
  "hostType": "spreadsheet",

  "documents": [
    {
      "name": "销售数据.xlsx",
      "path": "D:\\report\\销售数据.xlsx"
    }
  ]
}
```

MCP Server 为文档生成：

```text
doc_excel_001
```

Document Registry 至少保存：

```ts
interface RegisteredDocument {
  documentId: string;

  type:
    | "spreadsheet"
    | "presentation"
    | "writer";

  name: string;

  path?: string;

  connectionId: string;

  connected: boolean;
}
```

---

# 17. MCP Server 与 Add-in 的关系

Agent 不直接连接 Add-in。

统一经过：

```text
Agent
  ↓
MCP
  ↓
MCP Server
  ↓
根据 documentId 找 connectionId
  ↓
Add-in
  ↓
WPS JS API
```

例如：

```text
wps_run_readonly_code(
    documentId = doc_excel_001
)

MCP Server

doc_excel_001
    ↓
connectionId = conn_123
    ↓
Excel Add-in
    ↓
执行代码
```

---

# 18. Agent 标准工作流程

内嵌助手的系统提示词保留文档身份、选区快照、读写边界、规则生命周期和交付要求；宿主操作细节放在内置 `wps-api` 技能中。任务匹配技能时先读取 `SKILL.md`，再按触发条件读取表格、演示、文字、选区或报告绑定参考资料；历史 API 目录只按所需成员查阅。本轮已核实的文档、定义和值可以复用，查询只返回决策和验收需要的字段。

变量按业务含义命名、按独立重算口径拆分；Transform 保留具名业务值、来源、筛选、单位与可核对汇总，Render 负责目标映射与展示格式，描述写清页码、对象和用途。规则代码使用可读命名、正常换行和集中目标映射。纠正已有规则时读取完整定义，update 原变量或 Render，保留 ID 与其他绑定；先验证重算值，再重写并独立读回关键结果。保存定义与执行写入分别报告。源数据变化不触发后台重写，由用户明确触发对原规则重算、重写。

报告模板绑定先核实每个目标的来源和口径；按表头识别源字段及有效记录，表格增减行列时处理过期内容并保留样式，优先更新原对象和稳定 ID。宿主增删操作使用有限循环，每次重新取得对象并验证计数变化；重复重写检查内容、布局与对象数一致。原生图表必须读回类别和值，赋值返回成功或成员可见不代表更新完成；缺少已验证的写入路径时报告阻塞，不用其他对象冒充图表更新。具体宿主指引见 `skills/wps-api/references/report-sync.md`。

复杂任务开始简述目标，阶段结果、关键假设或阻塞时更新；仅集中询问无法从文档确定且会改变结果的问题。交付简述完成内容、关键验证结果、再次重算与重写的操作及未完成项；代码和内部 ID 默认保留在工具记录，排错或核对规则时再展示。技能指引不构成跨平台 API 兼容性保证，实际支持须在当前宿主核实。

假设用户输入：

> 把销售数据.xlsx中的各部门销售额更新到经营汇报.pptx第3页的销售图中。

Agent 应执行：

## Step 1

查询当前文档：

```text
wps_list_documents()
```

得到：

```text
doc_excel_001 → 销售数据.xlsx
doc_ppt_001   → 经营汇报.pptx
```

## Step 2

查询 Excel：

```text
wps_run_readonly_code(
    documentId = doc_excel_001
)
```

Agent 查看：

```text
Sheet
UsedRange
表头
数据结构
```

确定：

```text
销售数据!A:B

部门 | 销售额
```

## Step 3

查询 PPT：

```text
wps_run_readonly_code(
    documentId = doc_ppt_001
)
```

检查：

```text
Slide 3
Shapes
Chart
Shape.Name
```

确定：

```text
Slide 3
└── Shape: 销售图
```

## Step 4

创建 Variable + Transform：

```text
wps_create_variable(...)
```

得到：

```text
variableId = var_001
```

## Step 5

立即执行：

```text
wps_run_transform(var_001)
```

确认得到：

```json
[
  {
    "department": "华东",
    "sales": 120000
  },
  {
    "department": "华南",
    "sales": 98000
  }
]
```

如果结果不正确：

```text
Agent 读取完整定义后用 wps_update_variable 修改原 Transform，再重算验证
```

## Step 6

创建 Render：

```text
wps_create_render(...)
```

得到：

```text
render_001
```

## Step 7

执行：

```text
wps_run_render(
    var_001,
    render_001
)
```

PPT 被更新。

最终保存：

```text
var_001
│
├── Transform
│     └── 销售数据.xlsx
│
└── Render
      └── 经营汇报.pptx / Slide 3 / 销售图
```

---

# 19. @当前选区处理

例如用户输入：

> 把 @当前选区 的数据做成 PPT 第3页的柱状图。

UI 将引用信息提交给 Agent 时，应携带：

```json
{
  "type": "selection",
  "documentId": "doc_excel_001",
  "documentType": "spreadsheet",
  "sheet": "销售数据",
  "address": "A1:B10"
}
```

Agent 不需要自己猜“当前选区”属于哪个 WPS 实例。

Agent 可以继续通过：

```text
wps_run_readonly_code(doc_excel_001, ...)
```

调查该区域。

---

# 20. 错误响应统一格式

所有 Tool 失败建议统一：

```json
{
  "success": false,

  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",

    "details": {}
  }
}
```

第一版建议至少支持：

```text
DOCUMENT_NOT_FOUND
DOCUMENT_DISCONNECTED
WPS_EXEC_ERROR

VARIABLE_NOT_FOUND

TRANSFORM_NOT_FOUND
TRANSFORM_EXECUTION_ERROR

RENDER_NOT_FOUND
RENDER_EXECUTION_ERROR

INVALID_REQUEST
```

---

# 21. 第一版不做的内容

为了避免第一版复杂化，以下内容暂时不实现：

```text
Undo / Redo

Transform 版本管理

Render 版本管理

复杂依赖图

Variable 自动依赖计算

定时任务

自动监听文件变化

复杂权限系统

沙箱系统

复杂 MCP API 封装

Render Timeline

多用户协同
```

第一阶段先保证：

```text
Agent 能找到文档
        ↓
Agent 能调查文档
        ↓
Agent 能创建 Transform
        ↓
Transform 能正确执行
        ↓
Agent 能创建 Render
        ↓
Render 能正确执行
```

---

# 22. 第一版 MCP Tool 最终定义

最终只需要：

```text
wps_list_documents()

wps_get_document(
    documentId
)

wps_run_readonly_code(
    documentId,
    code
)

wps_create_variable(
    variableName,
    description,
    sourceDocumentId,
    code
)

wps_create_render(
    variableId,
    targetDocumentId,
    description,
    code
)

wps_update_variable(
    variableId,
    variableName?,
    description?,
    sourceDocumentId?,
    sourceRef?,
    code?
)

wps_update_render(
    variableId,
    renderId,
    targetDocumentId?,
    targetRef?,
    description?,
    code?
)

wps_get_variable(
    variableId
)

wps_run_transform(
    variableId
)

wps_run_render(
    variableId,
    renderId?
)
```

---

# 23. 最重要的实现约束

Agent 可以自由使用 WPS JS API，但必须遵守三个边界：

```text
1. wps_run_readonly_code
   只能调查文档。

2. transform
   只能读取文档并产生 Variable.value。

3. render
   是唯一允许修改 WPS 文档的规则。
```

因此：

```text
                查询
Agent ─────────────────→ wps_run_readonly_code
  │
  │ 创建规则
  ├────────────────────→ wps_create_variable
  │
  └────────────────────→ wps_create_render


                 运行阶段

源 WPS
   │
   │ transform
   ▼
Variable.value
   │
   │ render
   ▼
目标 WPS
```

MCP Server 的核心定位不是重新实现 WPS API，而是：

> **为 Agent 提供 WPS 文档发现、代码执行、Variable、Transform 和 Render 的生命周期管理能力。**

WPS 的具体文档操作能力继续由 WPS JS API 提供。

---

<a id="architecture-decisions"></a>

# 24. 架构决策

以下四项决策均已采纳。方案比较中的版本、环境、依赖数量和早期工具名称保留决策时的记录；当前工具定义见第 4 章，运行行为以当前代码为准。早期名称 `variable.render` 对应当前工具 `wps_run_render`。

<a id="adr-0001"></a>

## 24.1 ADR-0001：内嵌 pi SDK 作为会话引擎，工具直挂不走 MCP

状态：已采纳。

任务窗格的会话页需要一个能把「思考 / 工具调用 / 答复」流式吐出来的 Agent 引擎。决定把 pi 作为库嵌进 `wps-mcp` 进程：用 `@earendil-works/pi-coding-agent@0.87.1`（MIT）的 `createAgentSession()` 起会话，`session.subscribe()` 的事件直接转成 SSE 推给任务窗格；pi 要用的工具用 `customTools` **直挂** `src/tools.ts` 里同一批函数，**不**让内嵌的 pi 反过来通过 HTTP 连自己的 `/mcp`。

### 24.1.1 方案比较

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

### 24.1.2 影响与约束

- **多一组重依赖。** `@earendil-works/pi-coding-agent` 直连 20 个包，经 `pi-ai` 传递引入 `@anthropic-ai/sdk` / `openai` / `@google/genai` / `@aws-sdk/client-bedrock-runtime`，以及原生模块 `@silvia-odwyer/photon-node`。这是本项目为「简洁」开的最大一次例外，已知并接受。
  - 附带好处：`pi-ai` 自带 `http-proxy-agent` / `https-proxy-agent`，出站代理（`127.0.0.1:7890`）有官方支持，不用自己塞。
- **必须显式关掉 pi 的默认工具。** pi 默认给模型 `read / write / edit / bash`。用 `createAgentSession({ noTools: "builtin" })` 关掉它们 —— 这个开关的语义是「禁用内置工具，**保留** extension / customTools」，实测确认（见 [ADR-0004 的实测证据](#adr-0004)）。**不要**写成 `tools: []`：`tools` 是白名单语义（只启用列出的名字），空数组会把自定义工具一起关掉。
- **8 个工具实现必须抽到 `src/tools.ts`。** MCP 注册、内嵌 pi 的 `customTools`、UI 的动作入口三处都要调同一批函数。这是硬前提而非可选项 —— 否则「能改文档」的入口会分叉，只读守卫与审计随之分叉。
- **对外 MCP 不拆。** 一份 `src/tools.ts`，两个薄包装入口：MCP 注册给外部客户端，`customTools` 给内嵌 pi。不合并成一个。

<a id="adr-0002"></a>

## 24.2 ADR-0002：任务窗格界面自研静态页面，不引入前端框架与组件包

状态：已采纳。

任务窗格（会话 + 变量管理）用一份手写的 HTML/CSS/JS 静态页面实现，由现有 HTTP 服务同源托管。**不**引入 React / Vue / Vite 之类的框架与构建链，**也不**采用 pi 官方的 `@earendil-works/pi-web-ui` 组件包。最初的静态原型拆成 `addon/taskpane.{html,css,js}` 作为成品骨架，不重画。

### 24.2.1 方案比较

| | 做法 | 落选理由 |
|---|---|---|
| **A. 自研静态**（选中） | 原型拆分，纯静态、零构建、零运行时依赖 | —— |
| B. 自研 + 只搬 `pi-web-ui` 的 token 层 | 抄它的 `:root` 变量段（shadcn 命名 + `--syntax-*` 色板）替换自研变量名 | 收益只是「命名与上游同源、可 diff」，却引入需要定期跟上游对账的 vendored 片段；而原型的设计语言本来就是从 pi-web 源码手工对齐过的，不差这一层 |
| C. 引入 `pi-web-ui` 组件包 | 直接用官方 `ChatPanel` | ① 入口 `dist/index.js` 是 ESM，**没有 UMD/IIFE**，`<script>` 直引不可行；② peerDeps 要求 `lit@^3.3.1` + `@mariozechner/mini-lit` → **必须上打包器**；③ 依赖里 `xlsx` 指向 `https://cdn.sheetjs.com/...tgz`（非 npm registry），代理/内网环境安装会失败；④ **架构反向**：它的 Agent 跑在浏览器里、API key 存浏览器 IndexedDB、自带 CORS proxy 与 `ApiKeyPromptDialog`，而本项目的 pi 跑在 `wps-mcp` 服务端进程内（必须经 `src/tools.ts` 才能触达 WPS Add-in），页面只消费 SSE —— 适配它等于对着它的核心假设改；⑤ 它自带的 JavaScript REPL 工具在本场景不该存在 |

### 24.2.2 影响与约束

- **上游界面改版不会自动跟进。** 设计语言靠 `addon/taskpane.{html,css,js}` 手工对齐 pi-web；对上游的每一次跟进都是一次显式改动，而不是版本号 +1。
- **`addon/` 保持「拷进去就能跑」的形态**：无 `node_modules`、无打包产物、无 sourcemap。代价是 CSS 600 行与 JS 1300 行要自己维护。
- 这条决策与 [ADR-0001（服务端内嵌 pi）](#adr-0001)是配套的：正因为 Agent 在服务端，界面才只剩「渲染事件 + 触发动作」两件事，手写静态页足够。

<a id="adr-0003"></a>

## 24.3 ADR-0003：会话里由 Agent 触发的文档写入不设二次确认

状态：已采纳。

`variable.render` 是本项目唯一的破坏性动作（MCP 注解即 `destructiveHint: true` + `idempotentHint: false`，且 Render 脚本完全不过只读守卫，是一段拿着全量写权限的任意 WPS JS），而它在会话里是模型自主决定发起的。我们决定**不**在写之前拦一下：不弹确认卡、不加回执端点，Agent 调用即执行。原因是在本项目的实际使用形态里（单机、单人、文档本身有版本历史、写错重写一遍成本很低），确认卡带来的每次点击成本高于它挡住的错误率。

### 24.3.1 方案比较

- **A. 工具级暂停确认** —— `variable.render` 被调用时挂起 `execute`，UI 弹卡列出每个目标（`经营汇报.pptx 第 3 页 ·「销售图」`），点确认才真写。**否决原因**：SSE 是单向的，挂起一个工具需要再加回执端点 `POST /api/confirm {callId, approved}` 和超时策略，为一个低频事件引入一条新的控制回路。
- **B. 不确认（采纳）** —— 信任 Agent，只在工具卡里显示"已写入 X"。
- **C. 回合级计划确认** —— 约束 pi 写入前先出计划，UI 渲染「执行」按钮，点了再走 `/api/actions`。**否决原因**：计划的自然语言描述与 Render 代码实际干的事可能不一致（"计划≠执行"），而这个缝隙在 PPT/Excel 的定位场景里恰恰最容易出偏差，等于用一个不可靠的信号去做安全检查。

### 24.3.2 影响与约束

- 会话里"模型自己决定的写入"与"人点按钮的写入"在界面上**不再有阻断性差异**，只有来源标注的差异。防线的重心从"事前拦截"移到"事后可见"。
- 因此 `/api/chat` 的 SSE 协议**不需要**任何反向通道，是纯单向流，无需客户端确认回执。
- 工具调用卡必须**完整呈现写入事实**：目标文档、写入位置、`renderId`、耗时。不确认的前提是"看得见"，若卡片退化成一行"已执行"，这条决策的合理性就不成立了。
- 会话历史（pi 的 `SessionManager` 落盘的 jsonl）成为唯一的写入审计线索，`session.jsonl` 与 `state.json` 里的执行元数据共同构成追溯链。

<a id="adr-0004"></a>

## 24.4 ADR-0004：模型配置落在本机 config.json，用 ModelRuntime 在内存里注册 provider

状态：已采纳。

会话需要一个 LLM。它不一定是 DeepSeek 官方 —— 也可能是本机的 llama.cpp / vLLM / Ollama，或内网的 OpenAI 兼容网关。决定：**模型配置（provider、baseUrl、密钥、模型参数、思考等级）单独存 `%APPDATA%\wps-mcp\config.json`**（`WPS_MCP_DATA_DIR` 可覆盖），服务端启动时用 `ModelRuntime.create({ modelsPath: null })` 建一个不落盘的模型运行时，再 `registerProvider()` 把用户填的端点注册进去，最后 `createAgentSession({ modelRuntime, model, noTools: "builtin" })`。

**不读也不写 `~/.pi/agent/`**（`models.json` / `settings.json` / `auth.json`），也**不要求用户装 pi CLI**。

### 24.4.1 方案比较

| | 做法 | 落选理由 |
|---|---|---|
| **A. 本机 config.json + 内存注册**（选中） | `ModelRuntime.create({modelsPath:null})` + `registerProvider()` | —— |
| B. 照搬 pi-web 的分栏编辑器 | 直接读写 `~/.pi/agent/models.json` + `settings.json` + `auth.json` | ① 耦合到 pi 的全局配置格式，pi 升版即漂移；② 与本项目既有的「数据都在 `%APPDATA%\wps-mcp`」冲突；③ 等于要求用户装了 pi（哪怕只是配置文件层面），而 `wps-mcp` 的定位是独立服务 |
| C. 只认环境变量 | `DEEPSEEK_API_KEY` 之类 | 非技术用户无法在界面里切换模型/端点；且无法配置本地推理端点（没有对应的约定环境变量） |

### 24.4.2 影响与约束

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

---

<a id="automation"></a>

# 25. 仓库与自动化维护

公开仓库：[humoumou1215/wps-assistant](https://github.com/humoumou1215/wps-assistant)。项目采用 MIT；`package.json` 的 `private: true` 仅防止误发到 npm，不影响 GitHub 可见性。

## 25.1 工作流

| 工作流 | 触发 | 检查或产物 |
| --- | --- | --- |
| CI | main 推送、PR、手动、复用调用 | Linux/Windows/macOS × Node 22.19.0/24，类型与 JS 语法检查、Windows 部署脚本语法检查、模拟测试和 JUnit 报告 |
| Portable desktop | 相关 PR、手动 | macOS ARM64/Intel 与 Windows x64 原生构建、随包运行时隔离验证、ZIP 和 SHA-256；不自动创建 Release |
| CI 审计 | 同上 | macOS 部署脚本 Shell 语法检查、生产依赖高危审计 |
| Security | main 推送、PR、每周一 10:23（北京时间）、手动 | CodeQL；PR 检查新增依赖高危漏洞；定时及手动进行生产依赖审计 |
| Dependabot | 每周一 03:00（北京时间） | npm 和 Actions 更新 PR；小版本/补丁分组，保留人工审查 |

GitHub Actions 固定到完整 commit SHA，由 Dependabot 更新。工作流默认只有 `contents: read`；CodeQL 上传在对应任务中单独授权。PR 使用 `pull_request`，无外部密钥，也不连接个人电脑或真实 WPS。

CI 的 JUnit 报告和 Portable desktop 的 ZIP/SHA-256 在 PR 运行中保留 3 天；其他触发方式保留 14 天，便于手动构建后下载和排查主分支失败。保留期按新上传的产物生效，已有产物仍遵循上传时的保留期。

主分支保护要求 `CI passed` 和 `CodeQL`，分支必须与 main 保持同步，讨论必须解决，禁止强制推送和删除。个人项目不强制第二位审批者；仍必须通过 PR 合并。配置调整在 GitHub Settings → Branches。Actions 默认令牌为只读，不允许其创建/批准 PR。

<a id="development-deployment"></a>

## 25.2 开发部署

`scripts/` 仅保留三个文件，面向源码仓库的快速部署和验证：

| 文件 | 入口 | 职责 |
| --- | --- | --- |
| `scripts/install-macos.sh` | `npm run install:macos` | 安装依赖、构建、注册三个宿主的 Add-in 和 Writer 授权、安装或重启用户级 LaunchAgent、检查服务和页面资源 |
| `scripts/install-windows.ps1` | `npm run install:windows` | 安装依赖、构建、注册三个宿主的 Add-in、启动或重启后台 Node 服务、检查服务和页面资源 |
| `scripts/check-js.mjs` | `npm run check` 的 JS 检查部分 | 检查 Add-in、脚本和测试的 JavaScript 语法 |

要求安装 Node.js 22.19.0 或更高版本，以及支持 JS Add-in 的 WPS Office。macOS 使用系统的 Bash、launchctl、plutil、lsof 和 curl；Windows 使用 PowerShell 5.1 或更高版本及系统网络/进程命令。执行部署前须完全退出 WPS（包括托盘进程），脚本不会强制关闭用户文档。部署统一执行 `npm ci` 和 `npm run build`；依赖或构建失败时不重启旧服务。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `WPS_MCP_PORT` | `18766` | 服务端口，1025–65535；同时写入 Add-in 注册和服务配置 |
| `WPS_MCP_DATA_DIR` | macOS：`~/Library/Application Support/wps-mcp`；Windows：`%APPDATA%\wps-mcp` | 保留本机模型配置、变量、会话及运行日志；重复部署不删除这些数据 |
| `WPS_MCP_ADDINS_DIR` | macOS WPS 容器或 Windows `%APPDATA%\kingsoft\wps\jsaddons` | 覆盖加载项注册目录 |
| `WPS_MCP_ADDIN_ENABLE` | `enable_dev` | 加载项启用属性 |

Windows 也支持直接执行 `scripts/install-windows.ps1` 并传入 `-Port`、`-DataDirectory`、`-AddinsDirectory`。脚本只更新 `WpsMcpET`、`WpsMcpWPP`、`WpsMcpWPS` 的注册条目；已有 URL 随端口更新，重复部署不增加重复条目，其他加载项保持原样。首次修改已有 `publish.xml` 前保存 `.backup-before-wps-mcp`；macOS 的 `authaddin.json` 首次修改前保存 `.backup-before-wps-mcp-writer`，保留其他宿主及加载项记录。注册模块用 Saxes 验证 XML 完整结构后按元素位置替换 `jsplugins` 的直接子条目，保留注释、无关元素与原格式，支持成对标签和空根元素；生成结果再次验证。无效注册文件会在备份或修改前拒绝，Windows Writer 授权机制仍需实机确认。

macOS 使用 `com.local.wps-mcp` 用户级 LaunchAgent，登录时启动并自动重启；Windows 使用当前用户的后台 Node 进程，不创建开机任务，进程与数据目录记录在忽略的 `.dev/windows-deployment.json`。重复部署只允许重启已确认属于当前项目且数据目录相同的服务；端口被其他进程占用或会话仍在运行时拒绝重启。Windows 初次接管旧的手动启动服务前，需要自行停止旧服务。

macOS 的 `launchctl bootout` 异步移除服务。安装脚本卸载后最多等待 30 秒确认服务消失，再执行 `bootstrap`；为覆盖移除后的短暂注册冲突，最多重试 5 次，间隔 1 秒。卸载失败、超时或注册持续失败时停止部署并报告，不忽略错误继续启动。

服务启动后检查 `/health`、`/addins/et/`、`/addins/wpp/`、`/addins/wps/`、任务窗格 HTML/JS，以及 MCP 调试和配置引导页面的 HTML/CSS/JS。检查通过仅证明桥接服务和静态资源可用；还需重新打开 WPS，验证真实宿主加载和文档读写。

<a id="live-validation"></a>

## 25.3 真实 WPS 验收

CI 使用模拟宿主，不能证明真实 WPS API 兼容性。开发部署后，用 `test/sample/` 中的可丢弃副本验证 ET/WPP/Writer 的读取、变量重算、重写、结果读回及定位行为，在任务回复或 PR 中记录宿主、系统和结果。公开仓库不为 PR 配置个人电脑上的 self-hosted runner。

`test/wps-live/` 保留已有测试与素材生成器，但默认不运行。原有自动切换端口、限定测试文档及退出清理的脚本已移除，不再提供一键实机测试命令；不要直接开启实机测试开关并让它访问日常文档。

## 25.4 发布状态

支持源码开发部署和第 25.6 节的原生托盘免安装包。`Portable desktop` 工作流通过 PR 或手动运行生成平台 ZIP 与 SHA-256，PR 产物保留 3 天，手动构建产物保留 14 天；推送版本标签不会自动创建 GitHub Release。默认构建没有正式发布签名；公开分发前由维护者配置平台签名和 macOS 公证。

应用版本的唯一手工来源是根目录 `package.json.version`。服务 MCP `serverInfo`、`/health`、管理状态和任务窗格版本从它读取；本地 MCP 页面从生成的 `addon/version.js` 读取；Rust 构建脚本从同一文件嵌入版本，并校验 Cargo 包版本。`scripts/sync-version.mjs` 自动同步 npm 根锁、Cargo 清单/根包锁和浏览器版本模块；`npm run build` 与 `npm run build:portable` 前自动同步，`npm run check` 拒绝漂移。用 `npm version patch --no-git-tag-version`（或指定版本）更新并运行同步 hook，再在同一提交纳入生成文件；不单独修改各处版本。Node、第三方依赖、WPS 宿主及 MCP 协议版本各自独立，不是应用版本。

生产依赖审计阈值仍为 high，发现高危/严重漏洞时阻断 CI。CodeQL 的分析任务成功表示扫描执行成功，告警详情仍需在 Security → Code scanning 中审查。

<a id="local-mcp-pages"></a>

## 25.5 本地 MCP 调试与配置引导

两页与助手/变量页面复用 `addon/taskpane.css` 的字体、配色、边框与圆角；新页面通过 CSS layer 导入既有样式并调整页面布局，按钮、导航及分区沿用既有界面风格；布局适配浏览器宽屏与窄屏。两页由现有 HTTP 服务同源托管，不新增前端依赖、桌面运行时或常驻进程；HTML/CSS/JS 随项目提供，页面运行不加载 CDN 或外部文档。官方文档链接仅在用户点击时访问外网。托盘入口与免安装包见第 25.6 节。

| 页面 | 入口 | 职责 |
| --- | --- | --- |
| MCP 接口调试 | `/addon/mcp-debug.html` | 初始化、发现工具、显示真实参数 Schema、生成可编辑的 JSON-RPC 请求，手动发送工具调用和其他方法/通知，显示响应、HTTP 状态、耗时与 request-id |
| MCP 配置引导 | `/addon/mcp-guide.html` | 提供 Codex、Claude Code、WorkBuddy 的本机 HTTP 配置、复制配置或命令、逐步检查服务/MCP/WPS 文档并指导在客户端验证 |

两页由系统浏览器打开，原生托盘提供入口；助手「设置」与连接状态页也提供浏览器链接。不会新增 WPS Ribbon 按钮或 MCP 任务窗格；两页顶部可互相导航并打开会话、变量与模型设置。MCP 地址从页面实际 origin 生成，随服务端口变化；默认 `http://127.0.0.1:18766/mcp`。现有静态资源白名单同时允许通过三个宿主的 `/addins/<host>/` 前缀访问这些资源。

**调试协议与执行边界：**

- 页面直接 POST 到真实 `/mcp`，不通过 `/api/actions` 或另建工具执行实现。当前服务是无 session-id 的 stateless Streamable HTTP，每个 POST 建立独立 SDK transport，GET 不提供常驻 SSE；响应仍可能为 `text/event-stream`。页面支持 JSON 和 SSE 的 JSON-RPC 返回，按请求 ID 匹配结果，并区分 HTTP、JSON-RPC 与工具 `isError` 失败。
- 客户端以 `2025-11-25` 发起 `initialize`，使用服务返回的协商版本发送后续请求及 `notifications/initialized`。打开调试页自动初始化并读取工具清单，仅在用户点击「发送请求」后执行编辑的调用；没有模型请求，也无需模型 API Key。
- Schema 与工具说明来自 `tools/list`，不维护工具清单副本。选择工具后仅生成必填参数草稿；用户填写真实 ID、代码或规则参数。调用保留现有只读守卫、文档路由与规则执行语义。`create/update` 保存定义，`run_transform` 重算，`run_render` 写入文档；页面显示操作类型，发送即执行，不另加确认回路。
- 请求与响应仅显示在当前页面，不新增落盘历史；服务沿用第 25 章和既有日志约定，不记录参数或结果正文。页面调用默认等待最多 90 秒，失败或超时不自动重试；断开 HTTP 不能被视为已回滚或保证已取消工具执行，超时后须核对实际结果。

**引导与验证边界：**

- 三个客户端优先连接已运行服务的 HTTP URL，不用在线下载的 stdio 代理，不启动第二个桥接进程。Codex 提供 `config.toml` URL 条目与 CLI 添加命令；Claude Code 提供用户级 CLI 命令或项目 `.mcp.json`；WorkBuddy 提供 `.workbuddy/mcp.json` 的 `mcpServers` HTTP 条目与界面配置步骤。引导只生成可复制内容，不读取或修改客户端配置，提示合并条目并保留其他设置。
- 本地检测依次执行 `/health`、MCP 初始化、`tools/list`、`wps_list_documents`。无可用文档时明确显示空列表并提示打开 WPS、检查 Add-in；不会调用模型或写入文档。服务/MCP 检查成功不代表外部 Agent 已接入。
- 提供只调用 `wps_list_documents` 的验证指令，引导用户在所选 Agent 中确认服务器启用、工具发现及实际调用结果。客户端确认勾选项仅为用户手动确认，切换客户端后重置；不把浏览器自测或勾选状态宣称为自动探测证据。
- 服务仅监听 loopback；云端、容器、WSL、远程环境中的同名地址不保证指向 WPS 所在机器。项目内的模型设置只作用于内嵌助手，外部 Agent 仍使用自己的模型配置。隔离环境里的自然语言能力还需要该 Agent 可访问的模型服务。
- 「WPS 加载项注册」指更新 WPS 的注册条目（macOS Writer 另有授权信息），使宿主加载本地服务提供的 Add-in 页面；不是把 Node 服务安装进 WPS。首次或修复注册沿用第 25.2 节的备份、保留其他加载项、完全退出 WPS 等边界；当前两页不执行注册修复。

客户端说明核对日期：2026-10-02。依据：[Codex MCP](https://developers.openai.com/codex/mcp/)、[Claude Code MCP](https://code.claude.com/docs/en/mcp)、[WorkBuddy MCP 配置](https://www.workbuddy.ai/docs/zh/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/MCP-Guide)、[WorkBuddy HTTP MCP 字段](https://open.workbuddy.cn/docs/expert)。界面入口可能随客户端版本变化；页面提供离线说明，实际兼容性仍需客户端实机验证。

<a id="portable-desktop"></a>

## 25.6 免安装桌面程序

`desktop/native/` 是 Rust 原生托盘，使用 `tray-icon`、`tao` 和系统菜单/对话框，不引入 Electron、WebView 或第二套前端。Windows MSVC 构建启用静态 CRT，避免要求用户安装 VC Redistributable；最终 ZIP 验证同时检查托盘与 Node 的 PE 导入表。托盘每 4 秒查询本机健康状态，显示服务状态、WPS 连接数和可用文档数；操作期间由工作线程执行短时 Node 控制程序，不另设常驻监督进程。正常后台仅有一个托盘进程和一个现有 Node 服务；服务生命周期绑定启动它的托盘。「退出 WPS 助手」成功停止其服务后再关闭托盘，忙碌时禁止退出，失败时保留托盘并显示错误；服务已停止时仍可退出。托盘异常终止或被强制结束后，随包服务每 500ms 检查所属托盘 PID，发现退出即拒绝新工作、刷新日志并退出；不把强制结束等同于正常操作完成。源码服务和其他程序的服务不受该托盘退出影响。服务崩溃后显示停止状态，由用户选择启动；不自动反复重启。

| 托盘入口 | 行为 |
| --- | --- |
| 打开助手 / 打开变量管理 / 模型设置 | 系统浏览器打开现有 `taskpane.html#chat/#vars/#settings` |
| MCP 接口调试 / MCP 配置引导 | 系统浏览器打开第 25.5 节的两页；WPS 中不新增这些页面 |
| 启动 / 停止 / 重启服务 | 操作随包 Node 服务；忙碌时禁用停止和重启，服务端再次校验 |
| 修复 WPS 加载项注册 | 更新 ET/WPP/Writer 注册，macOS 同步 Writer 授权；须完全退出 WPS |
| 打开日志目录 | 系统文件管理器打开用户数据目录的 `logs/` |
| 登录时启动 | 默认关闭；macOS 用户 LaunchAgent，Windows 当前用户 Run 条目；不创建管理员级服务 |
| 关于 WPS 助手 | 明确处理点击事件并弹出原生对话框，显示应用名称与统一版本；macOS 使用应用所属的 NSAlert 并激活窗口 |
| 退出 WPS 助手 | 成功停止所属服务后退出；服务忙碌时禁用；没有所属服务时直接退出 |

**用户使用与离线边界：**

- macOS ZIP 中是 `WPS Assistant.app`，解压后放在稳定目录并双击；Windows ZIP 中是 `WPS Assistant` 文件夹，须保留整个文件夹，双击 `wps-assistant.exe`，不能仅复制 EXE。目标机器无需安装 Node、npm、Rust 或执行安装脚本。默认基于官方 Node 24.21.0：macOS 13.5+，Windows 10+（[Node 平台支持](https://github.com/nodejs/node/blob/v24.21.0/BUILDING.md#platform-list)）；WPS 仍须预先安装且支持 JS Add-in。macOS 默认是 ad-hoc 签名，外部分发可能受 Gatekeeper 限制；正式公证签名与 Windows Authenticode 由维护者的证书提供。
- 第一次双击自动注册三个宿主的加载项并启动服务，须事先完全退出 WPS；若仍运行则保留托盘并提示，关闭 WPS 后选择启动或修复注册。注册逻辑由 `src/addin-registration.ts` 统一实现，源码部署脚本也调用它，沿用第 25.2 节的首次备份和保留其他加载项规则。已有注册标记且端口/目录相同的后续启动不要求退出 WPS。
- 包内携带原生托盘、Node 二进制、编译后的服务、生产依赖、Add-in HTML/CSS/JS、内置技能及许可证；不携带 npm、开发工具、用户配置、会话、变量或日志。构建时移除非目标平台 esbuild、源码映射、类型声明及 pi 的 CLI bundle/示例/文档，保留 SDK、运行资源、WASM 和依赖许可证。目标机启动、注册、MCP 调试和规则执行无需外网；内嵌助手或外部 Agent 的模型需配置为隔离网络可达的服务，不能据此宣称远程模型可离线运行。
- 数据沿用 `~/Library/Application Support/wps-mcp` 或 `%APPDATA%\wps-mcp`；重复启动和替换应用不删除模型、会话、变量或技能。状态保存使用同目录临时文件原子替换；Windows 的 EPERM/EACCES/EBUSY 短暂读取锁每 50ms 重试，最多 1 秒；失败保留原文件并清理临时文件，不阻塞后续保存。升级前停止服务并退出托盘，再替换原路径的程序/文件夹。可用 `WPS_MCP_PORT`、`WPS_MCP_DATA_DIR`、`WPS_MCP_ADDINS_DIR`、`WPS_MCP_ADDIN_ENABLE` 覆盖默认值；Windows 托盘也支持相应 `--port=...`、`--data-dir=...`、`--addins-dir=...`、`--addin-enable=...` 参数，登录启动保留这些值。
- 原生文件锁保证每个数据目录只出现一个托盘；短时操作锁串行化启停和注册。`desktop-service.json` 保存服务 PID、实例 ID、运行路径、端口和随机控制凭据，文件权限为当前用户，控制凭据不返回给浏览器或写入日志。托盘/控制程序通过 `/api/desktop/status` 验证实例和路径后操作；源码服务无这些管理接口。`/api/desktop/stop` 还要求随机 Bearer token 和本机同源条件，存在聊天、配置/会话变更、HTTP 工作、工具执行、WPS RPC、后台状态保存或排队变量修改时返回 409；接受停止后拒绝新请求并刷新日志退出。不会通过进程名或仅凭 PID 强杀服务。
- 若端口属于源码 LaunchAgent、其他目录的免安装程序或不明进程，提示先从原入口停止，不会接管；移动程序后应从原托盘停止旧服务再打开新路径。服务记录保存所属托盘 PID；已启动的服务只有同一托盘可复用，旧版本未绑定托盘的服务须先停止再启动新版。删除程序不清除用户数据或 WPS 注册。关闭登录启动后该托盘在当前登录期间继续运行，但下次登录不再自动启动。

**维护者构建：** 在对应平台与架构准备 Node/npm、Rust 1.90+ 和本机编译工具（macOS Xcode Command Line Tools；Windows MSVC Build Tools/SDK），执行 `npm ci` 后 `npm run build:portable`。构建下载官方 Node 24.21.0 并用官方 `SHASUMS256.txt` 验证，构建机器需要外网和 curl；用户运行不下载资源。`Cargo.lock` 和 npm lock 固定依赖；部分 npm 版本会用 SDK 自带 shrinkwrap 覆盖根锁中的 `brace-expansion` 安全补丁，打包显式核对实际版本，必要时按根锁中 5.0.12 的 tarball 与 SHA-512 还原，再对暂存生产依赖执行 high 级审计，解压 smoke 再核对实际版本。输出忽略目录 `release/wps-assistant-<版本>-<darwin|win32>-<架构>.zip` 及 `.sha256`。原生菜单版本必须与 `package.json` 同步。

构建包含原生可执行程序、随包 Node 与 `PATH` 清空的隔离验证：临时目录注册、服务启动、重复启动复用、静态页面、MCP 初始化/工具发现、技能与工具加载、loopback 模拟模型响应、停止凭据、重启及会话保留；不修改构建机器的真实 WPS 注册、不连接外部模型。平台交互仍需实机验证；CI 的 Windows 构建和 smoke 不等于真实 WPS Writer 授权验收。

macOS 可设置 `WPS_MCP_CODESIGN_IDENTITY` 为 Developer ID，设置 `WPS_MCP_NOTARY_PROFILE` 为已配置的 notarytool keychain profile，完成公证、staple 后重新归档；Windows 可设置 `WPS_MCP_SIGNTOOL_CERT_SHA1` 使用本机证书和 signtool 签名。证书/凭据不入仓库，也不要求用户安装；默认 PR 构建不读取签名秘密、不发布 Release。

---

<a id="project-context"></a>

# 26. 项目术语与关系

把 WPS 文档当作数据源与写入目标的 MCP 服务：Agent 通过它把「算出来的值」绑定进文档。

## 26.1 术语约定

### 26.1.1 通道与界面

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

### 26.1.2 绑定三件套

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

### 26.1.3 模型与端点

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

### 26.1.4 引用与约束

**选区（Selection）**:
文档中当前被用户选中的区域，可作为引用对象被助手读到。
_Avoid_: 高亮、range、光标

**源区域（Source Ref）**:
Variable 的值取自源文档的哪一块区域。
_Avoid_: 数据源、来源文件

**只读守卫（Read-only Guard）**:
判定一段脚本能否在只读通道执行的规则。
_Avoid_: 沙箱、校验器

## 26.2 关系约束

- 一个 **Variable** 有且只有一个 **Transform**
- 一个 **Variable** 有零个或多个 **Render**
- 一个 **Transform** 从一个**文档**读出值；一个 **Render** 向一个**文档**写入值
- **重算**作用于 **Transform**；**重写**作用于 **Render**
- **Add-in** 承载 **任务窗格**；**会话**与变量管理都发生在**任务窗格**里
- 一份**模型配置**要么指向一个**内置服务商**，要么指向一个**自定义端点**；**会话**跑在它选定的那个模型上

## 26.3 对话示例

> **用户:** 「把这张表按部门汇总，写到汇报 PPT 第 3 页」
> **助手:** 建一个 **Variable**（部门销售额），**Transform** 从 `销售数据!A1:B13` 算值，再挂一条 **Render** 指向 PPT 第 3 页。
> **用户:** 「下季度数据到了，我要更新」
> **助手:** 源数据变了就**重算**；PPT 那边也要跟着变就连**重写**一起做。

## 26.4 易混淆含义

- 「重写」曾被读成「重新创建 Render 规则」—— 已定：**重写 = 执行 Render**；创建规则叫「新建 Render」。
- **description 有三个不同含义，不可互换**：`Variable.description` 是语义描述（「已剔除合计行」）；`Render.description` 是写入位置（「第 3 页 ·「销售图」」）；`Transform.description` 是已定义但从未被写入的字段。
- 「文档」既指 WPS 里打开的文件，也指注册表里的条目 —— 讨论时优先说「已注册文档」。
- 「Render」在本项目里是名词（一条规则）；它的动词形式一律说**重写**。
