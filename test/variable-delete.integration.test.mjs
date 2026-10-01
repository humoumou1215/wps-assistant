import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startHarness } from './helpers/ui-harness.mjs';

const makeVariable = (id, count) => ({
  variableId: id, name: id, hasValue: true, value: 120,
  transform: { transformId: 'transform_' + id, sourceDocumentId: 'doc_001', code: 'return 120;' },
  renders: Array.from({ length: count }, (_, i) => ({ renderId: id + '_r' + i, targetDocumentId: 'doc_001', code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return true;' })),
});

test('UI deletion preserves document writes, supports offline definitions, survives restart and rejects duplicates', { timeout: 30000 }, async () => {
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
    assert.deepEqual(duplicate.map(response => response.status).sort(), [200, 404]);
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
    assert.equal(deleted.deletedRenderCount, 1);
    assert.deepEqual((await state()).map(v => v.variableId), ['var_003']);
    assert.equal(h.appState.written, 120); assert.equal(rpcCount, beforeRPC, 'deletion never calls the WPS host');
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).variables, await state());
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
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')).variables, await get());
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
    assert.equal(JSON.parse(await readFile(file, 'utf8')).variables.length, 0);
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

test('Stop cancels an agent Render waiting behind a UI mutation without later writing or poisoning the queue', { timeout: 15000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-stop-queued-render-')); let h, release;
  const controller = new AbortController();
  try {
    const blocker = makeVariable('var_001', 1), queued = makeVariable('var_002', 1);
    blocker.value = 111; queued.value = 222;
    blocker.renders[0].code = 'return Application.reviewGate.then(() => { Application.ActiveSheet.Range("D3").Value2 = variable.value; return true; });';
    await writeFile(join(dir, 'state.json'), JSON.stringify({ variables: [blocker, queued], counters: {}, documentIds: {} }));
    h = await startHarness({ dataDir: dir, toolSteps: [['wps_run_render', { variableId: queued.variableId }]] });
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
