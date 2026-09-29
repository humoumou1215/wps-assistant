#!/usr/bin/env python3
"""Build a progressive-disclosure WPS JS API skill from reports.zip."""
import json
import pathlib
import sys
import zipfile
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
ZIP = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "reports.zip"
OUT = ROOT / ".agents/skills/wps-api"
HOSTS = {
    "et": ("spreadsheet", "表格", "Spreadsheet / ET"),
    "wps": ("writer", "文字", "Writer / WPS"),
    "wpp": ("presentation", "演示", "Presentation / WPP"),
}
STATUS = {"supported": "支持", "missing": "缺失", "present_but_failed": "存在但调用失败"}
ALIASES = {"wpsGlobal", "wpsGlobalFull", "window.wps", "window.Application"}


def md_table(rows, headers):
    def cell(s):
        return str(s).replace("|", "\\|").replace("\n", "<br>")
    return "\n".join([
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
        *["| " + " | ".join(cell(x) for x in row) + " |" for row in rows],
    ])


def generic_usage(obj, name, typ):
    path = f"{obj}.{name}"
    if typ == "function":
        return f"`{path}(...)`。先确认该宿主的签名/返回值；报告只枚举到函数时不代表已执行验证。"
    return f"读取 `{path}`；如返回 COM/WPS 对象，仅在 Add-in 执行环境中继续访问，不要直接序列化宿主对象。"


def test_usage(host, name):
    if name == "Application.Name": return "`return Application.Name;`"
    if name == "Application.Version": return "`return Application.Version;`"
    if name == "Application.Build": return "`return Application.Build;`"
    if name == "Application.Workbooks": return "表格：`const books = Application.Workbooks; return books.Count;`"
    if name == "Application.ActiveWorkbook": return "表格：`return Application.ActiveWorkbook.Name;`"
    if name == "Application.ActiveSheet": return "表格：`return Application.ActiveSheet.Name;`"
    if name == "Application.Selection": return "读取当前选区对象；表格可尝试 `Application.Selection.Address`。"
    if name == "Workbooks.Add": return "表格：仅在测试副本/用户明确授权的 Render 中用 `Application.Workbooks.Add()` 创建工作簿。"
    if name.startswith("Range.") and host == "wps":
        return "文字：使用 `Application.ActiveDocument.Content` 或选区 Range 读取；写入只放在 `variable.render` 中。"
    if name.startswith("Range."):
        prop = name.split(".", 1)[1].split()[0]
        return f"表格：读取 `Application.ActiveSheet.Range('A1:B2').{prop}`；写入必须放在 `variable.render` 中。"
    if name == "Application.Presentations": return "演示：`return Application.Presentations.Count;`"
    if name == "Application.ActivePresentation": return "演示：`return Application.ActivePresentation.Name;`"
    if name == "Application.ActiveWindow": return "演示：`return Application.ActiveWindow.View.Slide.SlideIndex;`（属性因版本而异）。"
    if name == "Presentations.Add": return "演示：仅在临时/测试演示文稿或获授权的 Render 中调用 `Application.Presentations.Add()`。"
    if name.startswith("Shapes."):
        return "演示：从 `Application.ActivePresentation.Slides.Item(n).Shapes` 取得集合；创建/修改仅允许在 `variable.render` 中。"
    if name.startswith("TextFrame."):
        return "演示：`shape.TextFrame.TextRange.Text` 读取文本；赋值只放在 `variable.render` 中。"
    if name == "Application.Documents": return "文字：`return Application.Documents.Count;`"
    if name == "Application.ActiveDocument": return "文字：`return Application.ActiveDocument.Name;`"
    if name == "Documents.Add": return "文字：仅在临时/测试文档或获授权的 Render 中调用 `Application.Documents.Add()`。"
    if name.startswith("Tables.") or name.startswith("Table."):
        return "文字：用 `Application.ActiveDocument.Tables` 遍历表格；单元格文本写入只能在 `variable.render` 中。"
    if name.startswith("Application.CreateTaskPane"):
        return "`Application.CreateTaskPane(url, title)` 创建任务窗格；报告仅验证成员存在，按需确认参数并避免信任不受信任 URL。"
    if name.startswith("Application.FileSystem"):
        return "FileSystem 是本机文件能力；只在明确授权的流程使用，文件写入不是文档查询。"
    if name.startswith("Application.ApiEvent") or name.startswith("ApiEvent."):
        return "API 事件注册/注销；报告中“listener registration succeeded”表示注册成功，不代表具体事件参数结构已验证。"
    return "见本节宿主状态与 `显式探测`；不确定签名时先用 `wps.exec` 读取成员/返回类型，再在测试副本验证。"


with zipfile.ZipFile(ZIP) as archive:
    reports = {}
    for filename in archive.namelist():
        if filename.startswith("reports/") and filename.endswith(".json"):
            doc = json.loads(archive.read(filename))
            short = filename.rsplit("/", 1)[1]
            key = "et" if short.startswith("et-") else "wps" if short.startswith("wps-") else "wpp" if short.startswith("wpp-") else None
            if key:
                reports[key] = doc

if set(reports) != set(HOSTS):
    raise SystemExit(f"Expected ET/WPS/WPP reports; got {sorted(reports)}")
OUT.mkdir(parents=True, exist_ok=True)
REF = OUT / "references"
REF.mkdir(exist_ok=True)

summary_rows = []
for key, (host, zh, full) in HOSTS.items():
    report = reports[key]
    counts = Counter(item.get("status") for group in report["tests"].values() if isinstance(group, list) for item in group)
    summary_rows.append([full, report["application"].get("Name", ""), report["application"].get("Version", ""), report["application"].get("Build", ""), counts["supported"], counts["missing"], counts["present_but_failed"]])

skill = """---
name: wps-api
description: WPS Office JavaScript API reference derived from the supplied diagnostic reports; use when inspecting or automating WPS Writer, Spreadsheets, or Presentations through wps-mcp.
---

# WPS API skill (progressive disclosure)

Use this skill only for WPS JS API operations. The MCP server provides document routing and code execution; the WPS JS API remains the document API.

## Fast path

1. Call `workspace.list_documents`, then `document.get` before writing any code.
2. Read only the matching API guide: [表格](references/spreadsheet.md), [演示](references/presentation.md), or [文字](references/writer.md).
3. Use `wps.exec` only for inspection. Create an extraction rule with `transform.create` then run `variable.transform`. Create edits using `render.create` then run `variable.render`.
4. Read [通用 API 与事件](references/common.md) only if needed. Open [完整 API 清单](references/api-catalog.md) only to look up a less common member.

## Hard boundaries

- `wps.exec` and Transform are read-only. Do not attempt property assignment, object construction, file I/O, or mutating methods.
- Only a Render may modify a WPS document. Confirm the target document, range/shape, and replacement content before execution.
- API availability differs by host and WPS version. The diagnostic reports are WPS 12.0 / Build 26885 on UOS Linux ARM64, not this Mac. Treat report support as a platform-specific observation, not a cross-platform guarantee.
- The complete member catalog records enumerable members and candidate-presence checks; member enumeration is not equivalent to invoking/testing the API. Explicit behavior probes and their reported statuses are in each host guide.
- JSAPI executes inside WPS and is not an OS/process sandbox. Only run trusted code. The MCP static guard is best-effort; never rely on it as a security boundary.

## Report baseline

""" + md_table(summary_rows, ["Host", "WPS app", "Version", "Build", "Supported", "Missing", "Present but failed"]) + """

The counts above are exact records in the supplied diagnostic bundles, not a new macOS pass. See [validation notes](references/validation.md).
"""
(OUT / "SKILL.md").write_text(skill, encoding="utf-8")

# host guides include every explicit reported probe, with usage guidance and host-specific status
for key, (host, zh, full) in HOSTS.items():
    report = reports[key]
    app = report["application"]
    lines = [
        f"# {full} API guide", "",
        f"诊断环境：{report.get('targetEnvironment', 'unknown')}；{app.get('Name')} {app.get('Version')} Build {app.get('Build')}。", "",
        "## API 根对象与常用入口", "",
    ]
    if key == "et":
        lines += ["表格宿主：从 `Application.ActiveWorkbook` → `Worksheets.Item(...)` → `Range(...)` 逐步检查。先只读调查；见范围/值写入一律安排到 Render。", "", "```js", "const book = Application.ActiveWorkbook;", "const sheet = book.Worksheets.Item(1);", "return { book: book.Name, sheet: sheet.Name, values: sheet.Range('A1:B10').Value2 };", "```", ""]
    elif key == "wpp":
        lines += ["演示宿主：从 `Application.ActivePresentation` → `Slides.Item(n)` → `Shapes` → `Shape`/`Chart`。先枚举名字和文本，再创建 Render。", "", "```js", "const pres = Application.ActivePresentation;", "const slide = pres.Slides.Item(1);", "const shapes = [];", "for (let i = 1; i <= slide.Shapes.Count; i++) { const s = slide.Shapes.Item(i); shapes.push({ name: s.Name, type: s.Type }); }", "return { name: pres.Name, count: pres.Slides.Count, shapes };", "```", ""]
    else:
        lines += ["文字宿主：从 `Application.ActiveDocument` → `Content`/`Range`/`Selection` 调查文本与结构。写入段落、表格、格式必须放进 Render。", "", "```js", "const doc = Application.ActiveDocument;", "return { name: doc.Name, text: doc.Content.Text };", "```", ""]
    lines += ["## 显式探测结果（逐项）", "", "状态说明：`支持`=报告中的探测成功；`缺失`=成员未提供；`存在但调用失败`=存在但报告所用调用失败。", ""]
    rows = []
    for group, items in report["tests"].items():
        if not isinstance(items, list) or not items:
            continue
        for item in items:
            name = item.get("name", "")
            status = STATUS.get(item.get("status"), item.get("status", ""))
            detail = item.get("detail", "")
            use = test_usage(key, name)
            if group == "events":
                use = f"事件名 `{name}`：通过 API 事件接口注册监听；此诊断只检查注册结果，事件回调数据形状需在目标版本实测。"
            rows.append([group, name, status, detail or "—", use])
    lines.extend(md_table(rows, ["组", "探测项目 / API", "结果", "诊断细节", "用法/建议"]).splitlines())
    lines += ["", "## 成员目录", "", "下表展示诊断脚本枚举到的 API 成员。类型是当时读取到的 JavaScript 值类型；除上面的显式探测项目外，不能据此断言签名或行为经过调用验证。", ""]
    for object_name, members in report["discovered"].items():
        if object_name in ALIASES:
            continue
        if not isinstance(members, list):
            continue
        rows = []
        for member in members:
            name = member.get("name", "")
            typ = member.get("type", "unknown")
            access_error = member.get("accessError") or "—"
            rows.append([name, typ, member.get("source", ""), access_error, generic_usage(object_name, name, typ)])
        if not rows:
            continue
        lines += [f"### `{object_name}` ({len(rows)} members)", "", *md_table(rows, ["成员", "类型", "发现方式", "访问错误", "使用说明"]).splitlines(), ""]
    lines += ["## 候选成员检查", "", "`candidateScan` 是针对候选路径的存在性/类型快照，不是完整方法调用测试。", ""]
    rows = []
    for obj, items in report.get("candidateScan", {}).items():
        if isinstance(items, list):
            for item in items:
                rows.append([obj, item.get("name", ""), STATUS.get(item.get("status"), item.get("status", "")), item.get("type", "")])
    lines.extend(md_table(rows, ["对象", "成员", "存在状态", "类型"]).splitlines())
    lines += ["", "## 应用侧建议", "", "- 使用 `documentId` 定位文档，不要以文件名路由。", "- 先检查活动对象、集合 Count 与目标名称；集合通常用 1-based `Item(index)`。", "- 读 Range/表格/图表时控制输出规模，只返回标量、数组、普通 JSON 对象。", "- API 返回 COM/WPS 宿主代理对象时不要直接 `return object`；显式映射为 JSON 字段。", "- 本目录中带 `write` 的探测仅说明诊断工具在临时文档上完成操作；对 MCP 调用仍需严格遵循 `variable.render` 边界。", ""]
    (REF / f"{host}.md").write_text("\n".join(lines), encoding="utf-8")

# Common API/event test matrix
common_names = []
for key in HOSTS:
    for item in reports[key]["tests"].get("common", []):
        if item["name"] not in common_names:
            common_names.append(item["name"])
rows = []
for name in common_names:
    row = [name]
    for key in HOSTS:
        item = next((x for x in reports[key]["tests"].get("common", []) if x["name"] == name), {})
        row += [STATUS.get(item.get("status"), "—"), item.get("detail", "—")]
    row += [generic_usage("Application", name.replace("Application.", ""), "function" if any(x["name"] == name and x.get("detail") == "function" for r in reports.values() for x in r["tests"].get("common", [])) else "property")]
    rows.append(row)
common = """# 通用 API 与事件

此处汇总三个宿主对通用 `Application` 候选项的观测；WPS版本/平台差异会造成缺失。使用 API 前先在目标宿主通过 `wps.exec` 检查类型。对于函数，表中只列函数存在性，参数签名不由诊断快照证明。

## Application / ApiEvent 通用项

""" + md_table(rows, ["路径", "表格", "细节", "文字", "细节", "演示", "细节", "用法"]) + "\n\n## 事件\n\n事件探测仅验证注册 listener 是否成功；它没有模拟事件触发或对每个 payload 做结构断言。避免将只在其他宿主报告中支持的事件硬编码。\n\n"
for key, (host, zh, full) in HOSTS.items():
    items = reports[key]["tests"].get("events", [])
    rows = [[x["name"], STATUS.get(x["status"], x["status"]), x.get("detail", "—")] for x in items]
    common += f"### {full}\n\n" + md_table(rows, ["事件名", "注册结果", "报告备注"]) + "\n\n"
common += "基础调用形式（需要按对应 WPS 版本确认具体签名/参数）：\n\n```js\nApplication.ApiEvent.AddApiEventListener('WorkbookOpen', handler);\n// 完成后移除监听：Application.ApiEvent.RemoveApiEventListener('WorkbookOpen', handler);\n```\n"
(REF / "common.md").write_text(common, encoding="utf-8")

# De-duplicated cross-host inventory with source object and explicit probe marker
catalog_rows = []
for key, (host, zh, full) in HOSTS.items():
    report = reports[key]
    tested = {x.get("name") for group in report["tests"].values() if isinstance(group, list) for x in group}
    for obj, members in report["discovered"].items():
        if obj in ALIASES or not isinstance(members, list):
            continue
        for member in members:
            name = member.get("name", "")
            typ = member.get("type", "unknown")
            path = f"{obj}.{name}"
            # A few behavior tests use shorthand paths rather than qualification.
            if name in tested or path in tested or any(path.endswith("." + t) for t in tested if "." in t):
                probe = "有同名显式探测；详情看宿主章节"
            else:
                probe = "仅发现/枚举"
            catalog_rows.append([full, obj, name, typ, probe, generic_usage(obj, name, typ)])
catalog_rows.sort(key=lambda row: (row[0], row[1].lower(), row[2].lower()))
(REF / "api-catalog.md").write_text(
    "# 完整 API 成员目录\n\n按报告的 `discovered` 对象成员展开，去掉了与 `Application` 重复的 `wpsGlobal` / `window.wps` 等别名。`function` 表示函数成员可见，不代表参数/效果已验证。查找显式验证结果应返回对应宿主 API guide 的“显式探测结果”。\n\n" +
    md_table(catalog_rows, ["宿主", "对象", "成员", "类型", "验证范围", "使用说明"]) + "\n",
    encoding="utf-8")

validation = """# 验证范围与来源

来源：`reports.zip` 中的三个诊断结果 JSON（ET、WPS Writer、WPP Presentation），原始 `host-info.txt` 记录 UOS Desktop 20、WPS Office 2026 Summer Update 12.8.2.26885；JavaScript 宿主中显示 WPS API Version 12.0 / Build 26885。测试由该诊断 bundle 生成，发生在 Linux ARM64，不是当前 macOS。

## 状态定义

- **支持**：诊断运行时将该检查标为 `supported`。常见 `Application.*` 行只是读取属性类型；功能组项目才有临时对象/写入等行为探测。
- **缺失**：检查结果为 `missing`，通常是属性未定义。
- **存在但调用失败**：成员或事件名存在，但报告所用的特定调用未成功；不能据此推导 API 永远不可用。
- **仅发现/枚举**：从宿主对象上枚举到 member/type，没有执行调用。

## 诊断报告汇总

""" + md_table(summary_rows, ["Host", "WPS app", "Version", "Build", "Supported", "Missing", "Present but failed"]) + "\n\n完整 API inventory 见 [catalog](api-catalog.md)；逐项 test fixture 见 spreadsheet/writer/presentation guide。"
(REF / "validation.md").write_text(validation, encoding="utf-8")

print(f"Generated skill at {OUT}; explicit checks: {sum(sum(len(g) for g in r['tests'].values() if isinstance(g,list)) for r in reports.values())}; catalog rows: {len(catalog_rows)}")
