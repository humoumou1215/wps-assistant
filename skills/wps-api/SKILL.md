---
name: wps-api
description: WPS Office JavaScript API reference derived from the supplied diagnostic reports; use when inspecting or automating WPS Writer, Spreadsheets, or Presentations through wps-mcp.
---

# WPS API skill (progressive disclosure)

Use this skill only for WPS JS API operations. The MCP server provides document routing and code execution; the WPS JS API remains the document API.

## Fast path

1. Call `workspace.list_documents`, then `document.get` before writing any code.
2. Read only the matching API guide: [表格](references/spreadsheet.md), [演示](references/presentation.md), or [文字](references/writer.md).
3. Use `wps.exec` only for inspection. Create an extraction rule with `transform.create` then run `variable.transform`. Create edits using `render.create` then run `variable.render`.
4. Read [通用 API 与事件](references/common.md) only if needed. Before relying on support claims, read [验证范围与 macOS 结果](references/validation.md). Open [完整 API 清单](references/api-catalog.md) only to look up a less common member.

## Hard boundaries

- `wps.exec` and Transform are read-only. Do not attempt property assignment, object construction, file I/O, or mutating methods.
- The read-only guard is a **static AST check** (`assertReadOnlyCode` in `src/server.ts`; the rule set itself lives in `src/readonly-guard.ts`), not a sandbox. It matches on **syntax shape + property name only**, ignoring whether the value is a document object or a plain local one: `const o = {}; o.a = 1`, a bare `i++` on a local counter, and **any** `new` — including `new Date()` — are all rejected. The method denylist matches names case-insensitively, so a locally-created object with a `copy`/`sort` property is rejected as well. Write `i = i + 1` instead of `i++`; plain identifier assignment, `Array.push` and `for` loops pass — the guard blocks the operator and the shape, not the construct. Verified against WPS on Windows, 2026-09-29.
- **All** violations are reported at once (each with `kind`, line/column, source line; structured form on `error.details.violations`) — fix them in one pass rather than iterating one error at a time. Before submitting code to `wps.exec` / `transform.create`, run the offline checker shipped with skill **`wps-mcp-binding`** (`scripts/check-readonly.mjs`, rules in §0 and §3 there). Render code is **not** guarded — that is where document writes belong.
- Only a Render may modify a WPS document. Confirm the target document, range/shape, and replacement content before execution.
- API availability differs by host and WPS version. The diagnostic reports are WPS 12.0 / Build 26885 on UOS Linux ARM64, not this Mac. Treat report support as a platform-specific observation, not a cross-platform guarantee.
- The complete member catalog records enumerable members and candidate-presence checks; member enumeration is not equivalent to invoking/testing the API. Explicit behavior probes and their reported statuses are in each host guide.
- JSAPI executes inside WPS and is not an OS/process sandbox. Only run trusted code. The MCP static guard is best-effort; never rely on it as a security boundary.

## Report baseline

| Host | WPS app | Version | Build | Supported | Missing | Present but failed |
| --- | --- | --- | --- | --- | --- | --- |
| Spreadsheet / ET | WPS表格 | 12.0 | 26885 | 88 | 25 | 1 |
| Writer / WPS | WPS文字 | 12.0 | 12.1.2.26885 | 72 | 31 | 2 |
| Presentation / WPP | WPS 演示 | 12.0 | 12.1.2.26885 | 70 | 36 | 1 |

The counts above are exact records in the supplied diagnostic bundles, not a new macOS pass. See [validation notes](references/validation.md).
