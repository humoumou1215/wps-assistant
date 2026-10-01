import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import WebSocket from 'ws';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

test('pane navigation routes by document identity through the actual Add-in handler without executing bindings', { timeout: 30000 }, async () => {
  const h = await startHarness(), sockets = [], calls = [];
  let client;
  const app = { Name: 'WPS表格', ActiveWindow: { ScrollRow: 1, ScrollColumn: 1 } };
  function book(fullName) {
    const workbook = { Name: 'same.xlsx', FullName: fullName, Activate() { calls.push(['book', fullName]); app.ActiveWorkbook = workbook; } };
    const sheets = new Map(['Sales', 'Summary', "Team's Sales"].map(name => {
      const sheet = { Name: name, Activate() { calls.push(['sheet', name]); app.ActiveSheet = sheet; }, Range(address) {
        return { Select() { calls.push(['select', fullName, name, address]); app.Selection = { Address: address }; } };
      } };
      return [name, sheet];
    }));
    workbook.Worksheets = { Item(name) { if (!sheets.has(name)) throw new Error('工作表不存在'); return sheets.get(name); } };
    return workbook;
  }
  const first = book('ui-fixture'), second = book('other-fixture');
  app.Workbooks = { Count: 2, Item(index) { return [first, second][index - 1]; } };
  app.ActiveWorkbook = second; app.ActiveSheet = second.Worksheets.Item('Sales'); app.Selection = { Address: 'Z99' };
  class Socket extends WebSocket { constructor(url) { super(url); sockets.push(this); } }
  const post = (path, body, headers = {}) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const state = async () => (await fetch(h.base + '/api/state')).json();
  try {
    h.socket.close(); await new Promise(r => h.socket.once('close', r));
    const source = await readFile(new URL('../addon/main.js', import.meta.url), 'utf8');
    vm.runInNewContext(source, { window: { wps: { EtApplication: () => app } }, URL, location: { href: h.base + '/addins/et/', pathname: '/addins/et/' }, WebSocket: Socket, clearTimeout() {}, setTimeout() {}, setInterval() {} });
    for (let i = 0; i < 100 && !(await state()).documents.find(d => d.path === 'other-fixture'); i++) await new Promise(r => setTimeout(r, 20));
    const docs = (await state()).documents;
    const sourceDoc = docs.find(d => d.path === 'ui-fixture'), targetDoc = docs.find(d => d.path === 'other-fixture');
    assert.ok(sourceDoc && targetDoc);
    client = new Client({ name: 'navigation-test', version: '1' }); await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
    const invoke = async (name, args) => {
      const result = await client.callTool({ name, arguments: args }); assert.ok(!result.isError, result.content[0].text); return JSON.parse(result.content[0].text);
    };
    const variable = await invoke('transform.create', { variableName: 'click test', sourceDocumentId: sourceDoc.documentId, sourceRef: 'Sales!A1:D4', code: 'return Application.MustNotExecute.value;' });
    const explicit = await invoke('render.create', { variableId: variable.variableId, targetDocumentId: targetDoc.documentId, targetRef: "'Team''s Sales'!$B$100:$D$104", description: '<unsafe>位置说明', code: 'throw new Error("Render must not execute");' });
    const legacy = await invoke('render.create', { variableId: variable.variableId, targetDocumentId: sourceDoc.documentId, description: '将数据写入 same.xlsx 的 Summary!A1:B4。', code: 'throw new Error("Render must not execute");' });
    const ambiguous = await invoke('render.create', { variableId: variable.variableId, targetDocumentId: sourceDoc.documentId, description: '从 Sales!A1 复制到 Summary!B2', code: 'return true;' });
    const missingSheet = await invoke('render.create', { variableId: variable.variableId, targetDocumentId: targetDoc.documentId, targetRef: 'Deleted!A1', code: 'return true;' });
    const request = { variableId: variable.variableId };
    let result = await post('/api/navigate', request); assert.equal(result.status, 200);
    assert.equal(app.ActiveWorkbook, first); assert.equal(app.ActiveSheet.Name, 'Sales'); assert.equal(app.Selection.Address, 'A1:D4');
    result = await post('/api/navigate', { ...request, renderId: explicit.renderId }); assert.equal(result.status, 200);
    assert.equal(app.ActiveWorkbook, second); assert.equal(app.ActiveSheet.Name, "Team's Sales"); assert.equal(app.Selection.Address, 'B100:D104');
    assert.equal(app.ActiveWindow.ScrollRow, 100); assert.equal(app.ActiveWindow.ScrollColumn, 2);
    // Hosts exposing Goto use its scroll flag instead of the window fallback.
    app.Goto = (range, scroll) => { assert.equal(scroll, true); calls.push(['goto']); };
    result = await post('/api/navigate', { ...request, renderId: legacy.renderId }); assert.equal(result.status, 200);
    assert.equal(app.ActiveWorkbook, first); assert.equal(app.Selection.Address, 'A1:B4'); assert.deepEqual(calls.at(-1), ['goto']);
    const before = JSON.stringify(await state()), callCount = calls.length;
    assert.equal((await post('/api/navigate', { ...request, renderId: ambiguous.renderId })).status, 422);
    assert.equal((await post('/api/navigate', { ...request, renderId: 'missing' })).status, 404);
    assert.equal((await post('/api/navigate', { ...request, code: 'evil' })).status, 400);
    assert.equal((await post('/api/navigate', request, { Origin: 'https://evil.example' })).status, 403);
    assert.equal(calls.length, callCount);
    assert.equal(JSON.stringify(await state()), before, 'navigation never changes variable values or execution metadata');
    const failed = await post('/api/navigate', { ...request, renderId: missingSheet.renderId }); assert.equal(failed.status, 422); assert.match(await failed.text(), /工作表不存在/);
    const saved = await invoke('variable.get', request); assert.equal(saved.renders[0].targetRef, "'Team''s Sales'!$B$100:$D$104");
    const disk = JSON.parse(await readFile(h.dir + '/state.json', 'utf8')); assert.equal(disk.variables[0].renders[0].targetRef, saved.renders[0].targetRef);
    assert.equal(disk.variables[0].hasValue, undefined); assert.equal(disk.variables[0].transform.lastRun, undefined); assert.equal(disk.variables[0].renders[0].lastRun, undefined);
    assert.equal(h.appState.written, null);
    sockets[0].close(); await new Promise(r => sockets[0].once('close', r));
    const disconnected = await post('/api/navigate', request); assert.equal(disconnected.status, 422); assert.match(await disconnected.text(), /DOCUMENT_DISCONNECTED/);
  } finally { for (const socket of sockets) socket.close(); if (client) await client.close(); await h.close(); }
});
