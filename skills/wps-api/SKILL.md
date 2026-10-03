---
name: wps-api
description: 通过 WPS 工具读取或修改已连接的表格、演示和文字文档；用于创建、纠正及执行 Variable / Transform / Render，以及把源数据绑定到报告模板。
---

# WPS API skill

把文档任务变成可读、可复用的规则。WPS JS API 操作文档，工具管理文档身份和规则生命周期。内嵌助手仅有 WPS 工具及读取已安装技能文本的 `read`；本技能无需其他技能、终端或离线脚本。

## 按任务读取

只加载当前分支的资料。宿主指南先读前 30 行的操作指引，后面的历史诊断表仅按具体成员分页查阅。

| 触发条件 | 资料 |
| --- | --- |
| 表格取数、计算或写入 | [表格](references/spreadsheet.md) |
| PPT 文本、表格或图表 | [演示](references/presentation.md) |
| Writer 段落、表格或书签 | [文字](references/writer.md) |
| 数据绑定到既定报告模板、动态行列或图表 | [报告绑定](references/report-sync.md)，全文 |
| 用户引用选区、通用枚举或依赖选区的宿主命令 | [选区与通用 API](references/common.md)，前 30 行 |
| 平台差异、兼容性结论 | [验证范围](references/validation.md)及其中相关链接 |
| 常用指引缺少具体成员 | [历史成员目录](references/api-catalog.md)，按宿主、对象、成员查阅，避免通读 |

## 执行与完成标准

1. **定位**：`wps_list_documents` 核实来源和目标，`wps_get_document` 核实相关文档及选区；本轮已有证据可复用。用 `wps_run_readonly_code` 收集本次决策需要的结构、表头、样本和稳定 ID，结果只返回 JSON，避免整份文档/目录转储。此步完成时，每个要求更新的目标均有来源和口径或明确保留原因；冲突才询问用户。
2. **重算**：新规则用 `wps_create_variable`，再 `wps_run_transform`。Transform 实时取数、按业务口径计算；验证空值、单位、分母、筛选和关键结果后进入重写。已有规则先 `wps_get_variable` 读完整代码与绑定，再 `wps_update_variable` 修改原规则。代码/来源/sourceRef 更新会清除旧值，必须重算。
3. **重写**：`wps_create_render` / `wps_update_render` 保存定义；只有 `wps_run_render` 才修改文档。Render 使用 `variable.value`，只处理目标与展示格式。单条修正用明确 `renderId` 执行，保留其他绑定；改变位置不会自动清除旧内容。完成标准是关键数据、对象数和样式读回符合要求，不能只凭 success 判定完成。
4. **交付**：简述已完成内容、关键结果、下一次操作和未完成项。用户明确触发更新时，对原变量重算再重写，无需重建规则。保存规则不执行写入；源数据变化不自动修改目标，文件始终由用户掌控。

独立查询可以并行；创建→重算→验证→重写保持依赖顺序。同一目标区域的重写顺序执行。工具已返回完整定义或值时复用结果，状态变化、纠正或验收需要时再读。查询仅返回决策所需字段；较大数据先返回行数/摘要/少量样本，异常再下钻。

## 可读的规则

- Variable 名称用业务名，如“月度运行指标”“延期需求”；一个变量对应一个独立重算口径，同源展示可挂多个 Render。不要每个单元格建变量，也不要把无关业务塞进巨型变量。
- Variable.description 写来源、筛选、口径和单位；值用具名字段，如 `{月份, 指标, 明细, 汇总}`，明细用具名对象或明确 `{表头, 行}`。数值保留数值，格式化放在 Render；缺失值与零分别处理。
- Render.description 写“第 3 页 · 重点项目表 · 展示项目进展”。代码用业务变量名、短函数、正常换行、分段注释及集中目标映射；每行表达一个步骤，便于人工修改。节省上下文靠按需读取和精简工具结果，代码保持可读。每份脚本只保留实际调用的函数，避免复制无关格式化函数或预置兼容框架。兼容分支服务于已观察到或用户明确要求的数据形态，未知形态给可读错误后再补充。
- `sourceRef` / `targetRef` 供人工定位，不自动限制代码范围或决定取数口径。表格用 `工作表!A1:B13`；表名含空格/单引号时用单引号包围，内部单引号双写。PPT 用实际稳定 ID `SlideID:257!ShapeID:4`，也支持 `Slide:2!Shape:对象名`、`Slide:2`。Writer 用 `Paragraph:4`、`Table:1`、`Range:0:20`、`Bookmark:名称` 或 `Heading:标题!Paragraph` / `!Table`。多个 Word/PPT 目标用 `+` 连接，每段为完整位置。
- 按已核实 ID 查找目标，缺失时抛出含页/对象含义的错误。Render 重复运行更新原对象并处理自己管理的过期内容，避免重复追加或影响未绑定对象。
- update 省略字段保留原值，description/sourceRef/targetRef 可用 null 清除；只改变量名称或描述保留值。先检查定义再更新，保留 ID。

## 只读代码的可用写法

查询和 Transform 从原生 `wpsDocument` 访问 `Worksheets`、`Slides`、`Content`、`Range`、`Tables`。集合通常为 1-based `Item(i)`，选区按快照坐标读取，活动对象不替代绑定文档。

The WPS tools automatically apply the guard before saving/executing read-only code. 静态守卫按语法和成员名检查，不区分 WPS 对象与本地对象；它不是沙箱。

| 场景 | 可用写法 |
| --- | --- |
| 循环、计数 | `i = i + 1`，`count = count + 1` |
| 收集/分组 | `rows.push({名称: name, 金额: amount})`，`map/filter/reduce` 返回新值 |
| 构造结果 | 对象/数组字面量，局部变量整体重新赋值 |
| 字符串清洗 | `trim()`、`split(...).join(...)` |
| 日期 | `Date.parse(text)` / `Date.UTC(...)`，返回数值或文本 |

只读通道拒绝任何成员赋值（含本地 `out[k]=v`）、`++/--`、`new`、`await`、文件 I/O、文档修改；`sort/replace/copy/add` 等禁用成员即使在本地对象上读取/调用也拒绝。不要拼接成员名绕过。全部违规含行列号一次返回，一次改完再提交。

Render 才允许文档写入及写方法检查。成员存在仅是线索，历史 UOS Build 26885 结果不保证当前宿主行为；按当前文档最小验证，未知 API 不猜签名。COM/WPS 代理留在宿主内访问，提取标量、数组和普通对象后 return。
