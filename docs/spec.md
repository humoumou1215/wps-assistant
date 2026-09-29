# WPS Report Assistant MCP Server SPEC

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
wps.exec
```

执行。

`wps.exec` 原则上只允许查询。

所有修改文档的操作必须通过：

```text
variable.render
```

执行。

即：

```text
wps.exec
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

第一版提供 8 个 Tool：

```text
Workspace
└── workspace.list_documents

Document
├── document.get
└── wps.exec

Definition
├── transform.create
└── render.create

Variable
├── variable.get
├── variable.transform
└── variable.render
```

---

# 5. workspace.list_documents

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

# 6. document.get

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

# 7. wps.exec

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

`wps.exec` 第一版只用于查询。

不允许 Agent 通过 `wps.exec` 修改文档。

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

这是刻意设计：`wps.exec` 的失败信息是 Agent 修正代码的**唯一依据**，一次只报一处会把一次修正拆成多轮往返（"改一处 → 报一处 → 再改一处"）。实现上由 `analyzeReadOnlyCode()` 收集全部违规、`assertReadOnlyCode()` 统一抛出。

### 7.4.2 判据的单一来源

检查逻辑集中在 `src/readonly-guard.ts`，`server.ts` 只做薄封装并 `import` 它。这样做的原因是：调用方（Agent 的离线自检工具、CI 校验脚本）需要复现同一套判定，若判据以副本形式散落各处，任一处改动都会让其它副本静默过时。

检查是纯语法层面的，**按节点类型与属性名匹配，不区分文档对象与本地对象**：

- 成员赋值一律拒绝，与属性名无关（`o.a = 1` 与 `Range('A1').Value2 = 1` 同一条规则）；
- 方法黑名单按属性名匹配，因此在本地普通对象上使用同名属性（`copy`、`sort`、`replace`）同样被拒绝；
- `new` 一律拒绝，`new Date()`、`new Map()` 也不例外。

---

# 8. transform.create

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

`transform.create`：

```text
只创建规则
不执行规则
```

创建完成后 Agent 应调用：

```text
variable.transform
```

验证 Transform 是否正确。

---

# 9. render.create

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

`render.create`：

```text
只保存 Render
不实际修改 WPS 文档
```

需要调用：

```text
variable.render
```

才真正执行。

---

# 10. variable.get

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

# 11. variable.transform

## 11.1 用途

执行 Variable 的 Transform。

流程：

```text
variable.transform(var_001)

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

# 12. variable.render

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
wps.exec(
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
workspace.list_documents()
```

得到：

```text
doc_excel_001 → 销售数据.xlsx
doc_ppt_001   → 经营汇报.pptx
```

## Step 2

查询 Excel：

```text
wps.exec(
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
wps.exec(
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
transform.create(...)
```

得到：

```text
variableId = var_001
```

## Step 5

立即执行：

```text
variable.transform(var_001)
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
render.create(...)
```

得到：

```text
render_001
```

## Step 7

执行：

```text
variable.render(
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
wps.exec(doc_excel_001, ...)
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
workspace.list_documents()

document.get(
    documentId
)

wps.exec(
    documentId,
    code
)

transform.create(
    variableName,
    description,
    sourceDocumentId,
    code
)

render.create(
    variableId,
    targetDocumentId,
    description,
    code
)

variable.get(
    variableId
)

variable.transform(
    variableId
)

variable.render(
    variableId,
    renderId?
)
```

---

# 23. 最重要的实现约束

Agent 可以自由使用 WPS JS API，但必须遵守三个边界：

```text
1. wps.exec
   只能调查文档。

2. transform
   只能读取文档并产生 Variable.value。

3. render
   是唯一允许修改 WPS 文档的规则。
```

因此：

```text
                查询
Agent ─────────────────→ wps.exec
  │
  │ 创建规则
  ├────────────────────→ transform.create
  │
  └────────────────────→ render.create


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