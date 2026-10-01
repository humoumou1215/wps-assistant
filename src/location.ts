export type SpreadsheetLocation = { sheet: string; address: string; ref: string; start?: number; end?: number };

/** Only explicit, bounded A1 references can drive navigation. Never evaluate saved code. */
export function parseSpreadsheetRef(ref: string | undefined): SpreadsheetLocation | undefined {
  if (!ref) return;
  const match = /^\s*('(?:[^']|'')+'|[^!']+)!\s*(\$?[A-Z]{1,3}\$?[1-9]\d{0,6})(?::(\$?[A-Z]{1,3}\$?[1-9]\d{0,6}))?\s*$/i.exec(ref);
  if (!match) return;
  const rawSheet = match[1]!;
  const sheet = rawSheet.startsWith("'") ? rawSheet.slice(1, -1).replace(/''/g, "'") : rawSheet.trim();
  if (!sheet || sheet.length > 31 || /[\[\]:*?/\\\x00-\x1f]/.test(sheet)) return;
  const cell = (text: string) => {
    const parts = /^([A-Z]+)(\d+)$/.exec(text.replace(/\$/g, "").toUpperCase())!;
    return { column: [...parts[1]!].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0), row: Number(parts[2]) };
  };
  const first = cell(match[2]!), last = cell(match[3] || match[2]!);
  if (last.column > 16384 || last.row > 1048576 || first.column > last.column || first.row > last.row) return;
  const address = (match[2]! + (match[3] ? `:${match[3]}` : "")).replace(/\$/g, "").toUpperCase();
  return { sheet, address, ref: `${rawSheet.trim()}!${address}` };
}

/** Backward compatibility for descriptions with exactly one recognizable destination. */
export function renderLocation(render: { targetRef?: string; description?: string }): SpreadsheetLocation | undefined {
  if (render.targetRef !== undefined) return parseSpreadsheetRef(render.targetRef);
  const text = render.description || "";
  const matches = [...text.matchAll(/('(?:[^']|'')+'|[\p{L}\p{N}_.-]+)!\$?[A-Z]{1,3}\$?[1-9]\d{0,6}(?::\$?[A-Z]{1,3}\$?[1-9]\d{0,6})?(?![\p{L}\p{N}_:$])/giu)];
  if (matches.length !== 1 || text.split("!").length !== 2) return;
  const match = matches[0]!, prefix = text.slice(0, match.index!);
  // Do not turn an external workbook reference or a partial unquoted name into a local target.
  if (/[\[\]'"!]$/.test(prefix) || (!match[0].startsWith("'") && /[A-Za-z0-9_.-]\s+$/.test(prefix))) return;
  const location = parseSpreadsheetRef(match[0]);
  return location ? { ...location, start: match.index!, end: match.index! + match[0].length } : undefined;
}
