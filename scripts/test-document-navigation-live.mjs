/** Exercise the actual Add-in navigation handler against already-open WPS
 * documents. Creates a temporary Variable/Render, changes selection only, then
 * deletes the temporary rules. Usage: node scripts/test-document-navigation-live.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { parseDocumentRefs } from '../dist/src/location.js';
const base = process.env.WPS_MCP_URL || 'http://127.0.0.1:18766';
const client = new Client({ name: 'document-navigation-live', version: '1' });
await client.connect(new StreamableHTTPClientTransport(new URL(base + '/mcp')));
let variableId;
const invoke = async (name, args) => {
  const r = await client.callTool({ name, arguments: args });
  assert.ok(!r.isError, r.content[0].text);
  const value = JSON.parse(r.content[0].text); assert.notEqual(value.success, false, JSON.stringify(value)); return value;
};
try {
  const { documents } = await invoke('wps_list_documents', {});
  const targets = [
    { name: '项目交付周会-测试版.pptx', type: 'presentation', host: 'wpp', refs: ['第2页 项目跟进表', 'SlideID:258!ShapeID:2+SlideID:258!ShapeID:3+SlideID:258!ShapeID:4', '第4页 重点关注文本框', '第4页 下周工作与资源协调文本框'] },
    { name: '项目交付周报-测试版.docx', type: 'writer', host: 'wps', refs: ['本周概况段落+团队进展表格', '本周变化段落', '关注事项段落+重点项目跟踪表格', '下周安排段落', 'Paragraph:4', 'Table:1', 'Range:0:7'] },
  ];
  for (const target of targets) {
    const doc = documents.find(d => d.name === target.name && d.type === target.type); assert.ok(doc, 'Open ' + target.name);
    target.doc = await invoke('wps_get_document', { documentId: doc.documentId });
  }
  ({ variableId } = await invoke('wps_create_variable', { variableName: '定位实机验证（临时）', sourceDocumentId: targets[0].doc.documentId, code: 'return true;' }));
  await invoke('wps_run_transform', { variableId });
  const source = await readFile(new URL('../addon/main.js', import.meta.url), 'utf8');
  for (const target of targets) {
    const locations = target.refs.flatMap(ref => parseDocumentRefs(target.type, ref));
    // Shadow browser facilities locally; retain the exact production source and
    // real Application object. No real WebSocket or timer survives this Render.
    const code = `
const messages = [], listeners = {};
class Socket {
  constructor() { this.readyState = 1; }
  addEventListener(name, fn) { listeners[name] = fn; }
  send(text) { messages.push(JSON.parse(text)); }
}
Socket.OPEN = 1;
const win = { wps: { ${target.host === 'wpp' ? 'WppApplication' : 'WpsApplication'}: () => Application } };
const loc = { href: "http://127.0.0.1:18766/addins/${target.host}/", pathname: "/addins/${target.host}/" };
(function(window, location, WebSocket, document, setInterval, setTimeout, clearTimeout) {
${source}
})(win, loc, Socket, undefined, () => {}, () => {}, () => {});
const results = [];
for (const location of ${JSON.stringify(locations)}) {
  const id = "live-" + results.length;
  await listeners.message({data: JSON.stringify({type:"request",id,method:"navigate",documentKey:${JSON.stringify(target.doc.path)},location})});
  results.push(messages.find(m => m.type === "response" && m.id === id));
}
${target.type === 'writer' ? `Application.ActiveDocument.Range(${target.doc.selection.start}, ${target.doc.selection.end}).Select();` : `Application.ActiveWindow.View.GotoSlide(${target.doc.activeSlide});`}
return {results};`;
    const r = await invoke('wps_create_render', { variableId, targetDocumentId: target.doc.documentId, description: '临时验证定位：仅改变选区，结束后恢复原位置', code });
    const run = await invoke('wps_run_render', { variableId, renderId: r.renderId });
    const results = run.renders[0].result.results;
    for (const result of results) assert.equal(result.payload.success, true, JSON.stringify(result));
    console.log(JSON.stringify({ name: target.name, results: results.map(r => r.payload.result) }, null, 2));
  }
} finally {
  if (variableId) {
    const response = await fetch(base + '/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variableId }) });
    assert.ok(response.ok, await response.text());
  }
  await client.close();
}
