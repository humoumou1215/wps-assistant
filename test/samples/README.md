# 金融科技部月度工作汇报自动更新验收题

这是一套用于验证“Excel 台账 → PPT 汇报材料自动更新”的验收题。

公开文件尽量贴近真实工作场景：PPT 是上一期已经使用过的汇报材料，Excel 是业务台账；PPT 和 Excel 内部不包含明显提示语，也不在 Excel 中放置解释性工作表。参赛系统需要自行判断哪些汇报内容应跟随台账变化。

## 目录

```text
公开文件/
├─ 01_金融科技部月度工作汇报模板.pptx
├─ 02_金融科技部工作台账_初始.xlsx
└─ 03_用户任务.md

隐藏验收数据/
├─ round1_数据更新.xlsx
├─ round2_项目增减及排序变化.xlsx
├─ round3_Excel结构调整.xlsx
├─ README_裁判验收说明.md
└─ expected/
   ├─ round0_expected.pptx
   ├─ round1_expected.pptx
   ├─ round2_expected.pptx
   └─ round3_expected.pptx
```

公开文件给参赛系统使用；隐藏验收数据由裁判保留，用于验证规则是否真正支持后续重算。
