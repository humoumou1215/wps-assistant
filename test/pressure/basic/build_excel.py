# -*- coding: utf-8 -*-
"""
压测素材 01 —— 高复杂度 Excel 负载。

设计目标：为 WPS MCP 的 Transform（只读）与 Render（可写）制造尽量多的边界，
而不是做一份"好看的表"。每个 sheet 都埋了具体陷阱，题面写在 0-题面 里。
"""
import random
from datetime import date, datetime

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT = "wps-mcp-压测-01-Excel.xlsx"

THIN = Side(style="thin", color="FFBFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
HEAD_FILL = PatternFill("solid", fgColor="FF4472C4")
HEAD_FONT = Font(name="微软雅黑", size=10, bold=True, color="FFFFFFFF")
BODY_FONT = Font(name="微软雅黑", size=10)
WARN_FILL = PatternFill("solid", fgColor="FFFFC7CE")

random.seed(20260930)

wb = Workbook()

# ============================================================ 0-题面
ws = wb.active
ws.title = "0-题面"
ws.column_dimensions["A"].width = 8
ws.column_dimensions["B"].width = 46
ws.column_dimensions["C"].width = 52
ws.column_dimensions["D"].width = 30
ws.column_dimensions["E"].width = 10

ws["A1"] = "wps-mcp 压力测试负载 · Excel 卷 · 题面"
ws.merge_cells("A1:E1")
ws["A1"].font = Font(name="微软雅黑", size=15, bold=True, color="FF2F5597")
ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 30

ws["A2"] = "用法：把本文件在 WPS 表格中打开，经 wps-mcp 对其执行下方题目；每题先试 Transform（只读），需要写入的再用 Render。注意标「陷阱」的列，它们才是压测点。"
ws.merge_cells("A2:E2")
ws["A2"].font = Font(name="微软雅黑", size=9, italic=True, color="FF595959")
ws["A2"].alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
ws.row_dimensions[2].height = 28

headers = ["编号", "题目（模拟用户自然语言需求）", "考察点 / 预期触发的边界", "涉及位置", "难度"]
for i, h in enumerate(headers, start=1):
    c = ws.cell(row=4, column=i, value=h)
    c.font = HEAD_FONT
    c.fill = HEAD_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = BORDER

tasks = [
    ("E1", "把「1-销售明细」这张表全部读出来，我要做核对",
     "表头不在第 1 行（第 3 行才是表头）；500 行 × 12 列一次性序列化的体积与稳定性", "1-销售明细!A3:L503", "★"),
    ("E2", "「2-合并单元格」里每个区域属于哪个大区？",
     "合并区只有左上角单元格有值，其余读到 undefined/空 —— 朴素的逐行读取会大面积丢分类", "2-合并单元格", "★★"),
    ("E3", "把「1-销售明细」的金额列求和",
     "H 列是公式列且被混入了文本与错误值 → 类型污染，sum 结果为 NaN 或字符串拼接", "1-销售明细!H4:H503", "★★"),
    ("E4", "按状态统计各有多少单",
     "J 列含真空白、空字符串、只有空格的单元格 —— 三种「空」是否被当成同一类", "1-销售明细!J4:J503", "★★"),
    ("E5", "把「3-类型陷阱」里那些看着像数字的文本转成数字再做合计",
     "守卫禁止成员赋值（o.a = 1 / a[0] = 9）；必须用「重建 + 整体重赋值」才过得去", "3-类型陷阱", "★★★"),
    ("E6", "按金额从高到低排序后取前 20 条",
     "守卫黑名单含 sort/sortascending/sortdescending → Transform 里排不了，须手写插入排序或改放 Render", "1-销售明细", "★★★"),
    ("E7", "把所有工作表都列一遍，隐藏的也要",
     "隐藏 sheet / 隐藏行列 / 分组折叠是否可见；ActiveSheet 与显式 Item 的差异", "6-结构陷阱", "★★"),
    ("E8", "读「7-大范围」整块数据做体检",
     "3000 行 × 30 列 ≈ 9 万单元格：序列化体积、RPC 45s 超时、内存与日志截断", "7-大范围!A1:AD3001", "★★★"),
    ("E9", "读出订单号原样写回另一个表，必须保持前导零",
     "「00123」这类值：读取后变数字则前导零丢失；写回时的格式与文本型数字处理", "1-销售明细!B4:B503", "★★★"),
    ("E10", "把下单日期原样搬到目标表",
     "日期读到的是序列号还是 Date 对象；写回后是否仍识别为日期（格式 vs 值）", "1-销售明细!E4:E503", "★★★"),
    ("E11", "汇总时遇到 #DIV/0! / #N/A / #VALUE! 怎么办",
     "错误值单元格读到什么；是否会污染整个聚合结果；能否定位到具体出错行", "5-公式与错误", "★★★"),
    ("E12", "把「4-边界值」里的数字算一下总数",
     "超过 2^53 的整数精度、1E+308 溢出、浮点 0.1+0.2、-0 —— JSON 序列化后是否变形", "4-边界值", "★★★"),
    ("E13", "读「带 空格 的 表名」里的内容",
     "sheet 名含空格（必要时须用 '表名'!A1 引号写法）；中文名的编码与转义", "8-带 空格 的 表名", "★★"),
    ("E14", "把 Excel 的结果写到 Word 或 PPT 里去",
     "跨文档 Render：源文档 Excel、目标文档 Writer/PPT 的组合是否顺畅；目标侧定位方式", "跨文件", "★★★"),
    ("E15", "整份文件另存一份备份再改",
     "Render 里的 SaveAs/另存 / 封面保护：守卫不管但宿主是否允许；文件占用与覆盖写", "整份", "★★★"),
]
row = 5
for t in tasks:
    for i, v in enumerate(t, start=1):
        c = ws.cell(row=row, column=i, value=v)
        c.font = BODY_FONT
        c.border = BORDER
        c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True) if i in (2, 3, 4) else Alignment(horizontal="center", vertical="top")
    ws.row_dimensions[row].height = 34
    row += 1

ws.cell(row=row + 1, column=1, value="提示：E5 / E6 / E11 是最容易直接撞到守卫与类型系统的三题，建议先跑它们。")
ws.merge_cells(start_row=row + 1, start_column=1, end_row=row + 1, end_column=5)
ws.cell(row=row + 1, column=1).font = Font(name="微软雅黑", size=9, bold=True, color="FF9C0006")
ws.freeze_panes = "A5"

# ============================================================ 1-销售明细
ws = wb.create_sheet("1-销售明细")
ws["A1"] = "销售明细（压测负载）"
ws["A1"].font = Font(name="微软雅黑", size=13, bold=True, color="FF2F5597")
ws.merge_cells("A1:L1")
ws["A2"] = "注意：表头在第 3 行；H 列是公式列但被混入文本；J 列有三种不同的「空」；K 列含换行与超长文本。"
ws.merge_cells("A2:L2")
ws["A2"].font = Font(name="微软雅黑", size=9, italic=True, color="FF9C0006")

cols = ["序号", "订单号", "客户名称", "区域", "下单日期", "数量", "单价", "金额", "折扣率", "状态", "备注", "异常标记"]
for i, h in enumerate(cols, start=1):
    c = ws.cell(row=3, column=i, value=h)
    c.font = HEAD_FONT
    c.fill = HEAD_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = BORDER

regions = ["华东区", "华南区", "华北区", "西南区", "东北区"]
statuses = ["已完成", "进行中", "已取消", "", " ", None]
names = ["宁波某某贸易有限公司", "苏州某某科技有限公司", "杭州某某电子商务有限公司", "合肥某某供应链管理有限公司",
         "某某（上海）实业有限公司", "深圳某某信息技术有限公司"]
long_note = ("该客户连续三期回款延迟，已由客户经理两次上门沟通；" * 8) + "需在月度风险会上再次确认授信额度。"
special_names = [
    "某 某 集 团（含全角空格）",
    "引号测试「中文引号」与\"英文引号\"",
    "换行\n客户名称",
    "制表\t符",
    "Emoji 客户 🚀📊",
    "  前后有空格  ",
    "超长客户名" + "异" * 120,
    "公式注入样本 =1+1",
    "at@sample.com",
]

for r in range(500):
    row = 4 + r
    idx = r + 1
    ws.cell(row=row, column=1, value=idx).font = BODY_FONT
    # B 订单号：带前导零的文本型编号
    ws.cell(row=row, column=2, value=f"NO{idx:06d}").font = BODY_FONT
    if r % 37 == 0:
        ws.cell(row=row, column=2, value=f"00{idx}")  # 纯前导零样本
    # C 客户名称：混入特殊值
    if r < len(special_names):
        ws.cell(row=row, column=3, value=special_names[r])
    elif r % 53 == 0:
        ws.cell(row=row, column=3, value=None)  # 真空白
    else:
        ws.cell(row=row, column=3, value=names[r % len(names)])
    # D 区域
    ws.cell(row=row, column=4, value=regions[r % len(regions)])
    # E 下单日期：部分为空、部分是文本日期
    if r % 61 == 0:
        ws.cell(row=row, column=5, value="2026-09-30")  # 文本日期
    elif r % 47 == 0:
        ws.cell(row=row, column=5, value=None)
    else:
        d = date(2026, (r % 12) + 1, (r % 28) + 1)
        c = ws.cell(row=row, column=5, value=d)
        c.number_format = "yyyy-mm-dd"
    # F 数量：部分是文本数字
    qty = (r % 20) + 1
    if r % 29 == 0:
        ws.cell(row=row, column=6, value=str(qty))
    else:
        ws.cell(row=row, column=6, value=qty)
    # G 单价
    price = round(9.9 + (r % 400) * 1.37, 2)
    ws.cell(row=row, column=7, value=price).number_format = "#,##0.00"
    # H 金额：公式列，但部分被覆盖为文本/错误
    if r % 41 == 0:
        ws.cell(row=row, column=8, value="待确认")
    elif r % 73 == 0:
        ws.cell(row=row, column=8, value="1,234.56")  # 像数字的文本
    else:
        c = ws.cell(row=row, column=8, value=f"=F{row}*G{row}")
        c.number_format = "#,##0.00"
    # I 折扣率
    rate = [0, 0.05, 0.1, 0.15, 0.2, 1][r % 6]
    c = ws.cell(row=row, column=9, value=rate)
    c.number_format = "0%"
    # J 状态：三种空
    st = statuses[r % len(statuses)]
    ws.cell(row=row, column=10, value=st)
    # K 备注
    if r % 89 == 0:
        ws.cell(row=row, column=11, value=long_note)
    elif r % 17 == 0:
        ws.cell(row=row, column=11, value="第一行\n第二行\n第三行")
    else:
        ws.cell(row=row, column=11, value=None)
    # L 异常标记：文本形式的错误标记
    if r % 97 == 0:
        ws.cell(row=row, column=12, value="#N/A")
    elif r % 31 == 0:
        ws.cell(row=row, column=12, value="正常")
    else:
        ws.cell(row=row, column=12, value=None)

# 少量合并（真实业务里常见的"大区归并"）
ws.merge_cells("D4:D8")
ws["D4"] = "华东区（合并区）"
ws.merge_cells("D9:D15")
ws["D9"] = "华南区（合并区）"

widths = [6, 12, 30, 16, 14, 8, 10, 12, 8, 10, 60, 10]
for i, w in enumerate(widths, start=1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "A4"
ws.auto_filter.ref = "A3:L503"

# ============================================================ 2-合并单元格
ws = wb.create_sheet("2-合并单元格")
ws["A1"] = "合并单元格陷阱"
ws.merge_cells("A1:D1")
ws["A1"].font = Font(name="微软雅黑", size=13, bold=True, color="FF2F5597")
ws["A2"] = "纵向/横向/大小不等的合并混排：只有左上角有值，其余为空。"
ws.merge_cells("A2:D2")
ws["A2"].font = Font(name="微软雅黑", size=9, italic=True, color="FF9C0006")

for i, h in enumerate(["大区", "省份", "城市", "销售额"], start=1):
    c = ws.cell(row=4, column=i, value=h)
    c.font = HEAD_FONT
    c.fill = HEAD_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")

layout = [
    ("华东", "江苏", "南京", 12000),
    (None, None, "苏州", 9800),
    (None, None, "无锡", 7600),
    (None, "浙江", "杭州", 15300),
    (None, None, "宁波", 11200),
    ("华南", "广东", "广州", 18700),
    (None, None, "深圳", 21400),
    (None, "福建", "福州", 6400),
    ("华北", "北京", "北京", 24800),
    (None, "天津", "天津", 8900),
]
r0 = 5
for i, (region, prov, city, amount) in enumerate(layout):
    r = r0 + i
    ws.cell(row=r, column=1, value=region)
    ws.cell(row=r, column=2, value=prov)
    ws.cell(row=r, column=3, value=city)
    ws.cell(row=r, column=4, value=amount).number_format = "#,##0"

# 大区纵向合并（跨度不等）
ws.merge_cells("A5:A7")
ws.merge_cells("A8:A9")
ws.merge_cells("A10:A11")
ws.merge_cells("A12:A13")
ws.merge_cells("A14:A14")
# 省份纵向合并
ws.merge_cells("B5:B7")
ws.merge_cells("B8:B9")
ws.merge_cells("B12:B13")
# 横向合并合计行
ws.cell(row=16, column=1, value="合计")
ws.merge_cells("A16:C16")
ws.cell(row=16, column=4, value="=SUM(D5:D14)").number_format = "#,##0"
ws.cell(row=16, column=4).font = Font(name="微软雅黑", size=10, bold=True)
# 不对称的横向合并
ws.cell(row=18, column=1, value="跨 4 列的长标题（横向合并）")
ws.merge_cells("A18:D18")
ws.cell(row=20, column=1, value="跨 2 列")
ws.merge_cells("A20:B20")
ws.cell(row=20, column=3, value="跨 1 列")
ws.cell(row=22, column=1, value="被合并遮蔽的空值区（右下角因合并无值）")
ws.merge_cells("A22:D24")

for i, w in enumerate([18, 14, 14, 14], start=1):
    ws.column_dimensions[get_column_letter(i)].width = w

# ============================================================ 3-类型陷阱
ws = wb.create_sheet("3-类型陷阱")
ws["A1"] = "类型陷阱（读出来到底是什么）"
ws.merge_cells("A1:E1")
ws["A1"].font = Font(name="微软雅黑", size=13, bold=True, color="FF2F5597")
for i, h in enumerate(["序号", "场景", "单元格原样内容", "期望读到的类型", "备注"], start=1):
    c = ws.cell(row=3, column=i, value=h)
    c.font = HEAD_FONT
    c.fill = HEAD_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")

type_rows = [
    ("前导零编号", "00123", "文本", "写成数字则前导零丢失"),
    ("千分位文本", "1,234.56", "文本", "看起来像数字，实为文本"),
    ("科学计数文本", "1.23E+05", "文本", "parseFloat 可转，但原样是文本"),
    ("真日期", date(2026, 9, 30), "日期", "读出来可能是序列号 46259"),
    ("斜杠文本日期", "2026/9/30", "文本", "与真日期不同"),
    ("中划线文本日期", "2026-09-30", "文本", "与真日期不同"),
    ("布尔真", True, "布尔", "JSON 里是 true"),
    ("布尔假", False, "布尔", "JSON 里是 false"),
    ("公式空串", '=""', "公式→空串", "读到空字符串而非 undefined"),
    ("真空白", None, "空", "读到 null/undefined"),
    ("只有空格", "   ", "文本", "trim 后为空但本身非空"),
    ("全角数字", "１２３", "文本", "Number() 转不了"),
    ("超长文本", "长" * 500, "文本", "单格 500 字，注意截断与体积"),
    ("含换行", "第一行\n第二行", "文本", "换行符是否保留"),
    ("含制表符与引号", 'A\tB"C\'D', "文本", "转义处理"),
    ("公式注入文本", "=1+1", "文本", "以 = 开头，写入时会被当公式"),
    ("命令注入文本", "@SUM(A1:A9)", "文本", "以 @ 开头"),
    ("加号开头", "+86 13800000000", "文本", "以 + 开头"),
    ("负号开头", "-abc", "文本", "以 - 开头"),
    ("中文逗号与顿号", "甲，乙、丙；丁", "文本", "分隔符差异"),
    ("Emoji 与中文标点", "✅完成《重要》—ok", "文本", "非 BMP 字符"),
    ("零宽字符", "a\u200bb", "文本", "肉眼不可见"),
    ("反斜杠路径", r"C:\Users\test\文件.xlsx", "文本", "反斜杠转义"),
    ("超小浮点", 1e-308, "数字", "接近下溢"),
    ("超大浮点", 1e308, "数字", "接近上溢"),
    ("负零", -0.0, "数字", "JSON 里是 -0 还是 0"),
    ("浮点误差", 0.1 + 0.2, "数字", "0.30000000000000004"),
    ("超 2^53 整数", 9007199254740993, "数字", "超出 IEEE754 精确表示"),
    ("正无穷文本", "Infinity", "文本", "若为数字则 JSON 变 null"),
    ("NaN 文本", "NaN", "文本", "同上"),
]
for i, (scene, value, expect, note) in enumerate(type_rows, start=1):
    r = 4 + i - 1
    ws.cell(row=r, column=1, value=i).font = BODY_FONT
    ws.cell(row=r, column=2, value=scene).font = BODY_FONT
    c = ws.cell(row=r, column=3, value=value)
    c.font = BODY_FONT
    c.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    ws.cell(row=r, column=4, value=expect).font = BODY_FONT
    ws.cell(row=r, column=5, value=note).font = BODY_FONT

for i, w in enumerate([6, 22, 46, 16, 40], start=1):
    ws.column_dimensions[get_column_letter(i)].width = w
ws.freeze_panes = "A4"

# ============================================================ 4-边界值
ws = wb.create_sheet("4-边界值")
ws["A1"] = "数值与日期边界"
ws.merge_cells("A1:D1")
ws["A1"].font = Font(name="微软雅黑", size=13, bold=True, color="FF2F5597")
for i, h in enumerate(["序号", "类型", "值", "说明"], start=1):
    c = ws.cell(row=3, column=i, value=h)
    c.font = HEAD_FONT
    c.fill = HEAD_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")

boundaries = [
    ("日期", date(1900, 1, 1), "Excel 序列号起点（值=1）"),
    ("日期", date(1900, 3, 1), "1900 闰年 bug 影响区（序列号 61）"),
    ("日期", date(9999, 12, 31), "最大可表示日期"),
    ("日期时间", datetime(2026, 9, 30, 23, 59, 59), "含时间的日期"),
    ("整数", 0, "零"),
    ("整数", -0, "负零"),
    ("整数", 9007199254740992, "2^53（仍精确）"),
    ("整数", 9007199254740993, "2^53+1（已不精确，读出来会变成 …992）"),
    ("整数", 12345678901234567890, "超出 64 位有符号范围"),
    ("浮点", 1e-308, "接近下溢"),
    ("浮点", 1e308, "接近上溢"),
    ("浮点", 1.7976931348623157e308, "双精度最大值"),
    ("浮点", 0.1 + 0.2, "经典浮点误差"),
    ("浮点", -1.5, "负数小数"),
    ("文本", "9223372036854775808", "超长数字的文本形式"),
    ("文本", "", "空字符串"),
]
for i, (kind, value, note) in enumerate(boundaries, start=1):
    r = 4 + i - 1
    ws.cell(row=r, column=1, value=i).font = BODY_FONT
    ws.cell(row=r, column=2, value=kind).font = BODY_FONT
    c = ws.cell(row=r, column=3, value=value)
    c.font = BODY_FONT
    if isinstance(value, (date, datetime)):
        c.number_format = "yyyy-mm-dd hh:mm:ss" if isinstance(value, datetime) else "yyyy-mm-dd"
    ws.cell(row=r, column=4, value=note).font = BODY_FONT

for i, w in enumerate([6, 12, 30, 44], start=1):
    ws.column_dimensions[get_column_letter(i)].width = w

# ============================================================ 5-公式与错误
ws = wb.create_sheet("5-公式与错误")
ws["A1"] = "公式、错误值与跨表引用"
ws.merge_cells("A1:E1")
ws["A1"].font = Font(name="微软雅黑", size=13, bold=True, color="FF2F5597")
ws["A2"] = "C 列是会产生错误值的公式（用 WPS 打开后自动计算）；F 列是静态文本形式的错误标记（不会被当错误值）。"
ws.merge_cells("A2:E2")
ws["A2"].font = Font(name="微软雅黑", size=9, italic=True, color="FF9C0006")

for i, h in enumerate(["序号", "场景", "公式/值", "读取目标", "说明"], start=1):
    c = ws.cell(row=4, column=i, value=h)
    c.font = HEAD_FONT
    c.fill = HEAD_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")

formulas = [
    ("除零", "=1/0", "错误值", "#DIV/0!"),
    ("空引用运算", "=NA()", "错误值", "#N/A"),
    ("文本参与算术", '="abc"+1', "错误值", "#VALUE!"),
    ("无效引用", "=A1/0", "错误值", "#DIV/0!"),
    ("空串结果", '=IF(1>2,"是","")', "空字符串", "公式结果是空串不是空"),
    ("跨表引用", "=SUM('7-大范围'!A1:A10)", "数字", "跨 sheet 求和"),
    ("VLOOKUP 未命中", '=VLOOKUP("不存在",A4:B9,2,FALSE)', "错误值", "#N/A"),
    ("IFERROR 兜底", '=IFERROR(1/0,"兜底")', "文本", "错误被吞掉变文本"),
    ("文本拼接", '=A4&"-"&B4', "文本", "类型被强转"),
    ("大数相乘", "=1E+200*1E+200", "错误值", "#NUM!"),
]
r = 5
for i, (scene, formula, target, note) in enumerate(formulas, start=1):
    ws.cell(row=r, column=1, value=i).font = BODY_FONT
    ws.cell(row=r, column=2, value=scene).font = BODY_FONT
    ws.cell(row=r, column=3, value=formula).font = BODY_FONT
    ws.cell(row=r, column=4, value=target).font = BODY_FONT
    ws.cell(row=r, column=5, value=note).font = BODY_FONT
    r += 1

# 静态文本形式的错误标记
ws.cell(row=5, column=6, value="#DIV/0!").font = BODY_FONT
ws.cell(row=6, column=6, value="#N/A").font = BODY_FONT
ws.cell(row=7, column=6, value="#VALUE!").font = BODY_FONT
ws.cell(row=8, column=6, value="#REF!").font = BODY_FONT
ws.cell(row=9, column=6, value="#NAME?").font = BODY_FONT
ws.cell(row=10, column=6, value="#NUM!").font = BODY_FONT
ws.cell(row=4, column=6, value="静态文本错误标记").font = HEAD_FONT
ws.cell(row=4, column=6).fill = HEAD_FILL

for i, w in enumerate([6, 18, 30, 14, 30, 20], start=1):
    ws.column_dimensions[get_column_letter(i)].width = w

# ============================================================ 6-结构陷阱
ws = wb.create_sheet("6-结构陷阱")
ws["A1"] = "结构陷阱：隐藏行列、分组、超宽列、空行空列"
ws.merge_cells("A1:H1")
ws["A1"].font = Font(name="微软雅黑", size=13, bold=True, color="FF2F5597")

for i in range(1, 9):
    ws.cell(row=3, column=i, value=f"列{i}").font = HEAD_FONT
    ws.cell(row=3, column=i).fill = HEAD_FILL
    ws.cell(row=3, column=i).alignment = Alignment(horizontal="center")
for r in range(4, 24):
    for c in range(1, 9):
        ws.cell(row=r, column=c, value=f"R{r}C{c}").font = BODY_FONT

# 隐藏行
for r in (6, 7, 8):
    ws.row_dimensions[r].hidden = True
# 隐藏列
ws.column_dimensions["D"].hidden = True
ws.column_dimensions["E"].hidden = True
# 分组
for r in range(12, 18):
    ws.row_dimensions[r].outlineLevel = 1
# 超宽列
ws.column_dimensions["H"].width = 120
# 分组折叠
ws.sheet_properties.outlinePr.summaryBelow = True
# 冻结
ws.freeze_panes = "C4"

ws.cell(row=26, column=1, value="↑ 第 6-8 行隐藏、D/E 列隐藏、12-17 行被分组、H 列宽 120").font = Font(name="微软雅黑", size=9, italic=True, color="FF9C0006")

# 数据验证（下拉）
dv = DataValidation(type="list", formula1='"甲,乙,丙"', allow_blank=True, showDropDown=False)
ws.add_data_validation(dv)
dv.add("A28:A32")
ws.cell(row=27, column=1, value="带数据验证的区域（A28:A32）").font = Font(name="微软雅黑", size=9, bold=True)

# ============================================================ 7-大范围
ws = wb.create_sheet("7-大范围")
ws["A1"] = "性能负载：3000 行 × 30 列"
ws["A1"].font = Font(name="微软雅黑", size=12, bold=True, color="FF2F5597")
ws.merge_cells("A1:AD1")
for c in range(1, 31):
    cell = ws.cell(row=2, column=c, value=f"M{c:02d}")
    cell.font = HEAD_FONT
    cell.fill = HEAD_FILL
    cell.alignment = Alignment(horizontal="center")
for r in range(3, 3003):
    for c in range(1, 31):
        ws.cell(row=r, column=c, value=round((r * c) % 997 * 1.13, 2))
ws.freeze_panes = "B3"

# ============================================================ 8-带 空格 的 表名
ws = wb.create_sheet("8-带 空格 的 表名")
ws["A1"] = "sheet 名含空格与中文"
ws["A1"].font = Font(name="微软雅黑", size=12, bold=True, color="FF2F5597")
ws["A2"] = "引用本表时必须写成 '8-带 空格 的 表名'!A1（带单引号），直接用 8-带 空格 的 表名!A1 在多数实现里会解析失败。"
ws.merge_cells("A2:D2")
ws["A2"].font = Font(name="微软雅黑", size=9, italic=True, color="FF9C0006")
for i, h in enumerate(["键", "值", "备注", "写回测试列"], start=1):
    c = ws.cell(row=4, column=i, value=h)
    c.font = HEAD_FONT
    c.fill = HEAD_FILL
for i, (k, v, note) in enumerate([
    ("k1", 100, "普通数值"),
    ("k2", "文本值", "中文"),
    ("k3", None, "空值"),
    ("k4", date(2026, 1, 1), "日期"),
    ("k5", "含'单引号'的文本", "引号"),
], start=1):
    r = 4 + i
    ws.cell(row=r, column=1, value=k).font = BODY_FONT
    ws.cell(row=r, column=2, value=v).font = BODY_FONT
    ws.cell(row=r, column=3, value=note).font = BODY_FONT
ws.column_dimensions["A"].width = 10
ws.column_dimensions["B"].width = 26
ws.column_dimensions["C"].width = 20
ws.column_dimensions["D"].width = 20

# ============================================================ 9-隐藏的表
ws = wb.create_sheet("9-隐藏的表（本表被隐藏）")
ws["A1"] = "这张表在打开时是隐藏状态（sheet_state = hidden）"
ws["A1"].font = Font(name="微软雅黑", size=11, bold=True)
ws["A2"] = "用于测试：能否枚举到隐藏表、能否直接按名访问它。"
ws["A2"].font = BODY_FONT
ws.sheet_state = "hidden"

wb.properties.title = "wps-mcp 压力测试负载 · Excel 卷"
wb.save(OUT)
print("saved:", OUT)
print("sheets:", wb.sheetnames)
