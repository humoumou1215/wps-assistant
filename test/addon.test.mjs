import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../addon/main.js', import.meta.url), 'utf8');
test('Add-in caches panes, uses bridge port and does not attach another document selection', () => {
  const sent = [], panes = new Map(), storage = new Map(); let counter = 0;
  const active = { Name: 'active.xlsx', FullName: '/active.xlsx' }, other = { Name: 'other.xlsx', FullName: '/other.xlsx' };
  const app = { ActiveWorkbook: active, ActiveSheet: { Name: 'Sheet1' }, Selection: { Address: 'B2' }, Workbooks: { Count: 2, Item: n => [active, other][n - 1] },
    PluginStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    CreateTaskpane(url) { const pane = { ID: counter++, url, Visible: false }; panes.set(String(pane.ID), pane); return pane; },
    GetTaskpane(id) { return panes.get(String(id)); },
  };
  class WS {
    static OPEN = 1; readyState = 1;
    addEventListener(name, callback) { if (name === 'open') callback(); }
    send(text) { sent.push(JSON.parse(text)); }
  }
  const window = { wps: { EtApplication: () => app } };
  vm.runInNewContext(source, { window, URL, location: { href: 'http://127.0.0.1:18766/addins/et/?bridgePort=18777', pathname: '/addins/et/' }, WebSocket: WS, clearTimeout() {}, setTimeout() {}, setInterval() {}, alert(message) { throw new Error(message); } });
  const docs = sent[0].documents;
  assert.equal(docs.find(d => d.name === 'active.xlsx').selection.address, 'B2');
  assert.equal(docs.find(d => d.name === 'other.xlsx').selection, undefined);
  window.WpsMcpShowAssistant(); window.WpsMcpShowAssistant(); window.WpsMcpShowVariables(); window.WpsMcpShowVariables();
  assert.equal(panes.size, 2);
  assert.ok([...panes.values()].every(p => p.Visible && p.url.startsWith('http://127.0.0.1:18777/addon/taskpane.html')));
  assert.equal(new URL([...panes.values()][1].url).searchParams.get('page'), 'vars');
});
