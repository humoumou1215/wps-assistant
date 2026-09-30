import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { callTool, getState, PORT } from "./tools.js";
import { publicConfig, parseConfig, saveConfig, redact } from "./config.js";
import { builtinModels, testConfig, resetAgent, isChatBusy, runChat, chatSchema, chatHistory } from "./agent.js";
import { logger } from "./logger.js";

export async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 1_000_000) throw new Error("请求过大");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(value));
}
let saving = false;
export async function handleApi(req: IncomingMessage, res: ServerResponse, path: string) {
  const host = req.headers.host;
  const allowed = [`127.0.0.1:${PORT}`, `localhost:${PORT}`];
  if (!allowed.includes(host ?? "") || (req.headers.origin && req.headers.origin !== `http://${host}`) || req.headers["sec-fetch-site"] === "cross-site") {
    json(res, 403, { error: "仅允许本机同源访问" }); return;
  }
  if (req.method === "POST" && !req.headers["content-type"]?.startsWith("application/json")) { json(res, 415, { error: "需要 application/json" }); return; }
  try {
    if (path === "/api/state" && req.method === "GET") { json(res, 200, getState()); return; }
    if (path === "/api/config" && req.method === "GET") { json(res, 200, { ...publicConfig(), builtinModels: await builtinModels() }); return; }
    if (path === "/api/chat" && req.method === "GET") { json(res, 200, JSON.parse(redact(JSON.stringify(chatHistory())))); return; }
    if (path === "/api/ref-preview" && req.method === "POST") {
      const ref = z.object({ kind: z.literal("sel"), id: z.string().min(1), activeSheet: z.string().optional(), selection: z.object({ sheet: z.string().optional(), address: z.string().max(300).optional() }).passthrough() }).parse(await readJson(req));
      const doc = getState().documents.find(d => d.documentId === ref.id && d.connected);
      if (!doc) throw new Error("引用文档已断开");
      const sheet = ref.selection.sheet || ref.activeSheet;
      const match = ref.selection.address?.match(/^\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?$/i);
      if (doc.type !== "spreadsheet" || !sheet || !match) { json(res, 200, { hasValue: false, message: "已显示选区快照；该选区没有可读取的明确工作表与单元格地址。" }); return; }
      const column = (name: string) => [...name.toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
      const columnName = (n: number): string => n > 0 ? columnName(Math.floor((n - 1) / 26)) + String.fromCharCode(65 + (n - 1) % 26) : "";
      const c1 = column(match[1]!), c2 = column(match[3] || match[1]!), r1 = Number(match[2]), r2 = Number(match[4] || match[2]);
      if (c1 > 16384 || c2 > 16384 || r1 < 1 || r2 < r1 || r2 > 1048576 || c2 < c1) throw new Error("选区地址无效");
      const address = `${columnName(c1)}${r1}:${columnName(Math.min(c2, c1 + 5))}${Math.min(r2, r1 + 4)}`;
      // Read a bounded snapshot through the same guarded executor; never follow ActiveSheet/Selection.
      const result = await callTool("wps.exec", { documentId: doc.documentId, code: `return Application.Workbooks.Item(${JSON.stringify(doc.name)}).Worksheets.Item(${JSON.stringify(sheet)}).Range(${JSON.stringify(address)}).Value2;` });
      const value = JSON.parse(result.content[0].text);
      if (result.isError) { json(res, 422, value); return; }
      json(res, 200, { hasValue: true, value: value.result, address, truncated: c2 - c1 >= 6 || r2 - r1 >= 5 }); return;
    }
    if (path === "/api/actions" && req.method === "POST") {
      const { op, variableId, renderId } = z.object({ op: z.enum(["transform", "render"]), variableId: z.string().min(1), renderId: z.string().optional() }).parse(await readJson(req));
      const result = await callTool(`variable.${op}`, { variableId, renderId });
      const value = JSON.parse(result.content[0].text);
      json(res, result.isError || value.success === false ? 422 : 200, value); return;
    }
    if ((path === "/api/config" || path === "/api/config/test") && req.method === "POST") {
      if (saving || isChatBusy()) { json(res, 409, { error: "会话或配置操作正在运行，请稍后重试" }); return; }
      saving = true;
      try {
        const input = await readJson(req);
        const { expectedRevision } = z.object({ expectedRevision: z.string().optional() }).parse(input);
        if (expectedRevision && expectedRevision !== publicConfig().revision) { json(res, 409, { error: "配置已在另一个面板更新，请加载最新配置后再修改" }); return; }
        const cfg = parseConfig(input);
        if (path.endsWith("/test")) {
          // Provider errors may echo the *unsaved* secret. Return only a neutral diagnostic.
          await logger.withSecrets([cfg.apiKey, ...Object.values(cfg.headers ?? {})], async () => {
            const started = Date.now();
            try {
              const result = await testConfig(cfg);
              logger.info("config.test_end", { success: true, model: cfg.model.id, durationMs: Date.now() - started });
              json(res, 200, result);
            } catch {
              logger.warn("config.test_end", { success: false, errorCode: "MODEL_CONNECTION_FAILED", durationMs: Date.now() - started });
              json(res, 422, { error: "连接失败或超时，请检查 Base URL、模型 ID、API Key 及协议" });
            }
          });
        } else {
          if (cfg.kind === "builtin") {
            const model = (await builtinModels()).find(m => m.id === cfg.model.id);
            if (!model) throw new Error("内置模型不存在");
            const { cost: _catalogPrice, ...parameters } = model;
            cfg.model = parameters;
          }
          const result = await saveConfig(cfg); resetAgent(); json(res, 200, result);
        }
      } finally { saving = false; }
      return;
    }
    if (path === "/api/chat" && req.method === "POST") {
      const input = chatSchema.parse(await readJson(req));
      if (isChatBusy() || saving) { json(res, 409, { error: "另一个轮次或配置操作正在运行" }); return; }
      const controller = new AbortController();
      res.on("close", () => controller.abort());
      res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", connection: "keep-alive", "x-accel-buffering": "no" });
      res.flushHeaders();
      const emit = (event: string, data: unknown) => { if (!res.destroyed) res.write(`event: ${event}\ndata: ${redact(JSON.stringify(data))}\n\n`); };
      const keepAlive = setInterval(() => { if (!res.destroyed) res.write(": keepalive\n\n"); }, 15000);
      try { await runChat(input, emit, controller.signal); }
      catch (error) { emit("error", { message: redact(error instanceof Error ? error.message : "会话失败") }); emit("turn.end", { failed: true }); }
      finally { clearInterval(keepAlive); res.end(); }
      return;
    }
    json(res, path.startsWith("/api/") ? 405 : 404, { error: "不支持的接口或请求方法" });
  } catch (error) {
    // Validation and provider messages can contain unsaved credentials or user content.
    logger.warn("api.failed", { route: path, errorCode: error instanceof z.ZodError ? "INVALID_REQUEST" : "API_ERROR" });
    const message = error instanceof z.ZodError ? error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("；") : error instanceof Error ? error.message : "请求失败";
    if (!res.headersSent) json(res, 400, { error: redact(message) });
  }
}
