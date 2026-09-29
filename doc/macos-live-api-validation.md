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

## Writer / WPS host blocker and install diagnosis

The local registration is at WPS's macOS `jsaddons/publish.xml` path. It is valid XML, and the current MCP entry is `name="WpsMcpWPS"`, `type="wps"`, `enable="enable_dev"`, `debug=""`, `install="null"`, with a trailing-slash URL. The corresponding `index.html`, `ribbon.xml`, `main.js`, and `manifest.xml` endpoints on port 18766 each returned HTTP 200. WPS documentation maps `type="wps"` to Writer; the registration path/type/URL are correct, while the local metadata now follows the Mac examples more closely.

The user then fully quit and reopened WPS again after the `debug="" install="null"` registry update and opened Writer. The latest WPS process (PID 35690) started at 09:24 and exited at 09:25. No new `/addins/wps/` request attributable to WPS appeared after the known manual curl checks; MCP remained at zero connections. The saved `authaddin.json` is unchanged from 00:13 and has no Writer section. Therefore WPS did not fetch the Writer entry page at all: the callback shim and `main.js` are not the cause of this load attempt, and the added registration attributes did not resolve discovery. Port-18766 assets remain reachable (HTTP 200).

The registration path/type/URL and XML are valid, but WPS for Mac is not consuming this `type="wps"` online entry on this build. WPS's public publish-mode support matrix lists Windows/Linux, not macOS; manual macOS `publish.xml` setup is a community workaround and may be unsupported or version-specific. This now points to Writer-host/plugin-manager compatibility or a different Mac deployment mechanism, not our HTTP page. The existing ET/WPP Add-ins loaded previously from the same config, so the issue is isolated to Writer. No further restart is requested until a different deployment path/build is identified.

The separate pre-existing `DataReportAssistantWPS` entry points to port 17891, where `/addins/wps/` currently returns 404; that entry cannot provide a working Writer Add-in in the current service state. Codex Computer Use also returned **“Computer Use was not approved to use WPS Office”** for read-only UI inspection, even with `--approve-for-me`; no UI actions were taken.

No Writer JS API has been executed on this Mac. Further Writer API validation is blocked until a Mac-compatible Writer Add-in deployment path or a WPS build that discovers this registration is found. Do not request more restarts of the unchanged setup; the last two reloads did not trigger a WPS resource request.

## Remaining work

1. Identify a supported macOS Writer Add-in deployment path or confirm with WPS support whether `type="wps"` online entries are supported in this build.
2. Once Writer registers, connect a disposable document and run its common, event, and `tests.wps` probes.
3. Continue safe function-invocation probes for ET/WPP and additional per-member behavior checks. Event registration/removal was tested, but its callback payloads were not. Property enumeration is not equivalent to invocation.
4. Keep every document mutation in a Render and use only temporary documents that close without saving.

All 114 ET and 107 WPP explicit report rows (common properties, host-specific checks, events, and modern-root presence checks) were rerun on this Mac. The remaining 105 Writer rows are blocked by the absent Writer Add-in. The 2,598 enumerable member rows are an inventory, not a set of safe method invocations; they were not individually invoked. The baseline reports and complete member catalog remain available in `skills/wps-api/references/`.
