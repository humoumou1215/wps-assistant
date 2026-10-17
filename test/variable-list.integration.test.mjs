import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

async function connect(h) {
  const client = new Client({ name: 'variable-list-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
  return client;
}
const call = async (client, name, args) => {
  const result = await client.callTool({ name, arguments: args });
  const value = JSON.parse(result.content[0].text);
  assert.equal(result.isError, undefined, JSON.stringify(value));
  return value;
};

test('listing returns summaries without code or value and executes no WPS code', { timeout: 30000 }, async () => {
  const h = await startHarness(); const client = await connect(h);
  try {
    assert.deepEqual(await call(client, 'wps_list_variables', {}), { variables: [] });

    const { variableId } = await call(client, 'wps_create_variable', {
      variableName: '销售合计', description: '周报口径', sourceDocumentId: 'doc_001', sourceRef: '销售数据!B3',
      code: 'return Application.ActiveSheet.Range("B3").Value2;',
    });
    const { renderId } = await call(client, 'wps_create_render', {
      variableId, targetDocumentId: 'doc_001', targetRef: '销售数据!D3',
      code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return true;',
    });

    const saved = (await call(client, 'wps_list_variables', {})).variables;
    assert.equal(saved.length, 1);
    assert.equal(saved[0].variableId, variableId);
    assert.equal(saved[0].name, '销售合计');
    assert.equal(saved[0].description, '周报口径');
    assert.equal(saved[0].hasValue, false, 'a saved Transform has no value until it runs');
    assert.equal(Object.hasOwn(saved[0], 'lastRunAt'), false);
    assert.equal(Object.hasOwn(saved[0], 'code'), false, 'the listing never returns Transform code');
    assert.equal(Object.hasOwn(saved[0], 'value'), false, 'the listing never returns the value');
    assert.equal(saved[0].sourceDocumentName, 'UI验证.xlsx');
    assert.equal(saved[0].sourceConnected, true);
    assert.equal(saved[0].renderCount, 1);
    assert.equal(Object.hasOwn(saved[0].renders[0], 'code'), false, 'the listing never returns Render code');
    assert.deepEqual(saved[0].renders[0], {
      renderId, targetDocumentId: 'doc_001', targetDocumentName: 'UI验证.xlsx', targetConnected: true, targetRef: '销售数据!D3',
    });

    let rpcCount = 0; const onMessage = raw => { if (JSON.parse(raw).type === 'request') rpcCount++; };
    h.socket.on('message', onMessage);
    assert.deepEqual((await call(client, 'wps_list_variables', {})).variables, saved);
    h.socket.off('message', onMessage);
    assert.equal(rpcCount, 0, 'listing executes no WPS code');

    await call(client, 'wps_run_transform', { variableId });
    await call(client, 'wps_run_render', { variableId, renderId });
    const ran = (await call(client, 'wps_list_variables', {})).variables[0];
    assert.equal(ran.hasValue, true);
    assert.ok(ran.lastRunAt, 'a Transform run time is summarized after the value exists');
    assert.equal(ran.sourceRef, '销售数据!B3');
    assert.equal(ran.renders.length, 1);
  } finally { await client.close(); await h.close(); }
});

test('listing keeps disconnected definitions visible and preserves creation order', { timeout: 30000 }, async () => {
  const h = await startHarness(); const client = await connect(h);
  try {
    const first = await call(client, 'wps_create_variable', { variableName: '第一', sourceDocumentId: 'doc_001', code: 'return 1;' });
    const second = await call(client, 'wps_create_variable', { variableName: '第二', sourceDocumentId: 'doc_001', code: 'return 2;' });
    const bare = (await call(client, 'wps_list_variables', {})).variables[1];
    assert.equal(Object.hasOwn(bare, 'description'), false, 'an unset description stays absent');
    assert.equal(Object.hasOwn(bare, 'sourceRef'), false, 'an unset sourceRef stays absent');
    assert.deepEqual(bare.renders, []);

    h.socket.close();
    for (let i = 0; i < 100; i++) {
      if (!(await (await fetch(h.base + '/api/state')).json()).documents.some(d => d.connected)) break;
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const list = (await call(client, 'wps_list_variables', {})).variables;
    assert.deepEqual(list.map(v => v.variableId), [first.variableId, second.variableId], 'creation order is stable');
    for (const variable of list) {
      assert.equal(variable.sourceConnected, false, 'a disconnected source stays listed');
      assert.equal(variable.sourceDocumentName, 'UI验证.xlsx', 'offline metadata still supplies the document name');
    }
  } finally { await client.close(); await h.close(); }
});
