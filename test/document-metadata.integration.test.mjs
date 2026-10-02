import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

async function until(read, ready) {
  // Windows CI can delay filesystem persistence while other integration servers start.
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const value = await read();
    if (ready(value)) return value;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.fail('document metadata did not settle');
}

test('closed source and target documents retain names and stable bindings across restart', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-document-metadata-'));
  let h, client;
  try {
    h = await startHarness({ dataDir: dir });
    const state = () => fetch(h.base + '/api/state').then(response => response.json());
    const main = { documentKey: 'ui-fixture', name: 'UI验证.xlsx', type: 'spreadsheet' };
    const source = { documentKey: 'opaque-source', name: '交付台账.xlsx', type: 'spreadsheet', activeSheet: '项目跟进', selectionVersion: 2, selection: { sheet: '项目跟进', address: 'A1:B3' } };
    const target = { documentKey: '/reports/周会.pptx', path: '/reports/周会.pptx', name: '周会.pptx', type: 'presentation', activeSlide: 2 };
    h.socket.send(JSON.stringify({ type: 'documents', documents: [main, source, target] }));
    const initial = await until(state, s => s.documents.filter(d => d.connected).length === 3);
    const sid = initial.documents.find(d => d.name === source.name).documentId;
    const tid = initial.documents.find(d => d.name === target.name).documentId;
    client = new Client({ name: 'document-metadata', version: '1' });
    await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
    const invoke = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      assert.ok(!result.isError, result.content[0].text);
      return JSON.parse(result.content[0].text);
    };
    const variable = await invoke('wps_create_variable', { variableName: '项目', sourceDocumentId: sid, sourceRef: '项目跟进!A1:B3', code: 'return 1;' });
    const render = await invoke('wps_create_render', { variableId: variable.variableId, targetDocumentId: tid, targetRef: '第2页 项目跟进表', code: 'return true;' });
    // A registration refresh must persist the actual display name, even when
    // neither the stable document ID nor its key changes.
    source.name = '交付台账（修订）.xlsx';
    h.socket.send(JSON.stringify({ type: 'documents', documents: [main, source, target] }));
    try {
      await until(async () => JSON.parse(await readFile(join(dir, 'state.json'), 'utf8')),
        s => s.documentMetadata?.[sid]?.name === source.name);
    } catch (error) {
      throw new Error(`Document metadata persistence failed. Service diagnostics:\n${h.logs}`, { cause: error });
    }
    h.socket.send(JSON.stringify({ type: 'documents', documents: [main] }));
    const closed = await until(state, s => s.documents.find(d => d.documentId === tid)?.connected === false);
    assert.equal(closed.documents.find(d => d.documentId === sid).name, source.name);
    assert.equal((await invoke('wps_list_documents', {})).documents.length, 1);
    assert.equal((await fetch(h.base + '/health').then(r => r.json())).documents, 1);
    const definitions = closed.variables;
    await client.close(); client = undefined;
    await h.close(); h = await startHarness({ dataDir: dir });
    const restored = await state();
    assert.deepEqual(restored.variables, definitions, 'binding IDs and parsed locations survive without reopening the files');
    const cachedSource = restored.documents.find(d => d.documentId === sid);
    const cachedTarget = restored.documents.find(d => d.documentId === tid);
    assert.equal(cachedSource.name, source.name);
    assert.equal(cachedTarget.name, target.name);
    assert.equal(cachedTarget.path, target.path);
    for (const doc of [cachedSource, cachedTarget]) {
      assert.equal(doc.connected, false);
      assert.equal(doc.selection, undefined);
      assert.equal(doc.activeSheet, undefined);
      assert.equal(doc.activeSlide, undefined);
    }
    const response = await fetch(h.base + '/api/navigate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variableId: variable.variableId, renderId: render.renderId }) });
    assert.equal(response.status, 422);
    assert.match(await response.text(), /DOCUMENT_DISCONNECTED/);
    h.socket.send(JSON.stringify({ type: 'documents', documents: [main, source, target] }));
    const reopened = await until(state, s => s.documents.find(d => d.documentId === tid)?.connected);
    assert.equal(reopened.documents.find(d => d.name === source.name).documentId, sid);
    assert.equal(reopened.documents.find(d => d.name === target.name).documentId, tid);
  } finally { if (client) await client.close(); if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

test('legacy identities recover Chinese filenames and document types without inventing names for opaque IDs', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-legacy-document-metadata-'));
  let h;
  try {
    const entries = [
      ['presentation', '/Users/test/Downloads/项目交付周会-测试版.pptx', 'doc_013'],
      ['writer', 'C:\\reports\\项目交付周报-测试版.docx', 'doc_014'],
      ['writer', '/other/项目交付周报-测试版.docx', 'doc_015'],
      ['spreadsheet', 'spreadsheet:未保存的台账', 'doc_016'],
      ['writer', 'opaque-key', 'doc_017'],
    ];
    const variable = { variableId: 'var_001', name: '旧变量', transform: { transformId: 'transform_001', sourceDocumentId: 'doc_014', sourceRef: '本周概况段落', code: 'return 1;' }, renders: [{ renderId: 'render_014', targetDocumentId: 'doc_013', targetRef: '第2页 项目跟进表', code: 'return true;' }] };
    await writeFile(join(dir, 'state.json'), JSON.stringify({ counters: { doc: 17 }, variables: [variable], documentIds: Object.fromEntries(entries.map(([type, key, id]) => [JSON.stringify([type, key]), id])) }));
    h = await startHarness({ dataDir: dir });
    const state = await fetch(h.base + '/api/state').then(r => r.json());
    for (const [type, key, id] of entries.slice(0, 4)) {
      const doc = state.documents.find(d => d.documentId === id);
      assert.equal(doc.type, type);
      assert.equal(doc.name, key.startsWith(type + ':') ? key.slice(type.length + 1) : key.split(/[\\/]/).at(-1));
      assert.equal(doc.connected, false);
    }
    assert.equal(state.documents.some(d => d.documentId === 'doc_017'), false);
    assert.equal(state.variables[0].renders[0].targetLocations[0].kind, 'presentation');
    assert.equal(state.variables[0].transform.sourceLocations[0].kind, 'writer');
    await until(async () => JSON.parse(await readFile(join(dir, 'state.json'), 'utf8')), s => s.documentMetadata?.doc_013?.name === '项目交付周会-测试版.pptx');
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});
