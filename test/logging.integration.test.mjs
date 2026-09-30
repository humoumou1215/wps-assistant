import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startHarness } from './helpers/ui-harness.mjs';

async function waitForRecords(file, predicate) {
  for (let i = 0; i < 100; i++) {
    try {
      const raw = await readFile(file, 'utf8');
      const records = raw.trim().split('\n').map(JSON.parse);
      if (predicate(records)) return { raw, records };
    } catch (error) { if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error; }
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('Expected log records were not flushed');
}

test('HTTP, chat, model, tool and RPC logs correlate and omit content including partial failures', { timeout: 30000 }, async () => {
  const h = await startHarness();
  const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const echoProvider = createServer((req, res) => { req.resume(); res.writeHead(401); res.end(JSON.stringify({ error: { message: 'unsaved-credential unsaved-header' } })); });
  await new Promise(resolve => echoProvider.listen(0, '127.0.0.1', resolve));
  try {
    await post('/api/config', h.cfg);
    const response = await post('/api/chat', { message: '验证绑定 private-chat-marker' });
    const requestId = response.headers.get('x-request-id');
    await response.text();
    h.appState.failRender = true;
    const failed = await post('/api/actions', { op: 'render', variableId: 'var_001' });
    assert.equal(failed.status, 422);
    const failureId = failed.headers.get('x-request-id'); await failed.text();
    const unsaved = await post('/api/config/test', { ...h.cfg, baseUrl: `http://127.0.0.1:${echoProvider.address().port}/v1`, apiKey: 'unsaved-credential', headers: { 'X-Key': 'unsaved-header' } });
    assert.equal(unsaved.status, 422); await unsaved.text();
    await fetch(h.base + '/unknown-private-url?apiKey=query-secret');
    const { raw, records } = await waitForRecords(join(h.dir, 'logs', 'wps-mcp.log'), rows => rows.some(r => r.event === 'config.test_end' && !r.success) && rows.some(r => r.event === 'http.end' && r.status === 404));
    const chat = records.find(r => r.event === 'chat.start' && r.requestId === requestId);
    assert.ok(chat?.turnId);
    const tools = records.filter(r => r.event === 'tool.end' && r.turnId === chat.turnId);
    assert.equal(tools.length, 8);
    assert.ok(tools.every(r => r.requestId === requestId && r.toolCallId && r.modelToolCallId && r.durationMs >= 0));
    const rpc = records.find(r => r.event === 'rpc.end' && r.turnId === chat.turnId);
    assert.ok(rpc?.rpcId && rpc.connectionId && rpc.documentId && rpc.toolCallId);
    assert.equal(rpc.requestId, requestId);
    assert.ok(records.some(r => r.event === 'model.end' && r.turnId === chat.turnId && r.usage.totalTokens > 0));
    assert.ok(records.some(r => r.event === 'chat.end' && r.turnId === chat.turnId && r.success));
    const partial = records.find(r => r.event === 'tool.end' && r.requestId === failureId);
    assert.equal(partial.success, false); assert.equal(partial.failedRenderCount, 1);
    assert.deepEqual(partial.errorCodes, ['RENDER_EXECUTION_ERROR']);
    for (const secret of ['ui-test-secret', 'header-secret', 'unsaved-credential', 'unsaved-header', 'query-secret', 'unknown-private-url', 'private-chat-marker', 'UI验证.xlsx', '模拟文档写保护', 'Application.ActiveSheet']) assert.ok(!raw.includes(secret), secret);
  } finally { echoProvider.closeAllConnections(); await new Promise(resolve => echoProvider.close(resolve)); await h.close(); }
});

test('stdio stdout contains only MCP messages and shutdown flushes log files', { timeout: 15000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'wps-log-stdio-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const probe = createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, [fileURLToPath(new URL('../dist/src/server.js', import.meta.url))], {
    env: { ...process.env, WPS_MCP_DATA_DIR: directory, WPS_MCP_PORT: String(port), WPS_MCP_TRANSPORT: 'stdio' }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
  try {
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'log-test', version: '1' } } }) + '\n');
    for (let i = 0; i < 100 && !stdout.includes('"id":1'); i++) await new Promise(resolve => setTimeout(resolve, 20));
    const messages = stdout.trim().split('\n').map(JSON.parse);
    assert.ok(messages.some(m => m.id === 1 && m.result));
    assert.ok(messages.every(m => m.jsonrpc === '2.0' && !m.event));
    assert.match(stderr, /server.listening/);
    let logDirectory = directory;
    // Windows TerminateProcess does not deliver SIGTERM; exercise flush on startup failure instead.
    if (process.platform !== 'win32') child.kill('SIGTERM');
    else {
      // Force startup failure in a second process to verify flush-before-exit on Windows.
      logDirectory = join(directory, 'conflicting');
      const conflicting = spawn(process.execPath, [fileURLToPath(new URL('../dist/src/server.js', import.meta.url))], {
        env: { ...process.env, WPS_MCP_DATA_DIR: logDirectory, WPS_MCP_PORT: String(port), WPS_MCP_TRANSPORT: 'http' }, stdio: ['ignore', 'ignore', 'pipe'],
      });
      conflicting.stderr.resume();
      const [code] = await once(conflicting, 'exit'); assert.equal(code, 1);
      child.kill();
    }
    await exited;
    const { records } = await waitForRecords(join(logDirectory, 'logs', 'wps-mcp.log'), rows => rows.some(r => r.event === (process.platform === 'win32' ? 'server.start_failed' : 'server.stopping')));
    if (process.platform === 'win32') assert.equal(records.find(r => r.event === 'server.start_failed').errorCode, 'EADDRINUSE');
  } finally { if (child.exitCode === null && child.signalCode === null) { child.kill(); await exited; } }
});
