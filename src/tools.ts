import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { z } from "zod";
import { boundedSelection } from "./selection.js";
import { analyzeReadOnlyCode, formatReadOnlyViolations, MAX_CODE_LENGTH } from "./readonly-guard.js";
import { DATA_DIR } from "./paths.js";
import { logger } from "./logger.js";
import { parseDocumentRefs, renderLocations } from "./location.js";

const sourceRoot = new URL("../", import.meta.url);
const openFile = promisify(execFile);
const APP_DIR = resolve(fileURLToPath(existsSync(new URL("package.json", sourceRoot)) ? sourceRoot : new URL("../../", import.meta.url)));
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
  selectionVersion?: number;
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
  targetRef?: string;
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
type DocumentMetadata = Pick<DocumentRecord, "type" | "name" | "path" | "documentKey">;
type PersistedState = {
  variables: Variable[];
  counters: Record<string, number>;
  documentIds: Record<string, string>;
  documentMetadata: Record<string, DocumentMetadata>;
};
type AddinDocument = {
  documentKey: string;
  type: DocType;
  name: string;
  path?: string;
  activeSheet?: string;
  activeSlide?: number;
  selection?: unknown;
  selectionVersion?: number;
};
type Connection = { id: string; socket: WebSocket; documents: Map<string, string>; hostType?: DocType };
type Pending = { connectionId: string; resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout };

const documents = new Map<string, DocumentRecord>();
const connections = new Map<string, Connection>();
const pending = new Map<string, Pending>();
const state: PersistedState = { variables: [], counters: {}, documentIds: {}, documentMetadata: {} };

function nextId(kind: string) {
  state.counters[kind] = (state.counters[kind] ?? 0) + 1;
  return `${kind}_${String(state.counters[kind]).padStart(3, "0")}`;
}
let persistence = Promise.resolve();
function persist(variables?: Variable[]) {
  const write = persistence.then(async () => {
    const snapshot = JSON.stringify({ ...state, variables: variables ?? state.variables }, null, 2);
    await mkdir(DATA_DIR, { recursive: true });
    const temp = `${STATE_FILE}.${randomUUID()}.tmp`;
    await writeFile(temp, snapshot, { mode: 0o600 });
    await rename(temp, STATE_FILE);
    if (variables) state.variables = variables;
  });
  persistence = write.catch(() => {});
  return write;
}
let variableMutation = Promise.resolve();
function mutateVariables<T>(operation: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  let cancelWaiting: (() => void) | undefined;
  const result = variableMutation.then(() => {
    // Once execution starts, keep its result and queue slot until it completes.
    if (cancelWaiting) signal!.removeEventListener("abort", cancelWaiting);
    return operation();
  });
  variableMutation = result.then(() => {}, () => {});
  if (!signal) return result;
  return new Promise<T>((resolve, reject) => {
    cancelWaiting = () => reject(new ToolError("OPERATION_CANCELLED", "已停止，未执行此操作"));
    if (signal.aborted) cancelWaiting();
    else signal.addEventListener("abort", cancelWaiting, { once: true });
    result.then(resolve, reject);
  });
}

// UI-only deletion: never execute WPS code or clear already-written content.
// Commit to disk before publishing the new list; serialize with tool mutations.
export function deleteVariableDefinition(variableId: string, renderId?: string) {
  return mutateVariables(async () => {
    const variable = variableById(variableId);
    if (renderId && !variable.renders.some(render => render.renderId === renderId)) {
      throw new ToolError("RENDER_NOT_FOUND", `Render '${renderId}' was not found`);
    }
    const variables = renderId
      ? state.variables.map(item => item === variable ? { ...variable, renders: variable.renders.filter(render => render.renderId !== renderId) } : item)
      : state.variables.filter(item => item !== variable);
    await persist(variables);
    return { success: true, variableId, ...(renderId ? { renderId } : { deletedRenderCount: variable.renders.length }) };
  });
}
async function loadState() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const stored = JSON.parse(await readFile(STATE_FILE, "utf8")) as Partial<PersistedState>;
    state.variables = Array.isArray(stored.variables) ? stored.variables : [];
    state.counters = stored.counters ?? {};
    state.documentIds = stored.documentIds ?? {};
    state.documentMetadata = stored.documentMetadata ?? {};
    // Older versions retained file identities but not display names. Recover
    // names from recognizable file paths or the Add-in's type:name keys.
    for (const [identity, documentId] of Object.entries(state.documentIds)) {
      if (state.documentMetadata[documentId]) continue;
      try {
        const [type, key] = JSON.parse(identity);
        if (!["spreadsheet", "presentation", "writer"].includes(type) || typeof key !== "string") continue;
        const typedName = key.startsWith(type + ":") ? key.slice(type.length + 1) : undefined;
        const filename = key.split(/[\\/]/).at(-1);
        const name = typedName || (filename && /\.(xlsx?|xlsm|xlsb|et|pptx?|pptm|dps|docx?|docm|wps)$/i.test(filename) ? filename : undefined);
        if (!name) continue;
        state.documentMetadata[documentId] = { type, name, documentKey: key,
          ...(!typedName && /^(\/|[a-z]:[\\/]|\\\\)/i.test(key) ? { path: key } : {}) };
      } catch { /* An opaque legacy key cannot supply a reliable name. */ }
    }
    for (const [documentId, metadata] of Object.entries(state.documentMetadata)) {
      if (!metadata || typeof metadata.name !== "string" || !metadata.name || typeof metadata.documentKey !== "string" ||
          !["spreadsheet", "presentation", "writer"].includes(metadata.type)) continue;
      // Never restore a live connection or selection from disk.
      documents.set(documentId, { documentId, type: metadata.type, name: metadata.name, documentKey: metadata.documentKey,
        ...(typeof metadata.path === "string" ? { path: metadata.path } : {}), connectionId: "", connected: false });
    }
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
 * Read-only guard for `wps_run_readonly_code` / Variable Transforms. The rule set and the AST walk live in
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
    connection.documents.set(item.documentKey, documentId);
  }
  const metadata: DocumentMetadata = { type: item.type, name: item.name, documentKey: item.documentKey,
    ...(item.path ? { path: item.path } : {}) };
  if (state.documentIds[identity] !== documentId || JSON.stringify(state.documentMetadata[documentId]) !== JSON.stringify(metadata)) {
    state.documentIds[identity] = documentId;
    state.documentMetadata[documentId] = metadata;
    void persist().catch(error => logger.error("state.persist_failed", { error }));
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
    ...(item.selectionVersion === 2 ? { selectionVersion: 2 } : {}),
    ...(item.activeSheet ? { activeSheet: item.activeSheet } : {}),
    ...(item.activeSlide !== undefined ? { activeSlide: item.activeSlide } : {}),
    ...(item.selection !== undefined ? { selection: boundedSelection(item.selection) } : {}),
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

// UI-only navigation: send a fixed command, never execute a Transform or Render.
export async function navigateVariableLocation(variableId: string, renderId?: string, locationIndex = 0) {
  const variable = variableById(variableId);
  const render = renderId ? variable.renders.find(r => r.renderId === renderId) : undefined;
  if (renderId && !render) throw new ToolError("RENDER_NOT_FOUND", "此 Render 绑定已不存在");
  const doc = documentById(render ? render.targetDocumentId : variable.transform.sourceDocumentId);
  const locations = render ? renderLocations(render, doc.type) : parseDocumentRefs(doc.type, variable.transform.sourceRef);
  const location = locations[locationIndex];
  if (!Number.isInteger(locationIndex) || locationIndex < 0 || !location) throw new ToolError("LOCATION_MISSING", "未标注明确的目的位置或位置已不存在，请补充来源或 Render 目标位置");
  // macOS WPS combines ET/WPP/Writer in one native tab bar. Activating a
  // component's COM window only changes that component's hidden selection.
  // Open the already-registered file in the same app to reveal its existing
  // tab, then perform the fixed location command. Unsaved documents keep the
  // host API path. Never accept a file path from the navigation request.
  if (process.platform === "darwin" && doc.path?.startsWith("/") && existsSync(doc.path)) {
    try { await openFile("/usr/bin/open", ["-b", "com.kingsoft.wpsoffice.mac", doc.path], { timeout: 5000 }); }
    catch { throw new ToolError("NAVIGATION_FAILED", "无法切换到目标 WPS 文档标签页"); }
  }
  const response = await sendRpc(doc, "navigate", { location }) as { success?: boolean; error?: string; result?: { ref?: string } };
  if (!response?.success) throw new ToolError("NAVIGATION_FAILED", response?.error || "WPS 定位失败");
  return { success: true, documentId: doc.documentId, documentName: doc.name, ref: response.result?.ref || location.ref };
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

// Ask the routed Add-in for a fresh selection rather than trusting the heartbeat.
// No document activation: an inactive document must not inherit another selection.
export async function refreshDocument(documentId: string) {
  const doc = documentById(documentId);
  if (doc.selectionVersion !== 2) throw new Error("选区采集插件需要更新，请重新启动 WPS 后再引用选区");
  const envelope = await sendRpc(doc, "inspect", {}) as { success?: boolean; result?: AddinDocument; error?: string };
  if (!envelope.success || envelope.result?.documentKey !== doc.documentKey) {
    throw new Error(envelope.error || "无法读取当前选区，请重新加载 WPS MCP 插件");
  }
  const connection = connections.get(doc.connectionId);
  if (!connection || !doc.connected) throw new Error("引用文档已断开");
  registerDocument(connection, envelope.result);
  return documentResponse(documentById(documentId));
}

export const toolDefinitions: { name: string; config: any; invoke: (args: any, signal?: AbortSignal) => Promise<any> }[] = [];
function defineTool<S extends z.ZodRawShape>(name: string, config: { inputSchema: S; title: string; description: string; annotations: Record<string, boolean> }, handler: (args: z.infer<z.ZodObject<S>>) => Promise<any>) {
  toolDefinitions.push({ name, config, invoke: (args, signal) => logger.withContext({ toolCallId: randomUUID() }, async () => {
    const started = Date.now();
    let parsed: z.infer<z.ZodObject<S>>;
    try { parsed = z.object(config.inputSchema).parse(args); }
    catch (error) { logger.warn("tool.end", { toolName: name, success: false, errorCode: "INVALID_REQUEST", durationMs: Date.now() - started }); return toolError(error, "INVALID_REQUEST"); }
    const ids = Object.fromEntries(Object.entries(parsed).filter(([key, value]) => /^(documentId|sourceDocumentId|targetDocumentId|variableId|renderId)$/.test(key) && typeof value === "string" && /^(doc|var|render)_\d+$/.test(value)));
    logger.info("tool.start", { toolName: name, ...ids });
    let result;
    try {
      // Check on dequeue, not just when the agent submits the call: Stop may
      // happen while another document's mutation is still holding the queue.
      const execute = () => {
        if (signal?.aborted) throw new ToolError("OPERATION_CANCELLED", "已停止，未执行此操作");
        return handler(parsed);
      };
      result = ["wps_create_variable", "wps_update_variable", "wps_create_render", "wps_update_render", "wps_run_transform", "wps_run_render"].includes(name)
        ? await mutateVariables(execute, signal) : await execute();
    }
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
defineTool("wps_list_documents", {
  title: "List WPS documents",
  description: "List WPS documents currently available through connected WPS Add-ins.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: {},
}, async () => toolResult({ documents: [...documents.values()].filter((doc) => doc.connected).map(cleanDocument) }));

defineTool("wps_get_document", {
  title: "Get WPS document state",
  description: "Get document metadata, active sheet/slide, and selection.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { documentId: z.string().min(1) },
}, async ({ documentId }) => {
  try { return toolResult(documentResponse(documentById(documentId))); }
  catch (error) { return toolError(error); }
});

defineTool("wps_run_readonly_code", {
  title: "Run read-only WPS JavaScript",
  description: "Execute WPS JS API JavaScript in the selected document. Read-only; document edits belong in wps_run_render.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: { documentId: z.string().min(1), code: z.string().min(1).max(MAX_CODE_LENGTH) },
}, async ({ documentId, code }) => {
  try {
    const result = await executeWps(documentById(documentId), code);
    return toolResult({ success: true, result });
  } catch (error) { return toolError(error, "WPS_EXEC_ERROR"); }
});

defineTool("wps_create_variable", {
  title: "Create Variable and Transform",
  description: "Create a Variable and save read-only WPS JavaScript that populates its value when wps_run_transform is called. Optional sourceRef locates the source: SheetName!A1:B13, SlideID:257!ShapeID:4, Paragraph:4, Table:1, Heading:标题 or Range:0:20.",
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

defineTool("wps_update_variable", {
  title: "Update Variable",
  description: "Update an existing Variable's name, description, source, or read-only Transform code without changing IDs or Render bindings. Omitted fields stay unchanged; null clears description/sourceRef. Code/source changes invalidate the value: run wps_run_transform before wps_run_render. Saves only, never executes WPS code.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: {
    variableId: z.string().min(1),
    variableName: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    sourceDocumentId: z.string().min(1).optional(),
    sourceRef: z.string().max(1000).nullable().optional(),
    code: z.string().min(1).max(MAX_CODE_LENGTH).optional(),
  },
}, async ({ variableId, variableName, description, sourceDocumentId, sourceRef, code }) => {
  try {
    const variable = variableById(variableId);
    if ([variableName, description, sourceDocumentId, sourceRef, code].every(value => value === undefined)) {
      throw new ToolError("INVALID_REQUEST", "Provide at least one field to update");
    }
    if (code !== undefined) assertReadOnlyCode(code);
    if (sourceDocumentId !== undefined) documentById(sourceDocumentId);
    const updated: Variable = { ...variable, transform: { ...variable.transform } };
    if (variableName !== undefined) updated.name = variableName;
    if (description !== undefined) {
      if (description === null) delete updated.description;
      else updated.description = description;
    }
    if (sourceDocumentId !== undefined) updated.transform.sourceDocumentId = sourceDocumentId;
    if (sourceRef !== undefined) {
      if (sourceRef === null) delete updated.transform.sourceRef;
      else updated.transform.sourceRef = sourceRef;
    }
    if (code !== undefined) updated.transform.code = code;
    const valueInvalidated = updated.transform.code !== variable.transform.code
      || updated.transform.sourceDocumentId !== variable.transform.sourceDocumentId
      || updated.transform.sourceRef !== variable.transform.sourceRef;
    if (valueInvalidated) {
      delete updated.value;
      updated.hasValue = false;
      delete updated.transform.lastRun;
    }
    await persist(state.variables.map(item => item === variable ? updated : item));
    return toolResult({ success: true, variableId, transformId: updated.transform.transformId, valueInvalidated, hasValue: !!updated.hasValue });
  } catch (error) { return toolError(error, "INVALID_REQUEST"); }
});

defineTool("wps_create_render", {
  title: "Create Render rule",
  description: "Attach a document-writing WPS JavaScript rule to an existing Variable; the rule is saved but not executed. Provide targetRef for UI navigation: spreadsheets SheetName!A1:B13; presentations SlideID:257!ShapeID:4 (prefer stable IDs) or Slide:2!Shape:对象名; Writer Paragraph:4, Table:1, Heading:标题!Paragraph, Heading:标题!Table, Bookmark:名称 or Range:0:20. Join multiple Word/PPT destinations with +. Saves only, never navigates or executes.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  inputSchema: {
    variableId: z.string().min(1),
    targetDocumentId: z.string().min(1),
    targetRef: z.string().min(1).max(1000).optional(),
    description: z.string().optional(),
    code: z.string().min(1).max(MAX_CODE_LENGTH),
  },
}, async ({ variableId, targetDocumentId, targetRef, description, code }) => {
  try {
    const variable = variableById(variableId);
    const doc = documentById(targetDocumentId);
    if (targetRef && !parseDocumentRefs(doc.type, targetRef).length) throw new ToolError("INVALID_REQUEST", "targetRef 必须是明确位置：表格 Summary!A1:B4；演示 SlideID:257!ShapeID:4；文字 Heading:本周概况!Paragraph 或 Table:1");
    const renderId = nextId("render");
    variable.renders.push({ renderId, targetDocumentId, ...(targetRef ? { targetRef } : {}), ...(description ? { description } : {}), code });
    await persist();
    return toolResult({ success: true, renderId });
  } catch (error) { return toolError(error, "INVALID_REQUEST"); }
});

defineTool("wps_update_render", {
  title: "Update Render rule",
  description: "Update one existing Render by variableId and renderId, preserving its ID and other bindings. Omitted fields stay unchanged; null clears description/targetRef. targetRef identifies the destination for UI navigation: Sheet!A1:B4, SlideID:257!ShapeID:4, Paragraph:4, Table:1 or Heading:标题!Paragraph/!Table. Join multiple Word/PPT destinations with +. Saves only: run wps_run_render with this renderId to apply it. Existing document content is not undone or moved.",
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: {
    variableId: z.string().min(1),
    renderId: z.string().min(1),
    targetDocumentId: z.string().min(1).optional(),
    targetRef: z.string().min(1).max(1000).nullable().optional(),
    description: z.string().nullable().optional(),
    code: z.string().min(1).max(MAX_CODE_LENGTH).optional(),
  },
}, async ({ variableId, renderId, targetDocumentId, targetRef, description, code }) => {
  try {
    const variable = variableById(variableId);
    const render = variable.renders.find(item => item.renderId === renderId);
    if (!render) throw new ToolError("RENDER_NOT_FOUND", `Render '${renderId}' was not found`);
    if ([targetDocumentId, targetRef, description, code].every(value => value === undefined)) {
      throw new ToolError("INVALID_REQUEST", "Provide at least one field to update");
    }
    const targetDoc = targetDocumentId !== undefined ? documentById(targetDocumentId) : documents.get(render.targetDocumentId);
    const effectiveRef = targetRef === undefined ? render.targetRef : targetRef;
    if (effectiveRef && (targetRef !== undefined || targetDocumentId !== undefined) && !parseDocumentRefs(targetDoc?.type, effectiveRef).length) throw new ToolError("INVALID_REQUEST", "targetRef 与目标文档类型不匹配或位置格式无效");
    const updated: Render = { ...render };
    if (targetDocumentId !== undefined) updated.targetDocumentId = targetDocumentId;
    if (targetRef !== undefined) {
      if (targetRef === null) delete updated.targetRef;
      else updated.targetRef = targetRef;
    }
    if (description !== undefined) {
      if (description === null) delete updated.description;
      else updated.description = description;
    }
    if (code !== undefined) updated.code = code;
    if (updated.code !== render.code || updated.targetDocumentId !== render.targetDocumentId || updated.targetRef !== render.targetRef || updated.description !== render.description) {
      delete updated.lastRun;
    }
    const updatedVariable = { ...variable, renders: variable.renders.map(item => item === render ? updated : item) };
    await persist(state.variables.map(item => item === variable ? updatedVariable : item));
    return toolResult({ success: true, variableId, renderId, targetDocumentId: updated.targetDocumentId, ...(updated.description !== undefined ? { description: updated.description } : {}) });
  } catch (error) { return toolError(error, "INVALID_REQUEST"); }
});

defineTool("wps_get_variable", {
  title: "Get Variable",
  description: "Get the latest value, hasValue, and complete Transform/Render definitions including code and lastRun. Read this before updating an existing rule.",
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { variableId: z.string().min(1) },
}, async ({ variableId }) => {
  try {
    const v = variableById(variableId);
    const transform = v.transform;
    return toolResult({
      variableId: v.variableId, name: v.name, ...(v.description ? { description: v.description } : {}),
      hasValue: !!v.hasValue, ...(v.hasValue ? { value: v.value } : {}),
      transform: { ...transform },
      renders: v.renders.map(render => ({ ...render })),
    });
  } catch (error) { return toolError(error); }
});

defineTool("wps_run_transform", {
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

defineTool("wps_run_render", {
  title: "Run Variable Render",
  description: "Run one Render or all Renders for a Variable, allowing the saved code to modify target WPS documents.",
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  inputSchema: { variableId: z.string().min(1), renderId: z.string().optional() },
}, async ({ variableId, renderId }) => {
  try {
    const variable = variableById(variableId);
    if (!variable.hasValue) throw new ToolError("INVALID_REQUEST", "Variable has no value; run wps_run_transform first");
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

export async function callTool(name: string, args: unknown, signal?: AbortSignal) {
  const tool = toolDefinitions.find(t => t.name === name);
  if (!tool) throw new ToolError("INVALID_REQUEST", "Unknown tool");
  return tool.invoke(args, signal);
}
export function getState() {
  return { documents: [...documents.values()].map(documentResponse), variables: state.variables.map(v => {
    const sourceLocations = parseDocumentRefs(documents.get(v.transform.sourceDocumentId)?.type, v.transform.sourceRef);
    return {
      ...v,
      transform: { ...v.transform, sourceLocation: sourceLocations[0], sourceLocations: sourceLocations.length ? sourceLocations : undefined },
      renders: v.renders.map(r => {
        const locations = renderLocations(r, documents.get(r.targetDocumentId)?.type);
        return { ...r, targetLocation: locations[0], targetLocations: locations.length ? locations : undefined };
      }),
    };
  }) };
}
export { APP_DIR, PORT, DATA_DIR, loadState, nextId, registerDocument, connections, documents, pending, asToolError };
export type { Connection, AddinDocument };
