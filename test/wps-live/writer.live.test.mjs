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

async function invoke(client, name, args = {}) {
  const response = await client.callTool({ name, arguments: args });
  const payload = textResult(response);
  if (response.isError || payload.success === false) {
    throw new Error(`${name} failed: ${JSON.stringify(payload.error ?? payload)}`);
  }
  return payload;
}

function normalizedPath(path) {
  return String(path).replace(/^\/private\//, "/");
}

async function waitForHealth(child) {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(`isolated test server exited (${child.exitCode})`);
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return;
    } catch {}
    await pause(250);
  }
  throw new Error(`isolated test server did not become ready at ${BASE}`);
}

async function waitForWriterDocument(client, expectedPath, serverLogs) {
  const expectedRealPath = normalizedPath(await realpath(expectedPath));
  const deadline = Date.now() + 45_000;
  let lastHealth = {};
  while (Date.now() < deadline) {
    const result = await invoke(client, "workspace.list_documents");
    const documents = result.documents ?? [];
    const match = documents.find((doc) => doc.type === "writer" && doc.path &&
      (normalizedPath(doc.path) === expectedRealPath || basename(doc.path) === basename(expectedRealPath)));
    if (match) return match;
    try { lastHealth = await (await fetch(`${BASE}/health`)).json(); } catch {}
    await pause(1_000);
  }
  const addinConnections = serverLogs().split(/\r?\n/).filter((line) => line.includes('"event":"addin.connected"')).length;
  throw new Error(`WPS Writer Add-in did not register the disposable test document (test connections=${lastHealth.connections ?? "?"}, registered documents=${lastHealth.documents ?? "?"}, Add-in connections=${addinConnections})`);
}

async function openInWps(file) {
  const result = spawnSync("open", ["-a", "/Applications/wpsoffice.app", file], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Could not open disposable Writer fixture: ${result.stderr || result.stdout}`);
}

async function makeVariable(client, documentId, name, token, fullName) {
  const created = await invoke(client, "transform.create", {
    variableName: name,
    sourceDocumentId: documentId,
    code: `return { token: ${JSON.stringify(token)}, fullName: ${JSON.stringify(fullName)} };`,
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
  const rendered = await invoke(client, "variable.render", { variableId, renderId: created.renderId });
  assert.equal(rendered.success, true, JSON.stringify(rendered));
  assert.equal(rendered.renders?.[0]?.success, true, JSON.stringify(rendered));
  return rendered.renders[0].result;
}

test("real WPS Writer Add-in executes isolated MCP queries and Render operations", { skip: !LIVE }, async (t) => {
  assert.ok(Number.isInteger(PORT) && PORT > 1024 && PORT !== 18766, "Writer live test must use an independent port");

  const runId = `${process.pid}-${Date.now()}`;
  const externalRunDir = process.env.WPS_LIVE_RUN_DIR;
  const runDir = externalRunDir ?? await mkdtemp(join(tmpdir(), `wps-mcp-writer-live-${runId}-`));
  const fixtureDir = join(runDir, "fixtures");
  const dataDir = join(runDir, "state");
  const externalWriterFile = process.env.WPS_LIVE_WRITER_FILE;
  let writerFile = externalWriterFile;

  if (!writerFile) {
    const generator = join(ROOT, "test/wps-live/create-fixtures.py");
    const generated = spawnSync("python3", [generator, fixtureDir], { encoding: "utf8" });
    assert.equal(generated.status, 0, `Writer fixture generation failed: ${generated.stderr}`);
    writerFile = join(runDir, `wps-mcp-live-${runId}-writer.docx`);
    await rename(join(fixtureDir, "writer-live-probe.docx"), writerFile);
  }

  const expectedPath = normalizedPath(await realpath(writerFile));
  const token = `WPS_WRITER_RENDER_${runId}`;
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
  const serverExit = new Promise((resolve) => server.once("exit", resolve));
  let client;
  let documentOpened = false;
  let documentClosed = false;

  t.after(async () => {
    if (client) await client.close().catch(() => {});
    if (server.exitCode === null && server.signalCode === null) {
      server.kill("SIGTERM");
      await Promise.race([serverExit, pause(3_000)]);
    }
    if (!externalRunDir && (documentClosed || !documentOpened)) {
      await rm(runDir, { recursive: true, force: true });
    } else if (documentOpened && !documentClosed) {
      console.error(`Writer test document may still be open; preserving disposable files at ${runDir}`);
    }
  });

  await waitForHealth(server);
  client = new Client({ name: "wps-mcp-writer-live-test", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`)));

  await openInWps(writerFile);
  documentOpened = true;
  const document = await waitForWriterDocument(client, writerFile, () => serverLog);
  const state = await invoke(client, "document.get", { documentId: document.documentId });
  assert.equal(state.connected, true);

  const baseline = await invoke(client, "wps.exec", {
    documentId: document.documentId,
    code: `
      const doc = Application.ActiveDocument;
      const actualPath = String(doc.FullName);
      if (actualPath !== ${JSON.stringify(expectedPath)} && actualPath !== "/private" + ${JSON.stringify(expectedPath)}) {
        return { targetMatches: false };
      }
      const text = String(doc.Content.Text);
      const tableCount = Number(doc.Tables.Count);
      const cellText = tableCount ? String(doc.Tables.Item(1).Cell(1, 1).Range.Text) : "";
      return {
        targetMatches: true,
        app: String(Application.Name),
        version: String(Application.Version),
        build: String(Application.Build),
        name: String(doc.Name),
        text,
        tableCount,
        cellText
      };
    `,
  });
  assert.equal(baseline.result.targetMatches, true, "WPS active document must be the disposable Writer fixture");
  assert.match(baseline.result.text, /WPS_WRITER_SEED/);
  assert.equal(Number(baseline.result.tableCount), 1);
  assert.match(baseline.result.cellText, /WPS_WRITER_TABLE_SEED/);
  assert.ok(baseline.result.app && baseline.result.version && baseline.result.build);

  const variableId = await makeVariable(client, document.documentId, `live-writer-${runId}`, token, expectedPath);
  const renderResult = await runRender(client, variableId, document.documentId,
    "Writer content insertion and read-back", `
      const doc = Application.ActiveDocument;
      const actualPath = String(doc.FullName);
      if (actualPath !== String(variable.value.fullName) && actualPath !== "/private" + String(variable.value.fullName)) {
        throw new Error("Refusing to write: active Writer document is not the disposable test copy");
      }
      doc.Content.InsertAfter("\\n" + variable.value.token);
      return { inserted: String(doc.Content.Text).includes(variable.value.token) };
    `);
  assert.equal(renderResult.inserted, true);

  const readback = await invoke(client, "wps.exec", {
    documentId: document.documentId,
    code: `
      const doc = Application.ActiveDocument;
      const actualPath = String(doc.FullName);
      if (actualPath !== ${JSON.stringify(expectedPath)} && actualPath !== "/private" + ${JSON.stringify(expectedPath)}) {
        return { targetMatches: false };
      }
      const text = String(doc.Content.Text);
      return {
        targetMatches: true,
        containsRenderToken: text.includes(${JSON.stringify(token)}),
        tableCount: Number(doc.Tables.Count)
      };
    `,
  });
  assert.equal(readback.result.targetMatches, true);
  assert.equal(readback.result.containsRenderToken, true);
  assert.equal(Number(readback.result.tableCount), 1);

  await runRender(client, variableId, document.documentId, "Save disposable Writer copy", `
    const doc = Application.ActiveDocument;
    const actualPath = String(doc.FullName);
    if (actualPath !== String(variable.value.fullName) && actualPath !== "/private" + String(variable.value.fullName)) {
      throw new Error("Refusing to save: active Writer document is not the disposable test copy");
    }
    doc.Save();
    return { saved: true };
  `);

  const closeResult = await runRender(client, variableId, document.documentId, "Close disposable Writer copy", `
    const doc = Application.ActiveDocument;
    const actualPath = String(doc.FullName);
    if (actualPath !== String(variable.value.fullName) && actualPath !== "/private" + String(variable.value.fullName)) {
      throw new Error("Refusing to close: active Writer document is not the disposable test copy");
    }
    doc.Close(false);
    return { closed: true };
  `).catch((error) => ({ closeError: String(error) }));

  const closeDeadline = Date.now() + 15_000;
  while (Date.now() < closeDeadline) {
    const documents = (await invoke(client, "workspace.list_documents").catch(() => ({}))).documents ?? [];
    if (!documents.some((doc) => doc.type === "writer" && doc.path &&
      (normalizedPath(doc.path) === expectedPath || basename(doc.path) === basename(expectedPath)))) {
      documentClosed = true;
      break;
    }
    await pause(500);
  }
  assert.equal(documentClosed, true,
    `Disposable Writer document did not unregister after close${closeResult.closeError ? ` (${closeResult.closeError})` : ""}`);

  console.log(JSON.stringify({
    testPort: PORT,
    writer: {
      document: document.name,
      app: baseline.result.app,
      version: baseline.result.version,
      build: baseline.result.build,
      initialTextPresent: baseline.result.text.includes("WPS_WRITER_SEED"),
      tableCellSeedPresent: baseline.result.cellText.includes("WPS_WRITER_TABLE_SEED"),
      tableCount: baseline.result.tableCount,
      renderInsertedAndReadBack: readback.result.containsRenderToken,
      disposableCopySavedAndClosed: documentClosed,
    },
  }, null, 2));
});
