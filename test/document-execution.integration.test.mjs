import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import WebSocket from 'ws';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

const source = await readFile(new URL('../addon/main.js', import.meta.url), 'utf8');
const collection = items => ({ get Count() { return items.length; }, Item(i) { return items[i - 1]; } });

test('query, Transform and Render bind native documents through real RPC independently of active same-name files', { timeout: 30000 }, async t => {
  const h = await startHarness(), sockets = [];
  let client;
  const state = async () => (await fetch(h.base + '/api/state')).json();
  try {
    const closed = new Promise(resolve => h.socket.once('close', resolve));
    h.socket.close(); await closed;
    class Socket extends WebSocket { constructor(url) { super(url); sockets.push(this); } }
    client = new Client({ name: 'bound-document-test', version: '1' });
    await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
    const invoke = async (name, args) => {
      const result = await client.callTool({ name, arguments: args });
      assert.ok(!result.isError, result.content[0].text);
      const value = JSON.parse(result.content[0].text);
      assert.notEqual(value.success, false, result.content[0].text);
      return value;
    };

    for (const [host, type, activeKey, collectionKey, extension, expression] of [
      ['et', 'spreadsheet', 'ActiveWorkbook', 'Workbooks', 'xlsx', 'wpsDocument.Worksheets.Item("销售数据").Range("A1").Value2'],
      ['wps', 'writer', 'ActiveDocument', 'Documents', 'docx', 'wpsDocument.Content.Text'],
      ['wpp', 'presentation', 'ActivePresentation', 'Presentations', 'pptx', 'wpsDocument.Slides.Item(1).Shapes.Item(1).TextFrame.TextRange.Text'],
    ]) await t.test(type, async () => {
      const app = { Version: '12.0' };
      const make = (role, value) => {
        const native = { Name: `same.${extension}`, FullName: `/${host}/${role}/same.${extension}`, value,
          Activate() { throw new Error('Execution must not activate documents'); } };
        if (host === 'et') native.Worksheets = { Item(name) {
          assert.equal(name, '销售数据');
          return { Name: name, Range() { return { get Value2() { return native.value; }, set Value2(v) { native.value = v; } }; } };
        } };
        if (host === 'wps') native.Content = { get Text() { return native.value; }, set Text(v) { native.value = v; } };
        if (host === 'wpp') native.Slides = collection([{ Shapes: collection([{ Name: '内容', Type: 17,
          TextFrame: { TextRange: { get Text() { return native.value; }, set Text(v) { native.value = v; } } } }]) }]);
        return native;
      };
      const first = make('source', host === 'et' ? 120 : '源内容'), second = make('target', host === 'et' ? 0 : '旧目标'), decoy = make('active', host === 'et' ? 999 : '另一个活动文件');
      const docs = [first, second, decoy];
      app[collectionKey] = collection(docs); app[activeKey] = decoy;
      const selection = { marker: 'unchanged' }; app.Selection = selection;
      vm.runInNewContext(source, { window: { wps: { [{ et: 'EtApplication', wps: 'WpsApplication', wpp: 'WppApplication' }[host]]: () => app } },
        URL, location: { href: h.base + '/addins/' + host + '/', pathname: '/addins/' + host + '/' }, WebSocket: Socket,
        clearTimeout() {}, setTimeout() {}, setInterval() {} });
      let registered;
      for (let i = 0; i < 100; i++) {
        registered = (await state()).documents;
        if (registered.find(d => d.path === second.FullName && d.connected)) break;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      const sourceDoc = registered.find(d => d.path === first.FullName), targetDoc = registered.find(d => d.path === second.FullName);
      assert.ok(sourceDoc?.connected && targetDoc?.connected);
      assert.notEqual(sourceDoc.documentId, targetDoc.documentId);

      // The actual shipped guide example must work in the restricted query channel.
      const guide = await readFile(new URL(`../skills/wps-api/references/${{ et: 'spreadsheet', wps: 'writer', wpp: 'presentation' }[host]}.md`, import.meta.url), 'utf8');
      const example = /```js\r?\n([\s\S]*?)\r?\n```/.exec(guide)?.[1]; assert.ok(example);
      const inspected = await invoke('wps_run_readonly_code', { documentId: sourceDoc.documentId, code: example });
      if (host === 'et') assert.equal(inspected.result.values, first.value);
      if (host === 'wps') assert.equal(inspected.result.text, first.value);
      if (host === 'wpp') assert.equal(inspected.result.shapes[0].name, '内容');
      assert.equal((await invoke('wps_run_readonly_code', { documentId: sourceDoc.documentId, code: `return { path: wpsDocument.FullName, value: ${expression}, version: Application.Version };` })).result.path, first.FullName);

      const variable = await invoke('wps_create_variable', { variableName: 'bound ' + type, sourceDocumentId: sourceDoc.documentId, code: `return ${expression};` });
      const rendered = await invoke('wps_create_render', { variableId: variable.variableId, targetDocumentId: targetDoc.documentId,
        code: `${expression} = variable.value; return { path: wpsDocument.FullName, value: ${expression} };` });
      const run = () => invoke('wps_run_render', { variableId: variable.variableId, renderId: rendered.renderId });
      assert.equal((await invoke('wps_run_transform', { variableId: variable.variableId })).value, first.value);
      assert.equal((await run()).renders[0].result.path, second.FullName);
      assert.equal(second.value, first.value);
      assert.equal(decoy.value, host === 'et' ? 999 : '另一个活动文件');
      assert.equal(app[activeKey], decoy); assert.equal(app.Selection, selection);

      // Later recomputation resolves the source again, even after the active object changes.
      first.value = host === 'et' ? 240 : '新源内容'; app[activeKey] = second;
      assert.equal((await invoke('wps_run_transform', { variableId: variable.variableId })).value, first.value);
      app[activeKey] = first; await run();
      assert.equal(second.value, first.value); assert.equal(app[activeKey], first);
      // Existing Application-based code retains its original semantics.
      assert.equal((await invoke('wps_run_readonly_code', { documentId: targetDoc.documentId, code: `return Application.${activeKey}.FullName;` })).result, first.FullName);

      // A stale registry entry must not fall back to a same-name active document or execute code.
      docs.splice(docs.indexOf(second), 1);
      const before = first.value;
      const failed = await client.callTool({ name: 'wps_run_render', arguments: { variableId: variable.variableId, renderId: rendered.renderId } });
      const missing = JSON.parse(failed.content[0].text);
      assert.equal(missing.success, false);
      assert.equal(missing.renders[0].error.code, 'RENDER_EXECUTION_ERROR');
      assert.match(missing.renders[0].error.message, /no longer available|已关闭/);
      assert.equal(first.value, before);
    });
  } finally {
    for (const socket of sockets) socket.close();
    if (client) await client.close(); await h.close();
  }
});
