---
name: wps-api
description: 读取或修改已连接的 WPS 表格、演示和文字文档，创建、纠正及执行 Variable / Transform / Render 数据绑定规则，把源数据同步到报告模板。
---

# WPS API skill

WPS JS API 操作文档，WPS 工具管理文档身份和规则。内嵌助手仅有 WPS 工具及技能 `read`。

## 按任务读取

`read` 显式传入下表的 `offset`、`limit`，复用本轮已读资料。宿主指南仅先读操作指引；历史成员按目录索引定位，所需成员的签名和效果仍须在当前宿主验证。

| 触发条件 | 资料 | offset | limit |
| --- | --- | ---: | ---: |
| 表格取数、计算或写入 | [表格](references/spreadsheet.md) | 1 | 29 |
| PPT 文本、表格或图表 | [演示](references/presentation.md) | 1 | 30 |
| Writer 段落、表格或书签 | [文字](references/writer.md) | 1 | 23 |
| 用户引用选区 | [选区](references/common.md) | 1 | 11 |
| 通用枚举、事件或依赖选区的宿主命令 | [宿主与事件](references/common.md#宿主与事件) | 12 | 11 |
| 绑定报告模板或调整表格行列 | [报告通用流程](references/report-sync.md) | 1 | 34 |
| 原生图表写入 | [图表](references/report-sync.md#图表)；另读报告通用流程 | 36 | 3 |
| 目标对象增删或替换 | [动态目标](references/report-sync.md#动态目标的返回约定) | 40 | 20 |
| PPT 表格写入，包括首次写入 | [PPT 续表](references/report-sync.md#ppt-table-continuation)；另读报告通用流程和动态目标 | 61 | 13 |
| 平台差异、兼容性结论 | [验证范围](references/validation.md)，再按需读取其中链接 | 1 | 20 |
| 缺少具体 API 成员 | [成员索引](references/api-catalog.md)，再按对象所在行范围读取 | 1 | 39 |

## 执行与完成标准

1. **定位**：用 `wps_list_documents`、`wps_get_document` 核实文档及选区；本轮证据可复用。查询只返回决策所需的结构、表头、样本、稳定 ID 和 JSON 数据；大结果先摘要，异常再下钻。每个要求更新的目标都有来源和口径，或明确保留原因。仅查询的任务到此完成，无需建规则。
2. **重算**：新建 Variable 后执行 Transform；已有规则先读完整定义，再原位 update，保留 ID 和其他绑定。代码、来源或 sourceRef 变化使旧值失效，重算后验证筛选、空值、单位、分母和关键结果。
3. **重写**：create/update Render 只保存定义，`wps_run_render` 才写文档。单条修正指定 renderId，改变目标不自动清除旧内容。重写后用独立查询核对关键内容、对象数和样式，不能只凭 success 完成。依赖顺序为重算→验证→重写→回读，同一区域顺序写入。

## 写规则时

- 每个 Variable 对应一个业务职责和独立重算口径，只返回所需字段；相同口径供多个 Render 复用，粒度以业务结果而非单个字段/单元格为单位。独立指标、明细、趋势分别建变量，即使同源或同属一份报告。名称用业务名，description 写来源、筛选、口径和单位。值用具名字段，如 `{月份, 项目明细, 高风险项目数}`；数值保留数值，区分缺失与零。
- Transform 负责实时取数与计算，Render 使用 `variable.value` 负责目标映射和展示格式。代码用业务命名、正常换行、短函数和必要注释；每条 Render 集中映射自己的目标。只保留实际使用的函数及已观察到或用户要求的兼容分支；未知形态给可读错误。
- 一条 Render 对应一处可独立定位、更新、验收的目标，如文本框、表格、图表或连续区域。同页不同目标分别绑定；必须联动才能完成一处更新时才合并，例如原表和自动续表。description 写位置、对象、用途及合并原因，targetRef 列全目标，逐处验收。
- 用已核实的稳定 ID 定位；缺失时报含目标含义的错误。重复重写更新原对象并处理自己管理的过期内容，保留未绑定对象。sourceRef/targetRef 供人工定位，不限制代码范围或决定口径；语法及 update 的省略/null 行为见工具参数。表格引用的名称转义见表格指引。

## 查询与 Transform 的写法

从绑定的 `wpsDocument` 访问 `Worksheets`、`Slides`、`Content`、`Range`、`Tables`，集合通常用 1-based `Item(i)`；选区按快照坐标读取。COM/WPS 代理留在宿主内，只返回标量、数组、普通对象。

工具在保存和执行前自动校验只读代码。守卫按语法和成员名检查，不区分宿主与本地对象，不是沙箱。

| 用途 | 可用写法 |
| --- | --- |
| 计数 | `i = i + 1` |
| 收集/分组 | `rows.push({名称: name, 金额: amount})`，`map/filter/reduce` 返回新值 |
| 构造结果 | 对象/数组字面量、局部变量整体重新赋值 |
| 清洗文本 | `trim()`、`split(...).join(...)` |
| 日期 | `Date.parse(text)` / `Date.UTC(...)`，返回数值或文本 |

只读通道拒绝成员赋值（含本地 `out[k]=v`）、`++/--`、`new`、`await`、文件 I/O、文档修改；`sort/replace/copy/add` 等禁用成员在本地对象上读取/调用也拒绝。按一次返回的全部违规修正，不拼接成员名绕过。文档写入及写方法检查仅在 Render 中执行。

规则收尾和交付遵循系统提示词；读取报告资料不代表用户要求长期保留绑定。外部客户端须自行约定生命周期及交付要求。
