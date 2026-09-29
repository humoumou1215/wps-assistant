import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, realpath, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const LIVE = process.env.WPS_LIVE === "1";
const PORT = Number(process.env.WPS_LIVE_PORT ?? "18767");
const BASE = `http://127.0.0.1:${PORT}`;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function textResult(response) {
  const text = response.content?.find((item) => item.type === "text")?.text;
  assert.ok(text, "MCP tool response has no text content");
  return JSON.parse(text);
}

async function waitForHealth(child, logs) {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(`test MCP server exited (${child.exitCode}): ${logs()}`);
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {}
    await pause(250);
  }
  throw new Error(`test MCP server did not become ready at ${BASE}; ${logs()}`);
}

async function invoke(client, name, args = {}) {
  const response = await client.callTool({ name, arguments: args });
  const payload = textResult(response);
  if (response.isError || payload.success === false) {
    throw new Error(`${name} failed: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function normalizedPath(path) {
  return path.replace(/^\/private\//, "/");
}

async function waitForDocument(client, type, expectedPath) {
  const expectedRealPath = normalizedPath(await realpath(expectedPath));
  let lastDocuments = [];
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const result = await invoke(client, "workspace.list_documents");
    lastDocuments = result.documents ?? [];
    const match = lastDocuments.find((doc) => {
      if (doc.type !== type || !doc.path) return false;
      const listedPath = normalizedPath(doc.path);
      return listedPath === expectedRealPath || basename(listedPath) === basename(expectedRealPath);
    });
    if (match) return match;
    await pause(1_000);
  }
  throw new Error(`WPS did not register ${type} document ${expectedPath}; registered: ${JSON.stringify(lastDocuments)}`);
}

async function openInWps(file) {
  const result = spawnSync("open", ["-a", "/Applications/wpsoffice.app", file], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Could not open ${file} in WPS: ${result.stderr || result.stdout}`);
}

async function makeVariable(client, documentId, name, token) {
  const created = await invoke(client, "transform.create", {
    variableName: name,
    sourceDocumentId: documentId,
    code: `return { token: ${JSON.stringify(token)} };`,
  });
  const transformed = await invoke(client, "variable.transform", { variableId: created.variableId });
  assert.equal(transformed.value.token, token);
  return created.variableId;
}

async function runRender(client, variableId, targetDocumentId, description, code) {
  const created = await invoke(client, "render.create", {
    variableId,
    targetDocumentId,
    description,
    code,
  });
  const rendered = await invoke(client, "variable.render", {
    variableId,
    renderId: created.renderId,
  });
  assert.equal(rendered.success, true, JSON.stringify(rendered));
  assert.equal(rendered.renders?.[0]?.success, true, JSON.stringify(rendered));
  return rendered.renders[0].result;
}

test("real WPS ET and WPP Add-ins execute MCP queries and Render operations", { skip: !LIVE }, async (t) => {
  assert.ok(Number.isInteger(PORT) && PORT > 1024 && PORT !== 18766, "live test must use an independent port");

  const runId = `${process.pid}-${Date.now()}`;
  const runDir = await mkdtemp(join(tmpdir(), `wps-mcp-live-${runId}-`));
  const dataDir = join(runDir, "state");
  const fixtureDir = join(runDir, "fixtures");
  const generator = join(ROOT, "test/wps-live/create-fixtures.py");
  const generated = spawnSync("python3", [generator, fixtureDir], { encoding: "utf8" });
  assert.equal(generated.status, 0, `fixture creation failed: ${generated.stderr}`);

  const etFile = join(runDir, `wps-mcp-live-${runId}-et.xlsx`);
  const wppFile = join(runDir, `wps-mcp-live-${runId}-wpp.pptx`);
  await rename(join(fixtureDir, "et-live-probe.xlsx"), etFile);
  await rename(join(fixtureDir, "wpp-live-probe.pptx"), wppFile);

  let serverLog = "";
  const server = spawn(process.execPath, [join(ROOT, "dist/src/server.js")], {
    cwd: ROOT,
    env: {
      ...process.env,
      WPS_MCP_TRANSPORT: "http",
      WPS_MCP_PORT: String(PORT),
      WPS_MCP_DATA_DIR: dataDir,
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  server.stderr.setEncoding("utf8").on("data", (chunk) => { serverLog += chunk; });
  let client;
  const completed = [];

  t.after(async () => {
    if (client) await client.close().catch(() => {});
    if (server.exitCode === null && server.signalCode === null) server.kill("SIGTERM");
    await rm(runDir, { recursive: true, force: true });
    if (completed.length) {
      console.log(`WPS live test completed: ${completed.join(", ")}; temp files and state removed`);
    }
  });

  await waitForHealth(server, () => serverLog);
  client = new Client({ name: "wps-mcp-live-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`)));

  // ET: open a unique disposable workbook through Launch Services and wait for the live Add-in.
  await openInWps(etFile);
  const etDoc = await waitForDocument(client, "spreadsheet", etFile);
  const etState = await invoke(client, "document.get", { documentId: etDoc.documentId });
  assert.equal(etState.connected, true);
  const etBaseline = await invoke(client, "wps.exec", {
    documentId: etDoc.documentId,
    code: `
      const book = Application.ActiveWorkbook;
      const sheet = Application.ActiveSheet;
      return {
        app: Application.Name,
        version: String(Application.Version),
        build: String(Application.Build),
        fullName: book.FullName,
        workbook: book.Name,
        sheet: sheet.Name,
        seed: sheet.Range("A1").Value2,
        number: sheet.Range("B1").Value2,
        formula: sheet.Range("B2").Formula,
        formulaValue: sheet.Range("B2").Value2
      };
    `,
  });
  assert.equal(normalizedPath(etBaseline.result.fullName), normalizedPath(await realpath(etFile)));
  assert.equal(etBaseline.result.sheet, "MCPProbe");
  assert.equal(etBaseline.result.seed, "WPS_MCP_SEED");
  assert.equal(Number(etBaseline.result.number), 7);
  assert.equal(Number(etBaseline.result.formulaValue), 3);
  assert.ok(etBaseline.result.app && etBaseline.result.version && etBaseline.result.build);

  const etVariable = await makeVariable(client, etDoc.documentId, `live-et-${runId}`, `ET-${runId}`);
  const etRender = await runRender(client, etVariable, etDoc.documentId, "ET formula and format round-trip", `
    const cell = Application.ActiveSheet.Range("Z100");
    cell.Formula = "=1+2";
    cell.Font.Bold = true;
    cell.NumberFormat = "0.00";
    return {
      formula: cell.Formula,
      value2: cell.Value2,
      bold: cell.Font.Bold,
      numberFormat: cell.NumberFormat
    };
  `);
  assert.equal(etRender.formula, "=1+2");
  assert.equal(Number(etRender.value2), 3);
  assert.equal(etRender.bold, true);
  assert.equal(etRender.numberFormat, "0.00");
  const etReadback = await invoke(client, "wps.exec", {
    documentId: etDoc.documentId,
    code: `const c = Application.ActiveSheet.Range("Z100"); return { formula: c.Formula, value2: c.Value2, bold: c.Font.Bold };`,
  });
  assert.equal(etReadback.result.formula, "=1+2");
  assert.equal(Number(etReadback.result.value2), 3);
  assert.equal(etReadback.result.bold, true);
  await runRender(client, etVariable, etDoc.documentId, "Save disposable ET copy", `Application.ActiveWorkbook.Save(); return { saved: true };`);
  completed.push(`ET (${etBaseline.result.version}/${etBaseline.result.build})`);

  // Close the first host document before activating WPP; it is only a disposable copy.
  await runRender(client, etVariable, etDoc.documentId, "Close disposable ET copy without saving further changes", `Application.ActiveWorkbook.Close(false); return { closed: true };`)
    .catch((error) => console.warn(`ET close returned an error after the document was saved: ${error.message}`));

  // WPP: same flow through the actual presentation Add-in and JS API.
  await openInWps(wppFile);
  const wppDoc = await waitForDocument(client, "presentation", wppFile);
  const wppState = await invoke(client, "document.get", { documentId: wppDoc.documentId });
  assert.equal(wppState.connected, true);
  const wppBaseline = await invoke(client, "wps.exec", {
    documentId: wppDoc.documentId,
    code: `
      const presentation = Application.ActivePresentation;
      const slide = presentation.Slides.Item(1);
      const first = slide.Shapes.Item(1);
      return {
        app: Application.Name,
        version: String(Application.Version),
        build: String(Application.Build),
        fullName: presentation.FullName,
        presentation: presentation.Name,
        slides: presentation.Slides.Count,
        shapes: slide.Shapes.Count,
        seedText: first.TextFrame.TextRange.Text
      };
    `,
  });
  assert.equal(normalizedPath(wppBaseline.result.fullName), normalizedPath(await realpath(wppFile)));
  assert.equal(Number(wppBaseline.result.slides), 1);
  assert.ok(Number(wppBaseline.result.shapes) >= 1);
  assert.match(wppBaseline.result.seedText, /WPS_MCP_SEED_TEXT/);
  assert.ok(wppBaseline.result.app && wppBaseline.result.version && wppBaseline.result.build);

  const wppVariable = await makeVariable(client, wppDoc.documentId, `live-wpp-${runId}`, `WPP-${runId}`);
  const wppRender = await runRender(client, wppVariable, wppDoc.documentId, "WPP textbox creation and text round-trip", `
    const slide = Application.ActivePresentation.Slides.Item(1);
    const box = slide.Shapes.AddTextbox(1, 30, 40, 210, 60);
    box.TextFrame.TextRange.Text = variable.value.token;
    box.Left = 30;
    box.Top = 40;
    box.Width = 210;
    box.Height = 60;
    return {
      name: box.Name,
      text: box.TextFrame.TextRange.Text,
      left: box.Left,
      top: box.Top,
      width: box.Width,
      height: box.Height
    };
  `);
  assert.equal(wppRender.text, `WPP-${runId}`);
  assert.equal(Number(wppRender.left), 30);
  assert.equal(Number(wppRender.top), 40);
  assert.equal(Number(wppRender.width), 210);
  assert.equal(Number(wppRender.height), 60);
  const wppReadback = await invoke(client, "wps.exec", {
    documentId: wppDoc.documentId,
    code: `
      const slide = Application.ActivePresentation.Slides.Item(1);
      const box = slide.Shapes.Item(slide.Shapes.Count);
      return { text: box.TextFrame.TextRange.Text, left: box.Left, top: box.Top };
    `,
  });
  assert.equal(wppReadback.result.text, `WPP-${runId}`);
  assert.equal(Number(wppReadback.result.left), 30);
  assert.equal(Number(wppReadback.result.top), 40);
  await runRender(client, wppVariable, wppDoc.documentId, "Save disposable WPP copy", `Application.ActivePresentation.Save(); return { saved: true };`);
  completed.push(`WPP (${wppBaseline.result.version}/${wppBaseline.result.build})`);
  await runRender(client, wppVariable, wppDoc.documentId, "Close disposable WPP copy", `Application.ActivePresentation.Close(); return { closed: true };`)
    .catch((error) => console.warn(`WPP close returned an error after the document was saved: ${error.message}`));

  console.log(JSON.stringify({
    testPort: PORT,
    et: { document: etDoc.name, path: etFile, ...etBaseline.result, render: etReadback.result },
    wpp: { document: wppDoc.name, path: wppFile, ...wppBaseline.result, render: wppReadback.result },
  }, null, 2));
});
