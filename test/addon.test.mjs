import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../addon/main.js', import.meta.url), 'utf8');

function inspectHost(app, host, eventRoot = 'app') {
  const sent = [], callbacks = {}, handlers = {};
  class WS {
    static OPEN = 1; readyState = 1;
    addEventListener(name, callback) { handlers[name] = callback; if (name === 'open') callback(); }
    send(text) { sent.push(JSON.parse(text)); }
  }
  const events = { AddApiEventListener(name, callback) { callbacks[name] = callback; } };
  const wps = { [{ et: 'EtApplication', wpp: 'WppApplication', wps: 'WpsApplication' }[host]]: () => app };
  if (eventRoot === 'app') app.ApiEvent = events; else wps.ApiEvent = events;
  vm.runInNewContext(source, { window: { wps }, URL, location: { href: 'http://127.0.0.1:18766/addins/' + host + '/', pathname: '/addins/' + host + '/' }, WebSocket: WS, clearTimeout() {}, setTimeout() {}, setInterval() {} });
  return { sent, callbacks, handlers };
}

test('PPT captures exact text and identity; inspect and events read fresh selection without activation', async () => {
  const active = { Name: '汇报.pptx', FullName: '/汇报.pptx' };
  const selection = { Type: 3, TextRange: { Text: '经营', Start: 3, Length: 2 }, TextRange2: { Text: 'default' }, ShapeRange: { Count: 1, Item: () => ({ Name: 'TextBox 1', Id: 42 }) } };
  const app = { ActivePresentation: active, Presentations: { Count: 1, Item: () => active }, ActiveWindow: { Selection: selection, View: { Slide: { SlideIndex: 1, SlideID: 256 } } } };
  const h = inspectHost(app, 'wpp');
  const doc = h.sent[0].documents[0];
  assert.deepEqual(doc.selection, { type: 'text', nativeType: 3, slide: 1, slideId: 256, shapeNames: ['TextBox 1'], shapeIds: [42], text: '经营', start: 3, length: 2 });
  selection.TextRange = { Text: '摘要', Start: 5, Length: 2 };
  await h.handlers.message({ data: JSON.stringify({ type: 'request', method: 'inspect', id: 'fresh', documentKey: '/汇报.pptx' }) });
  assert.equal(h.sent.at(-1).payload.result.selection.text, '摘要');
  selection.Type = 2;
  h.callbacks.WindowSelectionChange();
  assert.equal(h.sent.at(-1).documents[0].selection.type, 'shape');
  assert.equal(h.sent.at(-1).documents[0].selection.text, undefined, 'shape selection must not inherit a stale TextRange');
  selection.ShapeRange.Count = 0; selection.Type = 0;
  h.callbacks.WindowSelectionChange();
  assert.equal(h.sent.at(-1).documents[0].selection.type, 'none');
});

test('macOS global wps.ApiEvent publishes changed selections without Application.ApiEvent', () => {
  const book = { Name: '经营.xlsx', FullName: '/经营.xlsx' };
  const app = { ActiveWorkbook: book, Workbooks: { Count: 1, Item: () => book }, ActiveSheet: { Name: 'Sales' }, Selection: { Address: 'A1' } };
  const h = inspectHost(app, 'et', 'wps');
  assert.equal(app.ApiEvent, undefined);
  assert.equal(typeof h.callbacks.SheetSelectionChange, 'function');
  app.Selection.Address = 'B9'; h.callbacks.SheetSelectionChange();
  assert.equal(h.sent.at(-1).documents[0].selection.address, 'B9');
  assert.equal(typeof h.callbacks.WindowSelectionChange, 'function');
});

test('large Writer and PPT selections keep exact coordinates and bounded text previews', () => {
  const text = '中'.repeat(350000), doc = { Name: '大文档.docx', FullName: '/大文档.docx' };
  let textReads = 0;
  const writer = inspectHost({ ActiveDocument: doc, Documents: { Count: 1, Item: () => doc }, Selection: { Start: 10, End: 350010, StoryType: 1, get Text() { textReads++; return text; } } }, 'wps');
  const s = writer.sent[0].documents[0].selection;
  assert.equal(s.text.length, 2000); assert.equal(s.textLength, 350000); assert.equal(s.textTruncated, true);
  assert.equal(s.start, 10); assert.equal(s.end, 350010); assert.equal(textReads, 1);
  assert.ok(Buffer.byteLength(JSON.stringify(writer.sent[0])) < 10000);
  const ppt = inspectHost({ ActivePresentation: doc, Presentations: { Count: 1, Item: () => doc }, ActiveWindow: { Selection: { Type: 3, TextRange: { Text: text, Start: 3, Length: 350000 }, ShapeRange: { Count: 1, Item: () => ({ Name: 'TextBox 1', Id: 42 }) } }, View: { Slide: { SlideIndex: 1, SlideID: 256 } } } }, 'wpp');
  const p = ppt.sent[0].documents[0].selection;
  assert.equal(p.text.length, 2000); assert.equal(p.textLength, 350000); assert.equal(p.length, 350000);
});

test('Writer captures range and caret, and spreadsheet preserves disjoint areas', () => {
  const doc = { Name: '文档.docx', FullName: '/文档.docx' }, selection = { Type: 2, Start: 10, End: 12, Text: '经营', StoryType: 1 };
  const writer = inspectHost({ ActiveDocument: doc, Documents: { Count: 1, Item: () => doc }, Selection: selection }, 'wps');
  assert.deepEqual(writer.sent[0].documents[0].selection, { type: 'text', nativeType: 2, start: 10, end: 12, text: '经营', storyType: 1 });
  selection.End = 10; selection.Text = '';
  writer.callbacks.WindowSelectionChange();
  assert.equal(writer.sent.at(-1).documents[0].selection.type, 'caret');
  const book = { Name: '经营.xlsx', FullName: '/经营.xlsx' };
  const et = inspectHost({ ActiveWorkbook: book, Workbooks: { Count: 1, Item: () => book }, ActiveSheet: { Name: 'Sales' }, Selection: { Address: '$A$1:$A$2,$D$1:$D$2', Areas: { Count: 2, Item: n => ({ Address: n === 1 ? '$A$1:$A$2' : '$D$1:$D$2' }) } } }, 'et');
  assert.deepEqual(et.sent[0].documents[0].selection.areas, [{ address: '$A$1:$A$2' }, { address: '$D$1:$D$2' }]);
});
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

test('bound execution supports an unsaved active document without a collection and rejects a missing identity', async () => {
  for (const [host, activeKey, type] of [['et', 'ActiveWorkbook', 'spreadsheet'], ['wps', 'ActiveDocument', 'writer'], ['wpp', 'ActivePresentation', 'presentation']]) {
    const native = { Name: '未保存', marker: type };
    const app = { [activeKey]: native };
    const h = inspectHost(app, host);
    const execute = async documentKey => {
      await h.handlers.message({ data: JSON.stringify({ type: 'request', method: 'execute', id: 'bound', documentKey,
        code: 'return { name: wpsDocument.Name, marker: wpsDocument.marker };' }) });
      return h.sent.at(-1).payload;
    };
    assert.deepEqual((await execute(`${type}:未保存`)).result, { name: '未保存', marker: type });
    const missing = await execute(`${type}:另一个文档`);
    assert.equal(missing.success, false);
    assert.match(missing.error, /no longer available/);
    assert.equal(app[activeKey], native);
  }
});
