import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import WebSocket from "ws";

const PORT = 18768;
const BASE = `http://127.0.0.1:${PORT}`;
const WS = `ws://127.0.0.1:${PORT}/ws`;

async function waitForHealth(child, serverLog) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`MCP server exited: ${child.exitCode}; stderr: ${serverLog()}`);
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("MCP server did not become ready");
}
function callText(result) { return JSON.parse(result.content[0].text); }

test("Streamable HTTP MCP tools route to a WPS Add-in and enforce query-only calls", { timeout: 30000 }, async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), "wps-mcp-test-"));
  const child = spawn(process.execPath, [fileURLToPath(new URL("../dist/src/server.js", import.meta.url))], {
    env: { ...process.env, WPS_MCP_TRANSPORT: "http", WPS_MCP_PORT: String(PORT), WPS_MCP_DATA_DIR: dataDir },
    stdio: ["ignore", "ignore", "pipe"],
  });
  const childExit = new Promise((resolve) => child.once("exit", resolve));
  let serverLog = "";
  child.stderr.setEncoding("utf8").on("data", (data) => { serverLog += data; });
  const appState = { writtenValue: null };
  const sheet = {
    Name: "Sheet1",
    Range(address) {
      return {
        Address: address,
        get Value2() { return appState.writtenValue; },
        set Value2(value) { appState.writtenValue = value; },
      };
    },
  };
  const workbook = { Name: "MCP smoke.xlsx", FullName: "/tmp/MCP smoke.xlsx" };
  const app = {
    Name: "WPS表格", Version: "12.0", Build: 26885,
    ActiveWorkbook: workbook, ActiveSheet: sheet, Selection: { Address: "A1:B2" },
    Workbooks: { Count: 1, Item: () => workbook },
  };
  let socket;
  let client;
  try {
    await waitForHealth(child, () => serverLog);
    client = new Client({ name: "wps-mcp-integration-test", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`)));
    socket = new WebSocket(WS);
    // Install message handlers before yielding: open and welcome can arrive in one packet.
    socket.on("message", async (raw) => {
      const request = JSON.parse(raw.toString());
      if (request.type === "request" && request.method === "execute") {
        try {
          const run = new Function("Application", "wps", "variable", `"use strict"; return (async () => {\n${request.code}\n})()`);
          const result = await run(app, app, request.variable);
          socket.send(JSON.stringify({ type: "response", id: request.id, payload: { success: true, result } }));
        } catch (error) {
          socket.send(JSON.stringify({ type: "response", id: request.id, payload: { success: false, error: error.message } }));
        }
      }
    });
    const registered = new Promise((resolve, reject) => {
      socket.once("error", reject);
      socket.once("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "welcome") {
        socket.send(JSON.stringify({ type: "register", hostType: "spreadsheet", documents: [{
          documentKey: workbook.FullName, type: "spreadsheet", name: workbook.Name, path: workbook.FullName,
          activeSheet: "Sheet1", selection: { sheet: "Sheet1", address: "A1:B2" },
        }] }));
        socket.on("message", (payload) => { const event = JSON.parse(payload.toString()); if (event.type === "registered") resolve(); });
      }
      });
    });
    await registered;

    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name), [
      "wps_list_documents", "wps_get_document", "wps_run_readonly_code", "wps_create_variable", "wps_update_transform",
      "wps_create_render", "wps_update_render", "wps_get_variable", "wps_run_transform", "wps_run_render",
    ]);

    const listed = callText(await client.callTool({ name: "wps_list_documents", arguments: {} }));
    assert.equal(listed.documents.length, 1);
    const documentId = listed.documents[0].documentId;
    assert.equal(listed.documents[0].name, workbook.Name);

    const document = callText(await client.callTool({ name: "wps_get_document", arguments: { documentId } }));
    assert.equal(document.activeSheet, "Sheet1");
    assert.equal(document.selection.address, "A1:B2");

    const query = callText(await client.callTool({ name: "wps_run_readonly_code", arguments: {
      documentId, code: "return { name: Application.ActiveWorkbook.Name, version: Application.Version };",
    } }));
    assert.deepEqual(query.result, { name: workbook.Name, version: "12.0" });

    const blocked = await client.callTool({ name: "wps_run_readonly_code", arguments: {
      documentId, code: "Application.ActiveSheet.Range('A1').Value2 = 'not allowed'; return true;",
    } });
    assert.equal(blocked.isError, true);
    assert.match(blocked.content[0].text, /READ_ONLY_VIOLATION/);

    // A single call must surface every violation, not just the first one: the tool result is what
    // the agent corrects against, and a fail-fast guard forces one round trip per violation.
    const blockedBatch = await client.callTool({ name: "wps_run_readonly_code", arguments: {
      documentId, code: "let i = 0; i++;\nconst o = {}; o.a = 1;\nconst d = new Date();\nreturn { i: i, o: o, d: d };",
    } });
    assert.equal(blockedBatch.isError, true);
    const batchError = callText(blockedBatch).error;
    assert.equal(batchError.code, "READ_ONLY_VIOLATION");
    assert.deepEqual(batchError.details.violations.map((violation) => violation.kind), ["UPDATE_EXPRESSION", "MEMBER_ASSIGNMENT", "NEW_OPERATOR"]);
    assert.match(batchError.message, /3 violations found/);
    assert.match(batchError.message, /line 3/);

    const created = callText(await client.callTool({ name: "wps_create_variable", arguments: {
      variableName: "smoke data", sourceDocumentId: documentId,
      code: "return { rows: [[1, 2], [3, 4]], source: Application.ActiveWorkbook.Name };",
    } }));
    assert.equal(created.success, true);
    const variableId = created.variableId;
    const before = callText(await client.callTool({ name: "wps_get_variable", arguments: { variableId } }));
    assert.equal(before.name, "smoke data");
    assert.equal(Object.hasOwn(before, "value"), false);

    const transformed = callText(await client.callTool({ name: "wps_run_transform", arguments: { variableId } }));
    assert.deepEqual(transformed.value, { rows: [[1, 2], [3, 4]], source: workbook.Name });

    const render = callText(await client.callTool({ name: "wps_create_render", arguments: {
      variableId, targetDocumentId: documentId,
      code: "Application.ActiveSheet.Range('A1').Value2 = variable.value.rows; return { updated: true };",
    } }));
    assert.equal(render.success, true);
    const rendered = callText(await client.callTool({ name: "wps_run_render", arguments: { variableId, renderId: render.renderId } }));
    assert.equal(rendered.success, true);
    assert.deepEqual(appState.writtenValue, [[1, 2], [3, 4]]);

    const after = callText(await client.callTool({ name: "wps_get_variable", arguments: { variableId } }));
    assert.deepEqual(after.value, transformed.value);
    assert.equal(after.renders.length, 1);
    assert.ok(serverLog.split(/\r?\n/).filter(Boolean).some(line => { try { const record = JSON.parse(line); return record.event === 'document.registered' && record.documentId === 'doc_001'; } catch { return false; } }));
  } finally {
    if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    if (client) await client.close().catch(() => {});
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    if (child.exitCode === null && child.signalCode === null) await Promise.race([childExit, new Promise((resolve) => setTimeout(resolve, 3000))]);
    await rm(dataDir, { recursive: true, force: true });
  }
});
