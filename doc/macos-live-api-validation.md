# macOS live WPS API validation

This report documents one historical validation run that used Codex as its MCP client. Codex-specific setup and limitations below describe that test environment, not a runtime dependency; `wps-mcp` exposes the standard MCP Streamable HTTP interface for compatible clients.

Date: 2026-09-28 to 2026-09-29  
Platform: macOS / WPS Office 12.1.28496  
Driver: local `wps-mcp` WebSocket Add-in bridge, called through Codex MCP tools  
Baseline archive: `reports.zip` (UOS Linux ARM64 / WPS 12.0 Build 26885)

## Live documents and coverage

Codex connected to the real local WPS Add-ins and `workspace.list_documents` returned:

| ID | Host | Fixture | State |
| --- | --- | --- | --- |
| `doc_001` | ET / Spreadsheet | `wra-contract-excel.xlsx` | Connected; active sheet `Sales`; left unchanged |
| `doc_002` | WPP / Presentation | `wra-contract-powerpoint.pptx` | Connected; active slide 1; left unchanged |

`document.get`, `wps.exec`, Transform, and Render paths were exercised through Codex. All mutating probes below ran in a newly-created unsaved workbook/presentation through `variable.render`; each was closed with `SaveChanges=false`. A final document listing contained only the two original fixtures.

## ET / Spreadsheet

WPS returned `Application.Name = Microsoft Excel`, `Version = 12.0`, `Build = 28496`.

| Probe | macOS outcome | Notes |
| --- | --- | --- |
| `Workbooks.Add` / temporary workbook | PASS | New `工作簿1`; one worksheet; closed unsaved |
| `Application.Workbooks`, `ActiveWorkbook`, `ActiveSheet`, `Selection` | PASS | Counts/name/sheet/selection address readable |
| `Range.Value` write | FAIL | `TypeError: Cannot redefine property: Value` (same failure signature as the UOS report) |
| `Range.Formula` write | PASS | `=1+2` read back; `Value2` was `3` |
| `Range.Font.Bold` write | PASS | Read back `true` |
| `Range.NumberFormat` write | PASS | Read back `0.00` |
| `Range.Merge` / `UnMerge` | PASS | `MergeCells` changed `true` then `false` |
| `Range.Copy(destination)` | PASS | Copied formula result `3` to destination cell |
| `Range.Insert` / `Delete` | PASS | Both succeeded in the unsaved workbook |
| `Range.Select` | PASS | Selection address read back as `$B$4` |
| `Shapes.AddShape` / `AddTextbox` | PASS | Returned Rectangle and TextBox objects |
| `Range.Find` | PASS on fixture | `Find("East")` returned `$A$2`; the isolated blank-workbook search for `"3"` returned no match |
| Read values/formula/number format/merge state | PASS with caveat | `Value2` and `Formula` returned expected fixture data; multi-cell `Font.Bold` was `null`; `Range.Value` read serialized as undefined |

## WPP / Presentation

WPS returned `Application.Name = Microsoft PowerPoint`, `Version = 12.0`, `Build = 12.1.28496.28496`.

| Probe | macOS outcome | Notes |
| --- | --- | --- |
| `Presentations.Add` / temporary presentation | PASS | New `演示文稿1`; initially zero slides |
| Add blank slide | PASS | One slide, index 1 |
| `Shapes.AddTextbox` | PASS | Returned `文本框 1` |
| `TextFrame.TextRange.Text` write/read | PASS | Read back `WPS MCP temporary test` |
| Shape geometry (`Left`, `Top`, `Width`, `Height`) | PASS | Read back 30, 40, 210, 60 |
| Shape `Fill.ForeColor.RGB` write/read | PASS | Read back 3368601 |
| `Shape.Duplicate` | PASS | Returned a one-item range; its item name was `default` |
| `Shapes.AddTable` / table-cell text write | PASS | 2×2 table; cell read back `Metric` |
| Presentation/slide/shape/table reads | PASS | Two slides and four first-slide shapes; table cells read as `Metric`, `Value`, `Profit`, `0` |

All eight WPP Render probes returned success. The temporary presentation was closed unsaved; the original fixture remained connected and listed.

## Event API checks

The ET and WPP event rows from `reports.zip` were individually registered and immediately removed through Render; all registration/removal pairs passed on this Mac. No test event was triggered, so callback payloads remain unverified. Notably, WPP `WindowDeactivate` registered successfully here even though the UOS report marked it invalid.

## API-root and common-member observations

The 70 unique common property paths from the ET report were inspected on both live app-specific `Application` objects. The report’s duplicate `Application.ApiEvent` row was preserved as one unique path for counting. The expected Linux/macOS differences should not be interpreted as behavior failures without considering the root object:

- On macOS, `Application.ApiEvent` was `undefined`, while the actual Add-in global `wps.ApiEvent` was an object and exposed `AddApiEventListener` and `RemoveApiEventListener` as functions. Event handlers were registered and removed in the Render probes below.
- On both live hosts, the Add-in global `wps` exposed `Enum`, `Application`, `ApiEvent`, `FileSystem`, `PluginStorage`, `CreateTaskPane`, `GetTaskPane`, `CreateWebDialog`, `GetWebDialog`, `ShowDialog`, and `UpdateRibbon` with object/function types. ET additionally exposed `wps.AddCustomFunction`; WPP did not.
- Several of those are `undefined` on the app-specific `Application` object but present on `wps`. Future probes must use the appropriate root for this Mac build.
- The ET and WPP common-member output was a property-presence/type check only. It did not invoke every function. Full output and tool traces were captured during this session; detailed per-member source-platform rows remain in the Skill guides.

## Writer / WPS host install diagnosis

`publish.xml` is valid and has a `WpsMcpWPS` `type="wps"` entry. The relevant additional state is `authaddin.json`, which previously had `et` and `wpp` sections but no `wps` section. ET/WPP Add-ins were therefore registered in both files, while the Writer Add-in had only the publish entry.

A targeted isolation test found that `publish.xml` also contained a separate `DataReportAssistantWPS` entry. With that entry present, WPS did not request the WPS MCP Writer assets. I backed up the file and temporarily removed **only** `DataReportAssistantWPS`, leaving DataReportAssistant ET/WPP and all WPS MCP entries. On the next WPS launch, its process requested `/addins/wps/`, `index.html`, `ribbon.xml`, and `main.js` from port 18766. This is strong evidence that the Writer-specific DataReportAssistant registration was masking/interfering with WpsMcpWPS; its ET/WPP entries are still present. The Writer page was fetched, but it did not establish a WebSocket connection or appear in `authaddin.json` yet.

The DataReportAssistant asset check also needs correction: its directory URL `/addins/wps/` returns 404, but its explicit `index.html`, `ribbon.xml`, and `main.js` endpoints return HTTP 200. My previous claim that its Writer assets were unavailable was inaccurate.

I found the Mac Writer registration pattern used by [a community WPS Writer installer](https://github.com/claude-office-skills/claude-wps-word-plugin/blob/main/install-to-wps-word.sh): update both `publish.xml` and `authaddin.json`. The installer now preserves ET/WPP records and adds a `wps` auth entry for WpsMcpWPS, and refuses to modify config while WPS is running. After the user's latest relaunch, that auth entry remained in `authaddin.json`, but WPS MCP still did not appear. The latest server log shows WPS requested `/addins/wps/` but did not proceed to `index.html`, `ribbon.xml`, `main.js`, or a WebSocket connection; ET/WPP assets did load in the same log window. MCP health was `connections: 0` when checked, and WPS was no longer running. This means the auth record alone has not completed Writer activation; if the user did open a Writer document, the remaining issue is in WPS's Writer add-in activation/manager path. Confirm whether a Writer document was opened and inspect `Developer Tools → WPS Add-ins` before requesting another restart.

At the time of this earlier validation, `DataReportAssistantWPS` remained temporarily removed for isolation, backed up at `publish.xml.backup-before-writer-conflict-test`, and no Writer JS API had been executed. A later real-WPS smoke run succeeded; see [`macos-live-writer-smoke-2026-09-29.md`](macos-live-writer-smoke-2026-09-29.md). It verified a disposable DOCX, document/table reads, `Content.InsertAfter` through Render and read-back, save, and close. The smoke used the current WpsMcpWPS registration; it does not cover the full Writer matrix or DRA coexistence. Codex Computer Use remains denied for WPS UI inspection.

## Remaining work

1. Expand Writer coverage across common, event, and `tests.wps` probes using disposable documents.
2. If desired, restore the backed-up DataReportAssistantWPS entry and verify whether both Writer Add-ins coexist.
3. Continue safe function-invocation probes for ET/WPP and additional per-member behavior checks. Event registration/removal was tested, but its callback payloads were not. Property enumeration is not equivalent to invocation.
4. Keep every document mutation in a Render and use only temporary documents that close without saving.

All 114 ET and 107 WPP explicit report rows (common properties, host-specific checks, events, and modern-root presence checks) were rerun on this Mac. The 105 Writer rows were not rerun as a matrix; the later smoke covers only representative document/table reads and content insertion. The 2,598 enumerable member rows are an inventory, not a set of safe method invocations; they were not individually invoked. The baseline reports and complete member catalog remain available in `skills/wps-api/references/`.
