# -*- coding: utf-8 -*-
"""
round2 · 源文件生成器（跨文件语义映射压测题）
场景：示例银行科技部 2026 年度生产运行与项目建设 · 年终汇报

产出：
  源A-2026年度系统运行与投产台账.xlsx   原始台账，字段口径 != 汇报口径
  源B-各研发团队年度工作条目汇编.pptx    演示文稿内的多张团队工作条目表

设计原则：
  1. 源文件是"真实工作流里本来就会存在的东西"，不为压测而畸形
  2. 陷阱藏在真实的脏里：别名、混写、合并单元格、空值、粒度不一致
  3. 每个陷阱都对应目标文件里一个必须填的位置，形成"语义断层"
"""
import random
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

random.seed(20261231)

FONT = "微软雅黑"
OUT_XLSX = "源A-2026年度系统运行与投产台账.xlsx"

THIN = Side(style="thin", color="D0D7DE")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
HDR_FILL = PatternFill("solid", fgColor="1F4E79")
HDR_FONT = Font(name=FONT, size=10, bold=True, color="FFFFFF")
TITLE_FONT = Font(name=FONT, size=13, bold=True, color="1F4E79")
BODY = Font(name=FONT, size=10)
BOLD = Font(name=FONT, size=10, bold=True)
NOTE = Font(name=FONT, size=10, italic=True, color="7F5F00")
WARN_FILL = PatternFill("solid", fgColor="FFF2CC")
ALT_FILL = PatternFill("solid", fgColor="F2F7FB")
CENTER = Alignment(horizontal="center", vertical="center", wrap_text=True)
LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)


def title(ws, text, span, note=None):
    ws.merge_cells(f"A1:{span}1")
    c = ws["A1"]
    c.value = text
    c.font = TITLE_FONT
    c.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 24
    if note:
        ws.merge_cells(f"A2:{span}2")
        ws["A2"] = note
        ws["A2"].font = NOTE
        ws["A2"].alignment = LEFT
        ws.row_dimensions[2].height = 18


def header(ws, row, cols):
    for i, name in enumerate(cols, 1):
        c = ws.cell(row=row, column=i, value=name)
        c.font = HDR_FONT
        c.fill = HDR_FILL
        c.alignment = CENTER
        c.border = BORDER
    ws.row_dimensions[row].height = 30


def widths(ws, spec):
    for col, w in spec.items():
        ws.column_dimensions[col].width = w


# ==================================================================
# 业务基础数据
# ==================================================================
# (代号, 全称, 责任团队简称, 系统等级, 上线年份)
SYSTEMS = [
    ("XJYX", "消费金融核心业务系统", "研发一组", "一级", 2019),
    ("XJXD", "消费金融信贷管理系统", "研发一组", "一级", 2020),
    ("JLPG", "拒量评估引擎",         "研发二组", "一级", 2021),
    ("ZXFW", "征信服务网关",         "研发二组", "二级", 2021),
    ("YYZB", "远程银行中台",         "研发三组", "一级", 2022),
    ("ZLGL", "增信管理平台",         "研发三组", "二级", 2022),
    ("YLJS", "银联数据对接服务",     "研发三组", "二级", 2023),
    ("SJPT", "数据中台服务",         "数据组",   "一级", 2020),
    ("BZJK", "报表指标服务",         "数据组",   "二级", 2021),
    ("FXQJ", "反欺诈实时决策引擎",   "数据组",   "二级", 2022),
    ("JKKP", "监控告警平台",         "运维组",   "一级", 2019),
    ("RZFP", "日志集中服务平台",     "运维组",   "二级", 2020),
    ("ZNYW", "智能运维自动化平台",   "运维组",   "三级", 2023),
    ("AQSJ", "安全合规审计平台",     "安全组",   "二级", 2021),
    ("JMCY", "加密与密钥托管服务",   "安全组",   "二级", 2022),
    ("LDSC", "漏洞扫描与补丁服务",   "安全组",   "三级", 2023),
]
MONTHS = [f"2026-{m:02d}" for m in range(1, 13)]
OWNERS = ["陈立", "王雨桐", "李振国", "赵启明", "周敏", "吴海涛", "郑文彬", "孙雅雯", "黄志远", "林嘉树"]

wb = Workbook()

# ==================================================================
# 0 · 说明
# ==================================================================
ws = wb.active
ws.title = "说明"
widths(ws, {"A": 16, "B": 96})
ws["A1"] = "源A-2026年度系统运行与投产台账"
ws["A1"].font = Font(name=FONT, size=15, bold=True, color="1F4E79")
ws.merge_cells("A1:B1")
ws.row_dimensions[1].height = 30

lines = [
    ("文件性质", "合成测试数据：机构、人员、系统和指标均为虚构，不代表任何真实银行。此台账模拟监控与变更管理的月度/事件记录。"),
    ("数据范围", "2026-01-01 至 2026-12-31；覆盖 16 套在运应用系统。"),
    ("字段口径", "本台账字段为「系统内叫法」，与对外汇报口径不一致，请勿直接搬运列名与数值。"),
    ("时间粒度", "月度运行、日志异常为「系统 × 月份」长表；投产变更、故障事件为「单次事件」明细。"),
    ("已知不足", "① 团队名称使用内部简称；② 部分月度指标为人工填写，存在文本型数字与占位符；③ 去年基线仅覆盖存量系统。"),
    ("使用提示", "对外汇报需做聚合、同比与口径映射，建议先只读探查（Transform），确认口径后再写入目标文件（Render）。"),
]
r = 3
for k, v in lines:
    ws.cell(row=r, column=1, value=k).font = BOLD
    ws.cell(row=r, column=1).fill = ALT_FILL
    ws.cell(row=r, column=1).alignment = CENTER
    ws.cell(row=r, column=1).border = BORDER
    c = ws.cell(row=r, column=2, value=v)
    c.font = BODY
    c.alignment = LEFT
    c.border = BORDER
    ws.row_dimensions[r].height = 34
    r += 1

ws.cell(row=r + 1, column=1, value="工作表索引").font = BOLD
idx = [
    ("应用清单", "16 套系统的代号、全称、责任团队、系统等级、上线年份"),
    ("月度运行", "2026 年 1-12 月，每系统每月一行（共 192 行）"),
    ("投产变更", "全年每一次上线/优化/修复的变更单明细（共 240 条）"),
    ("故障事件", "全年每一笔生产故障的事件明细（共 60 条）"),
    ("去年基线", "2025 年度各系统投产次数与故障数，用于计算同比"),
    ("日志异常", "2026 年 1-12 月，每系统每月日志异常与严重异常条数（共 192 行）"),
]
r += 2
for k, v in idx:
    ws.cell(row=r, column=1, value=k).font = BOLD
    ws.cell(row=r, column=1).alignment = CENTER
    ws.cell(row=r, column=1).border = BORDER
    c = ws.cell(row=r, column=2, value=v)
    c.font = BODY
    c.alignment = LEFT
    c.border = BORDER
    r += 1

# ==================================================================
# 1 · 应用清单（责任团队为合并单元格）
# ==================================================================
ws = wb.create_sheet("应用清单")
title(ws, "应用清单（在运系统台账）", "F",
      "注：责任团队一列按团队合并；系统等级 一级/二级/三级 分别对应业务影响度 核心/重要/一般。")
header(ws, 3, ["序号", "系统代字", "系统全称", "责任团队", "系统等级", "上线年份"])
widths(ws, {"A": 6, "B": 11, "C": 26, "D": 12, "E": 10, "F": 10})

r = 4
team_start = {}
for i, (code, name, team, level, year) in enumerate(SYSTEMS, 1):
    ws.cell(row=r, column=1, value=i).font = BODY
    ws.cell(row=r, column=1).alignment = CENTER
    ws.cell(row=r, column=2, value=code).font = BODY
    ws.cell(row=r, column=2).alignment = CENTER
    n = ws.cell(row=r, column=3, value=name)
    n.font = BODY
    n.alignment = LEFT
    ws.cell(row=r, column=4, value=team).font = BODY
    ws.cell(row=r, column=4).alignment = CENTER
    ws.cell(row=r, column=5, value=level).font = BODY
    ws.cell(row=r, column=5).alignment = CENTER
    ws.cell(row=r, column=6, value=year).font = BODY
    ws.cell(row=r, column=6).alignment = CENTER
    for cc in range(1, 7):
        ws.cell(row=r, column=cc).border = BORDER
    team_start.setdefault(team, []).append(r)
    r += 1

# 合并同团队的「责任团队」单元格（陷阱：合并非首行读出来是 None）
for team, rows in team_start.items():
    if len(rows) > 1:
        ws.merge_cells(start_row=rows[0], start_column=4, end_row=rows[-1], end_column=4)
ws.freeze_panes = "A4"

# ==================================================================
# 2 · 月度运行（192 行长表 + 混合类型可用率）
# ==================================================================
ws = wb.create_sheet("月度运行")
title(ws, "月度运行指标（系统 × 月份）", "F",
      "注：月可用率为人工填报，多数为百分比数值，个别月份为文本或占位符，统计时需先归一。")
header(ws, 3, ["月份", "系统代字", "交易笔数", "成功笔数", "平均响应(ms)", "月可用率"])
widths(ws, {"A": 11, "B": 11, "C": 14, "D": 14, "E": 14, "F": 13})

BAND = {"一级": (1_800_000, 3_600_000), "二级": (400_000, 1_200_000), "三级": (30_000, 180_000)}
r = 4
dirty_slots = []          # 留出几处做脏数据
for code, _n, _t, level, _y in SYSTEMS:
    lo, hi = BAND[level]
    for mi, mon in enumerate(MONTHS, 1):
        factor = 1.0 + 0.06 * ((mi % 5) - 2)
        tx = int(random.uniform(lo, hi) * factor)
        succ = int(tx * random.uniform(0.9975, 0.99995))
        rt = round(random.uniform(40, 350), 1)
        av = round(random.uniform(0.99920, 0.99999), 5)
        ws.cell(row=r, column=1, value=mon).font = BODY
        ws.cell(row=r, column=1).alignment = CENTER
        ws.cell(row=r, column=2, value=code).font = BODY
        ws.cell(row=r, column=2).alignment = CENTER
        c = ws.cell(row=r, column=3, value=tx); c.font = BODY; c.number_format = "#,##0"
        c = ws.cell(row=r, column=4, value=succ); c.font = BODY; c.number_format = "#,##0"
        c = ws.cell(row=r, column=5, value=rt); c.font = BODY; c.number_format = "0.0"
        c = ws.cell(row=r, column=6, value=av); c.font = BODY; c.number_format = "0.00%"
        for cc in range(1, 7):
            ws.cell(row=r, column=cc).border = BORDER
        dirty_slots.append(r)
        r += 1

# 埋脏：6 处文本型百分比 + 2 处 '-' + 1 处空值（互不重叠）
picked = random.sample(dirty_slots, 9)
for row in picked[:6]:
    ws.cell(row=row, column=6).value = "99.97%"
for row in picked[6:8]:
    ws.cell(row=row, column=6).value = "-"
ws.cell(row=picked[8], column=6).value = None
ws.freeze_panes = "A4"

# ==================================================================
# 3 · 投产变更（48 条明细）
# ==================================================================
ws = wb.create_sheet("投产变更")
title(ws, "投产变更明细", "H",
      "注：变更类型 投产上线/优化变更/紧急修复；是否回退与是否涉资金为人工勾选，存在 是/否 与 Y/N 混写。")
header(ws, 3, ["上线日期", "系统代字", "变更单号", "变更类型", "是否涉资金", "是否回退", "影响时长(分)", "主责人"])
widths(ws, {"A": 12, "B": 11, "C": 13, "D": 12, "E": 12, "F": 10, "G": 13, "H": 10})

codes_all = [c for c, *_ in SYSTEMS]
# 每个系统至少 6 次投产上线，其余随机补齐（保证没有系统是"零变更"）
pairs = [("投产上线", c) for c in codes_all for _ in range(6)]
rest = ["投产上线"] * 34 + ["优化变更"] * 80 + ["紧急修复"] * 30
random.shuffle(rest)
pairs += [(t, random.choice(codes_all)) for t in rest]
records = []
for ctype, code in pairs:
    m = random.randint(1, 12)
    d = random.randint(1, 28)
    records.append((f"2026-{m:02d}-{d:02d}", code, ctype))
records.sort(key=lambda x: x[0])

r = 4
for i, (when, code, ctype) in enumerate(records, 1):
    ws.cell(row=r, column=1, value=when).font = BODY
    ws.cell(row=r, column=1).alignment = CENTER
    ws.cell(row=r, column=2, value=code).font = BODY
    ws.cell(row=r, column=2).alignment = CENTER
    ws.cell(row=r, column=3, value=f"CR2026{i:04d}").font = BODY
    ws.cell(row=r, column=3).alignment = CENTER
    ws.cell(row=r, column=4, value=ctype).font = BODY
    ws.cell(row=r, column=4).alignment = CENTER
    # 涉资金：投产上线 与 紧急修复 多为是
    money = "是" if (ctype == "投产上线" and random.random() < 0.62) or (ctype == "紧急修复" and random.random() < 0.5) else "否"
    ws.cell(row=r, column=5, value=money).font = BODY
    ws.cell(row=r, column=5).alignment = CENTER
    rb = "Y" if random.random() < 0.10 else ("否" if random.random() < 0.3 else "N")   # 混写：Y / N / 否
    ws.cell(row=r, column=6, value=rb).font = BODY
    ws.cell(row=r, column=6).alignment = CENTER
    c = ws.cell(row=r, column=7, value=random.choice([0, 0, 0, 5, 8, 12, 20, 35, 45, 90, 120]))
    c.font = BODY
    c.alignment = CENTER
    ws.cell(row=r, column=8, value=random.choice(OWNERS)).font = BODY
    ws.cell(row=r, column=8).alignment = CENTER
    for cc in range(1, 9):
        ws.cell(row=r, column=cc).border = BORDER
    r += 1
ws.freeze_panes = "A4"
ws.auto_filter.ref = f"A3:H{r - 1}"

# ==================================================================
# 4 · 故障事件（34 条明细，等级混写）
# ==================================================================
ws = wb.create_sheet("故障事件")
title(ws, "生产故障事件明细", "G",
      "注：事件等级由值班人员手填，绝大多数为 一级/二级/三级，个别写成罗马数字 I级/II级，统计前需归一。")
header(ws, 3, ["故障单号", "发生时间", "系统代字", "事件等级", "持续时长(分)", "根因分类", "是否重复发生"])
widths(ws, {"A": 14, "B": 17, "C": 11, "D": 11, "E": 13, "F": 14, "G": 14})

levels = ["一级"] * 10 + ["二级"] * 26 + ["三级"] * 22 + ["I级"] * 2
random.shuffle(levels)
causes = ["应用缺陷", "数据库", "中间件", "网络", "配置错误", "容量不足", "第三方依赖"]
r = 4
for i, lv in enumerate(levels, 1):
    code = random.choice(SYSTEMS)[0]
    m = random.randint(1, 12)
    d = random.randint(1, 28)
    hh = random.randint(0, 23)
    mi = random.randint(0, 59)
    ws.cell(row=r, column=1, value=f"INC2026{i:04d}").font = BODY
    ws.cell(row=r, column=1).alignment = CENTER
    ws.cell(row=r, column=2, value=f"2026-{m:02d}-{d:02d} {hh:02d}:{mi:02d}").font = BODY
    ws.cell(row=r, column=2).alignment = CENTER
    ws.cell(row=r, column=3, value=code).font = BODY
    ws.cell(row=r, column=3).alignment = CENTER
    c = ws.cell(row=r, column=4, value=lv)
    c.font = BOLD if lv in ("一级", "I级") else BODY
    c.alignment = CENTER
    dur = random.choice([5, 8, 11, 15, 22, 30, 45, 58, 90, 120, 180, 240])
    ws.cell(row=r, column=5, value=dur).font = BODY
    ws.cell(row=r, column=5).alignment = CENTER
    ws.cell(row=r, column=6, value=random.choice(causes)).font = BODY
    ws.cell(row=r, column=6).alignment = CENTER
    ws.cell(row=r, column=7, value="是" if random.random() < 0.2 else "否").font = BODY
    ws.cell(row=r, column=7).alignment = CENTER
    for cc in range(1, 8):
        ws.cell(row=r, column=cc).border = BORDER
    r += 1
ws.freeze_panes = "A4"
ws.auto_filter.ref = f"A3:G{r - 1}"

# ==================================================================
# 5 · 去年基线（仅存量系统有值）
# ==================================================================
ws = wb.create_sheet("去年基线")
title(ws, "2025 年度基线（用于计算同比）", "D",
      "注：2023 年以后新上线的系统无历史基线，对应单元格留空；同比应标注「新增」而非按 0 计算。")
header(ws, 3, ["系统代字", "2025投产次数", "2025故障起数", "2025平均可用率"])
widths(ws, {"A": 11, "B": 14, "C": 14, "D": 16})

blank_codes = {c for c, _n, _t, _l, y in SYSTEMS if y >= 2023}
while len(blank_codes) < 6:
    blank_codes.add(random.choice(SYSTEMS)[0])

r = 4
for code, _n, _t, _l, _y in SYSTEMS:
    ws.cell(row=r, column=1, value=code).font = BODY
    ws.cell(row=r, column=1).alignment = CENTER
    if code in blank_codes:
        for cc in range(2, 5):
            ws.cell(row=r, column=cc, value=None)
    else:
        ws.cell(row=r, column=2, value=random.randint(4, 14)).font = BODY
        ws.cell(row=r, column=2).alignment = CENTER
        ws.cell(row=r, column=3, value=random.randint(0, 8)).font = BODY
        ws.cell(row=r, column=3).alignment = CENTER
        c = ws.cell(row=r, column=4, value=round(random.uniform(0.99850, 0.99995), 5))
        c.font = BODY
        c.number_format = "0.00%"
        c.alignment = CENTER
    for cc in range(1, 5):
        ws.cell(row=r, column=cc).border = BORDER
    r += 1
ws.freeze_panes = "A4"

# ==================================================================
# 6 · 日志异常（192 行长表）
# ==================================================================
ws = wb.create_sheet("日志异常")
title(ws, "日志异常条数（系统 × 月份）", "D",
      "注：异常条数为平台自动统计；严重异常为其中 ERROR 级以上条数，存在 0 值。")
header(ws, 3, ["月份", "系统代字", "异常条数", "严重异常条数"])
widths(ws, {"A": 11, "B": 11, "C": 13, "D": 15})

r = 4
for code, _n, _t, level, _y in SYSTEMS:
    scale = {"一级": (4000, 14000), "二级": (1500, 6000), "三级": (300, 1500)}[level]
    for mon in MONTHS:
        a = random.randint(*scale)
        b = random.randint(0, max(1, a // 40))
        ws.cell(row=r, column=1, value=mon).font = BODY
        ws.cell(row=r, column=1).alignment = CENTER
        ws.cell(row=r, column=2, value=code).font = BODY
        ws.cell(row=r, column=2).alignment = CENTER
        c = ws.cell(row=r, column=3, value=a); c.font = BODY; c.number_format = "#,##0"
        c = ws.cell(row=r, column=4, value=b); c.font = BODY; c.number_format = "#,##0"
        for cc in range(1, 5):
            ws.cell(row=r, column=cc).border = BORDER
        r += 1
ws.freeze_panes = "A4"

wb.properties.creator = "wps-mcp synthetic fixtures"
wb.properties.description = "Synthetic test data; all institutions, people and metrics are fictional."
wb.save(OUT_XLSX)
print("saved:", OUT_XLSX)
print("sheets:", wb.sheetnames)
