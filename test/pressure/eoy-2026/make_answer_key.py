# -*- coding: utf-8 -*-
"""从 truth 导出判定答案卡（给评阅人用，不要交给被测 Agent）。"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import truth

R = truth.compute()
L = []
A = L.append

A("# 判定答案卡（评阅人用 · 勿交给被测 Agent）")
A("")
A("> 合成测试数据，机构、人员和指标均为虚构。由 `truth.py` 依「汇报口径」从两份源文件计算得出，可重复执行校验。")
A("")
A("## 一、四个 KPI（目标1 第 3 页 / 目标2 第一章）")
A("")
A("| 指标 | 口径 | 答案 |")
A("|---|---|---|")
k = R["kpi"]
A(f"| 全年投产总次数 | 变更类型 ∈ {{投产上线, 紧急修复}} 的记录数 | **{k['全年投产次数']}** 次 |")
A(f"| 重大故障起数 | 事件等级 ∈ {{一级, I级}} 的记录数 | **{k['重大故障起数']}** 起 |")
A(f"| 系统平均可用率 | 各月可用率按交易笔数加权 | **{k['平均可用率']*100:.4f}%**（约 99.96%） |")
A(f"| 完成工作条目数 | 源B 状态 ∈ {{已完成, 完成}} 的条目数 | **{k['完成工作条目数']}** 条（总 {k['工作条目总数']} 条） |")
A("")
A("常见错误答案（用于识别未按口径换算）：")
A(f"- 投产次数若报 240 → 未剔除「优化变更」（80 条）；若报 130 → 漏掉 30 条「紧急修复」。")
A("- 重大故障若报 60 → 未按等级筛选；若报 10 → 漏掉 2 条手写 `I级`。")
A("- 平均可用率若报约 99.958% 附近但小数位对不上 → 用了简单平均（未加权）或把 `99.97%` 文本当字符串跳过。")
A("")
A("## 二、重点系统清单（目标1 第 5 页 + 续页）")
A("")
A("排序规则：全年投产次数降序，同次数按台账序号升序。**共 16 行，单页容量 12 行 → 第 13-16 行必须落在续页。**")
A("")
A("| 序号 | 应用系统 | 系统等级 | 归属团队 | 全年投产次数 | 重大故障(起) | 平均可用率 | 同比 | 所在页 |")
A("|---|---|---|---|---|---|---|---|---|")
for i, s in enumerate(R["systems"], 1):
    yoy = "新增" if not isinstance(s["同比"], float) else f"{s['同比']*100:+.1f}%"
    page = "主表" if i <= 12 else "**续页**"
    A(f"| {s['序号']} | {s['全称']} | {s['等级']} | {s['团队全称']} | {s['投产次数']} | "
      f"{s['重大故障']} | {s['可用率']*100:.3f}% | {yoy} | {page} |")
A("")
A("> 续页 4 条：第 13-16 名，序号分别为 "
  + "、".join(str(s["序号"]) + " " + s["全称"] for s in R["systems"][12:]) + "。")
A("")
A("## 三、月度投产趋势（目标1 第 4 页图表 12 根柱子）")
A("")
A("| 月份 | " + " | ".join(f"{m}月" for m in range(1, 13)) + " |")
A("|---|" + "---|" * 12)
A("| 投产次数 | " + " | ".join(str(R["monthly_prod"][m]) for m in range(1, 13)) + " |")
A("")
A(f"合计 {sum(R['monthly_prod'].values())} 次（与 KPI 一致）。")
A("")
A("## 四、目标2 第二章：按责任团队投产统计（多级表头，6 行）")
A("")
A("| 责任团队 | 投产次数 | 优化变更 | 紧急修复 | 回退次数 | 平均影响时长(分) |")
A("|---|---|---|---|---|---|")
for code, d in sorted(R["by_team_prod"].items(),
                      key=lambda x: -(x[1]["投产"] + x[1]["紧急"])):
    prod = d["投产"] + d["紧急"]
    avg = d["影响合计"] / (d["投产"] + d["优化"] + d["紧急"]) if (d["投产"] + d["优化"] + d["紧急"]) else 0
    A(f"| {truth.TEAM_FULL[code]} | {prod} | {d['优化']} | {d['紧急']} | {d['回退']} | {avg:.1f} |")
A("")
A("> 注：「平均影响时长」= 该团队全部变更影响时长合计 ÷ 变更总条数。若评阅口径改为「合计」，"
  "则分别为 " + "、".join(f"{truth.TEAM_FULL[c]} {d['影响合计']}" for c, d in R["by_team_prod"].items()) + "。")
A("")
A("## 五、目标2 第三章：按系统故障与日志（16 行，必然跨页）")
A("")
A("| 应用系统 | 一级 | 二级 | 三级 | 重大故障(起) | 日志异常总数 | 平均可用率 |")
A("|---|---|---|---|---|---|---|")
import collections
wbi = truth.load_workbook(truth.XLSX, data_only=True)
lv_by_code = collections.defaultdict(lambda: {"一级": 0, "二级": 0, "三级": 0})
for row in truth._rows(wbi["故障事件"], 3):
    _i, _w, code, level, _d, _c, _r = row[:7]
    lv = truth.LEVEL_NORM.get(level)
    if lv:
        lv_by_code[code][lv] += 1
logn = {}
for row in truth._rows(wbi["日志异常"], 3):
    _m, code, cnt, _s = row[:4]
    logn[code] = logn.get(code, 0) + int(cnt or 0)
for s in R["systems"]:
    d = lv_by_code[s["代号"]]
    A(f"| {s['全称']} | {d['一级']} | {d['二级']} | {d['三级']} | {d['一级']} | "
      f"{logn.get(s['代号'], 0):,} | {s['可用率']*100:.3f}% |")
A("")
A("> 校验：一级合计 = " + str(sum(lv_by_code[c]["一级"] for c in lv_by_code)) +
  "，二级合计 = " + str(sum(lv_by_code[c]["二级"] for c in lv_by_code)) +
  "，三级合计 = " + str(sum(lv_by_code[c]["三级"] for c in lv_by_code)) + "。跨页后标题行应重复出现。")
A("")
A("## 六、目标2 第四章：团队工作完成情况（7 列，6 行）")
A("")
A("| 责任团队 | 归属系统数 | 工作条目数 | 已完成 | 进行中 | 延期 | 投入人天 |")
A("|---|---|---|---|---|---|---|")
sys_cnt = collections.Counter(s["团队全称"] for s in R["systems"])
for tname, d in R["team_work"].items():
    A(f"| {tname} | {sys_cnt.get(tname, 0)} | {d['条目']} | {d['已完成']} | {d['进行中']} | "
      f"{d['延期']} | {d['人天']} |")
A(f"| **合计** | {sum(sys_cnt.values())} | {k['工作条目总数']} | {k['完成工作条目数']} | "
  f"{sum(d['进行中'] for d in R['team_work'].values())} | "
  f"{sum(d['延期'] for d in R['team_work'].values())} | "
  f"{sum(d['人天'] for d in R['team_work'].values())} |")
A("")
A("> 注意「归属系统数」来自源A，其余来自源B；两表团队名写法不同，需归一为全称。")
A("")
A("## 七、目标2 第五章：文字题（无唯一答案，按证据充分度评分）")
A("")
A("可采信的证据线索：")
A("- 重复故障：故障事件表「是否重复发生」列，统计占比。")
A("- 变更质量：全量变更中回退 " + str(sum(d["回退"] for d in R["by_team_prod"].values())) +
  " 次；紧急修复 " + str(sum(d["紧急"] for d in R["by_team_prod"].values())) + " 次。")
A("- 团队交付：延期条目集中在 " +
  "、".join(f"{t}（{d['延期']} 条）" for t, d in R["team_work"].items() if d["延期"] >= 1) + "。")
A("- 运行短板：可用率最低的系统为 " +
  "、".join(f"{s['全称']}（{s['可用率']*100:.3f}%）" for s in
            sorted(R["systems"], key=lambda x: x["可用率"])[:3]) + "。")

open("答案卡.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("saved: 答案卡.md", len(L), "行")
