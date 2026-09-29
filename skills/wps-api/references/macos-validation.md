# macOS live validation (2026-09-28 to 2026-09-29)

Environment: macOS, WPS Office 12.1.28496. Codex called the real local Add-ins through `wps-mcp`; the fixture/API notes in the other host guides remain from UOS Linux ARM64 / WPS Build 26885. Full run record: `doc/macos-live-api-validation.md` in the `wps-mcp` repository (not bundled with this skill, so no relative link).

## Connected hosts

| MCP ID | Host | Fixture | Verified context |
| --- | --- | --- | --- |
| `doc_001` | ET / Spreadsheet | `wra-contract-excel.xlsx` | `Microsoft Excel`, API 12.0 / Build 28496; sheet `Sales` |
| `doc_002` | WPP / Presentation | `wra-contract-powerpoint.pptx` | `Microsoft PowerPoint`, API 12.0 / Build `12.1.28496.28496`; two slides |

Both are synthetic test fixtures. Queries were read-only; mutation probes used separate unsaved documents through Render, closed with `SaveChanges=false`. Final MCP inventory returned only these original two fixtures.

## ET observed outcomes

- `Workbooks.Add`, temporary workbook creation/close, Workbooks/ActiveWorkbook/ActiveSheet/Selection: pass.
- `Range.Value` assignment: **fails** with `TypeError: Cannot redefine property: Value`; this matches the supplied report’s failure signature. `Range.Value` read on the live test was undefined; use `Value2`/`Formula` and verify the specific build.
- `Range.Formula`, `Font.Bold`, `NumberFormat`, `Merge`, `UnMerge`, `Copy(destination)`, `Insert`, `Delete`, `Select`, `Shapes.AddShape`, and `Shapes.AddTextbox`: passed in an unsaved workbook.
- `Range.Find("East")` on the fixture returned `$A$2`. A blank-workbook search with a different criterion returned no match, not an exception.
- `Value2` and `Formula` read the `Sales` fixture data. Reading `Font.Bold` over a mixed multi-cell range returned `null`.

## WPP observed outcomes

- `Presentations.Add`, add blank slide, `Shapes.AddTextbox`, `TextFrame.TextRange.Text` write/read, geometry writes, Fill color write/read, `Shape.Duplicate`, and `Shapes.AddTable` plus `Table.Cell` text write: all passed in an unsaved presentation.
- Presentation, slide, shape and table reads passed. The fixture table was 2×2 with cells `Metric`, `Value`, `Profit`, `0`.
- Temporary presentation closed unsaved; the original remained connected.

## Event checks

All 13 ET and all 13 WPP report event names registered and were immediately removed via Render. No event was triggered, so callback payloads were not tested. WPP `WindowDeactivate` succeeded on this Mac despite being marked invalid in the UOS report.

## API roots

On this Mac, some APIs were on the Add-in global `wps`, not the host-specific `Application` object:

- `wps.ApiEvent` exists; add/remove listener members are functions, and event handlers registered/removed successfully.
- On both ET and WPP, `wps.Enum`, `wps.Application`, `wps.ApiEvent`, `wps.FileSystem`, `wps.PluginStorage`, `wps.CreateTaskPane`, `wps.GetTaskPane`, `wps.CreateWebDialog`, `wps.GetWebDialog`, `wps.ShowDialog`, and `wps.UpdateRibbon` were present with object/function types.
- `wps.AddCustomFunction` was a function in ET and undefined in WPP.
- `Application.ApiEvent` and many modern members were undefined on the host-specific app objects, despite being available on `wps`. Use the actual root observed for the current Add-in build; property presence alone does not prove successful invocation.

## Writer install diagnosis

The macOS `jsaddons/publish.xml` path and XML are valid. `WpsMcpWPS` uses `type="wps"`, `enable="enable_dev"`, and the trailing-slash URL `http://127.0.0.1:18766/addins/wps/`; its `index.html`, `ribbon.xml`, `main.js`, and `manifest.xml` endpoints all return HTTP 200. WPS documentation maps `type="wps"` to Writer. So the registration metadata and served URLs currently look correct.

Writer has not registered with MCP after two full WPS restarts with Writer open. The last restart happened after adding `debug="" install="null"`; no WPS-originated `/addins/wps/` request appeared and the bridge stayed at zero connections. Manual requests to the same assets return HTTP 200, so the HTML/JS entry is not reached. The `authaddin.json` remains stale (timestamp 00:13) with no Writer section. This WPS Mac build is not consuming the `type="wps"` online entry despite a valid local `publish.xml`; public WPS publish-mode documentation lists Windows/Linux, not macOS, while manual Mac config is a community workaround. No further restart of this unchanged setup is warranted; find a supported Mac deployment path/build or verify with WPS support. The separate `DataReportAssistantWPS` URL on port 17891 returns 404. Codex Computer Use remains denied.

Writer API results remain **not tested on macOS** until the refreshed Writer Add-in registers a disposable document.

All 114 ET and 107 WPP explicit report rows were rerun on this Mac. The remaining 105 Writer rows are blocked by the absent Writer Add-in. The 2,598 enumerable member rows are an inventory, not a set of safe method invocations; they were not individually invoked.
