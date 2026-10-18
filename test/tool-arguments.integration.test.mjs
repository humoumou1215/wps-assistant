import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

const invalidSelections = renderId => [
  { renderId: '' },
  { renderID: renderId },
  { renderId, renderID: renderId },
  { renderId: null },
  { renderId: 0 },
];
const call = async (client, name, args) => {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, result.content[0].text);
  return JSON.parse(result.content[0].text);
};

test('MCP rejects invalid Render selections before RPC and preserves explicit/all execution', { timeout: 30000 }, async () => {
  const h = await startHarness();
  const client = new Client({ name: 'tool-arguments-test', version: '1' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
    const { variableId } = await call(client, 'wps_create_variable', {
      variableName: '参数校验', sourceDocumentId: 'doc_001', code: 'return 1;',
    });
    await call(client, 'wps_run_transform', { variableId });
    const renderIds = [];
    for (let i = 0; i < 2; i++) {
      const { renderId } = await call(client, 'wps_create_render', {
        variableId, targetDocumentId: 'doc_001', code: 'return true;',
      });
      renderIds.push(renderId);
    }
    const requests = [];
    h.socket.on('message', raw => {
      const message = JSON.parse(raw);
      if (message.type === 'request') requests.push(message);
    });
    const before = await readFile(join(h.dir, 'state.json'), 'utf8');
    for (const args of invalidSelections(renderIds[0])) {
      const result = await client.callTool({ name: 'wps_run_render', arguments: { variableId, ...args } });
      assert.equal(result.isError, true, JSON.stringify(args));
      assert.match(result.content[0].text, /-32602/);
      const action = await fetch(h.base + '/api/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'render', variableId, ...args }),
      });
      assert.equal(action.status, 400, 'the UI action endpoint rejects the same invalid selections');
    }
    // Unknown optional fields must not silently allow a partial update either.
    const update = await client.callTool({ name: 'wps_update_variable', arguments: {
      variableId, variableName: '不应保存', sourceDocumentID: 'doc_001',
    } });
    assert.equal(update.isError, true);
    const list = await client.callTool({ name: 'wps_list_documents', arguments: { unexpected: true } });
    assert.equal(list.isError, true, 'zero-argument tools also reject unknown fields');
    assert.equal(requests.length, 0, 'invalid arguments never reach an Add-in');
    assert.equal(await readFile(join(h.dir, 'state.json'), 'utf8'), before, 'invalid arguments never alter saved definitions or lastRun');

    for (const renderId of ['render_missing', ' ']) {
      const result = await client.callTool({ name: 'wps_run_render', arguments: { variableId, renderId } });
      assert.equal(result.isError, true);
      assert.equal(JSON.parse(result.content[0].text).error.code, 'RENDER_NOT_FOUND');
    }
    assert.equal(requests.length, 0);
    const one = await call(client, 'wps_run_render', { variableId, renderId: renderIds[0] });
    assert.deepEqual(one.renders.map(r => r.renderId), [renderIds[0]]);
    assert.equal(requests.length, 1);
    const all = await call(client, 'wps_run_render', { variableId });
    assert.deepEqual(all.renders.map(r => r.renderId), renderIds);
    assert.equal(requests.length, 3);
    assert.ok(requests.every(r => r.method === 'execute' && r.mode === 'render'));

    const { tools } = await client.listTools();
    const agent = await (await fetch(h.base + '/api/agent')).json();
    for (const tool of tools) {
      assert.equal(tool.inputSchema.additionalProperties, false, tool.name);
      assert.equal(agent.tools.find(t => t.name === tool.name).parameters.additionalProperties, false, tool.name);
    }
    assert.equal(tools.find(t => t.name === 'wps_run_render').inputSchema.properties.renderId.minLength, 1);
  } finally { await client.close(); await h.close(); }
});

test('shared tool invocation rejects unknown arguments and empty Render IDs before handling', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'wps-tool-arguments-'));
  const previousDir = process.env.WPS_MCP_DATA_DIR, previousLevel = process.env.WPS_MCP_LOG_LEVEL;
  try {
    process.env.WPS_MCP_DATA_DIR = dir;
    process.env.WPS_MCP_LOG_LEVEL = 'silent';
    const tools = await import('../dist/src/tools.js');
    await writeFile(join(dir, 'state.json'), JSON.stringify({ variables: [{
      variableId: 'var_001', name: '参数校验', hasValue: true, value: 1,
      transform: { transformId: 'transform_001', sourceDocumentId: 'doc_001', code: 'return 1;' },
      renders: ['render_001', 'render_002'].map(renderId => ({ renderId, targetDocumentId: 'doc_001', code: 'return true;' })),
    }] }));
    await tools.loadState();
    const before = JSON.stringify(tools.getState());
    for (const args of invalidSelections('render_001')) {
      const result = await tools.callTool('wps_run_render', { variableId: 'var_001', ...args });
      assert.equal(result.isError, true, JSON.stringify(args));
      assert.equal(JSON.parse(result.content[0].text).error.code, 'INVALID_REQUEST');
    }
    const result = await tools.callTool('wps_list_documents', { unexpected: true });
    assert.equal(result.isError, true);
    assert.equal(JSON.parse(result.content[0].text).error.code, 'INVALID_REQUEST');
    assert.equal(JSON.stringify(tools.getState()), before);
  } finally {
    if (previousDir === undefined) delete process.env.WPS_MCP_DATA_DIR; else process.env.WPS_MCP_DATA_DIR = previousDir;
    if (previousLevel === undefined) delete process.env.WPS_MCP_LOG_LEVEL; else process.env.WPS_MCP_LOG_LEVEL = previousLevel;
    await rm(dir, { recursive: true, force: true });
  }
});

test('the embedded Agent rejects original invalid selections before SDK coercion can widen execution', { timeout: 30000 }, async () => {
  const selections = invalidSelections('render_001');
  const h = await startHarness({ toolSteps: selections.map(args => ['wps_run_render', { variableId: 'var_001', ...args }]) });
  const client = new Client({ name: 'agent-arguments-test', version: '1' });
  const post = (path, body) => fetch(h.base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
    const { variableId } = await call(client, 'wps_create_variable', {
      variableName: 'Agent 参数校验', sourceDocumentId: 'doc_001', code: 'return 1;',
    });
    await call(client, 'wps_run_transform', { variableId });
    for (let i = 0; i < 2; i++) await call(client, 'wps_create_render', {
      variableId, targetDocumentId: 'doc_001', code: 'return true;',
    });
    let rpcCount = 0;
    h.socket.on('message', raw => { if (JSON.parse(raw).type === 'request') rpcCount++; });
    const before = await readFile(join(h.dir, 'state.json'), 'utf8');
    assert.equal((await post('/api/config', h.cfg)).status, 200);
    const response = await post('/api/chat', { message: '参数校验回归', refs: [] });
    const stream = await response.text();
    assert.match(stream, /event: turn.end/);
    assert.equal(h.requests.length, selections.length + 1, 'every invalid call returns control to the model');
    const results = h.requests.at(-1).body.messages.filter(message => message.role === 'tool');
    assert.equal(results.length, selections.length);
    assert.ok(results.every(result => /Validation failed|INVALID_REQUEST/.test(result.content)));
    assert.equal(rpcCount, 0, 'even null or coerced arguments must not reach an Add-in');
    assert.equal(await readFile(join(h.dir, 'state.json'), 'utf8'), before);
  } finally { await client.close(); await h.close(); }
});
