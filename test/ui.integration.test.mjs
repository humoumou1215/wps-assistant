import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { startHarness } from './helpers/ui-harness.mjs';

test('task pane API, isolated pi session, full tool loop, errors, cancellation and config privacy', { timeout: 60000 }, async () => {
  const h = await startHarness();
  const get = async path => (await fetch(h.base + path)).json();
  const post = async (path, data, headers = {}) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  try {
    for (const path of ['/addon/taskpane.html', '/addins/et/taskpane.js', '/addins/wpp/taskpane.css', '/addins/wps/taskpane.html']) assert.equal((await fetch(h.base + path)).status, 200);
    assert.equal((await fetch(h.base + '/addins/et/taskpane.html/extra')).status, 404);
    assert.equal((await post('/api/config', h.cfg, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await fetch(h.base + '/api/config', { method: 'POST', body: '{}' })).status, 415);
    assert.equal((await post('/api/config', { ...h.cfg, model: { ...h.cfg.model, maxTokens: 999999 } })).status, 400);
    const saved = await (await post('/api/config', h.cfg)).json();
    assert.equal(saved.hasKey, true); assert.equal(saved.hasHeaders, true);
    assert.ok(!JSON.stringify(saved).includes('secret'));
    assert.equal((await post('/api/config/test', { ...h.cfg, apiKey: undefined, headers: undefined })).status, 200);
    assert.equal(h.requests.at(-1).headers.authorization, 'Bearer ui-test-secret');
    assert.equal(h.requests.at(-1).headers['x-test'], 'header-secret');
    // NTFS carries no POSIX permission bits; Node reports 0o666 for any writable file on Windows.
    if (process.platform !== 'win32') assert.equal((await stat(h.dir + '/config.json')).mode & 0o777, 0o600);
    const stream = await (await post('/api/chat', { message: '验证绑定', refs: [{ kind: 'sel', id: 'doc_001', selection: { address: 'A1:B3' } }] })).text();
    assert.match(stream, /event: tool.start/); assert.match(stream, /绑定已完成/); assert.match(stream, /event: turn.end/);
    assert.equal(h.appState.written, 120);
    const state = await get('/api/state'); assert.equal(state.variables.length, 1);
    assert.equal(state.variables[0].transform.sourceRef, '销售数据!A1:B3');
    assert.ok(state.variables[0].transform.lastRun); assert.ok(state.variables[0].renders[0].lastRun);
    const chatRequest = h.requests.find(r => r.body.tools?.length);
    assert.equal(chatRequest.body.tools.length, 8);
    assert.ok(chatRequest.body.tools.every(t => !['read', 'write', 'edit', 'bash'].includes(t.function.name)));
    assert.match(JSON.stringify(chatRequest.body.messages), /引用快照/);
    const variableId = state.variables[0].variableId;
    h.appState.value = 340;
    assert.equal((await post('/api/actions', { op: 'transform', variableId })).status, 200);
    assert.equal((await post('/api/actions', { op: 'render', variableId })).status, 200);
    assert.equal(h.appState.written, 340);
    h.appState.failRender = true;
    const failed = await post('/api/actions', { op: 'render', variableId }); assert.equal(failed.status, 422); assert.match(await failed.text(), /模拟文档写保护/);
    h.appState.failRender = false;
    const blocked = await (await post('/api/chat', { message: '守卫验证' })).text();
    assert.equal((blocked.match(/event: tool.start/g) || []).length, 3);
    assert.equal((await get('/api/state')).variables.length, 1);
    const failure = await (await post('/api/chat', { message: '模拟失败' })).text(); assert.match(failure, /event: error/);
    assert.ok((await get('/api/chat')).messages.length > 1);
    const disk = JSON.parse(await readFile(h.dir + '/state.json', 'utf8')); assert.equal(disk.variables[0].value, 340);
    const controller = new AbortController();
    const slow = await fetch(h.base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '慢响应' }), signal: controller.signal });
    assert.equal((await post('/api/chat', { message: '同时发送' })).status, 409);
    assert.equal((await post('/api/config', h.cfg)).status, 409);
    controller.abort();
    for (let i = 0; i < 30 && (await get('/api/chat')).busy; i++) await new Promise(r => setTimeout(r, 100));
    assert.equal((await get('/api/chat')).busy, false);
    await post('/api/config', { ...h.cfg, baseUrl: `http://localhost:${h.modelPort}/v1`, apiKey: undefined, headers: undefined });
    assert.equal((await get('/api/config')).hasKey, false);
    assert.equal((await get('/api/config')).hasHeaders, false);
  } finally { await h.close(); }
});

test('saved bindings and pi conversation survive bridge restart and document reconnect', { timeout: 30000 }, async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'wps-ui-restart-'));
  let h;
  try {
    h = await startHarness({ dataDir: dir });
    const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    await post('/api/config', h.cfg);
    await (await post('/api/chat', { message: '验证绑定' })).text();
    await h.close();
    h = await startHarness({ dataDir: dir });
    const state = await (await fetch(h.base + '/api/state')).json();
    assert.equal(state.documents[0].documentId, state.variables[0].transform.sourceDocumentId);
    assert.equal(state.variables[0].value, 120);
    const history = await (await fetch(h.base + '/api/chat')).json();
    assert.ok(history.messages.some(m => m.role === 'assistant'));
    assert.equal((await post('/api/actions', { op: 'render', variableId: state.variables[0].variableId })).status, 200);
    assert.equal(h.appState.written, 120);
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});
