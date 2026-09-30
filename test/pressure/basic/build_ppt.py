# -*- coding: utf-8 -*-
"""
压测素材 03 —— 高复杂度 PPT 负载。

覆盖：标题/内容/表格/图表/多形状/重名形状/超长文本/空白页/隐藏页/备注页，
表格含合并单元格与待增删的空表，图表带可回写的数据。
"""
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

OUT = "wps-mcp-压测-03-PPT.pptx"
IMG = "_asset-chart.png"

prs = Presentation()
prs.slide_width = Inches(13.333)   # 16:9
prs.slide_height = Inches(7.5)

BLANK = prs.slide_layouts[6]
TITLE_ONLY = prs.slide_layouts[5]

DARK = RGBColor(0x1F, 0x3B, 0x63)
RED = RGBColor(0xC0, 0x00, 0x00)


def add_title(slide, text, top=Inches(0.4), size=28):
    box = slide.shapes.add_textbox(Inches(0.6), top, Inches(12.1), Inches(0.9))
    tf = box.text_frame
    tf.text = text
    tf.paragraphs[0].runs[0].font.size = Pt(size)
    tf.paragraphs[0].runs[0].font.bold = True
    tf.paragraphs[0].runs[0].font.color.rgb = DARK
    box.name = "标题占位"
    return box


# ============================================================ P1 封面
slide = prs.slides.add_slide(TITLE_ONLY)
slide.shapes.title.text = "wps-mcp 压力测试负载 · PPT 卷"
sub = slide.shapes.add_textbox(Inches(0.9), Inches(3.0), Inches(11.5), Inches(2.2))
sub.name = "封面说明"
sub.text_frame.word_wrap = True
sub.text_frame.text = (
    "用途：在 WPS 演示中打开本文件，经 wps-mcp 执行下方题目。\n"
    "本文件刻意包含：合并单元格表格、可回写图表、重名形状、隐藏页、空白页、"
    "只有图片的页、超长文本、中文形状名。"
)
sub.text_frame.paragraphs[0].font.size = Pt(14)
slide.shapes.title.name = "封面主标题"
slide.notes_slide.notes_text_frame.text = "这页的备注是一段测试文本：如果读备注能拿到这句话，说明 Notes 可达。"

# ============================================================ P2 题面
slide = prs.slides.add_slide(BLANK)
add_title(slide, "题面：12 道压测题")
tasks = [
    ("P1", "把每一页的标题列出来", "标题可能不在 Title 占位符里（我故意用文本框当标题）；空页如何处理", "★"),
    ("P2", "列出第 8 页所有形状的名称和类型", "自动图形/文本框/图片/表格的类型判定；未命名形状返回什么", "★★"),
    ("P3", "读出「表格页」表格的全部内容", "含合并单元格的表格；空单元格读成什么", "★★"),
    ("P4", "让表格行数与数据条数一致", "Rows.Add() / 行删除的真实签名；增删后原有格式是否错位", "★★★"),
    ("P5", "读出柱状图的数据（分类与系列值）", "Chart.ChartData / SeriesCollection 是否可达", "★★★"),
    ("P6", "把新数据写回柱状图", "Render 里改图表数据的写法；改完是否立即刷新", "★★★"),
    ("P7", "「重名形状页」里叫「数据区」的形状有几个、分别在哪", "Shapes.Item(名字) 遇重名的行为；按索引还是按名定位", "★★★"),
    ("P8", "读出所有页的备注文字", "Notes / NotesPage 是否可达；无备注页返回什么", "★★"),
    ("P9", "把被隐藏的那一页也读出来", "隐藏页（show=0）能否被枚举到、能否被写入", "★★★"),
    ("P10", "读出图片的宽高与位置", "图片尺寸单位（EMU/磅/英寸）；相对画布的比例", "★★"),
    ("P11", "把某个文本框移动坐标并改字号", "形状 Left/Top/Width/Height 的读写；字号单位", "★★★"),
    ("P12", "新建一页并写入汇总表", "Render 里 AddSlide / AddShape 是否可行；版式选择", "★★★"),
]
tbl = slide.shapes.add_table(len(tasks) + 1, 4, Inches(0.5), Inches(1.4), Inches(12.4), Inches(5.4)).table
tbl.columns[0].width = Inches(0.8)
tbl.columns[1].width = Inches(4.6)
tbl.columns[2].width = Inches(6.2)
tbl.columns[3].width = Inches(0.8)
for i, h in enumerate(["编号", "题目（模拟用户自然语言需求）", "考察点 / 预期触发的边界", "难度"]):
    cell = tbl.cell(0, i)
    cell.text = h
    cell.text_frame.paragraphs[0].runs[0].font.bold = True
for r, t in enumerate(tasks, start=1):
    for c, v in enumerate(t):
        tbl.cell(r, c).text = str(v)
        tbl.cell(r, c).text_frame.paragraphs[0].runs[0].font.size = Pt(11)
slide.shapes[-1].name = "题面表格"

# ============================================================ P3 内容页（多级文本）
slide = prs.slides.add_slide(BLANK)
add_title(slide, "内容页：多级项目符号")
body = slide.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.5), Inches(5.2))
tf = body.text_frame
tf.word_wrap = True
lines = [
    (0, "绑定三件套：Variable / Transform / Render"),
    (1, "Variable —— 一个具名的值，唯一被持久化追踪的对象"),
    (2, "Transform —— 只读脚本，从源文档算出该值（过只读守卫）"),
    (2, "Render —— 写入脚本，把值写进目标文档（不过守卫）"),
    (0, "两条通道的差别"),
    (1, "查询：wps.exec / Transform，不可修改文档"),
    (2, "写入：只有 variable.render，且它是唯一的破坏性动作"),
    (0, "边界提示"),
    (1, "没有删除 Variable / Render 的接口 —— 探测用的 Render 会永久留下"),
]
for i, (level, text) in enumerate(lines):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.text = text
    p.level = level
    p.runs[0].font.size = Pt(15 if level == 0 else 13)

# ============================================================ P4 表格页（含合并）
slide = prs.slides.add_slide(BLANK)
add_title(slide, "表格页：含合并单元格（5 列 × 10 行）")
table_shape = slide.shapes.add_table(10, 5, Inches(0.5), Inches(1.5), Inches(12.3), Inches(4.6))
table_shape.name = "销售汇总表"
tb = table_shape.table
for i, h in enumerate(["序号", "产品线", "区域", "销售额（万元）", "同比"]):
    tb.cell(0, i).text = h
data = [
    ("1", "信用卡分期", "华东", "1,280", "+12%"),
    ("2", "消费贷", "华东", "960", "-3%"),
    ("3", "信用卡分期", "华南", "1,105", "+8%"),
    ("4", "消费贷", "华南", "845", "+21%"),
    ("5", "联合贷", "华北", "620", "-7%"),
    ("6", "信用卡分期", "华北", "730", "+4%"),
    ("7", "消费贷", "西南", "415", "+15%"),
    ("8", "联合贷", "西南", "298", "-2%"),
    ("9", "合计", "全国", "", ""),
]
for r, row in enumerate(data, start=1):
    for c, v in enumerate(row):
        tb.cell(r, c).text = str(v)
# 产品线纵向合并
tb.cell(1, 1).merge(tb.cell(3, 1))
tb.cell(1, 1).text = "信用卡分期（合并 3 行）"
tb.cell(4, 1).merge(tb.cell(5, 1))
tb.cell(4, 1).text = "消费贷（合并 2 行）"
# 合计行横向合并
tb.cell(9, 3).merge(tb.cell(9, 4))
tb.cell(9, 3).text = "合计占位（合并 2 列，待写入）"
tb.cell(9, 0).merge(tb.cell(9, 2))
tb.cell(9, 0).text = "合计"

# ============================================================ P5 空表页（待增删行）
slide = prs.slides.add_slide(BLANK)
add_title(slide, "表格页 2：只有 3 行，等你按数据增删")
small = slide.shapes.add_table(3, 3, Inches(1.5), Inches(1.8), Inches(9.0), Inches(2.4))
small.name = "动态行表格"
st = small.table
for i, h in enumerate(["#", "指标", "值"]):
    st.cell(0, i).text = h
st.cell(1, 0).text = "1"
st.cell(1, 1).text = "占位行"
st.cell(1, 2).text = "--"
st.cell(2, 0).text = "2"
st.cell(2, 1).text = "占位行"
st.cell(2, 2).text = "--"
note = slide.shapes.add_textbox(Inches(1.5), Inches(4.5), Inches(9.0), Inches(1.2))
note.text_frame.text = "题面 P4 与这里相关：让本表行数匹配 Variable 里的数据条数（先增后删，注意循环加保护）。"
note.name = "说明文本框"

# ============================================================ P6 柱状图页（可回写）
slide = prs.slides.add_slide(BLANK)
add_title(slide, "图表页 1：柱状图（题面 P5 / P6 指向这里）")
chart_data = CategoryChartData()
chart_data.categories = ["华东", "华南", "华北", "西南", "东北"]
chart_data.add_series("2025 年", (1280, 960, 620, 415, 180))
chart_data.add_series("2026 年", (1420, 1105, 730, 498, 226))
gf = slide.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(1.0), Inches(1.6), Inches(7.6), Inches(4.8), chart_data)
gf.name = "区域销售柱状图"
gf.chart.has_legend = True
gf.chart.legend.position = XL_LEGEND_POSITION.BOTTOM

# ============================================================ P7 饼图页
slide = prs.slides.add_slide(BLANK)
add_title(slide, "图表页 2：饼图")
pie_data = CategoryChartData()
pie_data.categories = ["信用卡分期", "消费贷", "联合贷", "其他"]
pie_data.add_series("占比", (0.42, 0.31, 0.19, 0.08))
pf = slide.shapes.add_chart(XL_CHART_TYPE.PIE, Inches(2.2), Inches(1.7), Inches(6.4), Inches(4.6), pie_data)
pf.name = "产品线饼图"
pf.chart.has_legend = True
pf.chart.legend.position = XL_LEGEND_POSITION.RIGHT

# ============================================================ P8 多形状页
slide = prs.slides.add_slide(BLANK)
add_title(slide, "多形状页：自动图形 + 文本框 + 图片")
shapes = [
    (MSO_SHAPE.ROUNDED_RECTANGLE, "圆角矩形-流程1", 0.6, 1.6, 2.4, 1.0),
    (MSO_SHAPE.CHEVRON, "箭头-流程2", 3.3, 1.6, 2.4, 1.0),
    (MSO_SHAPE.OVAL, "椭圆-指标", 6.2, 1.6, 2.0, 1.0),
    (MSO_SHAPE.DIAMOND, "菱形-判断", 8.6, 1.6, 2.2, 1.0),
    (MSO_SHAPE.RECTANGLE, "矩形-备注", 0.6, 3.0, 4.0, 0.9),
    (MSO_SHAPE.ISOSCELES_TRIANGLE, "三角形-警示", 5.0, 3.0, 2.2, 0.9),
    (MSO_SHAPE.PENTAGON, "五边形", 7.6, 3.0, 2.2, 0.9),
    (MSO_SHAPE.STAR_5_POINT, "五角星", 10.2, 3.0, 2.2, 0.9),
]
for kind, name, l, t, w, h in shapes:
    sp = slide.shapes.add_shape(kind, Inches(l), Inches(t), Inches(w), Inches(h))
    sp.name = name
    sp.text_frame.text = name
    sp.text_frame.paragraphs[0].font.size = Pt(10)

pic = slide.shapes.add_picture(IMG, Inches(0.6), Inches(4.3), width=Inches(2.4))
pic.name = "测试图片"
tb = slide.shapes.add_textbox(Inches(3.4), Inches(4.3), Inches(8.8), Inches(1.6))
tb.name = "长文本说明"
tb.text_frame.word_wrap = True
tb.text_frame.text = ("这个文本框承载一段较长的说明文字，用于测试文本形状的读取与改写。"
                      "它同时包含中文、English、数字 12345 与符号。") * 3

# ============================================================ P9 重名形状页
slide = prs.slides.add_slide(BLANK)
add_title(slide, "重名形状页：两个形状都叫「数据区」")
a = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.0), Inches(2.0))
a.name = "数据区"
a.text_frame.text = "数据区 A（左侧）"
b = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.6), Inches(1.8), Inches(5.0), Inches(2.0))
b.name = "数据区"
b.text_frame.text = "数据区 B（右侧）"
tip = slide.shapes.add_textbox(Inches(0.8), Inches(4.2), Inches(10.8), Inches(1.2))
tip.text_frame.word_wrap = True
tip.text_frame.text = ("题面 P7：两个形状的 Name 完全相同。按名字取会拿到哪一个？"
                       "按 Shapes.Item(名字) 是否会抛错？这是演示文稿里很常见的坑。")
tip.name = "重名提示"

# ============================================================ P10 超长文本页
slide = prs.slides.add_slide(BLANK)
add_title(slide, "超长文本页")
lt = slide.shapes.add_textbox(Inches(0.7), Inches(1.5), Inches(12.0), Inches(5.4))
lt.name = "超长文本框"
lt.text_frame.word_wrap = True
lt.text_frame.text = (
    "本页用于制造单个文本框内的超长文本，内容不分段，因此任何按段落切分的实现都只能拿到一段。"
    "消费金融的监管报送说明、产品说明书概要、系统迁移方案摘要经常以这种形态出现在汇报材料里。"
) * 10

# ============================================================ P11 空白页
slide = prs.slides.add_slide(BLANK)
# 故意什么都不放

# ============================================================ P12 只有图片的页
slide = prs.slides.add_slide(BLANK)
only = slide.shapes.add_picture(IMG, Inches(4.2), Inches(1.9), width=Inches(5.0))
only.name = "独占图片"

# ============================================================ P13 隐藏页
slide = prs.slides.add_slide(BLANK)
add_title(slide, "隐藏页（show=0）")
txt = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.0), Inches(2.0))
txt.text_frame.text = "这一页在放映与大纲里都是隐藏状态。题面 P9 指向这里：能否枚举到、能否写入。"
txt.name = "隐藏页文本"
slide._element.set("show", "0")

# ============================================================ P14 备注页
slide = prs.slides.add_slide(BLANK)
add_title(slide, "备注页：本页的备注比正文长")
body = slide.shapes.add_textbox(Inches(0.8), Inches(1.7), Inches(11.0), Inches(2.4))
body.text_frame.text = "正文只有这一句，但本页的备注（Notes）里写了很长一段话。题面 P8 指向这里。"
body.name = "备注页正文"
slide.notes_slide.notes_text_frame.text = (
    "这是备注内容，用于测试 Notes 的读取与写入。备注里同样可以包含换行、数字 2026、"
    "以及一些特殊字符（—、《》、¥1,234.56）。" * 6
)

# ============================================================ P15 中文形状名页
slide = prs.slides.add_slide(BLANK)
add_title(slide, "中文与特殊形状名页")
names = ["汇总表（含括号）", "图表-2026年", "文本框 带 空格", "shape-with-dash", "形状#1", "符号★形状"]
for i, nm in enumerate(names):
    sp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                Inches(0.6 + (i % 3) * 4.2), Inches(1.8 + (i // 3) * 2.2),
                                Inches(3.6), Inches(1.4))
    sp.name = nm
    sp.text_frame.text = nm
    sp.text_frame.paragraphs[0].font.size = Pt(11)

prs.core_properties.title = "wps-mcp 压力测试负载 · PPT 卷"
prs.core_properties.author = "wps-mcp pressure test"
prs.save(OUT)
print("saved:", OUT)
print("slides:", len(prs.slides._sldIdLst))
