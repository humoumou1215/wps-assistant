// Disposable local fixture for manual browser acceptance. No production files or real model.
import { startHarness } from './ui-harness.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const h = await startHarness();
const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
await post('/api/config', { ...h.cfg, model: { ...h.cfg.model, reasoning: true }, compat: { thinkingFormat: 'deepseek', maxTokensField: '' }, thinkingLevel: 'low' });
const client = new Client({ name: 'ui-browser-fixture', version: '1' });
await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
const call = async (name, args) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);
const table = await call('transform.create', { variableName: '部门销售额', description: '各部门销售额汇总，用于周报明细', sourceDocumentId: 'doc_001', sourceRef: '销售数据!A1:B13', code: 'return [["部门","金额"],["华东",320450],["华南",250000],["华北",200000],["西南",90000],["西北",60000]];' });
await call('variable.transform', { variableId: table.variableId });
const scalar = await call('transform.create', { variableName: '转化率', description: '原始数值，不猜测百分比格式', sourceDocumentId: 'doc_001', sourceRef: '销售数据!F2:F13', code: 'return 0.069;' });
await call('variable.transform', { variableId: scalar.variableId });
console.log(JSON.stringify({ base: h.base, modelPort: h.modelPort, dir: h.dir }));
process.stdin.setEncoding('utf8');
process.stdin.on('data', async data => {
  if (data.trim() === 'partial') {
    const state = await (await fetch(h.base + '/api/state')).json(), variable = state.variables.find(v => v.renders.length);
    if (variable) { await call('render.create', { variableId: variable.variableId, targetDocumentId: 'doc_001', description: '销售数据!E3（模拟失效目标）', code: 'throw new Error("目标不可写");' }); console.log('partial fixture ready'); }
  }
  if (data.trim() === 'close') { await client.close(); await h.close(); process.exit(0); }
});
