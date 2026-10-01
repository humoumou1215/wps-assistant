# -*- coding: utf-8 -*-
"""
round2 · 目标2 生成器
产出：目标2-2026年度生产运行分析报告.docx

角色：报告「半成品」，章节骨架 + 表格结构齐备，数据留白。
刻意设计：
  1. 第二章表格为「多级表头 + 合并单元格」，写入位置需要精确定位
  2. 第三章表格 16 行数据必然跨页——跨页后标题行需保持重复（w:tblHeader）
  3. 第一章 4 处数值、第五章整段文字均需从源文件推导后写入
  4. 团队名须用全称（源A为简称），且第四章要融合两个源
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import truth

from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUT = "目标2-2026年度生产运行分析报告.docx"
FONT = "微软雅黑"
NAVY = RGBColor(0x1F, 0x4E, 0x79)
GRAY = RGBColor(0x59, 0x59, 0x59)
RED = RGBColor(0xB0, 0x30, 0x30)
TODO = "【待填】"

doc = Document()
doc.add_paragraph("合成测试数据：机构、人员、系统和指标均为虚构，不代表任何真实银行的经营或运行情况。")

# ---------------------------------------------------------------- 全局样式
st = doc.styles["Normal"]
st.font.name = FONT
st.font.size = Pt(10.5)
st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
st.paragraph_format.space_after = Pt(6)
st.paragraph_format.line_spacing = 1.45

for hs, sz in (("Heading 1", 15), ("Heading 2", 12.5)):
    s_ = doc.styles[hs]
    s_.font.name = FONT
    s_.font.size = Pt(sz)
    s_.font.bold = True
    s_.font.color.rgb = NAVY
    s_.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)


def para(text, size=10.5, bold=False, color=None, align=WD_ALIGN_PARAGRAPH.LEFT,
         space_before=0, space_after=6, indent=False):
    p = doc.add_paragraph()
    p.alignment = align
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    if indent:
        p.paragraph_format.first_line_indent = Cm(0.74)
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.name = FONT
    r._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    if color is not None:
        r.font.color.rgb = color
    return p


def cell_text(cell, text, size=10, bold=False, color=None, align=WD_ALIGN_PARAGRAPH.CENTER):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.name = FONT
    r._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    if color is not None:
        r.font.color.rgb = color


def shade(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def set_grid(table, cms):
    """锁定表格列宽（cm），避免渲染器自动伸缩导致顶到页边距。"""
    tbl = table._tbl
    tblPr = tbl.tblPr
    for el in tblPr.findall(qn("w:tblLayout")):
        tblPr.remove(el)
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblPr.append(layout)
    old = tbl.find(qn("w:tblGrid"))
    if old is not None:
        tbl.remove(old)
    grid = OxmlElement("w:tblGrid")
    for w in cms:
        gc = OxmlElement("w:gridCol")
        gc.set(qn("w:w"), str(int(round(w * 566.93))))
        grid.append(gc)
    tblPr.addnext(grid)


def add_page_field(paragraph, instr):
    r = paragraph.add_run()
    f1 = OxmlElement("w:fldChar"); f1.set(qn("w:fldCharType"), "begin")
    it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = instr
    f2 = OxmlElement("w:fldChar"); f2.set(qn("w:fldCharType"), "end")
    r._r.append(f1); r._r.append(it); r._r.append(f2)
    r.font.size = Pt(9)
    r.font.name = FONT
    return r


# ---------------------------------------------------------------- 页面与页眉页脚
sec = doc.sections[0]
sec.page_width = Cm(21.0); sec.page_height = Cm(29.7)
sec.top_margin = Cm(2.6); sec.bottom_margin = Cm(2.4)
sec.left_margin = Cm(2.6); sec.right_margin = Cm(2.4)

hdr_p = sec.header.paragraphs[0]
hdr_p.text = ""
hdr_p.alignment = WD_ALIGN_PARAGRAPH.LEFT
r1 = hdr_p.add_run("示例银行科技部 · 2026 年度生产运行分析报告")
r1.font.size = Pt(9); r1.font.name = FONT; r1.font.color.rgb = GRAY
r1._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
r2 = hdr_p.add_run("　　　　　　　文件编号：" + TODO)
r2.font.size = Pt(9); r2.font.name = FONT; r2.font.color.rgb = RED
r2._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

ftr_p = sec.footer.paragraphs[0]
ftr_p.text = ""
ftr_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r3 = ftr_p.add_run("第 "); r3.font.size = Pt(9); r3.font.name = FONT
add_page_field(ftr_p, "PAGE")
r4 = ftr_p.add_run(" 页  共 "); r4.font.size = Pt(9); r4.font.name = FONT
add_page_field(ftr_p, "NUMPAGES")
r5 = ftr_p.add_run(" 页"); r5.font.size = Pt(9); r5.font.name = FONT

# ---------------------------------------------------------------- 标题
h = doc.add_paragraph()
h.alignment = WD_ALIGN_PARAGRAPH.CENTER
h.paragraph_format.space_after = Pt(4)
rh = h.add_run("2026 年度生产运行分析报告")
rh.font.size = Pt(20); rh.font.bold = True; rh.font.color.rgb = NAVY
rh.font.name = FONT; rh._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub.paragraph_format.space_after = Pt(16)
rs = sub.add_run("（报告期：2026-01-01 至 2026-12-31   数据来源：生产运行台账、团队工作条目汇编）")
rs.font.size = Pt(9.5); rs.font.color.rgb = GRAY
rs.font.name = FONT; rs._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

# ---------------------------------------------------------------- 一、总体情况
doc.add_heading("一、总体情况", level=1)
para("2026 年，科技部各研发团队围绕生产运行保障与重点项目建设两条主线推进工作。"
     "全年纳入运行台账管理的在运应用系统共 16 套，覆盖消费金融、征信服务、数据平台、"
     "基础运维与安全合规五类方向。", indent=True)
para("全年生产运行与建设投入的核心指标如下：")
for label, unit in (("全年投产总次数", "次"), ("重大故障起数", "起"),
                    ("系统平均可用率", ""), ("完成工作条目数", "条")):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(f"{label}：")
    r.font.size = Pt(10.5); r.font.name = FONT
    r._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    r2 = p.add_run(TODO + unit)
    r2.font.size = Pt(10.5); r2.font.bold = True; r2.font.color.rgb = RED
    r2.font.name = FONT; r2._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
para("上述指标口径与台账字段存在差异，需按汇报口径换算后填写：投产次数仅计入"
     "「投产上线」与「紧急修复」；重大故障仅计入事件等级一级；平均可用率为按交易笔数加权的结果。",
     size=9.5, color=GRAY)

# ---------------------------------------------------------------- 二、投产变更分析
doc.add_heading("二、投产变更分析", level=1)
para("按责任团队统计全年投产变更情况如下表。表中「投产次数」口径与第一章一致，"
     "「回退次数」统计变更单中标记为已回退的记录，影响时长取该团队全部变更的合计值。", indent=True)

T2_HEAD = ["责任团队", "投产次数", "优化变更", "紧急修复", "回退次数", "平均影响时长(分)"]
t2 = doc.add_table(rows=8, cols=6)
t2.style = "Table Grid"
t2.alignment = WD_TABLE_ALIGNMENT.CENTER
set_grid(t2, [2.8, 2.4, 2.4, 2.4, 2.4, 3.2])

# 第 1 行：表头（含合并）
cell_text(t2.cell(0, 0), "责任团队", 10, True, RGBColor(0xFF, 0xFF, 0xFF))
c = t2.cell(0, 1).merge(t2.cell(0, 3))
cell_text(c, "投产变更情况", 10, True, RGBColor(0xFF, 0xFF, 0xFF))
c = t2.cell(0, 4).merge(t2.cell(0, 5))
cell_text(c, "变更质量", 10, True, RGBColor(0xFF, 0xFF, 0xFF))
# 第 2 行：子表头
for j, txt in enumerate(["", "投产次数", "优化变更", "紧急修复", "回退次数", "平均影响时长(分)"]):
    cell_text(t2.cell(1, j), txt, 9.5, True, RGBColor(0xFF, 0xFF, 0xFF))
# 第 1 列表头纵向合并
cell_text(t2.cell(0, 0).merge(t2.cell(1, 0)), "责任团队", 10, True, RGBColor(0xFF, 0xFF, 0xFF))

for r in (0, 1):
    for cc in range(6):
        shade(t2.cell(r, cc), "1F4E79")
# 数据区留白
for i in range(2, 8):
    for j in range(6):
        cell_text(t2.cell(i, j), TODO if j == 0 else "", 10, False,
                  RED if j == 0 else None)

para("结论：", size=10.5, bold=True, space_before=8)
p = doc.add_paragraph()
p.paragraph_format.first_line_indent = Cm(0.74)
r = p.add_run(TODO + "（请基于上表与本年度台账，概述投产变更的总体特征，"
              "并指出变更量最大与回退最多的团队。）")
r.font.size = Pt(10.5); r.font.color.rgb = RED
r.font.name = FONT; r._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

# ---------------------------------------------------------------- 三、故障事件分析
doc.add_heading("三、故障事件分析", level=1)
para("按应用系统统计全年故障事件等级分布与日志异常情况如下表。"
     "其中「重大故障」为事件等级一级的起数（台账中存在 I级 手写写法，属同一等级）；"
     "「日志异常总数」为该年度 12 个月日志异常条数的合计。", indent=True)
para("本表共 16 个数据行，跨页显示时标题行需保持重复出现。", size=9.5, color=GRAY)

T3_HEAD = ["应用系统", "一级", "二级", "三级", "重大故障(起)", "日志异常总数", "平均可用率"]
ROW3 = 17
t3 = doc.add_table(rows=ROW3, cols=7)
t3.style = "Table Grid"
t3.alignment = WD_TABLE_ALIGNMENT.CENTER
set_grid(t3, [3.4, 1.6, 1.6, 1.6, 2.2, 2.6, 2.6])
for j, htxt in enumerate(T3_HEAD):
    cell_text(t3.cell(0, j), htxt, 9.5, True, RGBColor(0xFF, 0xFF, 0xFF))
    shade(t3.cell(0, j), "1F4E79")
for i in range(1, ROW3):
    for j in range(7):
        cell_text(t3.cell(i, j), TODO if j == 0 else "", 9.5, False, RED if j == 0 else None)

para("结论：", size=10.5, bold=True, space_before=8)
p = doc.add_paragraph()
p.paragraph_format.first_line_indent = Cm(0.74)
r = p.add_run(TODO + "（请基于上表归纳本年度故障特征：故障高发系统、等级构成，"
              "以及可用率与故障次数的关系。）")
r.font.size = Pt(10.5); r.font.color.rgb = RED
r.font.name = FONT; r._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)

# ---------------------------------------------------------------- 四、团队工作完成情况
doc.add_heading("四、团队工作完成情况", level=1)
para("结合台账中的系统归属关系与各团队年度工作条目，统计各团队交付情况如下表。"
     "「归属系统数」指该团队负责运维研发的在运系统数量。", indent=True)

T4_HEAD = ["责任团队", "归属系统数", "工作条目数", "已完成", "进行中", "延期", "投入人天"]
t4 = doc.add_table(rows=7, cols=7)
t4.style = "Table Grid"
t4.alignment = WD_TABLE_ALIGNMENT.CENTER
set_grid(t4, [3.0, 2.4, 2.4, 1.9, 1.9, 1.6, 2.4])
for j, htxt in enumerate(T4_HEAD):
    cell_text(t4.cell(0, j), htxt, 9.5, True, RGBColor(0xFF, 0xFF, 0xFF))
    shade(t4.cell(0, j), "1F4E79")
for i in range(1, 7):
    for j in range(7):
        cell_text(t4.cell(i, j), TODO if j == 0 else "", 10, False, RED if j == 0 else None)

# ---------------------------------------------------------------- 五、问题与改进建议
doc.add_heading("五、问题与改进建议", level=1)
for _ in range(3):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0.74)
    r = p.add_run(TODO)
    r.font.size = Pt(10.5); r.font.color.rgb = RED
    r.font.name = FONT; r._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
para("（本章需结合前四章数据自行归纳，不少于 3 段，每段给出问题、证据与改进方向。）",
     size=9.5, color=GRAY)

doc.core_properties.author = "wps-mcp synthetic fixtures"
doc.core_properties.comments = "Synthetic test data; all institutions, people and metrics are fictional."
doc.save(OUT)
print("saved:", OUT)
print("章节: 一、总体情况 / 二、投产变更分析 / 三、故障事件分析 / 四、团队工作完成情况 / 五、问题与改进建议")
print("表2: 多级表头 6 列 × 8 行（含 2 行表头，6 个团队待填）")
print("表3: 7 列 × %d 行（1 表头 + 16 数据行，必然跨页）" % ROW3)
print("表4: 7 列 × 7 行（含表头，6 个团队待填）")
