import { LocalMcpClient, rpcResult, copyText, pretty, PROTOCOL_VERSION } from './mcp-client.js';
import { APP_VERSION } from './version.js';

const $ = id => document.getElementById(id);
const client = new LocalMcpClient(new URL('/mcp', location.href).href);
let tools = [];
let busy = false;
$('endpoint').textContent = client.endpoint;

function template(method, params) {
  $('requestBody').value = pretty(client.request(method, params));
}
function initializeParams() {
  return { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'wps-mcp-debug', version: APP_VERSION } };
}
function setBusy(value) {
  busy = value;
  for (const id of ['connect', 'send']) $(id).disabled = value;
}
function showTools(list) {
  tools = list;
  $('toolSelect').replaceChildren(new Option('选择工具以生成请求', ''), ...tools.map(tool => new Option(tool.name, tool.name)));
  $('toolSelect').disabled = false;
  $('connection').textContent = `已连接 · ${tools.length} 个工具 · 协议 ${client.protocol}`;
}
function display(exchange) {
  $('sentRequest').textContent = pretty(exchange.request);
  $('rawResponse').textContent = exchange.raw || '（空响应）';
  $('responseBody').textContent = exchange.message ? pretty(exchange.message) : exchange.raw || '（通知已接收，无 JSON-RPC 返回值）';
  $('responseMeta').textContent = `HTTP ${exchange.status} · ${exchange.durationMs} ms · request-id: ${exchange.requestId || '—'}`;
  $('copyResponse').disabled = false;
  const failed = !exchange.ok || exchange.message?.error || exchange.message?.result?.isError || exchange.parseError || ('id' in exchange.request && !exchange.message);
  $('requestStatus').className = `status ${failed ? 'error' : 'success'}`;
  $('requestStatus').textContent = failed ? exchange.parseError || exchange.message?.error?.message || '请求失败，请查看响应中的错误。' : '请求完成';
  if (!failed && exchange.request.method === 'tools/list' && Array.isArray(exchange.message?.result?.tools)) showTools(exchange.message.result.tools);
}
function showError(error) {
  $('requestStatus').className = 'status error';
  $('requestStatus').textContent = error.message;
}
async function connect() {
  if (busy) return;
  setBusy(true);
  $('connection').textContent = '正在连接…';
  try {
    await client.initialize();
    const exchange = await client.send(client.request('tools/list'));
    const result = rpcResult(exchange);
    if (!Array.isArray(result.tools)) throw new Error('工具列表格式无效');
    showTools(result.tools);
    display(exchange);
  } catch (error) { $('connection').textContent = `连接失败：${error.message}`; showError(error); }
  finally { setBusy(false); }
}
function sample(schema) {
  if (schema?.default !== undefined) return schema.default;
  if (schema?.enum) return schema.enum[0];
  if (schema?.type === 'object') return Object.fromEntries((schema.required || []).map(key => [key, sample(schema.properties?.[key])]));
  if (schema?.type === 'array') return [];
  if (schema?.type === 'boolean') return false;
  if (schema?.type === 'number' || schema?.type === 'integer') return schema.minimum ?? 0;
  return '';
}
$('toolSelect').addEventListener('change', () => {
  const tool = tools.find(item => item.name === $('toolSelect').value);
  $('toolInfo').hidden = !tool;
  if (!tool) return;
  const effect = tool.annotations?.destructiveHint ? '写入 WPS 文档' : tool.annotations?.readOnlyHint ? '查询 / 计算' : '保存规则';
  $('toolEffect').textContent = effect;
  $('toolEffect').className = `chip${tool.annotations?.destructiveHint ? ' write' : ''}`;
  $('toolDescription').textContent = tool.description;
  $('toolSchema').textContent = pretty(tool.inputSchema);
  template('tools/call', { name: tool.name, arguments: sample(tool.inputSchema) });
});
for (const button of document.querySelectorAll('[data-method]')) button.addEventListener('click', () => {
  template(button.dataset.method, button.dataset.method === 'initialize' ? initializeParams() : undefined);
});
$('connect').addEventListener('click', connect);
$('send').addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  $('requestStatus').className = 'status';
  $('requestStatus').textContent = '正在等待响应…';
  $('responseMeta').textContent = '';
  $('responseBody').textContent = '等待响应…';
  $('rawResponse').textContent = '等待响应…';
  $('copyResponse').disabled = true;
  try {
    const request = JSON.parse($('requestBody').value);
    $('sentRequest').textContent = pretty(request);
    display(await client.send(request));
  } catch (error) { $('responseBody').textContent = '未收到响应'; showError(error); }
  finally { setBusy(false); }
});
$('format').addEventListener('click', () => { try { $('requestBody').value = pretty(JSON.parse($('requestBody').value)); } catch (error) { showError(error); } });
$('copyEndpoint').addEventListener('click', () => copyText(client.endpoint, $('copyEndpoint')));
$('copyResponse').addEventListener('click', () => copyText($('responseBody').textContent, $('copyResponse')));
template('tools/call', { name: 'wps_list_documents', arguments: {} });
void connect();
