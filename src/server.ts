import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { parse } from "acorn";
import { WebSocket, WebSocketServer } from "ws";
import { z } from "zod";

const APP_DIR = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const PORT = Number(process.env.WPS_MCP_PORT ?? "18766");
const DATA_DIR = resolve(process.env.WPS_MCP_DATA_DIR ?? join(homedir(), "Library/Application Support/wps-mcp"));
const STATE_FILE = join(DATA_DIR, "state.json");
const MAX_CODE_LENGTH = 100_000;
const RPC_TIMEOUT_MS = 45_000;

type DocType = "spreadsheet" | "presentation" | "writer";
type DocumentRecord = {
  documentId: string;
  type: DocType;
  name: string;
  path?: string;
  connectionId: string;
  documentKey: string;
  connected: boolean;
  activeSheet?: string;
  activeSlide?: number;
  selection?: unknown;
};
type Transform = {
  transformId: string;
  sourceDocumentId: string;
  description?: string;
  code: string;
};
type Render = {
  renderId: string;
  targetDocumentId: string;
  description?: string;
  code: string;
};
type Variable = {
  variableId: string;
  name: string;
  description?: string;
  value?: unknown;
  hasValue?: boolean;
  transform: Transform;
  renders: Render[];
};
type PersistedState = { variables: Variable[]; counters: Record<string, number> };
type AddinDocument = {
  documentKey: string;
  type: DocType;
  name: string;
  path?: string;
  activeSheet?: string;
  activeSlide?: number;
  selection?: unknown;
};
type Connection = { id: string; socket: WebSocket; documents: Map<string, string>; hostType?: DocType };
type Pending = { connectionId: string; resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout };

const documents = new Map<string, DocumentRecord>();
const connections = new Map<string, Connection>();
const pending = new Map<string, Pending>();
const state: PersistedState = { variables: [], counters: {} };

function log(...args: unknown[]) { console.error("[wps-mcp]", ...args); }
function nextId(kind: string) {
  state.counters[kind] = (state.counters[kind] ?? 0) + 1;
  return `${kind}_${String(state.counters[kind]).padStart(3, "0")}`;
}
async function persist() {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${STATE_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(state, null, 2), { mode: 0o600 });
  await rename(temp, STATE_FILE);
}
async function loadState() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const stored = JSON.parse(await readFile(STATE_FILE, "utf8")) as Partial<PersistedState>;
    state.variables = Array.isArray(stored.variables) ? stored.variables : [];
    state.counters = stored.counters ?? {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
function variableById(id: string) {
  const variable = state.variables.find((v) => v.variableId === id);
  if (!variable) throw new ToolError("VARIABLE_NOT_FOUND", `Variable '${id}' was not found`);
  return variable;
}
function documentById(id: string) {
  const doc = documents.get(id);
  if (!doc) throw new ToolError("DOCUMENT_NOT_FOUND", `Document '${id}' is not registered`);
  if (!doc.connected || !connections.has(doc.connectionId)) {
    throw new ToolError("DOCUMENT_DISCONNECTED", `Document '${id}' is disconnected`);
  }
  return doc;
}
class ToolError extends Error {
  constructor(readonly code: string, message: string, readonly details?: unknown) { super(message); }
}
function asToolError(error: unknown, fallback = "INTERNAL_ERROR") {
  if (error instanceof ToolError) return { code: error.code, message: error.message, ...(error.details === undefined ? {} : { details: error.details }) };
  if (error instanceof Error) return { code: fallback, message: error.message };
  return { code: fallback, message: String(error) };
}
function toolResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }], structuredContent: value as Record<string, unknown> };
}
function toolError(error: unknown, fallback?: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ success: false, error: asToolError(error, fallback) }, null, 2) }], isError: true };
}
function serializeResult(value: unknown) {
  const json = JSON.stringify(value);
  if (json === undefined) throw new ToolError("WPS_EXEC_ERROR", "WPS code returned a non-serializable undefined value");
  try { return JSON.parse(json) as unknown; }
  catch { throw new ToolError("WPS_EXEC_ERROR", "WPS code result must be JSON-serializable"); }
}

const DENIED_METHODS = new Set([
  "add", "add2", "addchart", "addshape", "addtextbox", "addtable", "addslide", "addworksheet",
  "delete", "remove", "clear", "clearcontents", "clearformats", "insert", "insertafter", "insertbefore",
  "cut", "paste", "copy", "duplicate", "merge", "unmerge", "save", "saveas", "close", "quit", "run",
  "execute", "sendkeys", "select", "activate", "undo", "redo", "writefile", "appendfile", "mkdir",
  "setvalue", "settext", "setdata", "setsource", "autofill", "autofilter", "sort", "sortascending", "sortdescending",
  "calculate", "calculatefull", "refresh", "refreshall", "replace", "exportasfixedformat", "applytemplate", "insertbreak",
  "addapieventlistener", "removeapieventlistener", "write", "savecopyas", "protect", "unprotect", "printout",
]);
const DENIED_GLOBALS = new Set(["eval", "Function", "fetch", "XMLHttpRequest", "WebSocket", "Worker", "SharedWorker"]);

/** Best-effort syntax guard. This is not a sandbox; WPS JS API is intentionally powerful. */
function assertReadOnlyCode(code: string) {
  if (!code.trim() || code.length > MAX_CODE_LENGTH) throw new ToolError("INVALID_REQUEST", `code must be 1-${MAX_CODE_LENGTH} characters`);
  let ast: any;
  try { ast = parse(code, { ecmaVersion: "latest", sourceType: "script", allowReturnOutsideFunction: true }); }
  catch (error) { throw new ToolError("INVALID_REQUEST", `Invalid JavaScript: ${(error as Error).message}`); }
  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "AssignmentExpression" && node.left?.type !== "Identifier") {
      throw new ToolError("READ_ONLY_VIOLATION", "wps.exec/transform cannot assign to document objects; use variable.render for document edits");
    }
    if (node.type === "UpdateExpression" || (node.type === "UnaryExpression" && node.operator === "delete")) {
      throw new ToolError("READ_ONLY_VIOLATION", "wps.exec/transform cannot mutate WPS objects");
    }
    if (node.type === "NewExpression") throw new ToolError("READ_ONLY_VIOLATION", "wps.exec/transform cannot instantiate host objects");
    if (node.type === "MemberExpression") {
      const prop = node.computed && node.property?.type === "Literal" ? String(node.property.value) : node.property?.name;
      if (prop && (DENIED_METHODS.has(String(prop).toLowerCase()) || ["constructor", "__proto__", "prototype"].includes(String(prop)))) {
        throw new ToolError("READ_ONLY_VIOLATION", `Member '${prop}' is not allowed in read-only code`);
      }
    }
    if (node.type === "CallExpression") {
      const callee = node.callee;
      if (callee?.type === "Identifier" && DENIED_GLOBALS.has(callee.name)) {
        throw new ToolError("READ_ONLY_VIOLATION", `Call to '${callee.name}' is not allowed in read-only code`);
      }
      if (callee?.type === "MemberExpression" && callee.computed && callee.property?.type !== "Literal") {
        throw new ToolError("READ_ONLY_VIOLATION", "Dynamic member calls are not allowed in read-only code");
      }
      const prop = callee?.type === "MemberExpression"
        ? (callee.computed && callee.property?.type === "Literal" ? String(callee.property.value) : callee.property?.name)
        : undefined;
      if (prop && DENIED_GLOBALS.has(String(prop))) {
        throw new ToolError("READ_ONLY_VIOLATION", `Call to '${prop}' is not allowed in read-only code`);
      }
      if (prop && DENIED_METHODS.has(String(prop).toLowerCase())) {
        throw new ToolError("READ_ONLY_VIOLATION", `Method '${prop}' is not allowed in read-only code`);
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "loc" || key === "start" || key === "end") continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(ast);
}
function registerDocument(connection: Connection, item: AddinDocument) {
  if (!item || !item.documentKey || !item.name || !["spreadsheet", "presentation", "writer"].includes(item.type)) return;
  let documentId = connection.documents.get(item.documentKey);
  if (!documentId) {
    documentId = nextId("doc");
    connection.documents.set(item.documentKey, documentId);
  }
  const previous = documents.get(documentId);
  documents.set(documentId, {
    documentId,
    type: item.type,
    name: item.name,
    ...(item.path ? { path: item.path } : {}),
    connectionId: connection.id,
    documentKey: item.documentKey,
    connected: true,
    ...(item.activeSheet ? { activeSheet: item.activeSheet } : {}),
    ...(item.activeSlide !== undefined ? { activeSlide: item.activeSlide } : {}),
    ...(item.selection !== undefined ? { selection: item.selection } : {}),
  });
  if (!previous) log(`registered ${documentId}: ${item.name} (${item.type})`);
  return documentId;
}
function cleanDocument(doc: DocumentRecord) {
  return {
    documentId: doc.documentId,
    type: doc.type,
    name: doc.name,
    ...(doc.path ? { path: doc.path } : {}),
    connected: doc.connected,
  };
}
function sendRpc(doc: DocumentRecord, method: string, params: Record<string, unknown>) {
  const connection = connections.get(doc.connectionId);
  if (!connection || connection.socket.readyState !== WebSocket.OPEN) throw new ToolError("DOCUMENT_DISCONNECTED", `Document '${doc.documentId}' is disconnected`);
  const id = randomUUID();
  const promise = new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new ToolError("WPS_EXEC_ERROR", `WPS API request timed out after ${RPC_TIMEOUT_MS}ms`)); }, RPC_TIMEOUT_MS);
    pending.set(id, { connectionId: doc.connectionId, resolve, reject, timer });
  });
  connection.socket.send(JSON.stringify({ type: "request", id, method, documentKey: doc.documentKey, ...params }));
  return promise;
}
async function executeWps(doc: DocumentRecord, code: string, variable?: unknown, mode: "query" | "render" = "query") {
  if (mode === "query") assertReadOnlyCode(code);
  const response = await sendRpc(doc, "execute", { code, variable, mode });
  const envelope = response as { success?: boolean; result?: unknown; error?: string };
  if (!envelope?.success) throw new ToolError(mode === "render" ? "RENDER_EXECUTION_ERROR" : "WPS_EXEC_ERROR", envelope?.error ?? "WPS Add-in execution failed");
  return serializeResult(envelope.result);
}
function findVariable(id: string) { return state.variables.find((v) => v.variableId === id); }
function documentResponse(doc: DocumentRecord) {
  return {
    ...cleanDocument(doc),
    ...(doc.path ? { path: doc.path } : {}),
    ...(doc.activeSheet ? { activeSheet: doc.activeSheet } : {}),
    ...(doc.activeSlide !== undefined ? { activeSlide: doc.activeSlide } : {}),
    ...(doc.selection !== undefined ? { selection: doc.selection } : {}),
  };
}

function createMcpServer() {
const mcp = new McpServer({ name: "wps-mcp", version: "0.1.0" });
mcp.registerTool("workspace.list_documents", {
  title: "List WPS documents",
  description: "List WPS documents currently available through connected WPS Add-ins.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: {},
}, async () => toolResult({ documents: [...documents.values()].filter((doc) => doc.connected).map(cleanDocument) }));

mcp.registerTool("document.get", {
  title: "Get WPS document state",
  description: "Get document metadata, active sheet/slide, and selection.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { documentId: z.string().min(1) },
}, async ({ documentId }) => {
  try { return toolResult(documentResponse(documentById(documentId))); }
  catch (error) { return toolError(error); }
});

mcp.registerTool("wps.exec", {
  title: "Run read-only WPS JavaScript",
  description: "Execute WPS JS API JavaScript in the selected document. Read-only; document edits belong in variable.render.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: { documentId: z.string().min(1), code: z.string().min(1).max(MAX_CODE_LENGTH) },
}, async ({ documentId, code }) => {
  try {
    const result = await executeWps(documentById(documentId), code);
    return toolResult({ success: true, result });
  } catch (error) { return toolError(error, "WPS_EXEC_ERROR"); }
});

mcp.registerTool("transform.create", {
  title: "Create Variable and Transform",
  description: "Create a Variable and save read-only WPS JavaScript that populates its value when variable.transform is called.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: {
    variableName: z.string().min(1),
    description: z.string().optional(),
    sourceDocumentId: z.string().min(1),
    code: z.string().min(1).max(MAX_CODE_LENGTH),
  },
}, async ({ variableName, description, sourceDocumentId, code }) => {
  try {
    assertReadOnlyCode(code);
    documentById(sourceDocumentId);
    const variableId = nextId("var");
    const transformId = nextId("transform");
    const variable: Variable = {
      variableId,
      name: variableName,
      ...(description ? { description } : {}),
      transform: { transformId, sourceDocumentId, code },
      renders: [],
    };
    state.variables.push(variable);
    await persist();
    return toolResult({ success: true, variableId, transformId });
  } catch (error) { return toolError(error, "INVALID_REQUEST"); }
});

mcp.registerTool("render.create", {
  title: "Create Render rule",
  description: "Attach a document-writing WPS JavaScript rule to an existing Variable; the rule is saved but not executed.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: {
    variableId: z.string().min(1),
    targetDocumentId: z.string().min(1),
    description: z.string().optional(),
    code: z.string().min(1).max(MAX_CODE_LENGTH),
  },
}, async ({ variableId, targetDocumentId, description, code }) => {
  try {
    const variable = variableById(variableId);
    documentById(targetDocumentId);
    const renderId = nextId("render");
    variable.renders.push({ renderId, targetDocumentId, ...(description ? { description } : {}), code });
    await persist();
    return toolResult({ success: true, renderId });
  } catch (error) { return toolError(error, "INVALID_REQUEST"); }
});

mcp.registerTool("variable.get", {
  title: "Get Variable",
  description: "Get the latest value and its Transform/Render metadata.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { variableId: z.string().min(1) },
}, async ({ variableId }) => {
  try {
    const v = variableById(variableId);
    const transform = v.transform;
    return toolResult({
      variableId: v.variableId, name: v.name, ...(v.description ? { description: v.description } : {}),
      ...(v.hasValue ? { value: v.value } : {}),
      transform: { transformId: transform.transformId, sourceDocumentId: transform.sourceDocumentId, ...(transform.description ? { description: transform.description } : {}) },
      renders: v.renders.map(({ renderId, targetDocumentId, description }) => ({ renderId, targetDocumentId, ...(description ? { description } : {}) })),
    });
  } catch (error) { return toolError(error); }
});

mcp.registerTool("variable.transform", {
  title: "Run Variable Transform",
  description: "Run a Variable's read-only Transform in its source document and save the JSON value.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: { variableId: z.string().min(1) },
}, async ({ variableId }) => {
  try {
    const variable = variableById(variableId);
    const doc = documentById(variable.transform.sourceDocumentId);
    const value = await executeWps(doc, variable.transform.code, undefined, "query");
    variable.value = value;
    variable.hasValue = true;
    await persist();
    return toolResult({ success: true, variableId, value });
  } catch (error) { return toolError(error, "TRANSFORM_EXECUTION_ERROR"); }
});

mcp.registerTool("variable.render", {
  title: "Run Variable Render",
  description: "Run one Render or all Renders for a Variable, allowing the saved code to modify target WPS documents.",
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  inputSchema: { variableId: z.string().min(1), renderId: z.string().optional() },
}, async ({ variableId, renderId }) => {
  try {
    const variable = variableById(variableId);
    if (!variable.hasValue) throw new ToolError("INVALID_REQUEST", "Variable has no value; run variable.transform first");
    const selected = renderId ? variable.renders.filter((r) => r.renderId === renderId) : variable.renders;
    if (renderId && selected.length === 0) throw new ToolError("RENDER_NOT_FOUND", `Render '${renderId}' was not found`);
    const renders = [];
    for (const render of selected) {
      try {
        const doc = documentById(render.targetDocumentId);
        const result = await executeWps(doc, render.code, { id: variable.variableId, name: variable.name, description: variable.description, value: variable.value }, "render");
        renders.push({ renderId: render.renderId, success: true, result });
      } catch (error) { renders.push({ renderId: render.renderId, success: false, error: asToolError(error, "RENDER_EXECUTION_ERROR") }); }
    }
    const success = renders.every((r) => r.success);
    return toolResult({ success, variableId, renders });
  } catch (error) { return toolError(error, "RENDER_EXECUTION_ERROR"); }
});
return mcp;
}

function mimeType(path: string) {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".xml")) return "application/xml; charset=utf-8";
  return "text/plain; charset=utf-8";
}
async function readRequestJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 2_000_000) throw new Error("MCP request too large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function handleMcpHttp(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") { res.writeHead(405, { Allow: "POST" }); res.end(); return; }
  try {
    const body = await readRequestJson(req);
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    res.on("close", () => { void transport.close(); void server.close(); });
    await transport.handleRequest(req, res, body);
  } catch (error) {
    log("MCP HTTP request failed:", error);
    if (!res.headersSent) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32600, message: (error as Error).message }, id: null }));
    }
  }
}
async function httpHandler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
  if (url.pathname === "/mcp") { await handleMcpHttp(req, res); return; }
  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify({ ok: true, connections: connections.size, documents: documents.size }));
    return;
  }
  const assets: Record<string, string> = {
    "/addon/": join(APP_DIR, "addon/index.html"),
    "/addon/index.html": join(APP_DIR, "addon/index.html"),
    "/addon/main.js": join(APP_DIR, "addon/main.js"),
    "/addon/manifest.xml": join(APP_DIR, "addon/manifest.xml"),
    "/addon/ribbon.xml": join(APP_DIR, "addon/ribbon.xml"),
    "/addon/status.html": join(APP_DIR, "addon/status.html"),
  };
  const pathParts = url.pathname.split("/").filter(Boolean);
  const addinPath = pathParts[0] === "addins" && ["et", "wpp", "wps"].includes(pathParts[1] ?? "") && (pathParts.length === 2 || ["index.html", "main.js", "manifest.xml", "ribbon.xml"].includes(pathParts[2] ?? ""));
  if (addinPath) {
    log(`Add-in asset request: ${req.method} ${url.pathname}`);
    const fileName = url.pathname.endsWith(".js") ? "main.js" : url.pathname.endsWith(".xml") ? (url.pathname.endsWith("manifest.xml") ? "manifest.xml" : "ribbon.xml") : "index.html";
    assets[url.pathname] = join(APP_DIR, "addon", fileName);
  }
  const file = assets[url.pathname];
  if (!file) { res.writeHead(404); res.end("Not found"); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": mimeType(file), "access-control-allow-origin": "*", "cache-control": "no-store" });
    res.end(body);
  } catch { res.writeHead(500); res.end("Asset unavailable"); }
}

async function startBridge() {
  const httpServer = createServer((req, res) => { void httpHandler(req, res); });
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (socket) => {
    const id = randomUUID();
    const connection: Connection = { id, socket, documents: new Map() };
    connections.set(id, connection);
    socket.send(JSON.stringify({ type: "welcome", connectionId: id, protocolVersion: 1 }));
    socket.on("message", (raw) => {
      let message: any;
      try { message = JSON.parse(raw.toString()); } catch { socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" })); return; }
      if (message.type === "register") {
        connection.hostType = message.hostType;
        const registered = (Array.isArray(message.documents) ? message.documents : []).map((doc: AddinDocument) => registerDocument(connection, doc)).filter(Boolean);
        socket.send(JSON.stringify({ type: "registered", connectionId: id, documents: registered }));
        return;
      }
      if (message.type === "documents") {
        const activeKeys = new Set<string>();
        const next = Array.isArray(message.documents) ? message.documents as AddinDocument[] : [];
        const currentKeys = new Set(connection.documents.keys());
        for (const item of next) {
          activeKeys.add(item.documentKey);
          registerDocument(connection, item);
        }
        for (const key of currentKeys) {
          if (activeKeys.has(key)) continue;
          const docId = connection.documents.get(key);
          if (docId) documents.delete(docId);
          connection.documents.delete(key);
        }
        return;
      }
      if (message.type === "response" && typeof message.id === "string") {
        const pendingRequest = pending.get(message.id);
        if (!pendingRequest) return;
        clearTimeout(pendingRequest.timer);
        pending.delete(message.id);
        pendingRequest.resolve(message.payload);
      }
    });
    socket.on("close", () => {
      connections.delete(id);
      for (const [docId, doc] of documents) if (doc.connectionId === id) doc.connected = false;
      for (const [requestId, p] of pending) {
        if (p.connectionId !== id) continue;
        clearTimeout(p.timer);
        p.reject(new ToolError("DOCUMENT_DISCONNECTED", "WPS Add-in disconnected during execution"));
        pending.delete(requestId);
      }
      log(`Add-in connection closed: ${id}`);
    });
    socket.on("error", (error) => log(`WebSocket error ${id}:`, error.message));
    log(`Add-in connected: ${id}`);
  });
  await new Promise<void>((resolvePromise, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(PORT, "127.0.0.1", () => { httpServer.off("error", reject); resolvePromise(); });
  });
  log(`local WPS bridge listening at http://127.0.0.1:${PORT} (WebSocket /ws)`);
  return { httpServer, wss };
}

async function main() {
  await loadState();
  await startBridge();
  if (process.env.WPS_MCP_TRANSPORT === "http") {
    log(`MCP Streamable HTTP endpoint: http://127.0.0.1:${PORT}/mcp`);
    return;
  }
  const transport = new StdioServerTransport();
  await createMcpServer().connect(transport);
}

main().catch((error) => { log("fatal:", error); process.exitCode = 1; });
