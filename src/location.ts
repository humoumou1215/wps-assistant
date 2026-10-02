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

export type DocumentType = "spreadsheet" | "presentation" | "writer";
export type PresentationLocation = {
  kind: "presentation"; slide?: number; slideId?: number; shapeId?: number; shapeName?: string;
  table?: boolean; textTitle?: string; ref: string;
};
export type WriterLocation = {
  kind: "writer"; paragraph?: number; table?: number; heading?: string; afterHeading?: "paragraph" | "table";
  rangeStart?: number; rangeEnd?: number; bookmark?: string; ref: string;
};
export type DocumentLocation = SpreadsheetLocation | PresentationLocation | WriterLocation;
const positive = (value: string) => Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= 2147483647;
const nameValid = (value: string) => value.length > 0 && value.length <= 200 && !/[\x00-\x1f+!]/.test(value);

/** Explicit references only. Names are data, never evaluated as JavaScript. */
export function parseDocumentRefs(type: DocumentType | undefined, ref: string | undefined): DocumentLocation[] {
  if (!ref || !type) return [];
  if (type === "spreadsheet") { const location = parseSpreadsheetRef(ref); return location ? [location] : []; }
  const parts = ref.split("+").map(part => part.trim());
  if (parts.length > 20 || parts.some(part => !part)) return [];
  const locations: DocumentLocation[] = [];
  for (const part of parts) {
    if (type === "presentation") {
      const explicit = /^(SlideID|Slide):([1-9]\d*)(?:!(ShapeID|Shape):(.+))?$/i.exec(part);
      if (explicit && positive(explicit[2]!)) {
        const location: PresentationLocation = { kind: "presentation", ref: part, ...(explicit[1]!.toLowerCase() === "slideid" ? { slideId: Number(explicit[2]) } : { slide: Number(explicit[2]) }) };
        if (explicit[3]?.toLowerCase() === "shapeid") {
          if (!/^\d+$/.test(explicit[4]!) || !positive(explicit[4]!)) return [];
          location.shapeId = Number(explicit[4]);
        } else if (explicit[3]) {
          if (!nameValid(explicit[4]!)) return [];
          location.shapeName = explicit[4];
        }
        locations.push(location); continue;
      }
      // Existing sessions used human-readable page/shape labels. Tables must be
      // unique on the page; text boxes match an exact name or first text line.
      const legacy = /^第([1-9]\d*)页(?:\s+(.+))?$/.exec(part);
      if (!legacy || !positive(legacy[1]!)) return [];
      const slide = Number(legacy[1]), label = legacy[2];
      if (!label) { locations.push({ kind: "presentation", slide, ref: part }); continue; }
      const target = /^(.+?)(文本框|表格|表)$/.exec(label);
      if (!target || !nameValid(target[1]!)) return [];
      if (target[2] !== "文本框") { locations.push({ kind: "presentation", slide, table: true, ref: part }); continue; }
      for (const title of target[1]!.split("与")) {
        if (!nameValid(title)) return [];
        locations.push({ kind: "presentation", slide, textTitle: title, ref: `第${slide}页 ${title}文本框` });
      }
    } else {
      const numbered = /^(Paragraph|Table):([1-9]\d*)$/i.exec(part) || /^第([1-9]\d*)(段|个表格)$/.exec(part);
      if (numbered) {
        const chinese = /^第/.test(part), number = chinese ? numbered[1]! : numbered[2]!;
        if (!positive(number)) return [];
        const table = chinese ? numbered[2] === "个表格" : numbered[1]!.toLowerCase() === "table";
        locations.push({ kind: "writer", ref: part, ...(table ? { table: Number(number) } : { paragraph: Number(number) }) }); continue;
      }
      const range = /^Range:(\d+):(\d+)$/i.exec(part);
      if (range) {
        const rangeStart = Number(range[1]), rangeEnd = Number(range[2]);
        if (![rangeStart, rangeEnd].every(n => Number.isSafeInteger(n) && n <= 2147483647) || rangeEnd < rangeStart) return [];
        locations.push({ kind: "writer", rangeStart, rangeEnd, ref: part }); continue;
      }
      const bookmark = /^Bookmark:(.+)$/i.exec(part);
      if (bookmark && nameValid(bookmark[1]!)) { locations.push({ kind: "writer", bookmark: bookmark[1], ref: part }); continue; }
      const heading = /^Heading:(.+?)(?:!(Paragraph|Table))?$/i.exec(part);
      if (heading && nameValid(heading[1]!)) {
        locations.push({ kind: "writer", heading: heading[1], ...(heading[2] ? { afterHeading: heading[2].toLowerCase() as "paragraph" | "table" } : {}), ref: part }); continue;
      }
      const legacy = /^(.+?)(段落|表格)$/.exec(part);
      if (!legacy || !nameValid(legacy[1]!)) return [];
      locations.push({ kind: "writer", heading: legacy[1], afterHeading: legacy[2] === "表格" ? "table" : "paragraph", ref: part });
    }
  }
  return locations.length <= 20 ? locations : [];
}

export function renderLocations(render: { targetRef?: string; description?: string }, type: DocumentType | undefined): DocumentLocation[] {
  if (render.targetRef !== undefined) return parseDocumentRefs(type, render.targetRef);
  // Preserve the existing spreadsheet description compatibility. Do not guess
  // Word/PPT locations from a prose description of multiple reads and writes.
  const location = type === "spreadsheet" ? renderLocation(render) : undefined;
  return location ? [location] : [];
}
