# WPS Report Assistant MCP Server SPEC

本文汇总工具规范、已采纳的架构决策、仓库维护流程和项目术语。

- 工具规范与数据模型：第 1–23 章。
- [架构决策](#architecture-decisions)：第 24 章，包含 ADR-0001 至 ADR-0004。
- [仓库与自动化维护](#automation)：第 25 章，包含 CI、安全检查、发布和真实 WPS 验收。
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
  "code": "const sheet = Application.Worksheets.Item('销售数据'); return sheet.Range('A1:B10').Value2;"
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

检查逻辑集中在 `src/readonly-guard.ts`，`server.ts` 只做薄封装并 `import` 它。这样做的原因是：调用方（Agent 的离线自检工具、CI 校验脚本）需要复现同一套判定，若判据以副本形式散落各处，任一处改动都会让其它副本静默过时。

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
  "code": "const sheet = Application.Worksheets.Item('销售数据'); const rows = sheet.Range('A2:B100').Value2; return rows.filter(row => row[0]).map(row => ({ department: String(row[0]), sales: Number(row[1]) }));"
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
  "code": "const data = variable.value; const slide = Application.ActivePresentation.Slides.Item(3); const chart = slide.Shapes.Item('销售图').Chart; /* update chart */ return { updated: true };"
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
  Application.ActivePresentation
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
Agent 修改 Transform
```

第一版如果暂时不提供 update，可以删除重建；正式实现建议同时提供内部更新能力。

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

公开仓库：[humoumou1215/wps-mcp](https://github.com/humoumou1215/wps-mcp)。项目采用 MIT；`package.json` 的 `private: true` 仅防止误发到 npm，不影响 GitHub 可见性。

## 25.1 工作流

| 工作流 | 触发 | 检查或产物 |
| --- | --- | --- |
| CI | main 推送、PR、手动、Release 调用 | Linux/Windows/macOS × Node 22.19.0/24，类型及 JS 语法检查、模拟测试和 JUnit 报告 |
| CI 打包 | 同上 | Shell 语法、生产依赖高危审计、压缩包/校验和、独立目录安装及 HTTP/Add-in 资源冒烟 |
| Security | main 推送、PR、每周一 10:23（北京时间）、手动 | CodeQL；PR 检查新增依赖高危漏洞；定时及手动进行生产依赖审计 |
| Release | 推送 `v*` 标签 | 完整 CI 成功后检查版本一致性，发布 GitHub Release、安装包和 SHA-256 |
| Dependabot | 每周一 03:00（北京时间） | npm 和 Actions 更新 PR；小版本/补丁分组，保留人工审查 |

GitHub Actions 固定到完整 commit SHA，由 Dependabot 更新。工作流默认只有 `contents: read`；CodeQL 上传和 Release 发布在对应任务中单独授权。PR 使用 `pull_request`，无外部密钥，也不连接个人电脑或真实 WPS。

主分支保护要求 `CI passed` 和 `CodeQL`，分支必须与 main 保持同步，讨论必须解决，禁止强制推送和删除。个人项目不强制第二位审批者；仍必须通过 PR 合并。配置调整在 GitHub Settings → Branches。Actions 默认令牌为只读，不允许其创建/批准 PR。

## 25.2 发布

先确保本次变更已合并到 main，工作区干净。更新版本并通过 PR 合并：

```sh
npm version patch --no-git-tag-version
# 将 package.json / package-lock.json 的变更提交到分支并创建 PR
```

合并后拉取 main，再创建与包版本相同的标签（下面以 0.1.1 为例）：

```sh
git switch main
git pull --ff-only
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
```

只有标签对应提交的完整 CI 成功且该提交已合并到 main 才发布；标签和 `package.json` 版本不一致会失败。包含 `-` 的版本发布为 prerelease。此流程不发布到 npm，不自动递增版本，也不自动合并依赖更新。

发布包含编译后的服务、Add-in、API skill、安装脚本、README、许可证和完整锁文件，不携带 Node.js 或依赖。解压后安装运行依赖即可启动：

```sh
npm ci --omit=dev
npm start
```

然后按 README 注册 Add-in。不要对发布包执行 `npm run build`；需要开发或运行实机测试时使用源码仓库。macOS 服务安装脚本可以直接使用包内的编译产物。

生产依赖审计阈值为 high；发现高危/严重漏洞时阻断 CI，并由 Dependabot 提交修复。CodeQL 的分析任务成功表示扫描执行成功，告警详情仍需在 Security → Code scanning 中审查。

## 25.3 真实 WPS 验收

CI 的宿主为模拟对象，不能证明真实 WPS API 兼容性。真实 ET/WPP/Writer 验收在安装 WPS 的本机显式运行 README 中的 `test:wps-live` 和 `test:wps-writer-live`。公开仓库不为 PR 配置个人电脑上的 self-hosted runner。

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
