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

A/B isolation found that the `DataReportAssistantWPS` entry in `publish.xml` was interfering with WpsMcpWPS: after removing only that Writer entry (leaving DataReportAssistant ET/WPP intact), WPS requested WPS MCP's `/addins/wps/`, `index.html`, `ribbon.xml`, and `main.js`. The page was fetched but did not establish an MCP WebSocket.

`authaddin.json` previously had ET/WPP sections but no `wps` section. The installer now adds the WpsMcpWPS Writer authorization/load record while preserving existing records. It survived the user's relaunch, but the Add-in still did not appear: the latest server log shows only `/addins/wps/`, without child assets or a WebSocket. Confirm that a Writer document was opened and inspect `Developer Tools → WPS Add-ins` before another restart. `DataReportAssistantWPS` remains temporarily removed for isolation; its backup is `publish.xml.backup-before-writer-conflict-test`. Correction: its directory URL returns 404, but its explicit `index.html`, `ribbon.xml`, and `main.js` endpoints return HTTP 200.

At the time of this install diagnosis, Writer API results had **not yet been tested on macOS**. A later real-WPS smoke run passed; see `doc/macos-live-writer-smoke-2026-09-29.md` in the `wps-mcp` repository (not bundled with this skill, so no relative link). It covered a disposable DOCX, document/table reads, `Content.InsertAfter` through Render and read-back, save, and close. The full Writer matrix remains untested. Codex Computer Use remains denied.

All 114 ET and 107 WPP explicit report rows were rerun on this Mac. The 105 Writer rows were not rerun as a matrix; the later smoke covers only representative API paths. The 2,598 enumerable member rows are an inventory, not a set of safe method invocations; they were not individually invoked.
