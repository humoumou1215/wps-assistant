import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalMcpClient, parseMcpResponse, rpcResult, PROTOCOL_VERSION } from '../addon/mcp-client.js';
import { clientProfiles } from '../addon/mcp-guide.js';
import { startHarness } from './helpers/ui-harness.mjs';

test('MCP page client matches JSON and SSE responses by ID and preserves protocol/tool errors', () => {
  const ok = { jsonrpc: '2.0', id: 7, result: { tools: [] } };
  assert.deepEqual(parseMcpResponse(JSON.stringify(ok), 'application/json', 7), ok);
  const sse = ': heartbeat\r\n\r\ndata: {"jsonrpc":"2.0","method":"notifications/message"}\r\n\r\nevent: message\r\ndata: {"jsonrpc":"2.0",\r\ndata: "id":7,"result":{"tools":[]}}\r\n\r\n';
  assert.deepEqual(parseMcpResponse(sse, 'text/event-stream; charset=utf-8', 7), ok);
  assert.throws(() => parseMcpResponse(JSON.stringify(ok), 'application/json', '7'), /请求 ID/);
  assert.throws(() => rpcResult({ ok: true, message: { error: { code: -32601, message: 'Unknown method' } } }), /MCP -32601/);
  assert.throws(() => rpcResult({ ok: true, message: { result: { isError: true, content: [{ text: 'DOCUMENT_NOT_FOUND' }] } } }), /DOCUMENT_NOT_FOUND/);
  assert.throws(() => rpcResult({ ok: false, status: 400, raw: 'Bad request' }), /HTTP 400/);
});

test('MCP page client negotiates the version, sends initialized and does not retry failed calls', async () => {
  const requests = [];
  const client = new LocalMcpClient('http://127.0.0.1:19999/mcp', async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push({ request, options });
    if (request.method === 'initialize') return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { protocolVersion: '2025-03-26' } }), { headers: { 'content-type': 'application/json' } });
    if (request.method === 'notifications/initialized') return new Response(null, { status: 202 });
    throw new Error('network failed');
  });
  await client.initialize();
  assert.equal(requests[0].request.params.protocolVersion, PROTOCOL_VERSION);
  assert.equal(requests[1].options.headers['MCP-Protocol-Version'], '2025-03-26');
  assert.equal(Object.hasOwn(requests[1].request, 'id'), false);
  await assert.rejects(client.send(client.request('tools/call', { name: 'wps_run_render', arguments: {} })), /network failed/);
  assert.equal(requests.length, 3);
  await assert.rejects(client.send([]), /单个 JSON-RPC/);
  assert.equal(requests.length, 3);
});

test('MCP page timeout aborts the request once and reports uncertain execution', async () => {
  let calls = 0;
  const client = new LocalMcpClient('http://127.0.0.1:19999/mcp', (_url, options) => new Promise((_resolve, reject) => {
    calls++;
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }));
  await assert.rejects(client.send(client.request('tools/call', { name: 'wps_run_render', arguments: {} }), 10), /可能已执行.*不会自动重试/);
  assert.equal(calls, 1);
});

test('client configuration uses the active endpoint without a second server or online proxy', () => {
  const endpoint = 'http://127.0.0.1:19999/mcp';
  const profiles = clientProfiles(endpoint);
  assert.deepEqual(Object.keys(profiles), ['codex', 'claude-code', 'workbuddy']);
  assert.match(profiles.codex.config, /\[mcp_servers\.wps-mcp\]/);
  for (const profile of Object.values(profiles)) {
    assert.ok(profile.config.includes(endpoint));
    assert.doesNotMatch(profile.config + profile.command, /npx|uvx|node |18766/);
  }
  for (const name of ['claude-code', 'workbuddy']) assert.deepEqual(JSON.parse(profiles[name].config).mcpServers['wps-mcp'], { type: 'http', url: endpoint });
});

test('local pages call the real MCP endpoint, expose tool failures and preserve WPS guards without a model', { timeout: 30000 }, async () => {
  const h = await startHarness();
  try {
    for (const name of ['mcp-debug.html', 'mcp-guide.html', 'mcp-pages.css', 'mcp-client.js', 'mcp-debug.js', 'mcp-guide.js']) {
      const response = await fetch(`${h.base}/addon/${name}`);
      assert.equal(response.status, 200, name);
    }
    assert.equal((await fetch(h.base + '/addon/not-allowed.html')).status, 404);
    const client = new LocalMcpClient(h.base + '/mcp');
    const init = rpcResult(await client.initialize());
    assert.equal(init.serverInfo.name, 'wps-mcp');
    const tools = rpcResult(await client.send(client.request('tools/list'))).tools;
    assert.ok(tools.some(tool => tool.name === 'wps_run_render' && tool.annotations.destructiveHint));
    const call = async (name, args) => client.send(client.request('tools/call', { name, arguments: args }));
    const listed = await call('wps_list_documents', {});
    assert.ok(listed.requestId);
    assert.equal(listed.status, 200);
    assert.ok(listed.contentType.includes('text/event-stream') || listed.contentType.includes('application/json'));
    const documents = JSON.parse(rpcResult(listed).content[0].text).documents;
    assert.equal(documents[0].name, 'UI验证.xlsx');
    const invalid = await call('wps_get_document', { documentId: 'missing' });
    assert.equal(invalid.message.result.isError, true);
    const blocked = await call('wps_run_readonly_code', { documentId: documents[0].documentId, code: 'Application.ActiveSheet.Range("D3").Value2 = 42; return true;' });
    assert.equal(blocked.message.result.isError, true);
    assert.match(blocked.raw, /READ_ONLY_VIOLATION/);
    assert.equal(h.appState.written, null);
    assert.equal(h.requests.length, 0, 'manual MCP requests must not call a model');
    const unknown = await client.send(client.request('missing/method'));
    assert.equal(unknown.message.error.code, -32601);
  } finally { await h.close(); }
});
