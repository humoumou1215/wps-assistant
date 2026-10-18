import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startHarness } from './helpers/ui-harness.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const makeVariable = (id, count) => ({
  variableId: id, name: id, hasValue: true, value: 120,
  transform: { transformId: 'transform_' + id, sourceDocumentId: 'doc_001', code: 'return 120;' },
  renders: Array.from({ length: count }, (_, i) => ({ renderId: id + '_r' + i, targetDocumentId: 'doc_001', code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return true;' })),
});

test('UI deletion preserves document writes, supports offline definitions, survives restart and accepts repeated soft deletion', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-delete-'));
  const file = join(dir, 'state.json'); let h;
  const initial = [makeVariable('var_001', 2), makeVariable('var_002', 0), makeVariable('var_003', 1)];
  try {
    await writeFile(file, JSON.stringify({ variables: initial, counters: {}, documentIds: {} }));
    h = await startHarness({ dataDir: dir });
    const post = (path, body, headers = {}) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    const state = async () => (await (await fetch(h.base + '/api/state')).json()).variables;
    let rpcCount = 0; h.socket.on('message', raw => { if (JSON.parse(raw).type === 'request') rpcCount++; });
    assert.equal((await post('/api/actions', { op: 'render', variableId: 'var_001', renderId: 'var_001_r0' })).status, 200);
    assert.equal(h.appState.written, 120);
    const beforeRPC = rpcCount;
    assert.equal((await post('/api/delete', { variableId: 'var_001' }, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await post('/api/delete', { variableId: 'var_001', renderId: '' })).status, 400);
    assert.equal((await post('/api/delete', { variableId: 'var_001', renderId: 'var_003_r0' })).status, 404);
    const duplicate = await Promise.all([post('/api/delete', { variableId: 'var_001', renderId: 'var_001_r0' }), post('/api/delete', { variableId: 'var_001', renderId: 'var_001_r0' })]);
    assert.deepEqual(duplicate.map(response => response.status).sort(), [200, 200]);
    const retained = (await state()).find(v => v.variableId === 'var_001');
    assert.deepEqual(retained.renders.map(r => r.renderId), ['var_001_r1']);
    assert.deepEqual(retained.transform, initial[0].transform); assert.equal(retained.value, 120);
    h.socket.close();
    for (let i = 0; i < 100; i++) {
      if (!(await (await fetch(h.base + '/api/state')).json()).documents.some(d => d.connected)) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal((await post('/api/delete', { variableId: 'var_003', renderId: 'var_003_r0' })).status, 200);
    assert.equal((await state()).find(v => v.variableId === 'var_003').renders.length, 0);
    assert.equal((await post('/api/delete', { variableId: 'var_002' })).status, 200);
    const deleted = await (await post('/api/delete', { variableId: 'var_001' })).json();
    assert.equal(deleted.affectedRenderCount, 1);
    assert.deepEqual((await state()).map(v => v.variableId), ['var_003']);
    assert.equal(h.appState.written, 120); assert.equal(rpcCount, beforeRPC, 'deletion never calls the WPS host');
    const saved = JSON.parse(await readFile(file, 'utf8')).variables;
    assert.equal(saved.length, 3); assert.ok(saved[0].deletedAt); assert.ok(saved[1].deletedAt);
    assert.ok(saved[0].renders[0].deletedAt); assert.equal(saved[0].renders.length, 2);
    assert.equal(saved[0].value, 120); assert.ok(saved[2].renders[0].deletedAt);
    await h.close(); h = await startHarness({ dataDir: dir });
    assert.deepEqual((await state()).map(v => [v.variableId, v.renders.length]), [['var_003', 0]]);
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

test('a failed deletion commit retains memory and recovers without poisoning the write queue', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-delete-fail-')); const file = join(dir, 'state.json'); let h;
  try {
    await writeFile(file, JSON.stringify({ variables: [makeVariable('var_001', 2)], counters: {}, documentIds: {} }));
    h = await startHarness({ dataDir: dir });
    const get = async () => (await (await fetch(h.base + '/api/state')).json()).variables;
    const post = body => fetch(h.base + '/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    // Registration persists asynchronously. A completed Render drains earlier writes
    // before the fixture replaces state.json, so a late registration cannot recreate it.
    const rendered = await fetch(h.base + '/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'render', variableId: 'var_001', renderId: 'var_001_r0' }) });
    assert.equal(rendered.status, 200); await rendered.json();
    const before = await get();
    // A directory at the final state path deterministically makes atomic rename fail, also on Windows.
    await rm(file); await mkdir(file);
    const failure = await post({ variableId: 'var_001', renderId: 'var_001_r0' });
    assert.equal(failure.status, 500); assert.equal((await failure.json()).success, false);
    assert.deepEqual(await get(), before);
    await rm(file, { recursive: true });
    assert.equal((await post({ variableId: 'var_001', renderId: 'var_001_r0' })).status, 200);
    assert.deepEqual((await get())[0].renders.map(r => r.renderId), ['var_001_r1']);
    const saved = JSON.parse(await readFile(file, 'utf8')).variables;
    assert.equal(saved[0].renders.length, 2); assert.ok(saved[0].renders[0].deletedAt);
    assert.deepEqual(saved[0].renders.filter(r => !r.deletedAt), (await get())[0].renders);
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

test('deletion waits for an in-flight Render and cannot resurrect its variable after the write', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-delete-race-')); const file = join(dir, 'state.json'); let h;
  try {
    const variable = makeVariable('var_001', 1);
    variable.renders[0].code = 'return new Promise(resolve => setTimeout(() => { Application.ActiveSheet.Range("D3").Value2 = variable.value; resolve(true); }, 150));';
    await writeFile(file, JSON.stringify({ variables: [variable], counters: {}, documentIds: {} }));
    h = await startHarness({ dataDir: dir });
    const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const started = new Promise(resolve => { const listener = raw => { if (JSON.parse(raw).type === 'request') { h.socket.off('message', listener); resolve(); } }; h.socket.on('message', listener); });
    const rendering = post('/api/actions', { op: 'render', variableId: 'var_001' });
    await started;
    const deleting = post('/api/delete', { variableId: 'var_001' });
    assert.equal((await rendering).status, 200);
    assert.equal((await deleting).status, 200);
    assert.equal(h.appState.written, 120);
    assert.equal((await (await fetch(h.base + '/api/state')).json()).variables.length, 0);
    const saved = JSON.parse(await readFile(file, 'utf8')).variables;
    assert.equal(saved.length, 1); assert.ok(saved[0].deletedAt); assert.ok(saved[0].renders[0].lastRun);
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

for (const queuedTool of ['wps_run_render', 'wps_delete_variable']) test('Stop cancels queued ' + queuedTool + ' without late mutations or poisoning the queue', { timeout: 15000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-stop-queued-render-')); let h, release;
  const controller = new AbortController();
  try {
    const blocker = makeVariable('var_001', 1), queued = makeVariable('var_002', 1);
    blocker.value = 111; queued.value = 222;
    blocker.renders[0].code = 'return Application.reviewGate.then(() => { Application.ActiveSheet.Range("D3").Value2 = variable.value; return true; });';
    await writeFile(join(dir, 'state.json'), JSON.stringify({ variables: [blocker, queued], counters: {}, documentIds: {} }));
    h = await startHarness({ dataDir: dir, toolSteps: [[queuedTool, { variableId: queued.variableId }]] });
    h.app.reviewGate = new Promise(resolve => { release = resolve; });
    const post = (path, body, signal) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
    await post('/api/config', h.cfg);
    const rpcVariables = [];
    const started = new Promise(resolve => h.socket.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.type === 'request') { rpcVariables.push(message.variable?.id); resolve(); }
    }));
    const rendering = post('/api/actions', { op: 'render', variableId: blocker.variableId });
    await started;
    const response = await post('/api/chat', { message: '重写已保存的变量', refs: [] }, controller.signal);
    const reader = response.body.getReader(), decoder = new TextDecoder(); let stream = '';
    while (!stream.includes('event: tool.start')) {
      const { value, done } = await reader.read(); assert.equal(done, false);
      stream += decoder.decode(value, { stream: true });
    }
    // A round trip ensures the tool has entered the queue after its SSE event.
    assert.equal((await (await fetch(h.base + '/api/chat')).json()).busy, true);
    assert.deepEqual(rpcVariables, [blocker.variableId]);
    controller.abort();
    for (let i = 0; i < 100 && (await (await fetch(h.base + '/api/chat')).json()).busy; i++) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal((await (await fetch(h.base + '/api/chat')).json()).busy, false, 'Stop settles while the unrelated mutation is still blocked');
    assert.equal(h.appState.written, null);
    release(true);
    assert.equal((await rendering).status, 200);
    // This operation drains the canceled queue entry and verifies queue recovery.
    assert.equal((await post('/api/actions', { op: 'transform', variableId: blocker.variableId })).status, 200);
    assert.equal(h.appState.written, 111, 'the canceled Render never overwrites the completed UI write');
    assert.ok(!rpcVariables.includes(queued.variableId));
    const state = await (await fetch(h.base + '/api/state')).json();
    assert.equal(state.variables.find(variable => variable.variableId === queued.variableId).renders[0].lastRun, undefined);
    assert.equal((await post('/api/actions', { op: 'render', variableId: queued.variableId })).status, 200);
    assert.equal(h.appState.written, 222, 'a later explicitly requested Render still runs');
  } finally { controller.abort(); release?.(true); if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

async function connect(h) {
  const client = new Client({ name: 'soft-delete-test', version: '1' });
  await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
  return client;
}
async function call(client, name, args, errorCode) {
  const result = await client.callTool({ name, arguments: args });
  assert.equal(!!result.isError, !!errorCode, result.content[0].text);
  const value = JSON.parse(result.content[0].text);
  if (errorCode) assert.equal(value.error.code, errorCode);
  return value;
}
const postTo = (h, path, body, headers = {}) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('MCP soft deletion filters execution, summaries and references while retaining complete definitions', { timeout: 30000 }, async () => {
  const h = await startHarness(); const client = await connect(h);
  try {
    const { variableId } = await call(client, 'wps_create_variable', { variableName: '共享值', sourceDocumentId: 'doc_001', code: 'return 120;' });
    const args = { variableId, targetDocumentId: 'doc_001', targetRef: '销售数据!D3', code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return true;' };
    const first = await call(client, 'wps_create_render', args), second = await call(client, 'wps_create_render', args);
    await call(client, 'wps_run_transform', { variableId });
    const before = await call(client, 'wps_get_variable', { variableId });
    const tools = (await client.listTools()).tools;
    for (const name of ['wps_delete_variable', 'wps_delete_render']) {
      assert.deepEqual(tools.find(t => t.name === name).annotations, { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false });
      const invalid = await client.callTool({ name, arguments: { variableId, renderId: null, unknown: true } });
      assert.equal(invalid.isError, true);
    }
    const deleted = await call(client, 'wps_delete_render', { variableId, renderId: first.renderId });
    assert.ok(deleted.deletedAt); assert.equal(deleted.alreadyDeleted, false);
    const repeat = await call(client, 'wps_delete_render', { variableId, renderId: first.renderId });
    assert.equal(repeat.deletedAt, deleted.deletedAt); assert.equal(repeat.alreadyDeleted, true);
    assert.equal((await call(client, 'wps_get_variable', { variableId })).renders.length, 1);
    const listed = (await call(client, 'wps_list_variables', {})).variables[0];
    assert.equal(listed.renderCount, 1); assert.equal(listed.renders[0].renderId, second.renderId);
    await call(client, 'wps_update_render', { variableId, renderId: first.renderId, code: 'return true;' }, 'RENDER_DELETED');
    await call(client, 'wps_run_render', { variableId, renderId: first.renderId }, 'RENDER_DELETED');
    assert.equal((await postTo(h, '/api/navigate', { variableId, renderId: first.renderId })).status, 422);
    const all = await call(client, 'wps_run_render', { variableId });
    assert.deepEqual(all.renders.map(r => r.renderId), [second.renderId]);
    const trash = await (await fetch(h.base + '/api/deleted')).json();
    assert.equal(trash.variables[0].renders.length, 1); assert.equal(trash.variables[0].active, true);
    assert.equal(Object.hasOwn(trash.variables[0], 'value'), false); assert.equal(Object.hasOwn(trash.variables[0].renders[0], 'code'), false);
    // Parent deletion does not rewrite child tombstones.
    const parent = await call(client, 'wps_delete_variable', { variableId });
    assert.equal(parent.affectedRenderCount, 1);
    const full = await call(client, 'wps_get_variable', { variableId, includeDeleted: true });
    assert.equal(full.active, false); assert.equal(full.value, before.value);
    assert.equal(full.renders[0].deletedAt, deleted.deletedAt); assert.equal(full.renders[1].deletedAt, undefined);
    assert.ok(full.renders.every(r => r.active === false));
    for (const [name, request] of [
      ['wps_get_variable', { variableId }], ['wps_update_variable', { variableId, variableName: '不应保存' }],
      ['wps_create_render', { ...args }], ['wps_run_transform', { variableId }],
      ['wps_run_render', { variableId }], ['wps_delete_render', { variableId, renderId: second.renderId }],
    ]) await call(client, name, request, 'VARIABLE_DELETED');
    assert.deepEqual((await call(client, 'wps_list_variables', {})).variables, []);
    const included = (await call(client, 'wps_list_variables', { includeDeleted: true })).variables;
    assert.equal(included.length, 1); assert.equal(included[0].renders.length, 2); assert.equal(included[0].active, false);
    assert.deepEqual((await (await fetch(h.base + '/api/state')).json()).variables, []);
    assert.equal((await postTo(h, '/api/restore', { variableId, renderId: first.renderId })).status, 409);
    await postTo(h, '/api/config', h.cfg);
    const requestCount = h.requests.length;
    const stale = await postTo(h, '/api/chat', { message: '使用旧引用', refs: [{ kind: 'render', id: second.renderId }] });
    assert.match(await stale.text(), /引用对象不存在/); assert.equal(h.requests.length, requestCount);
    assert.equal(h.appState.written, 120, 'deletion never erases existing document content');
  } finally { await client.close(); await h.close(); }
});

test('offline recovery preserves IDs, retained values and prior child deletions, invalidates values and survives restart', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-restore-')); let h, client;
  try {
    const variable = makeVariable('var_001', 2);
    variable.transform.lastRun = { at: '2026-10-01T00:00:00.000Z', durationMs: 1 };
    await writeFile(join(dir, 'state.json'), JSON.stringify({ variables: [variable], counters: { var: 1, transform: 1, render: 2 }, documentIds: {} }));
    h = await startHarness({ dataDir: dir }); client = await connect(h);
    await call(client, 'wps_delete_render', { variableId: 'var_001', renderId: 'var_001_r0' });
    await call(client, 'wps_delete_variable', { variableId: 'var_001' });
    h.socket.close();
    for (let i = 0; i < 100 && (await (await fetch(h.base + '/api/state')).json()).documents.some(d => d.connected); i++) await new Promise(r => setTimeout(r, 10));
    let rpcCount = 0; h.socket.on('message', raw => { if (JSON.parse(raw).type === 'request') rpcCount++; });
    assert.equal((await postTo(h, '/api/restore', { variableId: 'var_001' }, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await postTo(h, '/api/restore', { variableId: 'var_001', includeDeleted: true })).status, 400);
    const restored = await (await postTo(h, '/api/restore', { variableId: 'var_001' })).json();
    assert.equal(restored.valueInvalidated, true);
    let current = await call(client, 'wps_get_variable', { variableId: 'var_001' });
    assert.equal(current.hasValue, false); assert.equal(Object.hasOwn(current, 'value'), false);
    assert.deepEqual(current.transform, variable.transform); assert.deepEqual(current.renders, [variable.renders[1]]);
    const inspection = await (await postTo(h, '/api/variable', { variableId: 'var_001' })).json();
    assert.equal(inspection.retainedValue, 120); assert.equal(inspection.renders[0].active, false);
    await call(client, 'wps_run_render', { variableId: 'var_001' }, 'INVALID_REQUEST');
    assert.equal((await postTo(h, '/api/restore', { variableId: 'var_001', renderId: 'var_001_r0' })).status, 200);
    assert.equal(rpcCount, 0);
    await client.close(); client = undefined; await h.close();
    h = await startHarness({ dataDir: dir }); client = await connect(h);
    current = await call(client, 'wps_get_variable', { variableId: 'var_001' });
    assert.equal(current.renders.length, 2); assert.equal(current.hasValue, false);
    assert.deepEqual((await (await fetch(h.base + '/api/deleted')).json()).variables, []);
    await call(client, 'wps_run_transform', { variableId: 'var_001' });
    const repeated = await (await postTo(h, '/api/restore', { variableId: 'var_001' })).json();
    assert.equal(repeated.alreadyActive, true); assert.equal(repeated.valueInvalidated, false);
    assert.equal((await call(client, 'wps_get_variable', { variableId: 'var_001' })).hasValue, true);
    const next = await call(client, 'wps_create_variable', { variableName: '新变量', sourceDocumentId: 'doc_001', code: 'return 1;' });
    assert.equal(next.variableId, 'var_002');
  } finally { if (client) await client.close(); if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

test('failed MCP deletion and failed UI recovery leave tombstones and values unchanged and recover the queue', { timeout: 30000 }, async () => {
  const h = await startHarness(); const client = await connect(h);
  const file = join(h.dir, 'state.json');
  try {
    const { variableId } = await call(client, 'wps_create_variable', { variableName: '提交失败', sourceDocumentId: 'doc_001', code: 'return 120;' });
    await call(client, 'wps_run_transform', { variableId });
    let before = await call(client, 'wps_get_variable', { variableId, includeDeleted: true });
    await rm(file); await mkdir(file);
    await call(client, 'wps_delete_variable', { variableId }, 'INTERNAL_ERROR');
    assert.deepEqual(await call(client, 'wps_get_variable', { variableId, includeDeleted: true }), before);
    await rm(file, { recursive: true });
    await call(client, 'wps_delete_variable', { variableId });
    before = await call(client, 'wps_get_variable', { variableId, includeDeleted: true });
    await rm(file); await mkdir(file);
    assert.equal((await postTo(h, '/api/restore', { variableId })).status, 500);
    assert.deepEqual(await call(client, 'wps_get_variable', { variableId, includeDeleted: true }), before);
    await rm(file, { recursive: true });
    const repeated = await call(client, 'wps_delete_variable', { variableId });
    assert.equal(repeated.alreadyDeleted, true, 'repeat deletion needs no disk write');
    assert.equal((await postTo(h, '/api/restore', { variableId })).status, 200);
    assert.equal((await call(client, 'wps_get_variable', { variableId })).hasValue, false);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).variables[0].value, 120);
  } finally { await client.close(); await h.close(); }
});

test('embedded Agent executes both soft-delete tools and preserves their results in history without document calls', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-agent-delete-')); let h;
  try {
    await writeFile(join(dir, 'state.json'), JSON.stringify({ variables: [makeVariable('var_001', 2)], counters: {}, documentIds: {} }));
    h = await startHarness({ dataDir: dir, toolSteps: [
      ['wps_delete_render', { variableId: 'var_001', renderId: 'var_001_r0' }],
      ['wps_delete_variable', { variableId: 'var_001' }],
    ] });
    await postTo(h, '/api/config', h.cfg);
    let rpcCount = 0; h.socket.on('message', raw => { if (JSON.parse(raw).type === 'request') rpcCount++; });
    const stream = await (await postTo(h, '/api/chat', { message: '删除这条 Render，再删除该变量', refs: [] })).text();
    assert.match(stream, /event: turn.end/); assert.match(stream, /wps_delete_variable/); assert.match(stream, /wps_delete_render/);
    const history = await (await fetch(h.base + '/api/chat')).json();
    const results = history.messages.filter(message => message.role === 'toolResult');
    assert.deepEqual(results.map(result => result.toolName), ['wps_delete_render', 'wps_delete_variable']);
    assert.ok(results.every(result => JSON.parse(result.content[0].text).success));
    assert.deepEqual((await (await fetch(h.base + '/api/state')).json()).variables, []);
    const full = await (await postTo(h, '/api/variable', { variableId: 'var_001' })).json();
    assert.ok(full.deletedAt); assert.ok(full.renders[0].deletedAt); assert.equal(full.renders.length, 2);
    assert.equal(rpcCount, 0); assert.equal(h.appState.written, null);
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});
