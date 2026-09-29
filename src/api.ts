import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { callTool, getState, PORT } from "./tools.js";
import { publicConfig, parseConfig, saveConfig, redact } from "./config.js";
import { builtinModels, testConfig, resetAgent, isChatBusy, runChat, chatSchema, chatHistory } from "./agent.js";

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
        const cfg = parseConfig(await readJson(req));
        if (path.endsWith("/test")) {
          // Provider errors may echo the *unsaved* secret. Return only a neutral diagnostic.
          try { json(res, 200, await testConfig(cfg)); }
          catch { json(res, 422, { error: "连接失败或超时，请检查 Base URL、模型 ID、API Key 及协议" }); }
        } else {
          if (cfg.kind === "builtin") {
            const model = (await builtinModels()).find(m => m.id === cfg.model.id);
            if (!model) throw new Error("内置模型不存在");
            cfg.model = model;
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
    const message = error instanceof z.ZodError ? error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("；") : error instanceof Error ? error.message : "请求失败";
    if (!res.headersSent) json(res, 400, { error: redact(message) });
  }
}
