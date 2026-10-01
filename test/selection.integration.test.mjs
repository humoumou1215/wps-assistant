import test from 'node:test';
import assert from 'node:assert/strict';
import { startHarness } from './helpers/ui-harness.mjs';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const view = vm.createContext({ structuredClone });
vm.runInContext(await readFile(new URL('../addon/taskpane-view.js', import.meta.url), 'utf8'), view);
const requestRef = ref => view.WpsPaneView.selectionRequest(ref);

test('the UI fixture rejects unknown render code instead of executing it in Node', { timeout: 30000 }, async () => {
  const h = await startHarness();
  const client = new Client({ name: 'fixture-safety', version: '1' });
  const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    await post('/api/config', h.cfg);
    await (await post('/api/chat', { message: '验证绑定' })).text();
    await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
    const render = await client.callTool({ name: 'wps_create_render', arguments: {
      variableId: 'var_001', targetDocumentId: 'doc_001', description: '未知测试代码',
      code: 'globalThis.__wpsHarnessInjected = true; return true;',
    } });
    assert.ok(!render.isError);
    const response = await post('/api/actions', { op: 'render', variableId: 'var_001' });
    assert.equal(response.status, 422);
    assert.match(await response.text(), /Unsupported fixture code/);
    assert.equal(globalThis.__wpsHarnessInjected, undefined);
  } finally { delete globalThis.__wpsHarnessInjected; await client.close(); await h.close(); }
});

test('large text supports insertion, pinning, preview and 30-reference sends with bounded history', { timeout: 30000 }, async () => {
  const h = await startHarness();
  const post = (path, data) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  try {
    await post('/api/config', h.cfg);
    h.appState.type = 'writer';
    h.appState.selection = { type: 'text', nativeType: 2, start: 10, end: 350010, storyType: 1, text: '中'.repeat(350000) };
    const current = { kind: 'sel', id: 'doc_001', selectionMode: 'current', selection: h.appState.selection };
    const inserted = await post('/api/ref-resolve', requestRef(current)); assert.equal(inserted.status, 200);
    const snapshot = await inserted.json();
    assert.equal(snapshot.selection.text.length, 2000); assert.equal(snapshot.selection.textLength, 350000);
    assert.equal(snapshot.selection.end, 350010);
    const state = await (await fetch(h.base + '/api/state')).json();
    assert.equal(state.documents[0].selection.text.length, 2000, 'legacy full-text collectors are bounded at registration too');
    const fixed = { ...snapshot, selectionMode: 'fixed' };
    h.appState.selection = { ...h.appState.selection, start: 20, end: 350020 };
    const preview = await post('/api/ref-preview', requestRef(fixed)); assert.equal(preview.status, 200);
    const value = await preview.json(); assert.equal(value.truncated, true); assert.equal(value.ref.selection.start, 10);
    assert.equal(value.value.length, 2000);
    const refs = Array.from({ length: 30 }, (_, i) => requestRef({ ...(i % 2 ? fixed : current), marker: '引用' + (i + 1) }));
    const input = { message: '请检查这些引用', refs };
    assert.ok(Buffer.byteLength(JSON.stringify(input)) < 200000);
    const stream = await (await post('/api/chat', input)).text();
    assert.match(stream, /event: turn.end/); assert.ok(!stream.includes('event: error'));
    const history = await (await fetch(h.base + '/api/chat')).json();
    const saved = history.turns.at(-1).refs;
    assert.equal(saved.length, 30); assert.equal(saved[0].selection.start, 20); assert.equal(saved[1].selection.start, 10);
    assert.ok(saved.every(ref => ref.selection.text.length === 2000 && ref.selection.textTruncated && ref.selection.textLength === 350000));
    assert.ok(Buffer.byteLength(JSON.stringify(h.requests.at(-1).body.messages)) < 300000, 'model context must not contain 30 full selections');
  } finally { await h.close(); }
});

test('incomplete or invalid native locations are rejected before the model runs', { timeout: 30000 }, async () => {
  const h = await startHarness();
  const post = (path, data) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const current = { kind: 'sel', id: 'doc_001', selectionMode: 'current' };
  try {
    await post('/api/config', h.cfg);
    const ppt = { type: 'text', slide: 1, slideId: 256, shapeNames: ['TextBox 1'], shapeIds: [42], text: '经营', start: 3, length: 2 };
    const writer = { type: 'text', start: 10, end: 12, storyType: 1, text: '经营' };
    const invalid = [
      ['presentation', { ...ppt, start: undefined }], ['presentation', { ...ppt, length: undefined }],
      ['presentation', { ...ppt, start: -1 }], ['presentation', { ...ppt, length: -1 }],
      ['presentation', { ...ppt, shapeIds: undefined }], ['presentation', { ...ppt, slideId: undefined }],
      ['writer', { ...writer, end: undefined }], ['writer', { ...writer, storyType: undefined }],
      ['writer', { ...writer, start: -1 }], ['writer', { ...writer, end: 9 }],
      ['writer', { ...writer, type: 'caret' }], ['spreadsheet', {}],
    ];
    for (const [type, selection] of invalid) {
      h.appState.type = type; h.appState.selection = selection;
      const response = await post('/api/ref-resolve', current);
      assert.equal(response.status, 400, JSON.stringify({ type, selection }));
      assert.match((await response.json()).error, /选区/);
      const fixed = await post('/api/ref-resolve', { ...current, selectionMode: 'fixed', selection });
      assert.equal(fixed.status, 400);
      const stream = await (await post('/api/chat', { message: '改写选区', refs: [current] })).text();
      assert.match(stream, /event: error/);
      assert.equal(h.requests.length, 0, 'invalid locations must never reach the model');
    }
    for (const [type, selection] of [
      ['presentation', ppt], ['writer', writer], ['writer', { ...writer, type: 'caret', end: 10, text: '' }],
      ['presentation', { type: 'shape', slide: 1, shapeNames: ['TextBox 1'] }],
    ]) {
      h.appState.type = type; h.appState.selection = selection;
      assert.equal((await post('/api/ref-resolve', current)).status, 200);
    }
  } finally { await h.close(); }
});

test('current resolves at send, fixed holds its sheet, and history saves actual references', { timeout: 30000 }, async () => {
  const h = await startHarness();
  const post = (path, data) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  try {
    await post('/api/config', h.cfg);
    const fixed = { kind: 'sel', id: 'doc_001', selectionMode: 'fixed', activeSheet: '销售数据', selection: { sheet: '销售数据', address: 'A1:B3' } };
    const current = { ...fixed, selectionMode: 'current' };
    // Change the live host without publishing a heartbeat: stale client data must be ignored.
    h.appState.activeSheet = 'Summary'; h.appState.selection = { sheet: 'Summary', address: 'D1:D4' };
    const preview = await (await post('/api/ref-preview', current)).json();
    assert.match(preview.ref.label, /UI验证.xlsx.*Summary!D1:D4/); assert.equal(preview.address, 'D1:D4');
    const fixedPreview = await (await post('/api/ref-preview', fixed)).json();
    assert.match(fixedPreview.ref.label, /销售数据!A1:B3/); assert.equal(fixedPreview.address, 'A1:B3');
    h.appState.selection.address = 'F2:F3';
    const inspectionsBeforeSend = h.appState.inspected;
    const stream = await (await post('/api/chat', { message: '请查看 [引用1:旧选区] 与 [引用2:固定]、[引用3:当前]', refs: [{ ...current, marker: '引用1' }, { ...fixed, marker: '引用2' }, { ...current, marker: '引用3' }] })).text();
    assert.match(stream, /event: refs.resolved/);
    const history = await (await fetch(h.base + '/api/chat')).json();
    const refs = history.turns.at(-1).refs;
    assert.equal(h.appState.inspected - inspectionsBeforeSend, 1, 'same-document current references share one fresh snapshot');
    assert.deepEqual(refs[2].selection, refs[0].selection);
    assert.equal(refs[0].selection.address, 'F2:F3'); assert.equal(refs[0].activeSheet, 'Summary');
    assert.equal(refs[1].selection.address, 'A1:B3'); assert.equal(refs[1].activeSheet, '销售数据');
    assert.ok(refs.every(ref => ref.selectionResolved));
    const request = h.requests.at(-1).body.messages;
    assert.match(JSON.stringify(request), /F2:F3/);
    h.appState.selection.address = 'Z9';
    assert.deepEqual((await (await fetch(h.base + '/api/chat')).json()).turns.at(-1).refs, refs);
    // Historical previews explicitly use the saved selection, rather than following today’s location.
    const savedPreview = await (await post('/api/ref-preview', { ...refs[0], selectionMode: 'fixed' })).json();
    assert.equal(savedPreview.address, 'F2:F3');
    const areas = await (await post('/api/ref-preview', { ...fixed, selection: { sheet: '销售数据', address: 'A1:A2,D1:D2', areas: [{ address: 'A1:A2' }, { address: 'D1:D2' }] } })).json();
    assert.equal(areas.address, 'A1:A2,D1:D2'); assert.equal(areas.value.length, 2);
    assert.ok(!h.appState.reads.includes('A1:D2'), 'unselected cells between areas must not be read');
    h.appState.selection = null;
    assert.equal((await post('/api/ref-resolve', current)).status, 400);
    assert.equal((await post('/api/ref-preview', fixed)).status, 200, 'fixed reference works while its document is inactive');
    assert.equal((await fetch(h.base + '/api/ref-resolve', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: JSON.stringify(current) })).status, 403);
    h.socket.send(JSON.stringify({ type: 'documents', documents: [{ documentKey: 'ui-fixture', name: 'UI验证.xlsx', type: 'spreadsheet', activeSheet: '销售数据', selection: { sheet: '销售数据', address: 'A9' } }] }));
    for (let i = 0; i < 30; i++) {
      if ((await (await fetch(h.base + '/api/state')).json()).documents[0].selection?.address === 'A9') break;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    const oldAddin = await post('/api/ref-resolve', current);
    assert.equal(oldAddin.status, 400); assert.match((await oldAddin.json()).error, /重新启动 WPS/);
  } finally { await h.close(); }
});
