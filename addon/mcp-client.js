// Small browser client for this bridge's stateless Streamable HTTP endpoint.
// No model calls, external resources, persistent history, or automatic retries.
import { APP_VERSION } from './version.js';
export const PROTOCOL_VERSION = '2025-11-25';

export function parseMcpResponse(text, contentType, id) {
  if (!text.trim()) return null;
  const messages = contentType.includes('text/event-stream')
    ? text.replace(/\r\n?/g, '\n').split('\n\n').flatMap(block => {
      const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
      return data ? [JSON.parse(data)] : [];
    })
    : [JSON.parse(text)];
  const message = messages.find(item => item && item.jsonrpc === '2.0' && item.id === id && ('result' in item || 'error' in item));
  if (!message) throw new Error('响应中没有与请求 ID 匹配的 JSON-RPC 结果');
  return message;
}

export function rpcResult(exchange) {
  if (!exchange.ok) throw new Error(`HTTP ${exchange.status}：${exchange.message?.error?.message || exchange.raw || '请求失败'}`);
  if (exchange.parseError) throw new Error(exchange.parseError);
  if (exchange.message?.error) throw new Error(`MCP ${exchange.message.error.code}：${exchange.message.error.message}`);
  if (!exchange.message || !('result' in exchange.message)) throw new Error('MCP 响应缺少 result');
  if (exchange.message.result?.isError) throw new Error(JSON.stringify(exchange.message.result.content));
  return exchange.message.result;
}

export class LocalMcpClient {
  constructor(endpoint, fetcher = globalThis.fetch.bind(globalThis)) {
    this.endpoint = endpoint;
    this.fetcher = fetcher;
    this.protocol = PROTOCOL_VERSION;
    this.nextId = 1;
  }

  request(method, params) {
    return { jsonrpc: '2.0', id: this.nextId++, method, ...(params === undefined ? {} : { params }) };
  }

  async send(request, timeoutMs = 90000) {
    if (!request || Array.isArray(request) || request.jsonrpc !== '2.0' || typeof request.method !== 'string' || !request.method) {
      throw new Error('请输入单个 JSON-RPC 2.0 请求或通知');
    }
    if ('id' in request && typeof request.id !== 'string' && typeof request.id !== 'number') throw new Error('请求 ID 必须是字符串或数字');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const started = Date.now();
    try {
      const response = await this.fetcher(this.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': this.protocol },
        body: JSON.stringify(request), signal: controller.signal, cache: 'no-store',
      });
      const raw = await response.text();
      let message = null;
      let parseError = '';
      try {
        if ('id' in request) message = parseMcpResponse(raw, response.headers.get('content-type') || '', request.id);
      } catch (error) { parseError = error.message; }
      if (message?.result?.protocolVersion && request.method === 'initialize') this.protocol = message.result.protocolVersion;
      return { request, ok: response.ok, status: response.status, durationMs: Date.now() - started,
        requestId: response.headers.get('x-request-id'), contentType: response.headers.get('content-type'), raw, message, parseError };
    } catch (error) {
      if (controller.signal.aborted) throw new Error('等待响应超时。请求可能已执行，请先核对结果；页面不会自动重试。');
      throw new Error(`无法连接本地 MCP 服务：${error.message}`);
    } finally { clearTimeout(timer); }
  }

  async initialize() {
    const exchange = await this.send(this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'wps-mcp-local-pages', version: APP_VERSION },
    }));
    rpcResult(exchange);
    const notification = await this.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    if (!notification.ok) throw new Error(`初始化通知失败：HTTP ${notification.status}`);
    return exchange;
  }
}

export async function copyText(text, feedback) {
  try {
    await navigator.clipboard.writeText(text);
    feedback.textContent = '已复制';
  } catch { feedback.textContent = '无法自动复制，请选中文字后手动复制'; }
}

export function pretty(value) { return JSON.stringify(value, null, 2); }
