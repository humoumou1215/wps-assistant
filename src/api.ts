import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { APP_DIR, callTool, getState, PORT, deleteVariableDefinition, asToolError } from "./tools.js";
import { publicConfig, parseConfig, saveConfig, redact } from "./config.js";
import { builtinModels, testConfig, resetAgent, isChatBusy, runChat, chatSchema, chatHistory, agentResources } from "./agent.js";
import { logger } from "./logger.js";
import { resolveSelectionReference } from "./references.js";

const pluginVersion: string = JSON.parse(await readFile(join(APP_DIR, "package.json"), "utf8")).version;

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
    if (path === "/api/state" && req.method === "GET") { json(res, 200, { ...getState(), pluginVersion }); return; }
    if (path === "/api/config" && req.method === "GET") { json(res, 200, { ...publicConfig(), builtinModels: await builtinModels() }); return; }
    if (path === "/api/chat" && req.method === "GET") { json(res, 200, JSON.parse(redact(JSON.stringify(chatHistory())))); return; }
    if (path === "/api/agent" && req.method === "GET") { json(res, 200, JSON.parse(redact(JSON.stringify(await agentResources())))); return; }
    if (path === "/api/ref-resolve" && req.method === "POST") {
      json(res, 200, await resolveSelectionReference(await readJson(req))); return;
    }
    if (path === "/api/ref-preview" && req.method === "POST") {
      const ref = await resolveSelectionReference(await readJson(req));
      const doc = getState().documents.find(d => d.documentId === ref.id && d.connected);
      if (!doc) throw new Error("引用文档已断开");
      const selection = ref.selection as Record<string, any>;
      if (doc.type !== "spreadsheet") {
        json(res, 200, { ref, hasValue: typeof selection.text === "string", value: selection.text, truncated: selection.textTruncated === true, message: selection.type === "shape" ? "已引用选中的对象；位置包含页码与对象名称。" : "已显示选区位置；当前 WPS 未提供选中文字。" }); return;
      }
      const sheet = selection.sheet || ref.activeSheet;
      const regions = Array.isArray(selection.areas) ? selection.areas.map((area: any) => area.address) : [selection.address];
      if (!sheet || !regions.length || regions.some((address: unknown) => typeof address !== "string" || !address.match(/^\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?$/i))) {
        json(res, 200, { ref, hasValue: false, message: "已显示选区位置；该选区没有可读取的明确工作表与单元格地址。" }); return;
      }
      const column = (name: string) => [...name.toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
      const columnName = (n: number): string => n > 0 ? columnName(Math.floor((n - 1) / 26)) + String.fromCharCode(65 + (n - 1) % 26) : "";
      const addresses = regions.slice(0, 6).map((region: string) => {
        const match = region.match(/^\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?$/i)!;
        const c1 = column(match[1]!), c2 = column(match[3] || match[1]!), r1 = Number(match[2]), r2 = Number(match[4] || match[2]);
        if (c1 > 16384 || c2 > 16384 || r1 < 1 || r2 < r1 || r2 > 1048576 || c2 < c1) throw new Error("选区地址无效");
        const address = `${columnName(c1)}${r1}:${columnName(Math.min(c2, c1 + 5))}${Math.min(r2, r1 + 4)}`;
        return { address, truncated: c2 - c1 >= 6 || r2 - r1 >= 5 };
      });
      // Bound every area independently; never read gaps between disjoint selections.
      const result = await callTool("wps.exec", { documentId: doc.documentId, code: `return [${addresses.map(({ address }: { address: string }) => `Application.Workbooks.Item(${JSON.stringify(doc.name)}).Worksheets.Item(${JSON.stringify(sheet)}).Range(${JSON.stringify(address)}).Value2`).join(",")}];` });
      const value = JSON.parse(result.content[0].text);
      if (result.isError) { json(res, 422, value); return; }
      json(res, 200, { ref, hasValue: true, value: addresses.length === 1 ? value.result[0] : addresses.map((area: { address: string }, i: number) => ({ address: area.address, value: value.result[i] })), address: addresses.map((area: { address: string }) => area.address).join(","), truncated: regions.length > 6 || addresses.some((area: { truncated: boolean }) => area.truncated) }); return;
    }
    if (path === "/api/delete" && req.method === "POST") {
      const { variableId, renderId } = z.object({ variableId: z.string().min(1), renderId: z.string().min(1).optional() }).parse(await readJson(req));
      try { json(res, 200, await deleteVariableDefinition(variableId, renderId)); }
      catch (error) {
        const detail = asToolError(error);
        json(res, ["VARIABLE_NOT_FOUND", "RENDER_NOT_FOUND"].includes(detail.code) ? 404 : 500, { success: false, error: detail });
      }
      return;
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
