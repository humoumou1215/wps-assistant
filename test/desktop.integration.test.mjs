import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { startHarness } from './helpers/ui-harness.mjs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

test('portable controls authenticate ownership and reject stopping during chat and document work', { timeout: 40000 }, async () => {
  const token = randomUUID(), instance = randomUUID();
  const h = await startHarness({ serviceEnv: { WPS_MCP_DESKTOP_TOKEN: token, WPS_MCP_DESKTOP_INSTANCE: instance } });
  const get = async (path, headers = {}) => fetch(h.base + path, { headers });
  const post = (path, body, headers = {}) => fetch(h.base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const auth = { authorization: `Bearer ${token}` };
  try {
    assert.equal((await get('/api/desktop/status')).status, 403);
    assert.equal((await get('/api/desktop/status', { authorization: 'Bearer invalid' })).status, 403);
    assert.equal((await get('/api/desktop/status', { ...auth, Origin: 'https://example.test' })).status, 403);
    let status = await (await get('/api/desktop/status', auth)).json();
    for (let i = 0; i < 100 && status.busy; i++) {
      await new Promise(r => setTimeout(r, 50));
      status = await (await get('/api/desktop/status', auth)).json();
    }
    assert.equal(status.instanceId, instance); assert.equal(status.pid, h.child.pid); assert.equal(status.dataDir, h.dir); assert.equal(status.busy, false);
    assert.ok(!JSON.stringify(status).includes(token)); assert.equal((await (await get('/health')).json()).desktopManaged, true);
    assert.equal((await post('/api/desktop/stop', {})).status, 403);
    assert.equal((await post('/api/config', h.cfg)).status, 200);
    const controller = new AbortController();
    const slow = await fetch(h.base + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: '慢响应' }), signal: controller.signal });
    assert.equal((await post('/api/desktop/stop', {}, auth)).status, 409);
    assert.equal((await (await get('/api/desktop/status', auth)).json()).busy, true);
    controller.abort(); await slow.text().catch(() => {});
    for (let i = 0; i < 100 && (await (await get('/api/desktop/status', auth)).json()).busy; i++) await new Promise(r => setTimeout(r, 50));
    // Hold a genuine WPS RPC without responding; stop must also refuse external MCP/UI work.
    const handler = async raw => { const message = JSON.parse(raw); if (message.type === 'request') held = message; };
    h.socket.removeAllListeners('message'); let held; h.socket.on('message', handler);
    const pending = post('/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'wps_run_readonly_code', arguments: { documentId: 'doc_001', code: 'return 1;' } } }, { accept: 'application/json, text/event-stream' });
    for (let i = 0; i < 100 && !held; i++) await new Promise(r => setTimeout(r, 20));
    assert.ok(held); assert.equal((await post('/api/desktop/stop', {}, auth)).status, 409);
    h.socket.send(JSON.stringify({ type: 'response', id: held.id, payload: { success: true, result: 1 } }));
    const completed = await pending; assert.equal(completed.status, 200); await completed.text();
    const exit = new Promise(r => h.child.once('exit', r));
    assert.equal((await post('/api/desktop/stop', {}, auth)).status, 202);
    await exit; assert.equal(h.child.exitCode, 0);
  } finally { await h.close(); }
});

test('source deployments do not expose desktop management', async () => {
  const h = await startHarness();
  try { assert.equal((await fetch(h.base + '/api/desktop/status')).status, 404); }
  finally { await h.close(); }
});

test('portable runtime refuses foreign listeners and stale or altered ownership, reuses one service and preserves data', { timeout: 45000 }, async () => {
  const data = await mkdtemp(join(tmpdir(), 'wps-runtime-'));
  const foreign = createServer((req, res) => res.end('{"ok":true}'));
  await new Promise(r => foreign.listen(0, '127.0.0.1', r));
  const port = foreign.address().port;
  const env = { ...process.env, WPS_MCP_PORT: String(port), WPS_MCP_DATA_DIR: data, WPS_MCP_ADDINS_DIR: join(data, 'addins') };
  const command = action => new Promise((resolveCommand, reject) => {
    const child = spawn(process.execPath, ['dist/src/desktop-runtime.js', action], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '', error = ''; child.stdout.on('data', b => { output += b; }); child.stderr.on('data', b => { error += b; });
    child.once('error', reject); child.once('exit', code => { try { resolveCommand({ code, ...JSON.parse(output) }); } catch { reject(new Error(error || output)); } });
  });
  const metadata = join(data, 'desktop-service.json');
  let original;
  try {
    const rejected = await command('start'); assert.equal(rejected.ok, false); assert.match(rejected.message, /其他服务占用/);
    assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status, 200);
    assert.equal((await command('quit')).ok, true, 'quitting a tray never stops a source/foreign listener');
    assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status, 200);
    await assert.rejects(readFile(metadata), { code: 'ENOENT' });
    await new Promise(r => foreign.close(r));
    await writeFile(join(data, 'desktop-registration.json'), JSON.stringify({ port, addinsDir: env.WPS_MCP_ADDINS_DIR }));
    await writeFile(join(data, 'state.json'), '{"variables":[],"documentIdentities":{}}');
    assert.equal((await command('initialize')).ok, true);
    original = await readFile(metadata, 'utf8'); const meta = JSON.parse(original);
    assert.equal((await command('start')).ok, true);
    assert.equal(await readFile(metadata, 'utf8'), original);
    for (const altered of [{ ...meta, token: 'invalid' }, { ...meta, appDir: resolve(data, 'another-app') }, { ...meta, instanceId: randomUUID() }]) {
      await writeFile(metadata, JSON.stringify(altered));
      assert.equal((await command('stop')).ok, false);
      assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status, 200);
    }
    await writeFile(metadata, original);
    assert.equal((await command('quit')).ok, true); original = undefined;
    assert.ok(await readFile(join(data, 'state.json'), 'utf8'));
    await assert.rejects(readFile(metadata), { code: 'ENOENT' });
  } finally {
    if (original) { await writeFile(metadata, original); await command('stop'); }
    if (foreign.listening) await new Promise(r => foreign.close(r));
    await rm(data, { recursive: true, force: true });
  }
});

test('portable service exits when its tray owner disappears and flushes the shutdown log', { timeout: 30000 }, async () => {
  const owner = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  await new Promise((resolveOwner, reject) => { owner.once('spawn', resolveOwner); owner.once('error', reject); });
  let h;
  try {
    h = await startHarness({ serviceEnv: { WPS_MCP_DESKTOP_TOKEN: randomUUID(), WPS_MCP_DESKTOP_INSTANCE: randomUUID(), WPS_MCP_DESKTOP_PARENT_PID: String(owner.pid) } });
    const exit = new Promise(resolveExit => h.child.once('exit', resolveExit));
    const ownerExit = new Promise(resolveExit => owner.once('exit', resolveExit));
    owner.kill(); await ownerExit;
    let timer;
    try { await Promise.race([exit, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Service outlived the tray owner')), 5000); })]); }
    finally { clearTimeout(timer); }
    assert.equal(h.child.exitCode, 0);
    assert.match(await readFile(join(h.dir, 'logs/wps-mcp.log'), 'utf8'), /desktop-parent-exit/);
    await assert.rejects(fetch(h.base + '/health'));
  } finally { owner.kill(); if (h) await h.close(); }
});
