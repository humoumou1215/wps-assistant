# -*- coding: utf-8 -*-
"""
压测素材 02 —— 高复杂度 WPS Writer 负载。

覆盖：多级标题、样式、超长段落、特殊字符、含合并单元格的大表格、
嵌套列表、页眉页脚与页码域、TOC 域、书签、超链接、文本框、图片、隐藏文字、分节。
"""
import os
import struct
import zlib
from datetime import date

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Pt, RGBColor

OUT = "wps-mcp-压测-02-Writer.docx"
IMG = "_asset-chart.png"


def make_png(path, width, height):
    """纯 Python 生成一张渐变 PNG，避免额外依赖。"""
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0
        for x in range(width):
            raw += bytes(((x * 255) // max(width - 1, 1), (y * 255) // max(height - 1, 1), 200))

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)


make_png(IMG, 240, 120)

doc = Document()

# ---------------------------------------------------------------- 基础样式
normal = doc.styles["Normal"]
normal.font.name = "微软雅黑"
normal.font.size = Pt(10.5)
normal.paragraph_format.space_after = Pt(6)


def field(paragraph, instr, placeholder=""):
    """插入一个域（TOC / PAGE / NUMPAGES）。"""
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr_el = OxmlElement("w:instrText")
    instr_el.set(qn("xml:space"), "preserve")
    instr_el.text = instr
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    text_el = OxmlElement("w:t")
    text_el.text = placeholder
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for el in (begin, instr_el, sep, text_el, end):
        run._r.append(el)


def add_hyperlink(paragraph, url, text):
    r_id = paragraph.part.relate_to(url, RT.HYPERLINK, is_external=True)
    link = OxmlElement("w:hyperlink")
    link.set(qn("r:id"), r_id)
    run = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    style = OxmlElement("w:rStyle")
    style.set(qn("w:val"), "Hyperlink")
    rpr.append(style)
    run.append(rpr)
    t = OxmlElement("w:t")
    t.text = text
    run.append(t)
    link.append(run)
    paragraph._p.append(link)


def add_bookmark(paragraph, name, bid):
    start = OxmlElement("w:bookmarkStart")
    start.set(qn("w:id"), str(bid))
    start.set(qn("w:name"), name)
    end = OxmlElement("w:bookmarkEnd")
    end.set(qn("w:id"), str(bid))
    paragraph._p.insert(0, start)
    paragraph._p.append(end)


def add_textbox(anchor_paragraph, text, width_pt=240, height_pt=70):
    """插入一个 VML 文本框（python-docx 无原生 API，手动声明 VML 命名空间）。"""
    xml = (
        '<w:pict '
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:v="urn:schemas-microsoft-com:vml">'
        f'<v:shape id="ptbox1" type="#_x0000_t202" '
        f'style="width:{width_pt}pt;height:{height_pt}pt;visibility:visible" '
        f'fillcolor="#FFF2CC" strokecolor="#BF8F00" strokeweight="1pt">'
        f'<v:textbox><w:txbxContent><w:p><w:r><w:t xml:space="preserve">{text}</w:t></w:r></w:p>'
        f'</w:txbxContent></v:textbox></v:shape></w:pict>'
    )
    run = anchor_paragraph.add_run()
    run._r.append(parse_xml(xml))


# ---------------------------------------------------------------- 标题与题面
title = doc.add_heading("wps-mcp 压力测试负载 · Writer 卷", level=0)
sub = doc.add_paragraph()
sub.add_run("用途：在 WPS 文字中打开本文件，经 wps-mcp 执行下方题目，观察 Transform（只读）与 Render（可写）"
            "在真实 Writer 文档上的行为。文中每一节都对应一组压测点，不要只读开头。").italic = True

doc.add_heading("目录（域：需右键更新）", level=1)
toc_p = doc.add_paragraph()
field(toc_p, 'TOC \\o "1-3" \\h \\z \\u', "右键此处选择「更新域」生成目录")

doc.add_heading("题面：14 道压测题", level=1)
tasks = [
    ("W1", "读全文，我要检查内容", "段落层级如何体现（Style 名 vs 大纲级别）；长文一次性取回的体积", "全文", "★"),
    ("W2", "把「3 表格」整张表读出来", "含合并单元格的表格：gridSpan / vMerge 的还原、空单元格、超长单元格", "§3 表格", "★★★"),
    ("W3", "改写表格第 3 行第 5 列的值", "Writer 表格 Cell(row, col) 是 1 基还是 0 基；合并区里的坐标是否仍然有效", "§3 表格", "★★★"),
    ("W4", "让表格行数与数据条数一致（增/删行）", "Rows.Add() / Row.Delete() 的真实签名；增删后公式与合并是否错位", "§3 表格", "★★★"),
    ("W5", "读出页眉和页脚的文字", "Header / Footer 是否可达；页码域读到的是域代码还是渲染值", "页眉页脚", "★★"),
    ("W6", "把目录里的条目列出来", "TOC 是域：读到的是域代码、缓存文本还是真正的标题集合", "§目录", "★★★"),
    ("W7", "读出所有超链接的显示文字与目标地址", "Hyperlink.Address 与 TextToDisplay 的区分；段落内联超链接的遍历", "§6 超链接", "★★★"),
    ("W8", "读出书签「AnchorPoint」的位置", "Bookmarks 集合是否可达；书签范围如何取文本", "§5 书签", "★★"),
    ("W9", "读出图片的宽高与锚定方式", "InlineShape / Shape 的区别；图片尺寸单位（磅 vs 像素）", "§5 图片", "★★"),
    ("W10", "读出被隐藏的那段文字", "隐藏文字（hidden）是否会被读取；与「不可见 = 读不到」的直觉是否一致", "§7 隐藏文字", "★★"),
    ("W11", "把超长段落截断成前 50 字", "单段 2000+ 字的字符级操作性能与截断边界", "§1 超长段落", "★★"),
    ("W12", "在「锚点段落」后面插入一行汇总文本", "InsertAfter / InsertParagraphAfter 的行为；插入后原有样式是否被破坏", "§5 书签", "★★★"),
    ("W13", "把另一份 Excel 的汇总结果写成这里的表格", "跨文档 Render；目标表格行数自适应（先增后删）", "§3 表格", "★★★"),
    ("W14", "这份文档有几节？页面是横向还是纵向？", "Sections 集合；分节后的页面设置差异", "§8 分节", "★★"),
]
table = doc.add_table(rows=1, cols=5)
table.style = "Light Grid Accent 1"
table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = table.rows[0].cells
for i, h in enumerate(["编号", "题目（模拟用户自然语言需求）", "考察点 / 预期触发的边界", "位置", "难度"]):
    hdr[i].text = h
    for p in hdr[i].paragraphs:
        for r in p.runs:
            r.bold = True
for row_data in tasks:
    cells = table.add_row().cells
    for i, v in enumerate(row_data):
        cells[i].text = str(v)
for row in table.rows:
    row.cells[0].width = Pt(36)
    row.cells[4].width = Pt(36)

# ---------------------------------------------------------------- 1 文本与样式
doc.add_heading("1 文本与样式", level=1)
doc.add_heading("1.1 标题层级", level=2)
doc.add_heading("1.1.1 三级标题", level=3)
doc.add_heading("1.1.1.1 四级标题", level=4)
doc.add_paragraph("本段是普通正文，用于验证「按样式取段落」这类需求能否按 Heading 1/2/3/4 精确命中。")

doc.add_heading("1.2 段落与样式", level=2)
p = doc.add_paragraph("这是一段引用样式文本。", style="Intense Quote")
p = doc.add_paragraph("这是一段代码样式文本：const x = Application.ActiveDocument;", style="No Spacing")
for run in p.runs:
    run.font.name = "Consolas"

doc.add_heading("1.3 超长段落（单段 2000+ 字）", level=2)
long_text = (
    "本文用于制造超长单段场景，段落内部不含任何换行符，因此任何按行切分的实现都必须把整段当成一行处理。"
    "银行消金业务的合同条款、监管报送说明、系统迁移方案概述经常出现这种数千字不分段的长文本，"
    "它同时考验三个环节：读取时的一次性体积、字符串处理时的性能、以及写回时是否会被自动换行或截断。"
) * 12
doc.add_paragraph(long_text)

doc.add_heading("1.4 中英文混排与数字", level=2)
doc.add_paragraph("Mixed 中英文 123 and 符号 !@#$%^&*()_+-=[]{}|;':\",./<>? 的混排段落。")
p = doc.add_paragraph()
p.add_run("加粗").bold = True
p.add_run(" / ")
p.add_run("斜体").italic = True
p.add_run(" / ")
p.add_run("下划线").underline = True
p.add_run(" / ")
r = p.add_run("彩色字")
r.font.color.rgb = RGBColor(0xC0, 0x00, 0x00)
p.add_run(" / ")
r = p.add_run("上标2")
r.font.superscript = True

# ---------------------------------------------------------------- 2 特殊字符
doc.add_heading("2 特殊字符与不可见字符", level=1)
special = [
    "全角数字：１２３４５６７８９０",
    "全角字母：ＡＢＣＤＥ",
    "中文标点：，。、；：「」《》——……",
    "零宽字符：a\u200bb（中间有一个零宽空格）",
    "制表符：A\tB\tC（中间是制表符）",
    "反斜杠路径：C:\\Users\\test\\压力测试\\文件.xlsx",
    "Emoji：🚀 📊 ✅ ❌ 🎯",
    "数学符号：∑ ∫ ≈ ≠ ≤ ≥ ± × ÷",
    "罗马数字：Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ",
    "货币：¥ 1,234.56 ／ $ 1,234.56 ／ € 1,234.56",
]
for s in special:
    doc.add_paragraph(s, style="List Bullet")

# ---------------------------------------------------------------- 3 表格
doc.add_heading("3 表格（含合并单元格与超长单元格）", level=1)
doc.add_paragraph("该表 8 列 × 26 行（含表头），内含：横向合并表头、纵向合并的分类列、空单元格、超长单元格、"
                  "数字/日期/百分比混排。题面 W2 / W3 / W4 / W13 都指向它。")

cols = ["序号", "项目名称", "区域", "负责人", "开始日期", "金额（元）", "完成率", "备注"]
big = doc.add_table(rows=1, cols=8)
big.style = "Table Grid"
head_cells = big.rows[0].cells
for i, c in enumerate(cols):
    head_cells[i].text = c
    for p in head_cells[i].paragraphs:
        for r in p.runs:
            r.bold = True

rows_data = []
for i in range(1, 25):
    rows_data.append([
        str(i),
        f"项目{i:02d}·系统改造" if i % 5 else "项目名称超长测试：" + "超长项目名称" * 6,
        ["华东", "华南", "华北", "西南"][i % 4],
        ["张三", "李四", "王五", "", "赵六"][i % 5],
        f"2026-{(i % 12) + 1:02d}-{(i % 27) + 1:02d}",
        f"{i * 13700 + 2500:,}",
        f"{min(i * 4, 100)}%",
        "" if i % 6 == 0 else ("备注：该行备注刻意留长，" * 4 if i % 4 == 0 else "正常"),
    ])

for rd in rows_data:
    cells = big.add_row().cells
    for i, v in enumerate(rd):
        cells[i].text = v

# 横向合并：表头跨列
big.cell(0, 5).merge(big.cell(0, 6))
big.cell(0, 5).text = "金额与进度（合并表头）"
# 纵向合并：区域列
big.cell(1, 2).merge(big.cell(4, 2))
big.cell(1, 2).text = "华东（合并 4 行）"
big.cell(5, 2).merge(big.cell(8, 2))
big.cell(5, 2).text = "华南（合并 4 行）"
# 纵向合并：负责人列
big.cell(9, 3).merge(big.cell(12, 3))
big.cell(9, 3).text = "王五（合并 4 行）"

doc.add_paragraph()
doc.add_paragraph("↑ 表格结束。注意第 2 行起的「区域」列是纵向合并区，只有左上角有值。").italic = True

# ---------------------------------------------------------------- 4 嵌套列表
doc.add_heading("4 多级列表", level=1)
for i in range(1, 4):
    doc.add_paragraph(f"一级条目 {i}", style="List Number")
    for j in range(1, 4):
        doc.add_paragraph(f"二级条目 {i}.{j}", style="List Bullet 2")
        if j == 2:
            doc.add_paragraph(f"三级条目 {i}.{j}.1", style="List Bullet 3")

# ---------------------------------------------------------------- 5 图片 / 文本框 / 书签
doc.add_heading("5 图片、文本框与书签", level=1)
doc.add_paragraph("下面是一张 240×120 的内联图片。")
doc.add_picture(IMG, width=Pt(180))

doc.add_paragraph("下面是一个 VML 文本框（若 WPS 无法显示，说明该构造在当前宿主不被支持 —— 这本身也是压测结论）。")
try:
    add_textbox(doc.paragraphs[-1], "文本框内的文字：从这里能读到吗？")
    doc.add_paragraph()
    textbox_ok = True
except Exception as exc:  # noqa: BLE001
    doc.add_paragraph(f"（文本框构造失败：{exc}）")
    textbox_ok = False

anchor = doc.add_paragraph("锚点段落：这是一个书签所在的位置，题面 W8 / W12 指向这里。")
add_bookmark(anchor, "AnchorPoint", 1001)

# ---------------------------------------------------------------- 6 超链接
doc.add_heading("6 超链接", level=1)
p = doc.add_paragraph("项目主页：")
add_hyperlink(p, "https://github.com/humoumou1215", "humoumou1215 的 GitHub")
p = doc.add_paragraph("参考文档：")
add_hyperlink(p, "https://example.com/docs/wps-js-api", "WPS JS API 文档（示例地址）")

# ---------------------------------------------------------------- 7 隐藏文字与分节
doc.add_heading("7 隐藏文字", level=1)
p = doc.add_paragraph()
r = p.add_run("【这段文字被设置为隐藏（hidden），用于验证是否仍可被读取】")
r.font.hidden = True
doc.add_paragraph("上一段之后有一个隐藏 run；如果读取结果里出现了它的内容，说明隐藏属性未生效或被忽略。")

# ---------------------------------------------------------------- 8 分节
doc.add_heading("8 分节与页面设置", level=1)
doc.add_paragraph("本节之后将插入分节符，并切换为横向页面，用于验证 Sections 的读取。")

new_section = doc.add_section(WD_SECTION.NEW_PAGE)
new_section.orientation = WD_ORIENT.LANDSCAPE
new_section.page_width, new_section.page_height = new_section.page_height, new_section.page_width
doc.add_heading("8.1 横向页（第二节）", level=2)
doc.add_paragraph("本页所在的节被设置为横向 A4。若读取到的页面宽度仍是纵向值，说明节属性没有被正确取到。")

# ---------------------------------------------------------------- 页眉页脚
for section in doc.sections:
    header = section.header
    hp = header.paragraphs[0]
    hp.text = "wps-mcp 压测负载 · Writer 卷 · 页眉"
    hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer = section.footer
    fp = footer.paragraphs[0]
    fp.text = "页脚：第 "
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    field(fp, "PAGE", "1")
    fp.add_run(" 页 / 共 ")
    field(fp, "NUMPAGES", "1")
    fp.add_run(" 页")

doc.core_properties.title = "wps-mcp 压力测试负载 · Writer 卷"
doc.core_properties.author = "wps-mcp pressure test"

doc.save(OUT)
print("saved:", OUT)
print("paragraphs:", len(doc.paragraphs), "tables:", len(doc.tables), "textbox_ok:", textbox_ok)
