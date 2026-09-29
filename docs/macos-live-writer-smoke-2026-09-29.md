# macOS real-WPS Writer smoke test

Date: 2026-09-29
Platform: macOS / Apple Silicon, Darwin 25.5.0
Test MCP/Add-in WebSocket port: `127.0.0.1:18767` (production service remains on `18766`)
Driver: project MCP tools over isolated Streamable HTTP; Writer Add-in and APIs executed inside real WPS Writer

## Result

**PASS** — `npm run test:wps-writer-live` passed one live Writer suite. It generated and opened a unique disposable DOCX, verified the active document path before querying or writing, read the document and table through WPS APIs, inserted a token through Render, read it back, saved the disposable copy, and closed it.

The DOCX fixture is deterministic test input from `test/wps-live/create-fixtures.py`; no API responses are mocked. The test Add-in was temporarily routed to port `18767` and restricted to the exact disposable document. The runner closed the WPS session it launched, restored `addon/main.js`, and removed the temporary file and state directory.

## Observed Writer host and API results

- `Application.Name`: `Microsoft Word`
- WPS API `Version`: `12.0`; `Build`: `12.1.28496.28496`
- `Application.ActiveDocument.FullName` matched the disposable DOCX before each read/write/save/close step.
- Read `Document.Content.Text`, `Document.Tables.Count` (`1`), and `Tables.Item(1).Cell(1,1).Range.Text`; both seed markers were present.
- Render called `Document.Content.InsertAfter` with a per-run token; immediate result and subsequent content read-back confirmed insertion.
- Saved and closed only the disposable DOCX.

## Isolation and limits

- MCP and Add-in WebSocket traffic used the isolated port `18767`; the existing service on `18766` served static Add-in assets only.
- `addon/main.js` was temporarily configured to use `18767` and to send only the test document's metadata to the test bridge. The original source was restored afterward. `publish.xml` and `authaddin.json` were not changed by this run.
- This is a representative Writer smoke test, not the full Writer API matrix. It does not validate all 105 explicit Writer rows, event callbacks, or other WPS builds.
