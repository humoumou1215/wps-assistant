# -*- coding: utf-8 -*-
"""
round2 · 目标1 生成器
产出：目标1-2026年度科技工作汇报.pptx

角色：汇报稿「半成品」。页面框架、标题、表格结构齐备，数据位置留白。
刻意设计：
  1. 第 5 页重点系统清单表——单页容量 12 行，实际需 16 行，必须新建续页
  2. 第 4 页图表——需要把图表数据替换为台账真实值（对象模型与 MS Office 有差异）
  3. 第 3 页 KPI、第 6 页团队表——全部留白，考察跨源聚合
  4. 第 5 页已预填前 3 行作为「格式样板」，其余留空（含跨页余量问题）
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import truth

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION

OUT = "目标1-2026年度科技工作汇报.pptx"
FONT = "微软雅黑"
NAVY = RGBColor(0x1F, 0x4E, 0x79)
BLUE = RGBColor(0x2E, 0x74, 0xB5)
GRAY = RGBColor(0x59, 0x59, 0x59)
LIGHT = RGBColor(0xF2, 0xF7, 0xFB)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
RED = RGBColor(0xC0, 0x39, 0x2B)
TODO = "【待填】"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

R = truth.compute()
sys_sorted = R["systems"]
KPI = R["kpi"]


def set_run(run, text, size=12, bold=False, color=None, italic=False):
    run.text = text
    run.font.name = FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color if color is not None else RGBColor(0x33, 0x33, 0x33)


def tb(slide, l, t, w, h, lines, size=12, bold=False, color=None, align=PP_ALIGN.LEFT, spacing=1.0):
    box = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    for i, ln in enumerate(lines if isinstance(lines, list) else [lines]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        if isinstance(ln, tuple):
            set_run(p.add_run(), ln[0], ln[1] if len(ln) > 1 else size,
                    ln[2] if len(ln) > 2 else bold, ln[3] if len(ln) > 3 else color)
        else:
            set_run(p.add_run(), ln, size, bold, color)
    return box


def fill(cell, text, size=10, bold=False, color=None, bg=None, center=True):
    cell.margin_left = Emu(45720); cell.margin_right = Emu(45720)
    cell.margin_top = Emu(18000); cell.margin_bottom = Emu(18000)
    cell.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf = cell.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER if center else PP_ALIGN.LEFT
    set_run(p.add_run(), str(text), size, bold, color)
    if bg is not None:
        cell.fill.solid(); cell.fill.fore_color.rgb = bg


def band(slide, title_text, sub=None, page_no=None):
    bar = slide.shapes.add_shape(1, Inches(0), Inches(0), prs.slide_width, Inches(0.92))
    bar.fill.solid(); bar.fill.fore_color.rgb = NAVY; bar.line.fill.background()
    tf = bar.text_frame
    tf.margin_left = Inches(0.5)
    tf.margin_top = Inches(0.1)
    p = tf.paragraphs[0]
    set_run(p.add_run(), title_text, 20, True, WHITE)
    if sub:
        p2 = tf.add_paragraph()
        set_run(p2.add_run(), sub, 11, False, RGBColor(0xBD, 0xD7, 0xEE))
    if page_no is not None:
        tb(slide, 12.4, 6.95, 0.7, 0.35, f"{page_no:02d}", 11, False, GRAY, PP_ALIGN.RIGHT)


# ================================================================ 1 封面
s = prs.slides.add_slide(BLANK)
b = s.shapes.add_shape(1, Inches(0), Inches(0), prs.slide_width, Inches(5.9))
b.fill.solid(); b.fill.fore_color.rgb = NAVY; b.line.fill.background(); b.text_frame.text = ""
tb(s, 0.9, 1.15, 11.5, 0.5, "示例银行 · 科技部（合成测试数据）", 17, False, RGBColor(0xBD, 0xD7, 0xEE))
tb(s, 0.9, 1.75, 11.5, 1.6, "2026 年度科技工作汇报", 42, True, WHITE)
tb(s, 0.9, 3.55, 11.5, 0.55, "生产运行 · 项目建设 · 团队效能", 18, False, RGBColor(0xBD, 0xD7, 0xEE))
tb(s, 0.9, 6.3, 11.5, 0.9,
   ["汇报人：科技部远程应用研发部", "汇报日期：2027 年 1 月"], 14, False, GRAY)
s.notes_slide.notes_text_frame.text = "封面。汇报人、日期可按需补充。"

# ================================================================ 2 题目说明
s = prs.slides.add_slide(BLANK)
band(s, "本页为数据填充任务说明", "请先读完本页再动手；口径以本页为准", page_no=2)
body = [
    ("【任务】", 13, True, NAVY),
    ("以《源A-2026年度系统运行与投产台账.xlsx》和《源B-各研发团队年度工作条目汇编.pptx》为数据基础，"
     "把数据呈现到本文件和《目标2-2026年度生产运行分析报告.docx》中。", 12, False, None),
    ("", 8, False, None),
    ("【汇报口径】（源文件字段与之不一致，必须换算）", 13, True, NAVY),
    ("1. 全年投产次数 = 变更类型为「投产上线」或「紧急修复」的次数；「优化变更」不计入。", 11.5, False, None),
    ("2. 重大故障起数 = 事件等级为一级的起数（等级字段存在 I级 手写混用，属同一等级）；二级、三级不计入。", 11.5, False, None),
    ("3. 平均可用率 = 各月可用率按当月交易笔数加权平均；写成文本的百分比按数值处理，\"-\" 与空值不参与。", 11.5, False, None),
    ("4. 同比 = (2026 投产次数 − 2025 投产次数) ÷ 2025 投产次数；无 2025 基线的系统填「新增」。", 11.5, False, None),
    ("5. 系统等级：台账中的 一级/二级/三级 分别对应汇报口径的 核心/重要/一般。", 11.5, False, None),
    ("6. 团队名称：台账用简称（如「研发一组」），汇报口径一律用全称（如「系统研发一组」）。", 11.5, False, None),
    ("", 8, False, None),
    ("【排序规则】", 13, True, NAVY),
    ("重点系统清单按「全年投产次数」降序；次数相同的，按台账序号升序。", 11.5, False, None),
    ("", 8, False, None),
    ("【本文件可写位置】", 13, True, NAVY),
    ("第 3 页 4 个 KPI 数值；第 4 页柱状图；第 5 页重点系统清单（含续页）；第 6 页团队表；第 7、8 页文字。", 11.5, False, None),
]
box = s.shapes.add_textbox(Inches(0.70), Inches(1.10), Inches(12.15), Inches(6.25))
tf = box.text_frame
tf.word_wrap = True
for i, (text, size, bold, color) in enumerate(body):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.line_spacing = 1.22
    p.space_after = Pt(3)
    set_run(p.add_run(), text, size, bold, color)
s.notes_slide.notes_text_frame.text = "题面页。"

# ================================================================ 3 总体概览（4 KPI）
s = prs.slides.add_slide(BLANK)
band(s, "一、总体情况", "全年生产运行与建设投入关键指标", page_no=3)
cards = [
    ("全年投产总次数", "次", "口径：投产上线 + 紧急修复"),
    ("重大故障起数", "起", "口径：事件等级一级"),
    ("平均可用率", "", "口径：按交易笔数加权"),
    ("完成工作条目数", "条", "来源：各团队工作条目汇编"),
]
cw, gap, x0 = 2.92, 0.28, 0.62
for i, (name, unit, note) in enumerate(cards):
    x = x0 + i * (cw + gap)
    card = s.shapes.add_shape(1, Inches(x), Inches(1.75), Inches(cw), Inches(2.5))
    card.fill.solid(); card.fill.fore_color.rgb = LIGHT
    card.line.color.rgb = BLUE; card.line.width = Pt(1)
    card.text_frame.text = ""
    tb(s, x + 0.2, 2.0, cw - 0.4, 0.5, name, 13, True, NAVY, PP_ALIGN.CENTER)
    tb(s, x + 0.2, 2.55, cw - 0.4, 0.8, TODO, 26, True, RED, PP_ALIGN.CENTER)
    tb(s, x + 0.2, 3.38, cw - 0.4, 0.4, unit, 12, False, GRAY, PP_ALIGN.CENTER)
    tb(s, x + 0.2, 3.72, cw - 0.4, 0.5, note, 9, False, GRAY, PP_ALIGN.CENTER)
tb(s, 0.62, 4.6, 12.1, 1.6,
   ["提示：四个数值均需从源A台账聚合得出，不可从源文件直接摘取（源A无同名汇总行）。",
    "平均可用率需先做类型归一（部分单元格为文本型百分比或占位符），再按交易笔数加权。"],
   11, False, GRAY)
s.notes_slide.notes_text_frame.text = "KPI 卡片待填。"

# ================================================================ 4 月度投产趋势（图表）
s = prs.slides.add_slide(BLANK)
band(s, "二、年度投产节奏", "按月统计的投产次数（图表数据待替换）", page_no=4)
cd = CategoryChartData()
cd.categories = [f"{m}月" for m in range(1, 13)]
cd.add_series("投产次数", tuple([5] * 12))
gframe = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED,
                            Inches(0.85), Inches(1.25), Inches(11.6), Inches(4.85), cd)
chart = gframe.chart
chart.has_legend = False
chart.has_title = True
chart.chart_title.text_frame.text = "2026 年 1-12 月投产次数（示例数据，待替换为台账实际值）"
for r_ in chart.chart_title.text_frame.paragraphs[0].runs:
    r_.font.size = Pt(12); r_.font.name = FONT
plot = chart.plots[0]
plot.has_data_labels = True
plot.data_labels.font.size = Pt(9)
plot.data_labels.font.name = FONT
chart.category_axis.tick_labels.font.size = Pt(10)
chart.value_axis.tick_labels.font.size = Pt(10)
tb(s, 0.85, 6.25, 11.6, 0.9,
   ["要求：把 12 根柱子的数值替换为源A「投产变更」表中按月统计的实际投产次数（口径同第 3 页）。",
    "注意：本图使用内嵌工作表承载数据，替换方式与 Excel 图表不同。"],
   11, False, GRAY)
s.notes_slide.notes_text_frame.text = "图表数据待替换。"

# ================================================================ 5 重点系统清单（跨页表格）
s = prs.slides.add_slide(BLANK)
band(s, "三、重点系统运行质量清单",
     "按全年投产次数降序；本页容量 12 行，超出部分须续页", page_no=5)
HEADS = ["序号", "应用系统", "系统等级", "归属团队", "全年投产次数", "重大故障(起)", "平均可用率", "同比"]
CW = [0.60, 3.20, 1.00, 1.70, 1.45, 1.25, 1.55, 1.15]
ROW_N = 12
tbl = s.shapes.add_table(ROW_N + 1, len(HEADS), Inches(0.55), Inches(1.30),
                         Inches(sum(CW)), Inches(0.34 * (ROW_N + 1))).table
tbl.first_row = True
for i, w in enumerate(CW):
    tbl.columns[i].width = Inches(w)
for j, h in enumerate(HEADS):
    fill(tbl.cell(0, j), h, 10, True, WHITE, NAVY)

def yoy_text(v):
    return "新增" if not isinstance(v, float) else f"{v*100:+.1f}%"

# 已预填前 3 行（按口径算出的真实值，作为格式样板）
for i, sy in enumerate(sys_sorted[:3], 1):
    row = [sy["序号"], sy["全称"], sy["等级"], sy["团队全称"], sy["投产次数"],
           sy["重大故障"], f"{sy['可用率']*100:.3f}%", yoy_text(sy["同比"])]
    for j, v in enumerate(row):
        fill(tbl.cell(i, j), v, 9.5, False, None, LIGHT if i % 2 == 0 else None,
             center=(j != 1))
# 其余行留白
for i in range(4, ROW_N + 1):
    for j in range(len(HEADS)):
        fill(tbl.cell(i, j), TODO if j < 4 else "", 9.5, False, RGBColor(0xB0, 0x30, 0x30))

tb(s, 0.55, 5.95, 12.2, 1.1,
   ["跨页要求：本页表格单页容量为 12 行数据。若待填数据超过 12 行，须在紧随其后的新页续排，",
    "续页表头保持一致、标题标注「（续）」、序号连续不中断；不得压缩字号或删行以塞进单页。"],
   11, True, RED)
s.notes_slide.notes_text_frame.text = (
    "跨页要求：本页表格单页容量 12 行数据。若数据行数 > 12，须在紧随其后的新页续排，"
    "表头保持一致，标题标注「（续）」，序号连续不中断。禁止通过缩小字号、删减行或合并单元格来规避续页。"
)

# ================================================================ 6 团队工作完成情况
s = prs.slides.add_slide(BLANK)
band(s, "四、团队工作完成情况", "需融合源A（团队-系统归属）与源B（工作条目）两处数据", page_no=6)
H2 = ["责任团队", "归属系统数", "工作条目数", "已完成", "进行中", "延期", "投入人天"]
CW2 = [2.30, 1.55, 1.55, 1.20, 1.20, 1.10, 1.30]
tbl2 = s.shapes.add_table(7, len(H2), Inches(1.35), Inches(1.55),
                          Inches(sum(CW2)), Inches(0.42 * 7)).table
tbl2.first_row = True
for i, w in enumerate(CW2):
    tbl2.columns[i].width = Inches(w)
for j, h in enumerate(H2):
    fill(tbl2.cell(0, j), h, 11, True, WHITE, NAVY)
for i in range(1, 7):
    for j in range(len(H2)):
        fill(tbl2.cell(i, j), TODO if j == 0 else "", 11, False, RGBColor(0xB0, 0x30, 0x30))
tb(s, 1.35, 4.7, 10.8, 1.8,
   ["说明：",
    "· 责任团队一行一个团队，共 6 个，须使用全称（源A为简称）。",
    "· 归属系统数来自源A「应用清单」；工作条目数 / 已完成 / 进行中 / 延期 / 投入人天来自源B。",
    "· 源B 的状态字段存在「已完成 / 完成 / 进行中 / 延期」多种写法，「已完成」与「完成」应视为同一种状态。"],
   11, False, GRAY)
s.notes_slide.notes_text_frame.text = "团队表待填。"

# ================================================================ 7 问题与改进
s = prs.slides.add_slide(BLANK)
band(s, "五、存在的主要问题", "请基于台账与条目数据归纳", page_no=7)
tb(s, 0.7, 1.4, 11.9, 5.2,
   [("【待填】", 18, True, RED),
    "", "",
    "建议从以下线索展开（不限于）：",
    "· 故障复现：台账中有「是否重复发生」标记，可统计重复故障占比。",
    "· 变更质量：涉资金变更与回退情况、平均影响时长。",
    "· 团队交付：延期条目集中在哪些团队与类别。",
    "· 运行韧性：可用率相对偏低的系统及其归属。"],
   12.5, False, None, spacing=1.35)
s.notes_slide.notes_text_frame.text = "问题页待填。"

# ================================================================ 8 明年计划
s = prs.slides.add_slide(BLANK)
band(s, "六、2027 年工作思路", "待补充", page_no=8)
tb(s, 0.7, 1.5, 11.9, 5.0, [("【待填】", 18, True, RED)], 12)
s.notes_slide.notes_text_frame.text = "计划页待填。"

prs.core_properties.author = "wps-mcp synthetic fixtures"
prs.core_properties.last_modified_by = "wps-mcp synthetic fixtures"
prs.core_properties.comments = "Synthetic test data; all institutions, people and metrics are fictional."
prs.save(OUT)
print("saved:", OUT)
print("slides:", len(prs.slides._sldIdLst))
print("预填前 3 行:")
for sy in sys_sorted[:3]:
    print(f"  {sy['序号']} {sy['全称']} {sy['等级']} {sy['团队全称']} "
          f"{sy['投产次数']} {sy['重大故障']} {sy['可用率']*100:.3f}% {yoy_text(sy['同比'])}")
print("第 5 页表格容量 12 行 / 实际需", len(sys_sorted), "行 → 需续页放", len(sys_sorted) - 12, "行")
