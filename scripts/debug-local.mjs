/**
 * Local end-to-end debugging harness.
 *
 * Connects two mock WPS Add-ins (spreadsheet + presentation) to the running
 * bridge over WebSocket, then drives every MCP tool over Streamable HTTP and
 * prints a readable report. It replaces the real WPS Office host, so it can
 * validate the MCP/WebSocket/bridge layers but NOT WPS JS API compatibility.
 *
 * Usage:
 *   node dist/src/server.js            # or WPS_MCP_TRANSPORT=http node dist/src/server.js
 *   node scripts/debug-local.mjs [http://127.0.0.1:18766]
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";

const BASE = process.argv[2] ?? process.env.WPS_MCP_URL ?? "http://127.0.0.1:18766";
const MCP_URL = new URL("/mcp", BASE);
const WS_URL = new URL("/ws", BASE).toString().replace(/^http/, "ws");

/** Mirrors the server's state directory resolution so the persistence check follows the running instance. */
function stateFile() {
  const dir = process.env.WPS_MCP_DATA_DIR ?? (process.platform === "win32"
    ? join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "wps-mcp")
    : process.platform === "darwin"
      ? join(homedir(), "Library/Application Support/wps-mcp")
      : join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "wps-mcp"));
  return join(dir, "state.json");
}

const pass = [];
const fail = [];
function check(label, condition, detail = "") {
  (condition ? pass : fail).push(label);
  console.log(`${condition ? "  PASS" : "  FAIL"}  ${label}${condition || !detail ? "" : `\n        ${typeof detail === "string" ? detail : JSON.stringify(detail)}`}`);
}
function parse(result) {
  const text = result.content?.[0]?.text;
  try { return JSON.parse(text); } catch { return { raw: text }; }
}
function section(title) { console.log(`\n=== ${title} ===`); }

/* ---------------------------------------------------------------- mock WPS */

/** A1:B4 -> {r1,c1,r2,c2}; enough for the shapes used below. */
function parseAddress(address) {
  const [start, end = start] = String(address).split(":");
  const cell = (ref) => {
    const match = /^([A-Z]+)(\d+)$/i.exec(ref.trim());
    if (!match) throw new Error(`Invalid range address '${address}'`);
    let column = 0;
    for (const char of match[1].toUpperCase()) column = column * 26 + (char.charCodeAt(0) - 64);
    return { row: Number(match[2]), column };
  };
  const first = cell(start);
  const last = cell(end);
  return { r1: first.row, c1: first.column, r2: last.row, c2: Math.max(last.column, first.column) };
}

function spreadsheetApp(state) {
  const slice = (address) => {
    const { r1, c1, r2, c2 } = parseAddress(address);
    return state.data.slice(r1 - 1, r2).map((row) => row.slice(c1 - 1, c2));
  };
  const sheet = {
    Name: "销售数据",
    Range(address) {
      return {
        Address: address,
        get Value2() { return slice(address); },
        set Value2(value) { state.data = value; state.writes.push(value); },
        get Formula() { return "=SUM(B2:B4)"; },
      };
    },
  };
  const workbook = { Name: "销售数据.xlsx", FullName: "D:\\report\\销售数据.xlsx" };
  return {
    Name: "WPS表格", Version: "12.0", Build: 26885,
    ActiveWorkbook: workbook, ActiveSheet: sheet, Selection: { Address: "A1:B4" },
    Workbooks: { Count: 1, Item: () => workbook },
    Worksheets: {
      Count: 1,
      Item(name) {
        if (name !== undefined && name !== sheet.Name) throw new Error(`Worksheet '${name}' does not exist`);
        return sheet;
      },
    },
  };
}

function presentationApp(state) {
  const shapes = {
    Count: 1,
    Item(name) {
      if (name !== "销售图") return null;
      return {
        Name: "销售图",
        get Chart() { return { get SeriesData() { return state.chart; }, set SeriesData(v) { state.chart = v; state.writes.push(v); } }; },
      };
    },
  };
  const slide = { SlideIndex: 3, Shapes: shapes };
  const presentation = { Name: "经营汇报.pptx", FullName: "D:\\report\\经营汇报.pptx", Slides: { Count: 3, Item: () => slide } };
  return {
    Name: "WPS演示", Version: "12.0",
    ActivePresentation: presentation,
    Presentations: { Count: 1, Item: () => presentation },
    ActiveWindow: { View: { Slide: slide }, Selection: { ShapeRange: { Count: 1, Item: () => ({ Name: "销售图" }) } } },
  };
}

/**
 * Minimal WPS Add-in stand-in: registers documents, then executes incoming
 * code with `Application`, `wps` and `variable` injected, mirroring addon/main.js.
 */
function connectAddin({ hostType, app, documents, label }) {
  const socket = new WebSocket(WS_URL);
  socket.on("message", async (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (message.type === "welcome") {
      socket.send(JSON.stringify({ type: "register", hostType, documents }));
      console.log(`  [${label}] registered: ${documents.map((d) => d.name).join(", ")}`);
      return;
    }
    if (message.type !== "request" || message.method !== "execute") return;
    let payload;
    try {
      const known = documents.some((doc) => doc.documentKey === message.documentKey);
      if (!known) throw new Error("document no longer available in this Add-in context");
      const run = new Function("Application", "wps", "variable", `"use strict"; return (async () => {\n${message.code}\n})()`);
      const result = await run(app, app, message.variable);
      const json = JSON.stringify(result);
      if (json === undefined) throw new Error("Code returned undefined");
      payload = { success: true, result: JSON.parse(json) };
    } catch (error) {
      payload = { success: false, error: error?.message || String(error) };
    }
    socket.send(JSON.stringify({ type: "response", id: message.id, payload }));
  });
  socket.on("error", (error) => console.log(`  [${label}] socket error: ${error.message}`));
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

/* -------------------------------------------------------------------- main */

const sheetState = { data: [["部门", "销售额"], ["华东", 120000], ["华南", 98000], ["华北", 76000]], writes: [] };
const chartState = { chart: [], writes: [] };

const http = await fetch(new URL("/health", BASE)).catch(() => null);
if (!http?.ok) {
  console.error(`Cannot reach the MCP bridge at ${BASE}. Start it first (see scripts/debug-local.mjs header).`);
  process.exit(1);
}
console.log(`Bridge reachable at ${BASE}: ${await http.text()}`);

const sockets = [];
const client = new Client({ name: "wps-mcp-debug", version: "1.0.0" });

try {
  section("Connect mock Add-ins");
  sockets.push(await connectAddin({
    hostType: "spreadsheet", app: spreadsheetApp(sheetState), label: "ET",
    documents: [{
      documentKey: "D:\\report\\销售数据.xlsx", type: "spreadsheet", name: "销售数据.xlsx",
      path: "D:\\report\\销售数据.xlsx", activeSheet: "销售数据", selection: { sheet: "销售数据", address: "A1:B4" },
    }],
  }));
  sockets.push(await connectAddin({
    hostType: "presentation", app: presentationApp(chartState), label: "WPP",
    documents: [{
      documentKey: "D:\\report\\经营汇报.pptx", type: "presentation", name: "经营汇报.pptx",
      path: "D:\\report\\经营汇报.pptx", activeSlide: 3, selection: { type: "shape", shapeNames: ["销售图"] },
    }],
  }));

  await client.connect(new StreamableHTTPClientTransport(MCP_URL));
  section("MCP handshake");
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name);
  check("8 tools exposed", names.length === 8, names);
  check("tool names match spec.md", JSON.stringify(names) === JSON.stringify([
    "workspace.list_documents", "document.get", "wps.exec", "transform.create",
    "render.create", "variable.get", "variable.transform", "variable.render",
  ]), names);

  section("1. workspace.list_documents");
  const listed = parse(await client.callTool({ name: "workspace.list_documents", arguments: {} }));
  check("two documents visible", listed.documents?.length === 2, listed);
  const excel = listed.documents.find((d) => d.type === "spreadsheet");
  const ppt = listed.documents.find((d) => d.type === "presentation");
  check("spreadsheet routed to ET connection", excel?.name === "销售数据.xlsx", excel);
  check("presentation routed to WPP connection", ppt?.name === "经营汇报.pptx", ppt);

  section("2. document.get");
  const excelDoc = parse(await client.callTool({ name: "document.get", arguments: { documentId: excel.documentId } }));
  check("activeSheet reported", excelDoc.activeSheet === "销售数据", excelDoc);
  check("selection reported", excelDoc.selection?.address === "A1:B4", excelDoc.selection);
  const pptDoc = parse(await client.callTool({ name: "document.get", arguments: { documentId: ppt.documentId } }));
  check("activeSlide reported", pptDoc.activeSlide === 3, pptDoc);
  check("shape selection reported", pptDoc.selection?.shapeNames?.[0] === "销售图", pptDoc.selection);

  section("3. wps.exec (read-only investigation)");
  const queried = parse(await client.callTool({ name: "wps.exec", arguments: {
    documentId: excel.documentId,
    code: "const sheet = Application.Worksheets.Item('销售数据'); return { sheet: sheet.Name, rows: sheet.Range('A1:B4').Value2 };",
  } }));
  check("read workbook through WPS JS API", queried.success === true && queried.result.rows.length === 4, queried);

  section("4. Read-only guard (wps.exec must not modify documents)");
  for (const [label, code, pattern] of [
    ["assignment to Range", "Application.ActiveSheet.Range('A1').Value2 = 1; return true;", /READ_ONLY_VIOLATION/],
    ["method call add()", "return Application.ActiveWorkbook.Worksheets.Add();", /READ_ONLY_VIOLATION/],
    ["delete operator", "const o = {a:1}; delete o.a; return o;", /READ_ONLY_VIOLATION/],
    ["new host object", "const d = new Date(); return d.getTime();", /READ_ONLY_VIOLATION/],
    ["eval()", "return eval('1+1');", /READ_ONLY_VIOLATION/],
    ["dynamic member call", "const k = 'Item'; return Application.Worksheets[k](1);", /READ_ONLY_VIOLATION/],
    ["syntax error", "return {;", /INVALID_REQUEST/],
  ]) {
    const blocked = await client.callTool({ name: "wps.exec", arguments: { documentId: excel.documentId, code } });
    check(`blocked: ${label}`, blocked.isError === true && pattern.test(blocked.content[0].text), blocked.content[0].text);
  }

  section("5. transform.create + variable.transform");
  const created = parse(await client.callTool({ name: "transform.create", arguments: {
    variableName: "部门销售额",
    description: "读取销售数据工作表中的部门和销售额",
    sourceDocumentId: excel.documentId,
    code: "const sheet = Application.Worksheets.Item('销售数据'); const rows = sheet.Range('A2:B4').Value2; return rows.map((row) => ({ department: String(row[0]), sales: Number(row[1]) }));",
  } }));
  check("variable created", created.success === true && /^var_/.test(created.variableId), created);
  const variableId = created.variableId;

  const before = parse(await client.callTool({ name: "variable.get", arguments: { variableId } }));
  check("value absent before first transform", Object.hasOwn(before, "value") === false, before);

  const transformed = parse(await client.callTool({ name: "variable.transform", arguments: { variableId } }));
  check("transform returned 3 rows", transformed.value?.length === 3, transformed);
  check("transform mapped fields", transformed.value?.[0]?.department === "华东" && transformed.value?.[0]?.sales === 120000, transformed.value);

  const rendEarly = parse(await client.callTool({ name: "render.create", arguments: {
    variableId, targetDocumentId: ppt.documentId, description: "渲染前占位",
    code: "return { ok: true };",
  } }));
  check("render.create saves without executing", rendEarly.success === true, rendEarly);

  section("6. render.create + variable.render (document write path)");
  const render = parse(await client.callTool({ name: "render.create", arguments: {
    variableId,
    targetDocumentId: ppt.documentId,
    description: "将部门销售额更新到第3页销售图",
    code: "const data = variable.value; const slide = Application.ActivePresentation.Slides.Item(3); const chart = slide.Shapes.Item('销售图').Chart; chart.SeriesData = data; return { updated: true, count: data.length };",
  } }));
  check("render created", render.success === true && /^render_/.test(render.renderId), render);
  check("render not executed by create", chartState.writes.length === 0, chartState.writes);

  const rendered = parse(await client.callTool({ name: "variable.render", arguments: { variableId, renderId: render.renderId } }));
  check("render succeeded", rendered.success === true && rendered.renders?.[0]?.result?.count === 3, rendered);
  check("variable payload reached render code", chartState.chart.length === 3, chartState.chart);

  const after = parse(await client.callTool({ name: "variable.get", arguments: { variableId } }));
  check("value persisted", after.value?.length === 3, after.value);
  check("render metadata listed", after.renders?.length === 2, after.renders);

  section("7. Error contract");
  for (const [label, tool, args, code] of [
    ["unknown document", "document.get", { documentId: "doc_999" }, "DOCUMENT_NOT_FOUND"],
    ["unknown document on exec", "wps.exec", { documentId: "doc_999", code: "return 1;" }, "DOCUMENT_NOT_FOUND"],
    ["unknown variable", "variable.get", { variableId: "var_999" }, "VARIABLE_NOT_FOUND"],
    ["unknown render", "variable.render", { variableId, renderId: "render_999" }, "RENDER_NOT_FOUND"],
  ]) {
    const result = await client.callTool({ name: tool, arguments: args });
    check(`${label} -> ${code}`, result.isError === true && result.content[0].text.includes(code), result.content[0].text);
  }

  const runtimeError = parse(await client.callTool({ name: "wps.exec", arguments: {
    documentId: excel.documentId, code: "return Application.Worksheets.Item('不存在').Name;",
  } }));
  check("runtime error surfaces WPS_EXEC_ERROR", runtimeError.success === false && runtimeError.error?.code === "WPS_EXEC_ERROR", runtimeError);

  section("8. Persistence");
  let state = {};
  try { state = JSON.parse(await readFile(stateFile(), "utf8")); }
  catch (error) { check("state.json readable", false, `${stateFile()}: ${error.message}`); }
  const persisted = state.variables?.find((v) => v.variableId === variableId);
  check(`state.json written to ${stateFile()}`, Boolean(persisted), state.variables?.map((v) => v.variableId));
  check("transform value persisted", persisted?.value?.length === 3, persisted?.value);
  check("renders persisted", persisted?.renders?.length === 2, persisted?.renders);
  check("counters persisted", Object.keys(state.counters ?? {}).length >= 4, state.counters);

  section("9. Disconnect handling");
  sockets[0].close();
  await new Promise((r) => setTimeout(r, 300));
  const afterClose = parse(await client.callTool({ name: "wps.exec", arguments: { documentId: excel.documentId, code: "return 1;" } }));
  check("disconnected doc rejected", afterClose.success === false && afterClose.error?.code === "DOCUMENT_DISCONNECTED", afterClose);
  const stillThere = parse(await client.callTool({ name: "workspace.list_documents", arguments: {} }));
  check("disconnected doc hidden from listing", stillThere.documents?.length === 1, stillThere);
} catch (error) {
  console.error("\nHARNESS ERROR:", error);
  fail.push(`harness: ${error.message}`);
} finally {
  for (const socket of sockets) if (socket.readyState === WebSocket.OPEN) socket.close();
  await client.close().catch(() => {});
}

console.log(`\n================ RESULT: ${pass.length} passed, ${fail.length} failed ================`);
if (fail.length) { console.log("Failed checks:"); for (const item of fail) console.log(`  - ${item}`); process.exitCode = 1; }
