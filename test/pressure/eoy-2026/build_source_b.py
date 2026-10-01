# -*- coding: utf-8 -*-
"""
round2 · 源B 生成器
产出：源B-各研发团队年度工作条目汇编.pptx

角色：第二个数据源。数据以「演示文稿内的表格」形式存在——
      考察 Agent 能不能从 PPT 表格里读数据（对象模型与 Excel 完全不同）。
刻意埋点：
  1. 状态字段混写：已完成 / 完成 / 进行中 / 延期 四种写法，实际语义只有三类
  2. 团队名用「全称」，而源A 用「简称」，必须自行建立映射
  3. 汇总页与明细页一致（备注说明以明细为准），给一个自校验锚点
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

OUT = "源B-各研发团队年度工作条目汇编.pptx"
FONT = "微软雅黑"
NAVY = RGBColor(0x1F, 0x4E, 0x79)
GRAY = RGBColor(0x59, 0x59, 0x59)
LIGHT = RGBColor(0xF2, 0xF7, 0xFB)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

# (团队全称, 编号前缀, 条目列表)
# 条目: 工作条目 / 类别 / 计划完成 / 实际完成 / 状态 / 投入人天 / 量化成果
TEAMS = [
    ("系统研发一组", "R1", [
        ("消费金融核心业务系统微服务解耦改造", "系统建设", "2026-06-30", "2026-07-18", "已完成", 186, "核心交易链路平均响应下降 32%"),
        ("信贷管理系统批量代扣作业提速", "性能优化", "2026-03-31", "2026-03-28", "已完成", 92, "日终批量窗口由 210 分钟压缩至 96 分钟"),
        ("核心系统双活机房切换演练", "运维保障", "2026-09-30", "2026-10-12", "延期", 64, "完成 1 轮真实切换，RTO 实测 4 分 12 秒"),
        ("信贷合同签约链路国密改造", "安全合规", "2026-08-31", "2026-08-25", "完成", 78, "全量签约链路启用 SM2/SM4"),
        ("核心系统慢 SQL 专项治理", "性能优化", "2026-11-30", "2026-11-20", "已完成", 51, "慢 SQL 日均条数由 380 降至 26"),
        ("柜面外设驱动兼容性升级", "系统建设", "2026-05-31", "2026-06-06", "完成", 44, "兼容 12 类外设型号"),
        ("消金核心年度投产保障", "运维保障", "2026-12-31", "2026-12-15", "已完成", 120, "全年 0 次回退"),
    ]),
    ("系统研发二组", "R2", [
        ("拒量评估引擎规则热更新能力建设", "系统建设", "2026-04-30", "2026-04-24", "已完成", 96, "规则生效时间由 T+1 缩短至 5 分钟内"),
        ("征信服务网关并发能力扩容", "性能优化", "2026-02-28", "2026-03-04", "延期", 58, "峰值并发由 800 TPS 提升至 2400 TPS"),
        ("征信查询链路降级预案建设", "运维保障", "2026-07-31", "2026-07-29", "已完成", 37, "征信中断场景下可切换本地缓存"),
        ("拒量模型特征变量血缘梳理", "管理提升", "2026-10-31", "", "进行中", 45, "已梳理 214 个特征变量血缘关系"),
        ("征信数据接口敏感字段脱敏", "安全合规", "2026-06-30", "2026-06-26", "完成", 29, "覆盖 36 个对外接口"),
        ("拒量评估结果可解释性改造", "系统建设", "2026-12-31", "2026-12-18", "已完成", 82, "输出决策依据项，支持人工复核"),
    ]),
    ("系统研发三组", "R3", [
        ("远程银行中台音视频链路稳定性改造", "系统建设", "2026-05-31", "2026-05-27", "已完成", 134, "音视频中断率由 1.8% 降至 0.3%"),
        ("增信管理平台对账自动化", "性能优化", "2026-08-31", "2026-09-05", "延期", 66, "对账人工投入由 3 人日/月降至 0.5 人日/月"),
        ("银联数据对接服务链路加固", "运维保障", "2026-03-31", "2026-03-30", "已完成", 48, "增加重试与幂等，重复入账 0 起"),
        ("远银中台话务数据合规留存", "安全合规", "2026-11-30", "2026-11-25", "完成", 33, "话务记录留存满足 5 年监管要求"),
        ("增信业务报表自动化出数", "管理提升", "2026-06-30", "2026-07-10", "延期", 41, "月报出数时间由 2 天缩短至 2 小时"),
        ("中台服务注册发现体系重构", "系统建设", "2026-10-31", "2026-10-22", "已完成", 77, "服务实例上下线实现秒级感知"),
        ("银联数据接口压测专项", "运维保障", "2026-04-30", "2026-04-28", "已完成", 26, "摸清单机能力上限，形成压测基线"),
    ]),
    ("数据平台组", "DT", [
        ("数据中台实时计算能力升级", "系统建设", "2026-07-31", "2026-07-26", "已完成", 168, "实时指标时延由 60 秒降至 8 秒"),
        ("报表指标服务口径统一治理", "管理提升", "2026-12-31", "2026-12-20", "已完成", 112, "统一 386 个指标口径，消除 92 处口径冲突"),
        ("反欺诈引擎规则上线效率提升", "性能优化", "2026-05-31", "2026-06-02", "延期", 54, "规则上线周期由 5 天缩短至 1 天"),
        ("数据中台元数据血缘补全", "管理提升", "2026-09-30", "", "进行中", 88, "已补齐 1200 张表血缘关系"),
        ("个人金融信息分类分级打标", "安全合规", "2026-03-31", "2026-03-27", "完成", 62, "完成 8.4 万字段分级打标"),
        ("反欺诈模型迭代平台化", "系统建设", "2026-11-30", "2026-11-18", "已完成", 95, "模型迭代周期由 3 周缩短至 5 天"),
        ("数据服务接口限流熔断建设", "运维保障", "2026-08-31", "2026-08-30", "已完成", 31, "对外数据服务年度 0 次雪崩"),
    ]),
    ("基础运维组", "OP", [
        ("监控告警平台告警收敛专项", "运维保障", "2026-06-30", "2026-06-25", "已完成", 104, "日均告警量由 4.2 万条降至 3800 条，收敛比 91%"),
        ("日志集中服务平台检索性能优化", "性能优化", "2026-04-30", "2026-04-29", "已完成", 47, "亿级日志检索响应由 12 秒降至 1.4 秒"),
        ("智能运维自动化平台场景扩展", "系统建设", "2026-10-31", "2026-11-12", "延期", 136, "自动化场景由 18 个扩展至 52 个"),
        ("生产变更窗口标准化", "管理提升", "2026-02-28", "2026-02-26", "完成", 22, "变更成功率由 97.2% 提升至 99.4%"),
        ("核心系统容量基线建模", "运维保障", "2026-09-30", "2026-09-24", "已完成", 58, "完成 16 套系统容量水位建模"),
        ("监控指标采集探针统一", "性能优化", "2026-07-31", "2026-07-30", "已完成", 35, "采集开销由 3.2% 降至 0.6%"),
        ("应急预案数字化改造", "管理提升", "2026-12-31", "2026-12-22", "已完成", 74, "168 份预案全部实现线上化演练"),
    ]),
    ("安全合规组", "SC", [
        ("安全合规审计平台日志接入全量化", "安全合规", "2026-05-31", "2026-05-29", "已完成", 89, "接入率由 76% 提升至 100%"),
        ("加密与密钥托管服务国密改造", "安全合规", "2026-08-31", "2026-08-27", "已完成", 118, "密钥服务全面支持 SM 系列算法"),
        ("漏洞扫描与补丁服务闭环建设", "运维保障", "2026-06-30", "2026-07-06", "延期", 63, "高危漏洞平均修复周期由 14 天降至 4 天"),
        ("开源组件依赖治理专项", "管理提升", "2026-10-31", "2026-10-28", "完成", 56, "清理高危开源组件 214 个"),
        ("生产环境特权账号治理", "安全合规", "2026-04-30", "2026-04-24", "已完成", 44, "特权账号由 187 个收敛至 42 个"),
        ("数据出境风险评估", "安全合规", "2026-12-31", "2026-12-16", "已完成", 37, "完成 3 类业务场景合规评估"),
        ("安全基线自动化核查", "运维保障", "2026-09-30", "2026-09-29", "已完成", 41, "基线核查覆盖率 100%"),
    ]),
]

HEADERS = ["条目编号", "工作条目", "类别", "计划完成", "实际完成", "状态", "投入人天", "量化成果"]
COL_W = [0.95, 3.35, 0.95, 1.00, 1.00, 0.85, 0.85, 3.35]   # 合计 12.30


def set_run(run, text, size=10, bold=False, color=None):
    run.text = text
    run.font.name = FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color if color is not None else RGBColor(0x33, 0x33, 0x33)


def textbox(slide, l, t, w, h, text, size=14, bold=False, color=NAVY, align=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    set_run(p.add_run(), text, size, bold, color)
    return tb


def fill_cell(cell, text, size=9, bold=False, color=None, bg=None, center=False):
    cell.margin_left = Emu(45720)
    cell.margin_right = Emu(45720)
    cell.margin_top = Emu(22860)
    cell.margin_bottom = Emu(22860)
    cell.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf = cell.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER if center else PP_ALIGN.LEFT
    set_run(p.add_run(), str(text), size, bold, color)
    if bg is not None:
        cell.fill.solid()
        cell.fill.fore_color.rgb = bg


prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

# ---------------------------------------------------------------- 封面
s = prs.slides.add_slide(BLANK)
bar = s.shapes.add_shape(1, Inches(0), Inches(0), prs.slide_width, Inches(2.2))
bar.fill.solid(); bar.fill.fore_color.rgb = NAVY; bar.line.fill.background()
bar.text_frame.text = ""
textbox(s, 0.8, 0.55, 11.5, 0.6, "示例银行 · 科技部（合成测试数据）", 16, False, RGBColor(0xBD, 0xD7, 0xEE))
textbox(s, 0.8, 1.05, 11.5, 0.8, "2026 年度研发团队工作条目汇编", 30, True, WHITE)
textbox(s, 0.8, 2.7, 11.5, 1.6,
        "编制：科技部远程应用研发部\n数据来源：各研发团队自报 + 项目管理台账核对\n统计区间：2026-01-01 至 2026-12-31",
        14, False, GRAY)
textbox(s, 0.8, 6.4, 11.5, 0.5,
        "说明：本汇编用于团队内部盘点，条目明细见各团队分页；汇总数据以明细为准。", 11, True, RGBColor(0xB0, 0x50, 0x00))
s.notes_slide.notes_text_frame.text = "封面。本文件是团队工作条目的原始汇编，供年终汇总使用。"

# ---------------------------------------------------------------- 团队页
for team, prefix, items in TEAMS:
    s = prs.slides.add_slide(BLANK)
    textbox(s, 0.55, 0.30, 9.0, 0.5, f"{team} · 2026 年度工作条目", 20, True, NAVY)
    textbox(s, 0.55, 0.85, 9.0, 0.35,
            f"共 {len(items)} 条；类别覆盖 系统建设 / 性能优化 / 运维保障 / 安全合规 / 管理提升。",
            11, False, GRAY)

    rows = len(items) + 1
    tbl_shape = s.shapes.add_table(rows, len(HEADERS), Inches(0.55), Inches(1.35), Inches(sum(COL_W)), Inches(0.34 * rows))
    tbl = tbl_shape.table
    tbl.first_row = True
    for i, w in enumerate(COL_W):
        tbl.columns[i].width = Inches(w)
    for j, htxt in enumerate(HEADERS):
        fill_cell(tbl.cell(0, j), htxt, 9, True, WHITE, NAVY, center=True)
    for i, it in enumerate(items, 1):
        vals = [f"{prefix}-{i:02d}"] + list(it)
        for j, v in enumerate(vals):
            center = j in (0, 2, 3, 4, 5, 6)
            fill_cell(tbl.cell(i, j), v, 9, False, None, LIGHT if i % 2 == 0 else None, center=center)
    s.notes_slide.notes_text_frame.text = (
        f"{team} 年度工作条目原始记录。状态字段为团队自报，存在「已完成/完成/进行中/延期」多种写法。"
    )

# ---------------------------------------------------------------- 汇总页
s = prs.slides.add_slide(BLANK)
textbox(s, 0.55, 0.30, 11.0, 0.5, "各团队条目汇总（自报）", 20, True, NAVY)

agg = []
for team, _p, items in TEAMS:
    done = sum(1 for it in items if it[4] in ("已完成", "完成"))
    doing = sum(1 for it in items if it[4] == "进行中")
    delay = sum(1 for it in items if it[4] == "延期")
    days = sum(it[5] for it in items)
    agg.append((team, len(items), done, doing, delay, days))

hdrs = ["责任团队", "工作条目数", "已完成", "进行中", "延期", "投入人天"]
cw = [2.6, 1.8, 1.4, 1.4, 1.2, 1.6]
rows = len(agg) + 2
tbl_shape = s.shapes.add_table(rows, len(hdrs), Inches(1.6), Inches(1.3), Inches(sum(cw)), Inches(0.38 * rows))
tbl = tbl_shape.table
tbl.first_row = True
for i, w in enumerate(cw):
    tbl.columns[i].width = Inches(w)
for j, htxt in enumerate(hdrs):
    fill_cell(tbl.cell(0, j), htxt, 11, True, WHITE, NAVY, center=True)
for i, row in enumerate(agg, 1):
    for j, v in enumerate(row):
        fill_cell(tbl.cell(i, j), v, 11, j == 0, None, LIGHT if i % 2 == 0 else None, center=(j > 0))
tot = ("合计", sum(a[1] for a in agg), sum(a[2] for a in agg), sum(a[3] for a in agg),
       sum(a[4] for a in agg), sum(a[5] for a in agg))
for j, v in enumerate(tot):
    fill_cell(tbl.cell(rows - 1, j), v, 11, True, NAVY, RGBColor(0xDE, 0xEB, 0xF7), center=(j > 0))

textbox(s, 1.6, 5.6, 10.0, 0.9,
        "使用说明：上表为各团队自报汇总，仅作校核参考；对外汇报一律以各团队分页的条目明细重新汇总为准。",
        11, True, RGBColor(0xB0, 0x50, 0x00))
s.notes_slide.notes_text_frame.text = "汇总页。汇总数为自报值，可作交叉校验锚点。"

prs.core_properties.author = "wps-mcp synthetic fixtures"
prs.core_properties.last_modified_by = "wps-mcp synthetic fixtures"
prs.core_properties.comments = "Synthetic test data; all institutions, people and metrics are fictional."
prs.save(OUT)
print("saved:", OUT)
print("slides:", len(prs.slides._sldIdLst))
print("条目总数:", sum(len(t[2]) for t in TEAMS))
for row in agg:
    print("  ", row)
print("  合计:", tot)
