import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { z } from "zod";
import { analyzeReadOnlyCode, formatReadOnlyViolations, MAX_CODE_LENGTH } from "./readonly-guard.js";
import { DATA_DIR } from "./paths.js";
import { logger } from "./logger.js";

const APP_DIR = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const PORT = Number(process.env.WPS_MCP_PORT ?? "18766");
const STATE_FILE = join(DATA_DIR, "state.json");
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
  sourceRef?: string;
  description?: string;
  code: string;
  lastRun?: { at: string; durationMs: number };
};
type Render = {
  renderId: string;
  targetDocumentId: string;
  description?: string;
  code: string;
  lastRun?: { at: string; durationMs: number };
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
type PersistedState = { variables: Variable[]; counters: Record<string, number>; documentIds: Record<string, string> };
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
const state: PersistedState = { variables: [], counters: {}, documentIds: {} };

function nextId(kind: string) {
  state.counters[kind] = (state.counters[kind] ?? 0) + 1;
  return `${kind}_${String(state.counters[kind]).padStart(3, "0")}`;
}
let persistence = Promise.resolve();
function persist() {
  const snapshot = JSON.stringify(state, null, 2);
  const write = persistence.then(async () => {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${STATE_FILE}.${randomUUID()}.tmp`;
  await writeFile(temp, snapshot, { mode: 0o600 });
  await rename(temp, STATE_FILE);
  });
  persistence = write.catch(() => {});
  return write;
}
async function loadState() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const stored = JSON.parse(await readFile(STATE_FILE, "utf8")) as Partial<PersistedState>;
    state.variables = Array.isArray(stored.variables) ? stored.variables : [];
    state.counters = stored.counters ?? {};
    state.documentIds = stored.documentIds ?? {};
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

/**
 * Read-only guard for `wps.exec` / Variable Transforms. The rule set and the AST walk live in
 * `readonly-guard.ts` so that tooling (including the agent-facing skill) can call the exact same
 * judgement offline instead of maintaining a hand-copied denylist.
 *
 * Callers must surface the whole violation batch: `analyzeReadOnlyCode` reports every problem in
 * one pass, and collapsing that back to a single error is what used to push agents into
 * one-violation-per-round retry loops.
 */
function assertReadOnlyCode(code: string) {
  const analysis = analyzeReadOnlyCode(code);
  if (analysis.invalid) throw new ToolError("INVALID_REQUEST", analysis.invalid.message);
  if (analysis.violations.length > 0) {
    throw new ToolError("READ_ONLY_VIOLATION", formatReadOnlyViolations(analysis.violations), { violations: analysis.violations });
  }
}
function registerDocument(connection: Connection, item: AddinDocument) {
  if (!item || !item.documentKey || !item.name || !["spreadsheet", "presentation", "writer"].includes(item.type)) return;
  const identity = JSON.stringify([item.type, (item.path || item.documentKey).replace(/^\/private\//, "/")]);
  let documentId = connection.documents.get(item.documentKey);
  if (!documentId) {
    documentId = state.documentIds[identity] ?? nextId("doc");
    state.documentIds[identity] = documentId;
    void persist().catch(error => logger.error("state.persist_failed", { error }));
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
  if (!previous) logger.info("document.registered", { documentId, documentType: item.type, connectionId: connection.id });
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
async function sendRpc(doc: DocumentRecord, method: string, params: Record<string, unknown>) {
  const connection = connections.get(doc.connectionId);
  if (!connection || connection.socket.readyState !== WebSocket.OPEN) throw new ToolError("DOCUMENT_DISCONNECTED", `Document '${doc.documentId}' is disconnected`);
  const id = randomUUID();
  return logger.withContext({ rpcId: id, connectionId: doc.connectionId, documentId: doc.documentId }, async () => {
    const started = Date.now();
    logger.info("rpc.start", { method, mode: params.mode });
    try {
      const response = await new Promise<unknown>((resolve, reject) => {
        const fail = (error: Error) => { clearTimeout(timer); pending.delete(id); reject(error); };
        const timer = setTimeout(() => fail(new ToolError("WPS_EXEC_ERROR", `WPS API request timed out after ${RPC_TIMEOUT_MS}ms`)), RPC_TIMEOUT_MS);
        pending.set(id, { connectionId: doc.connectionId, resolve, reject: fail, timer });
        try {
          connection.socket.send(JSON.stringify({ type: "request", id, method, documentKey: doc.documentKey, ...params }), error => { if (error) fail(error); });
        } catch (error) { fail(error instanceof Error ? error : new Error("WPS request send failed")); }
      });
      const success = !!(response as { success?: boolean } | null)?.success;
      logger[success ? "info" : "warn"]("rpc.end", { success, durationMs: Date.now() - started, ...(!success ? { errorCode: "WPS_EXEC_ERROR" } : {}) });
      return response;
    } catch (error) {
      logger.warn("rpc.failed", { errorCode: asToolError(error).code, durationMs: Date.now() - started, timeout: error instanceof ToolError && error.message.includes("timed out") });
      throw error;
    }
  });
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

export const toolDefinitions: { name: string; config: any; invoke: (args: any) => Promise<any> }[] = [];
function defineTool<S extends z.ZodRawShape>(name: string, config: { inputSchema: S; title: string; description: string; annotations: Record<string, boolean> }, handler: (args: z.infer<z.ZodObject<S>>) => Promise<any>) {
  toolDefinitions.push({ name, config, invoke: args => logger.withContext({ toolCallId: randomUUID() }, async () => {
    const started = Date.now();
    let parsed: z.infer<z.ZodObject<S>>;
    try { parsed = z.object(config.inputSchema).parse(args); }
    catch (error) { logger.warn("tool.end", { toolName: name, success: false, errorCode: "INVALID_REQUEST", durationMs: Date.now() - started }); return toolError(error, "INVALID_REQUEST"); }
    const ids = Object.fromEntries(Object.entries(parsed).filter(([key, value]) => /^(documentId|sourceDocumentId|targetDocumentId|variableId|renderId)$/.test(key) && typeof value === "string" && /^(doc|var|render)_\d+$/.test(value)));
    logger.info("tool.start", { toolName: name, ...ids });
    let result;
    try { result = await handler(parsed); }
    catch (error) { result = toolError(error, "INTERNAL_ERROR"); }
    const value = result.structuredContent ?? JSON.parse(result.content[0].text);
    const createdIds = Object.fromEntries(Object.entries(value).filter(([key, value]) => /^(variableId|transformId|renderId)$/.test(key) && typeof value === "string" && /^(var|transform|render)_\d+$/.test(value)));
    const failures = value.renders?.filter((r: { success: boolean }) => !r.success);
    const success = !result.isError && value.success !== false;
    logger[success ? "info" : "warn"]("tool.end", {
      toolName: name, ...ids, ...createdIds, success, durationMs: Date.now() - started,
      errorCode: value.error?.code, failedRenderCount: failures?.length,
      errorCodes: failures?.map((r: { error?: { code?: string } }) => r.error?.code),
    });
    return result;
  }) });
}
defineTool("workspace.list_documents", {
  title: "List WPS documents",
  description: "List WPS documents currently available through connected WPS Add-ins.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: {},
}, async () => toolResult({ documents: [...documents.values()].filter((doc) => doc.connected).map(cleanDocument) }));

defineTool("document.get", {
  title: "Get WPS document state",
  description: "Get document metadata, active sheet/slide, and selection.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { documentId: z.string().min(1) },
}, async ({ documentId }) => {
  try { return toolResult(documentResponse(documentById(documentId))); }
  catch (error) { return toolError(error); }
});

defineTool("wps.exec", {
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

defineTool("transform.create", {
  title: "Create Variable and Transform",
  description: "Create a Variable and save read-only WPS JavaScript that populates its value when variable.transform is called. Optional sourceRef describes the source region as SheetName!A1:B13.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: {
    variableName: z.string().min(1),
    description: z.string().optional(),
    sourceDocumentId: z.string().min(1),
    sourceRef: z.string().max(1000).optional(),
    code: z.string().min(1).max(MAX_CODE_LENGTH),
  },
}, async ({ variableName, description, sourceDocumentId, sourceRef, code }) => {
  try {
    assertReadOnlyCode(code);
    documentById(sourceDocumentId);
    const variableId = nextId("var");
    const transformId = nextId("transform");
    const variable: Variable = {
      variableId,
      name: variableName,
      ...(description ? { description } : {}),
      transform: { transformId, sourceDocumentId, code, ...(sourceRef ? { sourceRef } : {}) },
      renders: [],
    };
    state.variables.push(variable);
    await persist();
    return toolResult({ success: true, variableId, transformId });
  } catch (error) { return toolError(error, "INVALID_REQUEST"); }
});

defineTool("render.create", {
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

defineTool("variable.get", {
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
      transform: { transformId: transform.transformId, sourceDocumentId: transform.sourceDocumentId, ...(transform.sourceRef ? { sourceRef: transform.sourceRef } : {}), ...(transform.description ? { description: transform.description } : {}) },
      renders: v.renders.map(({ renderId, targetDocumentId, description }) => ({ renderId, targetDocumentId, ...(description ? { description } : {}) })),
    });
  } catch (error) { return toolError(error); }
});

defineTool("variable.transform", {
  title: "Run Variable Transform",
  description: "Run a Variable's read-only Transform in its source document and save the JSON value.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: { variableId: z.string().min(1) },
}, async ({ variableId }) => {
  try {
    const variable = variableById(variableId);
    const doc = documentById(variable.transform.sourceDocumentId);
    const started = Date.now();
    const value = await executeWps(doc, variable.transform.code, undefined, "query");
    variable.value = value;
    variable.hasValue = true;
    variable.transform.lastRun = { at: new Date().toISOString(), durationMs: Date.now() - started };
    await persist();
    return toolResult({ success: true, variableId, value });
  } catch (error) { return toolError(error, "TRANSFORM_EXECUTION_ERROR"); }
});

defineTool("variable.render", {
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
        const started = Date.now();
        const result = await executeWps(doc, render.code, { id: variable.variableId, name: variable.name, description: variable.description, value: variable.value }, "render");
        render.lastRun = { at: new Date().toISOString(), durationMs: Date.now() - started };
        await persist();
        renders.push({ renderId: render.renderId, targetDocumentId: render.targetDocumentId, targetDocumentName: doc.name, description: render.description, lastRun: render.lastRun, success: true, result });
      } catch (error) { renders.push({ renderId: render.renderId, success: false, error: asToolError(error, "RENDER_EXECUTION_ERROR") }); }
    }
    const success = renders.every((r) => r.success);
    return toolResult({ success, variableId, renders });
  } catch (error) { return toolError(error, "RENDER_EXECUTION_ERROR"); }
});

export async function callTool(name: string, args: unknown) {
  const tool = toolDefinitions.find(t => t.name === name);
  if (!tool) throw new ToolError("INVALID_REQUEST", "Unknown tool");
  return tool.invoke(args);
}
export function getState() {
  return { documents: [...documents.values()].map(documentResponse), variables: state.variables };
}
export { APP_DIR, PORT, DATA_DIR, loadState, nextId, registerDocument, connections, documents, pending, asToolError };
export type { Connection, AddinDocument };
