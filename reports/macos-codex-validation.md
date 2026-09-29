# macOS / Codex validation record

This is a record of one environment-specific validation run. Codex was the MCP client and automation tool used in that run; Codex sandbox and Computer Use limitations are not runtime dependencies of `wps-mcp`. The server exposes MCP over Streamable HTTP and is intended to work with other compatible clients.

Date: 2026-09-28 to 2026-09-29

## Current status

| Check | Result | Evidence |
| --- | --- | --- |
| MCP service and Codex registration | PASS | LaunchAgent `com.local.wps-mcp` runs on `127.0.0.1:18766`; Codex `wps-mcp` is Streamable HTTP. `/health` and real Codex MCP calls succeeded. |
| Live ET Add-in | PASS | Codex lists `doc_001` (`wra-contract-excel.xlsx`) as connected. Real metadata, cell/range queries, and temporary-workbook Render probes succeeded. |
| Live WPP Add-in | PASS | Codex lists `doc_002` (`wra-contract-powerpoint.pptx`) as connected. Real slide/shape/table queries and temporary-presentation Render probes succeeded. |
| Live WPS Writer Add-in | PASS (smoke) | A later isolated live run opened a disposable DOCX, read document/table content, used Render for `Content.InsertAfter`, verified read-back, then saved and closed the copy. See [`macos-live-writer-smoke-2026-09-29.md`](macos-live-writer-smoke-2026-09-29.md). The full Writer matrix remains unrun. |
| Codex Computer Use of WPS | BLOCKED | `cua.getApp("com.kingsoft.wpsoffice.mac")` returns `Computer Use was not approved to use WPS Office`, including with automatic approval routing. No WPS UI actions were performed. |
| ET mutation probes | PARTIAL PASS | Ran only inside an unsaved workbook via `variable.render`, then closed without saving. 17 passed; `Range.Value` assignment failed with `Cannot redefine property: Value`. All 13 ET event listeners registered and were removed. |
| WPP mutation probes | PASS | Eight behavior probes ran only in an unsaved presentation via Render; all succeeded; presentation closed without saving. All 13 WPP event listeners registered and were removed. |
| Explicit report matrix | PARTIAL | All 114 ET and 107 WPP explicit rows were rerun on this Mac. The 105 Writer rows were not rerun as a matrix; the later smoke covers only representative document/table reads and text insertion. The 2,598 enumerable member rows were not individually invoked. |
| Local automated suite | PASS outside Codex sandbox | Direct `npm test` passes. Running its HTTP integration harness inside Codex’s `workspace-write` sandbox fails to bind `127.0.0.1:18768` (`listen EPERM`). The test harness uses a mock Add-in, not WPS API behavior. |

## Real document inventory

Codex `workspace.list_documents` returned two live Add-in documents:

- `doc_001` — `wra-contract-excel.xlsx`, Spreadsheet / active sheet `Sales`.
- `doc_002` — `wra-contract-powerpoint.pptx`, Presentation / active slide 1.

All document mutation checks were done in separate temporary, unsaved workbook/presentation objects created by Render. Both were closed with `SaveChanges=false`. Event listener probes registered and immediately removed their handlers without changing document content. A final document list showed only the original two fixtures; neither fixture was saved or modified by the tests.

## API results

See [`macos-live-api-validation.md`](macos-live-api-validation.md) for exact ET/WPP outcomes, build identifiers, and the Add-in-global `wps` versus host-specific `Application` root distinction. The skill copy of this summary is at `.agents/skills/wps-api/references/macos-validation.md`.

## Remaining blocker

The earlier Writer activation blocker was cleared for a representative live smoke test; the results are in [`macos-live-writer-smoke-2026-09-29.md`](macos-live-writer-smoke-2026-09-29.md). The earlier activation diagnosis above records the state at that time. Remaining API coverage is still partial: the 105 explicit Writer rows and 2,598 enumerable member rows were not individually invoked. The DRA Writer entry remains temporarily removed with a backup. CUA access remains denied.
