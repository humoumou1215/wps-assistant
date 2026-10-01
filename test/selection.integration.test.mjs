import test from 'node:test';
import assert from 'node:assert/strict';
import { startHarness } from './helpers/ui-harness.mjs';

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
