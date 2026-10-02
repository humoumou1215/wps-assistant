# 裁判验收说明

本目录中的文件不应提前提供给参赛系统。

## 文件说明

- `round1_数据更新.xlsx`：数值、状态、文本变化，结构不变。
- `round2_项目增减及排序变化.xlsx`：项目、生产事件、延期需求数量发生变化。
- `round3_Excel结构调整.xlsx`：插入新列、列顺序变化，业务表头含义不变。
- `expected/`：每个轮次的参考 PPT 结果。

## 验收流程

1. 使用公开文件执行首次绑定和渲染。
2. 对比 `expected/round0_expected.pptx`。
3. 替换 Excel 为 `round1_数据更新.xlsx`，只执行已有 transform / render。
4. 对比 `expected/round1_expected.pptx`。
5. 替换 Excel 为 `round2_项目增减及排序变化.xlsx`，只执行已有 transform / render。
6. 对比 `expected/round2_expected.pptx`。
7. 替换 Excel 为 `round3_Excel结构调整.xlsx`，只执行已有 transform / render。
8. 对比 `expected/round3_expected.pptx`。

## 判定重点

- 如果系统每轮都重新让 Agent 写规则，不能算通过重算能力。
- 如果 PPT 结果内容正确但破坏了模板样式，应扣样式保持和修改范围控制分。
- 如果只能更新固定行数，不能通过 Round2。
- 如果固定列号读取 Excel，通常不能通过 Round3。
