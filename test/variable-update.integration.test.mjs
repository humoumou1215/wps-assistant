import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

async function connect(h) {
  const client = new Client({ name: 'rule-update-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
  return client;
}
const call = async (client, name, args) => {
  const result = await client.callTool({ name, arguments: args });
  const value = JSON.parse(result.content[0].text);
  assert.equal(result.isError, undefined, JSON.stringify(value));
  return value;
};
const failed = async (client, name, args, code) => {
  const result = await client.callTool({ name, arguments: args });
  assert.equal(result.isError, true);
  if (code) {
    const text = result.content[0].text;
    if (code === 'INVALID_REQUEST' && text.startsWith('MCP error')) assert.match(text, /-32602/);
    else assert.equal(JSON.parse(text).error.code, code);
  }
};
async function createRules(client) {
  const { variableId, transformId } = await call(client, 'wps_create_variable', {
    variableName: '总和', description: '原描述', sourceDocumentId: 'doc_001', sourceRef: '销售数据!B3',
    code: 'return Application.ActiveSheet.Range("B3").Value2;',
  });
  const { renderId } = await call(client, 'wps_create_render', { variableId, targetDocumentId: 'doc_001', description: '销售数据!D3', code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return true;' });
  await call(client, 'wps_run_transform', { variableId });
  await call(client, 'wps_run_render', { variableId, renderId });
  return { variableId, transformId, renderId };
}

test('rule updates preserve identity and other bindings, invalidate stale values and survive restart', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-update-')); let h, client;
  try {
    h = await startHarness({ dataDir: dir }); client = await connect(h);
    const { variableId, transformId, renderId } = await createRules(client);
    const sibling = await call(client, 'wps_create_render', { variableId, targetDocumentId: 'doc_001', code: 'return variable.value;' });
    const before = await call(client, 'wps_get_variable', { variableId });
    assert.equal(before.hasValue, true); assert.ok(before.transform.code); assert.ok(before.transform.lastRun);
    assert.ok(before.renders[0].code); assert.ok(before.renders[0].lastRun);
    let rpcCount = 0; h.socket.on('message', raw => { if (JSON.parse(raw).type === 'request') rpcCount++; });

    await call(client, 'wps_update_transform', { variableId, variableName: '平均值', description: null });
    const metadata = await call(client, 'wps_get_variable', { variableId });
    assert.equal(metadata.name, '平均值'); assert.equal(Object.hasOwn(metadata, 'description'), false);
    assert.equal(metadata.value, before.value); assert.deepEqual(metadata.transform.lastRun, before.transform.lastRun);
    const unchanged = await call(client, 'wps_update_transform', { variableId, code: before.transform.code });
    assert.equal(unchanged.valueInvalidated, false);

    for (const [name, args, code] of [
      ['wps_update_transform', { variableId, code: 'Application.ActiveSheet.Name = "bad"; return true;' }, 'READ_ONLY_VIOLATION'],
      ['wps_update_transform', { variableId, code: 'return (' }, 'INVALID_REQUEST'],
      ['wps_update_transform', { variableId, sourceDocumentId: 'doc_missing' }, 'DOCUMENT_NOT_FOUND'],
      ['wps_update_render', { variableId, renderId, targetDocumentId: 'doc_missing' }, 'DOCUMENT_NOT_FOUND'],
      ['wps_update_transform', { variableId }, 'INVALID_REQUEST'],
      ['wps_update_render', { variableId, renderId }, 'INVALID_REQUEST'],
      ['wps_update_transform', { variableId: 'missing', code: 'return 1;' }, 'VARIABLE_NOT_FOUND'],
      ['wps_update_render', { variableId, renderId: 'missing', code: 'return true;' }, 'RENDER_NOT_FOUND'],
      ['wps_update_render', { variableId: 'missing', renderId, code: 'return true;' }, 'VARIABLE_NOT_FOUND'],
      ['wps_update_transform', { variableId, variableName: '' }, 'INVALID_REQUEST'],
      ['wps_update_render', { variableId, renderId, code: '' }, 'INVALID_REQUEST'],
    ]) {
      await failed(client, name, args, code);
      assert.deepEqual(await call(client, 'wps_get_variable', { variableId }), metadata);
    }

    const update = await call(client, 'wps_update_transform', { variableId, sourceRef: null, code: 'return Application.ActiveSheet.Range("B3").Value2 / 3;' });
    assert.equal(update.valueInvalidated, true); assert.equal(update.hasValue, false); assert.equal(update.transformId, transformId);
    const invalidated = await call(client, 'wps_get_variable', { variableId });
    assert.equal(invalidated.hasValue, false); assert.equal(Object.hasOwn(invalidated, 'value'), false);
    assert.equal(Object.hasOwn(invalidated.transform, 'lastRun'), false); assert.equal(Object.hasOwn(invalidated.transform, 'sourceRef'), false);
    assert.deepEqual(invalidated.renders, before.renders);
    await failed(client, 'wps_run_render', { variableId, renderId }, 'INVALID_REQUEST');
    await call(client, 'wps_update_render', { variableId, renderId, description: null, code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value * 10; return true;' });
    const saved = await call(client, 'wps_get_variable', { variableId });
    assert.equal(saved.renders.length, 2); assert.equal(saved.renders[0].renderId, renderId);
    assert.equal(Object.hasOwn(saved.renders[0], 'description'), false); assert.equal(Object.hasOwn(saved.renders[0], 'lastRun'), false);
    assert.deepEqual(saved.renders[1], before.renders.find(r => r.renderId === sibling.renderId));
    assert.equal(h.appState.written, 120); assert.equal(rpcCount, 0, 'saving rules does not execute WPS code');

    assert.equal((await call(client, 'wps_run_transform', { variableId })).value, 40);
    const rendered = await call(client, 'wps_run_render', { variableId, renderId });
    assert.equal(rendered.renders.length, 1); assert.equal(h.appState.written, 400);
    const final = await call(client, 'wps_get_variable', { variableId });
    assert.ok(final.transform.lastRun); assert.ok(final.renders[0].lastRun);
    await client.close(); client = undefined; await h.close();
    h = await startHarness({ dataDir: dir }); client = await connect(h);
    assert.deepEqual(await call(client, 'wps_get_variable', { variableId }), final);
    await call(client, 'wps_run_render', { variableId, renderId }); assert.equal(h.appState.written, 400);
    const disk = JSON.parse(await readFile(join(dir, 'state.json'), 'utf8'));
    assert.equal(disk.variables.length, 1); assert.equal(disk.variables[0].renders.length, 2);
    const regionChange = await call(client, 'wps_update_transform', { variableId, sourceRef: '销售数据!B1:B3' });
    assert.equal(regionChange.valueInvalidated, true, 'a source-region change alone invalidates the value');
    const moved = await call(client, 'wps_get_variable', { variableId });
    assert.equal(moved.transform.code, final.transform.code); assert.equal(moved.hasValue, false);
    await failed(client, 'wps_run_render', { variableId, renderId }, 'INVALID_REQUEST');
  } finally { if (client) await client.close(); if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

test('source and target rebinding validate documents and existing bindings remain editable offline', { timeout: 30000 }, async () => {
  const h = await startHarness(); const client = await connect(h);
  try {
    const { variableId, renderId } = await createRules(client);
    const registered = new Promise(resolve => { const listener = raw => { if (JSON.parse(raw).type === 'registered') { h.socket.off('message', listener); resolve(); } }; h.socket.on('message', listener); });
    h.socket.send(JSON.stringify({ type: 'register', documents: [{ documentKey: 'other', name: '新来源.xlsx', type: 'spreadsheet' }] }));
    await registered;
    const changed = await call(client, 'wps_update_transform', { variableId, sourceDocumentId: 'doc_002' });
    assert.equal(changed.valueInvalidated, true);
    await call(client, 'wps_update_render', { variableId, renderId, targetDocumentId: 'doc_002', description: '新位置' });
    const rebound = await call(client, 'wps_get_variable', { variableId });
    assert.equal(rebound.transform.sourceDocumentId, 'doc_002'); assert.equal(rebound.renders[0].targetDocumentId, 'doc_002');
    h.socket.close();
    for (let i = 0; i < 100; i++) {
      if (!(await (await fetch(h.base + '/api/state')).json()).documents.some(d => d.connected)) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    await call(client, 'wps_update_transform', { variableId, code: 'return 45;' });
    await call(client, 'wps_update_render', { variableId, renderId, code: 'return variable.value;' });
    await failed(client, 'wps_update_transform', { variableId, sourceDocumentId: 'doc_002' }, 'DOCUMENT_DISCONNECTED');
    await failed(client, 'wps_update_render', { variableId, renderId, targetDocumentId: 'doc_002' }, 'DOCUMENT_DISCONNECTED');
    const offline = await call(client, 'wps_get_variable', { variableId });
    assert.equal(offline.transform.code, 'return 45;'); assert.equal(offline.renders[0].code, 'return variable.value;');
  } finally { await client.close(); await h.close(); }
});

test('failed update commits retain original state and do not poison the mutation queue', { timeout: 30000 }, async () => {
  const h = await startHarness(); const client = await connect(h); const file = join(h.dir, 'state.json');
  try {
    const { variableId, renderId } = await createRules(client);
    const before = await call(client, 'wps_get_variable', { variableId });
    await rm(file); await mkdir(file);
    await failed(client, 'wps_update_transform', { variableId, code: 'return 45;' });
    assert.deepEqual(await call(client, 'wps_get_variable', { variableId }), before);
    await failed(client, 'wps_update_render', { variableId, renderId, code: 'return true;' });
    assert.deepEqual(await call(client, 'wps_get_variable', { variableId }), before);
    await rm(file, { recursive: true });
    await call(client, 'wps_update_transform', { variableId, code: 'return 45;' });
    await call(client, 'wps_update_render', { variableId, renderId, code: 'return true;' });
    const after = await call(client, 'wps_get_variable', { variableId });
    assert.equal(after.transform.code, 'return 45;'); assert.equal(after.renders[0].code, 'return true;');
    assert.equal(JSON.parse(await readFile(file, 'utf8')).variables[0].hasValue, false);
  } finally { await client.close(); await h.close(); }
});

test('updates wait for in-flight execution and deletion removes the updated rule', { timeout: 30000 }, async () => {
  const h = await startHarness(); const client = await connect(h);
  const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const { variableId, renderId } = await createRules(client);
    await call(client, 'wps_update_render', { variableId, renderId, code: 'return new Promise(resolve => setTimeout(() => { Application.ActiveSheet.Range("D3").Value2 = variable.value; resolve(true); }, 150));' });
    const started = new Promise(resolve => { const listener = raw => { if (JSON.parse(raw).type === 'request') { h.socket.off('message', listener); resolve(); } }; h.socket.on('message', listener); });
    const rendering = post('/api/actions', { op: 'render', variableId, renderId });
    await started;
    const updating = call(client, 'wps_update_render', { variableId, renderId, code: 'return true;' });
    assert.equal((await rendering).status, 200); await updating;
    const updated = await call(client, 'wps_get_variable', { variableId });
    assert.equal(updated.renders[0].code, 'return true;'); assert.equal(Object.hasOwn(updated.renders[0], 'lastRun'), false);
    assert.equal(h.appState.written, 120);
    assert.equal((await post('/api/delete', { variableId, renderId })).status, 200);
    assert.equal((await call(client, 'wps_get_variable', { variableId })).renders.length, 0);
    await failed(client, 'wps_update_render', { variableId, renderId, code: 'return false;' }, 'RENDER_NOT_FOUND');
    assert.equal(JSON.parse(await readFile(join(h.dir, 'state.json'), 'utf8')).variables[0].renders.length, 0);
  } finally { await client.close(); await h.close(); }
});
