import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';
import { MAX_DOCUMENT_LOCATIONS, MAX_DOCUMENT_REF_LENGTH } from '../dist/src/location.js';

async function connect(h, t) {
  const client = new Client({ name: 'dynamic-render-target', version: '1' });
  await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
  t.after(() => client.close());
  return async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    assert.ok(!result.isError, result.content[0].text);
    return JSON.parse(result.content[0].text);
  };
}
async function presentation(h) {
  h.appState.type = 'presentation';
  const registered = new Promise(resolve => {
    const listener = raw => { if (JSON.parse(raw).type === 'registered') { h.socket.off('message', listener); resolve(); } };
    h.socket.on('message', listener);
  });
  h.socket.send(JSON.stringify({ type: 'register', documents: [{ documentKey: 'ui-fixture', name: '续表.pptx', type: 'presentation' }] }));
  await registered;
}
const constant = value => `return ${JSON.stringify(value)};`;
const refs = count => Array.from({ length: count }, (_, i) => `SlideID:${257 + i}!ShapeID:4`).join('+');
const post = (h, path, body) => fetch(h.base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('UI rewrites persist growing/shrinking destination groups, navigate beyond 20, and survive restart', { timeout: 30000 }, async t => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-dynamic-target-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  let h = await startHarness({ dataDir: dir });
  t.after(() => h.close());
  let call = await connect(h, t);
  await presentation(h);
  const { variableId } = await call('wps_create_variable', { variableName: '项目明细', sourceDocumentId: 'doc_001', code: 'return 1;' });
  await call('wps_run_transform', { variableId });
  const { renderId } = await call('wps_create_render', { variableId, targetDocumentId: 'doc_001', targetRef: refs(1), description: '原表',
    code: constant({ renderTarget: { targetRef: refs(MAX_DOCUMENT_LOCATIONS), description: '原表及续表' }, count: MAX_DOCUMENT_LOCATIONS }) });
  const rewrite = () => post(h, '/api/actions', { op: 'render', variableId, renderId });
  const saved = async () => (await call('wps_get_variable', { variableId })).renders[0];
  assert.equal((await rewrite()).status, 200);
  const grown = await saved();
  assert.equal(grown.targetRef, refs(MAX_DOCUMENT_LOCATIONS));
  assert.equal(grown.description, '原表及续表');
  assert.ok(grown.lastRun);
  const ui = await (await fetch(h.base + '/api/state')).json();
  assert.equal(ui.variables[0].renders[0].targetLocations.length, MAX_DOCUMENT_LOCATIONS);
  for (const locationIndex of [20, MAX_DOCUMENT_LOCATIONS - 1]) {
    const response = await post(h, '/api/navigate', { variableId, renderId, locationIndex });
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal((await response.json()).ref, `SlideID:${257 + locationIndex}!ShapeID:4`);
  }
  assert.equal((await post(h, '/api/navigate', { variableId, renderId, locationIndex: MAX_DOCUMENT_LOCATIONS })).status, 400);
  assert.equal((await rewrite()).status, 200);
  assert.equal((await saved()).targetRef, grown.targetRef);
  await call('wps_update_render', { variableId, renderId, code: constant({ renderTarget: { targetRef: refs(2) } }) });
  assert.equal((await rewrite()).status, 200);
  assert.equal((await saved()).description, grown.description, 'omitted description is preserved');
  assert.equal((await post(h, '/api/navigate', { variableId, renderId, locationIndex: 2 })).status, 422);
  await call('wps_update_render', { variableId, renderId, code: constant({ renderTarget: { targetRef: refs(1), description: null } }) });
  assert.equal((await rewrite()).status, 200);
  const final = await saved();
  assert.equal(Object.hasOwn(final, 'description'), false);
  assert.equal(final.targetRef, refs(1));
  await h.close();
  h = await startHarness({ dataDir: dir }); call = await connect(h, t); await presentation(h);
  assert.deepEqual(await saved(), final);
});

test('invalid dynamic metadata preserves the definition and does not stop later Render rules', { timeout: 30000 }, async t => {
  const h = await startHarness(); t.after(() => h.close());
  const call = await connect(h, t); await presentation(h);
  const { variableId } = await call('wps_create_variable', { variableName: '项目', sourceDocumentId: 'doc_001', code: 'return 1;' });
  await call('wps_run_transform', { variableId });
  const { renderId } = await call('wps_create_render', { variableId, targetDocumentId: 'doc_001', targetRef: refs(1), description: '保留', code: 'return true;' });
  const sibling = await call('wps_create_render', { variableId, targetDocumentId: 'doc_001', code: constant({ targetRef: 'ordinary business output', description: 'not metadata' }) });
  for (const renderTarget of [null, [], {}, { targetRef: 'Paragraph:1' }, { targetRef: '' }, { targetRef: refs(1), targetDocumentId: 'other' },
    { targetRef: refs(1), description: 1 }, { targetRef: refs(1), description: 'x'.repeat(1001) },
    { targetRef: refs(MAX_DOCUMENT_LOCATIONS + 1) }, { targetRef: 'Slide:1' + ' '.repeat(MAX_DOCUMENT_REF_LENGTH) }]) {
    await call('wps_update_render', { variableId, renderId, code: constant({ renderTarget }) });
    const before = (await call('wps_get_variable', { variableId })).renders[0];
    const result = await call('wps_run_render', { variableId });
    assert.equal(result.success, false);
    assert.equal(result.renders[0].error.code, 'RENDER_EXECUTION_ERROR');
    assert.match(result.renders[0].error.message, /文档可能已写入/);
    assert.equal(result.renders[1].success, true);
    const after = await call('wps_get_variable', { variableId });
    assert.deepEqual(after.renders[0], before);
    assert.equal(after.renders[1].renderId, sibling.renderId);
    assert.equal(Object.hasOwn(after.renders[1], 'targetRef'), false, 'ordinary result fields are not consumed');
  }
  for (const code of ['return true;', 'return null;', 'return [1,2];', 'throw new Error("目标不可写");']) {
    await call('wps_update_render', { variableId, renderId, code });
    const result = await call('wps_run_render', { variableId, renderId });
    assert.equal(result.success, !code.startsWith('throw'));
    const saved = (await call('wps_get_variable', { variableId })).renders[0];
    assert.equal(saved.targetRef, refs(1)); assert.equal(saved.description, '保留');
  }
});

test('failed state persistence publishes neither new destinations nor lastRun', { timeout: 30000 }, async t => {
  const h = await startHarness(); t.after(() => h.close());
  const call = await connect(h, t);
  const { variableId } = await call('wps_create_variable', { variableName: '动态位置', sourceDocumentId: 'doc_001', code: constant({ renderTarget: { targetRef: 'Summary!A1' } }) });
  await call('wps_run_transform', { variableId });
  const { renderId } = await call('wps_create_render', { variableId, targetDocumentId: 'doc_001', code: 'return variable.value;' });
  await call('wps_run_render', { variableId, renderId });
  await call('wps_update_variable', { variableId, code: constant({ renderTarget: { targetRef: 'Summary!B2', description: '新位置' } }) });
  await call('wps_run_transform', { variableId });
  const before = await call('wps_get_variable', { variableId });
  const file = join(h.dir, 'state.json'), backup = join(h.dir, 'state-before-failure.json');
  await rename(file, backup); await mkdir(file);
  try {
    const result = await call('wps_run_render', { variableId, renderId });
    assert.equal(result.success, false);
    assert.deepEqual(await call('wps_get_variable', { variableId }), before);
  } finally { await rm(file, { recursive: true }); await rename(backup, file); }
  assert.equal((await call('wps_run_render', { variableId, renderId })).success, true);
  const persisted = JSON.parse(await readFile(file, 'utf8')).variables[0].renders[0];
  assert.equal(persisted.targetRef, 'Summary!B2'); assert.equal(persisted.description, '新位置'); assert.ok(persisted.lastRun);
});

test('UI batch requests retain all dynamic target updates across an intervening Render failure', { timeout: 30000 }, async t => {
  const h = await startHarness(); t.after(() => h.close());
  const call = await connect(h, t); await presentation(h);
  for (const name of ['项目明细', '风险明细']) {
    const { variableId } = await call('wps_create_variable', { variableName: name, sourceDocumentId: 'doc_001', code: 'return 42;' });
    await call('wps_run_transform', { variableId });
    const first = await call('wps_create_render', { variableId, targetDocumentId: 'doc_001', code: constant({ renderTarget: { targetRef: refs(2), description: name + '续表' } }) });
    const failed = await call('wps_create_render', { variableId, targetDocumentId: 'doc_001', targetRef: refs(1), code: 'throw new Error("目标不可写");' });
    const last = await call('wps_create_render', { variableId, targetDocumentId: 'doc_001', code: constant({ renderTarget: { targetRef: 'SlideID:999!ShapeID:4' } }) });
    const response = await post(h, '/api/actions', { op: 'render', variableId });
    assert.equal(response.status, 422);
    assert.deepEqual((await response.json()).renders.map(r => [r.renderId, r.success]), [[first.renderId, true], [failed.renderId, false], [last.renderId, true]]);
    const saved = await call('wps_get_variable', { variableId });
    assert.equal(saved.value, 42);
    assert.deepEqual(saved.renders.map(r => r.targetRef), [refs(2), refs(1), 'SlideID:999!ShapeID:4']);
    assert.ok(saved.renders[0].lastRun); assert.ok(saved.renders[2].lastRun);
    assert.equal(Object.hasOwn(saved.renders[1], 'lastRun'), false);
    assert.equal(saved.renders[0].description, name + '续表');
    const disk = JSON.parse(await readFile(join(h.dir, 'state.json'), 'utf8'));
    assert.deepEqual(disk.variables.find(v => v.variableId === variableId).renders, saved.renders);
  }
});
