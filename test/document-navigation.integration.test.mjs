import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import WebSocket from 'ws';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

const collection = items => ({ get Count() { return items.length; }, Item(i) { return items[i - 1]; } });
test('Word/PPT destinations navigate through real RPC and Add-in handler, rejecting ambiguous or removed targets', { timeout: 30000 }, async () => {
  const h = await startHarness(), sockets = [], calls = [];
  let client;
  const ppt = { Name: 'WPS演示' }, writer = { Name: 'WPS文字' };
  function presentation(path) {
    const pres = { Name: 'same.pptx', FullName: path };
    const makeShape = (id, name, text, table = false) => ({ Id: id, Name: name, HasTable: table ? -1 : 0, TextFrame: { TextRange: { Text: text } }, Select() { calls.push(['shape', path, id]); ppt.ActiveWindow.Selection = { ShapeRange: collection([this]) }; } });
    const slides = [
      { SlideID: 256, SlideIndex: 1, Shapes: collection([makeShape(1, 'title', '首页')]) },
      { SlideID: 257, SlideIndex: 2, Shapes: collection([makeShape(4, '表格 3', '', true)]) },
      { SlideID: 258, SlideIndex: 3, Shapes: collection([makeShape(2, '安排1', '本周完成\r内容'), makeShape(3, '安排2', '计划调整\r内容')]) },
      { SlideID: 259, SlideIndex: 4, Shapes: collection([makeShape(3, '下周工作', '下周工作\r内容'), makeShape(5, '资源协调', '资源协调\r内容'), makeShape(6, '重复', ''), makeShape(7, '重复', '')]) },
    ];
    pres.slides = slides; pres.Slides = collection(slides);
    const win = { Selection: {}, View: { GotoSlide(i) { calls.push(['slide', path, i]); this.Slide = slides.find(s => s.SlideIndex === i); } }, Activate() { calls.push(['presentation', path]); ppt.ActivePresentation = pres; ppt.ActiveWindow = win; } };
    pres.Windows = collection([win]); return pres;
  }
  function document(path) {
    const doc = { Name: 'same.docx', FullName: path, Content: { End: 200 }, Activate() { calls.push(['document', path]); writer.ActiveDocument = doc; } };
    const range = (start, end, text) => ({ Start: start, End: end, Text: text, Select() { calls.push(['range', path, start, end]); writer.Selection = { Start: start, End: end, Text: text }; } });
    const paras = [
      { Range: range(0, 5, '本周概况\r') }, { Range: range(5, 20, '概况内容\r') },
      { Range: range(20, 25, '团队进展\r') }, { Range: range(25, 30, '团队\r\x07') },
      { Range: range(80, 85, '重复标题\r') }, { Range: range(90, 95, '重复标题\r') },
    ];
    doc.paras = paras; doc.Paragraphs = collection(paras);
    doc.tables = [{ Range: range(25, 70, '表格') }]; doc.Tables = collection(doc.tables);
    doc.Range = (start, end) => range(start, end, '');
    doc.Bookmarks = { Exists(name) { return name === '目标'; }, Item() { return { Range: range(100, 110, '书签') }; } };
    return doc;
  }
  const p1 = presentation('/a/same.pptx'), p2 = presentation('/b/same.pptx'), d1 = document('/a/same.docx'), d2 = document('/b/same.docx');
  ppt.Presentations = collection([p1, p2]); p2.Windows.Item(1).Activate();
  writer.Documents = collection([d1, d2]); writer.ActiveWindow = {}; d2.Activate(); writer.Selection = { Start: 199, End: 199 };
  class Socket extends WebSocket { constructor(url) { super(url); sockets.push(this); } }
  const state = async () => (await fetch(h.base + '/api/state')).json();
  const post = body => fetch(h.base + '/api/navigate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const source = await readFile(new URL('../addon/main.js', import.meta.url), 'utf8');
    for (const [host, app] of [['wpp', ppt], ['wps', writer]]) vm.runInNewContext(source, { window: { wps: { [host === 'wpp' ? 'WppApplication' : 'WpsApplication']: () => app } }, URL, location: { href: h.base + '/addins/' + host + '/', pathname: '/addins/' + host + '/' }, WebSocket: Socket, clearTimeout() {}, setTimeout() {}, setInterval() {} });
    for (let i = 0; i < 100 && (await state()).documents.length < 5; i++) await new Promise(r => setTimeout(r, 20));
    const docs = (await state()).documents, pid = docs.find(d => d.path === p1.FullName).documentId, wid = docs.find(d => d.path === d1.FullName).documentId;
    client = new Client({ name: 'document-navigation', version: '1' }); await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
    const invoke = async (name, args) => { const result = await client.callTool({ name, arguments: args }); assert.ok(!result.isError, result.content[0].text); return JSON.parse(result.content[0].text); };
    const variable = await invoke('wps_create_variable', { variableName: 'nav', sourceDocumentId: wid, sourceRef: 'Paragraph:2', code: 'return Application.MustNotExecute.value;' });
    const create = (id, ref) => invoke('wps_create_render', { variableId: variable.variableId, targetDocumentId: id, targetRef: ref, code: 'throw new Error("render must not execute");' });
    const pr = await create(pid, 'SlideID:257!ShapeID:4'), wr = await create(wid, '本周概况段落+团队进展表格');
    const request = { variableId: variable.variableId };
    async function navigate(renderId, locationIndex) { const response = await post({ ...request, ...(renderId ? { renderId } : {}), ...(locationIndex !== undefined ? { locationIndex } : {}) }); assert.equal(response.status, 200, await response.clone().text()); return response.json(); }
    await navigate(); assert.equal(writer.ActiveDocument, d1); assert.equal(writer.Selection.Start, 5);
    await navigate(pr.renderId); assert.equal(ppt.ActivePresentation, p1); assert.equal(ppt.ActiveWindow.View.Slide.SlideID, 257); assert.deepEqual(calls.at(-1), ['shape', p1.FullName, 4]);
    await navigate(wr.renderId); assert.equal(writer.Selection.Start, 5); await navigate(wr.renderId, 1); assert.equal(writer.Selection.Start, 25); assert.equal(writer.Selection.End, 70);
    assert.equal((await state()).variables.find(v => v.variableId === request.variableId).renders.find(r => r.renderId === wr.renderId).targetLocations.length, 2);
    for (const ref of ['第2页 项目跟进表', '第4页 下周工作与资源协调文本框', 'Slide:3!Shape:安排2', 'Slide:1']) { const r = await create(pid, ref); await navigate(r.renderId); if (ref.includes('与')) { await navigate(r.renderId, 1); assert.deepEqual(calls.at(-1), ['shape', p1.FullName, 5]); } }
    for (const ref of ['Table:1', 'Heading:本周概况', 'Heading:本周概况!Paragraph', 'Heading:团队进展!Table', 'Bookmark:目标', 'Range:0:20']) { const r = await create(wid, ref); await navigate(r.renderId); }
    // Stable IDs keep pointing at the same slide after reordering.
    p1.slides.reverse(); p1.slides.forEach((s, i) => { s.SlideIndex = i + 1; }); await navigate(pr.renderId); assert.equal(ppt.ActiveWindow.View.Slide.SlideID, 257); assert.equal(ppt.ActiveWindow.View.Slide.SlideIndex, 3);
    const bad = [];
    for (const [id, ref] of [[pid, 'SlideID:999!ShapeID:4'], [pid, 'Slide:1!Shape:重复'], [wid, 'Heading:重复标题'], [wid, 'Range:0:201'], [wid, 'Bookmark:消失'], [wid, 'Paragraph:999']]) bad.push(await create(id, ref));
    const before = JSON.stringify((await state()).variables), count = calls.length;
    for (const r of bad) { const result = await post({ ...request, renderId: r.renderId }); assert.equal(result.status, 422, await result.clone().text()); }
    assert.equal((await post({ ...request, renderId: wr.renderId, locationIndex: 2 })).status, 422);
    assert.equal((await post({ ...request, locationIndex: -1 })).status, 400);
    assert.equal(calls.length, count); assert.equal(JSON.stringify((await state()).variables), before);
    // Create/update validation agrees across document types and keeps old IDs.
    await invoke('wps_update_render', { ...request, renderId: pr.renderId, targetRef: 'SlideID:258!ShapeID:2' }); await navigate(pr.renderId);
    const invalid = await client.callTool({ name: 'wps_update_render', arguments: { ...request, renderId: pr.renderId, targetDocumentId: wid } }); assert.equal(invalid.isError, true);
    d1.tables.length = 0; assert.equal((await post({ ...request, renderId: wr.renderId, locationIndex: 1 })).status, 422);
    assert.equal(h.appState.written, null);
  } finally { for (const socket of sockets) socket.close(); if (client) await client.close(); await h.close(); }
});
