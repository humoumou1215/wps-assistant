import { handleApi } from "./api.js";
import { loadConfig } from "./config.js";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { WebSocketServer } from "ws";
import { APP_DIR, PORT, log, loadState, registerDocument, connections, documents, pending, toolDefinitions, type Connection, type AddinDocument } from "./tools.js";
function createMcpServer() {
  const mcp = new McpServer({ name: "wps-mcp", version: "0.1.0" });
  for (const tool of toolDefinitions) mcp.registerTool(tool.name, tool.config, tool.invoke);
  return mcp;
}

function mimeType(path: string) {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
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
  if (!["127.0.0.1:" + PORT, "localhost:" + PORT].includes(req.headers.host ?? "")) { res.writeHead(403); res.end("Invalid host"); return; }
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
  if (url.pathname.startsWith("/api/")) { await handleApi(req, res, url.pathname); return; }
  if (url.pathname === "/mcp") { await handleMcpHttp(req, res); return; }
  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    // Count only usable documents so /health matches workspace.list_documents.
    res.end(JSON.stringify({ ok: true, connections: connections.size, documents: [...documents.values()].filter((doc) => doc.connected).length }));
    return;
  }
  const allowedAssets = ["index.html", "main.js", "manifest.xml", "ribbon.xml", "status.html", "taskpane.html", "taskpane.css", "taskpane.js"];
  const match = /^\/(?:addon|addins\/(?:et|wpp|wps))\/(?:([^/]+))?$/.exec(url.pathname);
  const fileName = match?.[1] ?? "index.html";
  const file = match && allowedAssets.includes(fileName) ? join(APP_DIR, "addon", fileName) : undefined;
  if (!file) { res.writeHead(404); res.end("Not found"); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": mimeType(file), "access-control-allow-origin": "*", "cache-control": "no-store" });
    res.end(body);
  } catch { res.writeHead(500); res.end("Asset unavailable"); }
}

async function startBridge() {
  const httpServer = createServer((req, res) => { void httpHandler(req, res).catch(error => { log("HTTP error", error); if (!res.headersSent) res.writeHead(500); res.end("Request failed"); }); });
  const wss = new WebSocketServer({ server: httpServer, path: "/ws", verifyClient: (info: { origin: string }) => {
    const origin = info.origin;
    return !origin || [`http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`, "http://127.0.0.1:18766"].includes(origin);
  } });
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
        if (!pendingRequest || pendingRequest.connectionId !== id) return;
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
        p.reject(new Error("WPS Add-in disconnected during execution"));
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
  await loadConfig();
  await startBridge();
  if (process.env.WPS_MCP_TRANSPORT === "http") {
    log(`MCP Streamable HTTP endpoint: http://127.0.0.1:${PORT}/mcp`);
    return;
  }
  const transport = new StdioServerTransport();
  await createMcpServer().connect(transport);
}

main().catch((error) => { log("fatal:", error); process.exitCode = 1; });
