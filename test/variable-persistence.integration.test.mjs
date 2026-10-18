import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { startHarness } from './helpers/ui-harness.mjs';

test('failed variable creation, Render creation and recalculation never publish or leak into later saves', { timeout: 30000 }, async () => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'wps-variable-persistence-'));
  let h, client;
  const connect = async () => {
    h = await startHarness({ dataDir: dir });
    client = new Client({ name: 'variable-persistence-test', version: '1' });
    await client.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
  };
  const call = async (name, args = {}, expectedError = false) => {
    const result = await client.callTool({ name, arguments: args });
    assert.equal(!!result.isError, expectedError, result.content[0].text);
    return JSON.parse(result.content[0].text);
  };
  const file = join(dir, 'state.json');
  const disk = async () => JSON.parse(await fs.readFile(file, 'utf8'));
  const failSave = async action => {
    const backup = join(dir, 'state.backup');
    const before = await fs.readFile(file, 'utf8');
    await fs.rename(file, backup);
    await fs.mkdir(file);
    try { await action(); }
    finally { await fs.rm(file, { recursive: true }); await fs.rename(backup, file); }
    assert.equal(await fs.readFile(file, 'utf8'), before);
    assert.equal((await fs.readdir(dir)).some(name => name.endsWith('.tmp')), false);
  };
  try {
    await connect();
    const createArgs = { variableName: 'baseline', sourceDocumentId: 'doc_001', code: 'return Application.ActiveSheet.Range("B3").Value2;' };
    const { variableId } = await call('wps_create_variable', createArgs);
    const get = () => call('wps_get_variable', { variableId });
    const original = await get();
    const failedArgs = { ...createArgs, variableName: 'retry' };
    const renderArgs = { variableId, targetDocumentId: 'doc_001', code: 'return true;' };
    await failSave(async () => {
      await call('wps_create_variable', failedArgs, true);
      assert.deepEqual((await call('wps_list_variables')).variables.map(v => v.variableId), [variableId]);
      await call('wps_create_render', renderArgs, true);
      assert.deepEqual(await get(), original);
      await call('wps_run_transform', { variableId }, true);
      assert.deepEqual(await get(), original, 'an initial failed calculation must leave hasValue false and lastRun absent');
    });
    // An unrelated successful write must not pick up any of the failed drafts.
    await call('wps_update_variable', { variableId, description: 'saved after failures' });
    let saved = await disk();
    assert.equal(saved.variables.length, 1);
    assert.deepEqual(saved.variables[0].renders, []);
    assert.equal(saved.variables[0].hasValue, undefined);
    assert.deepEqual(saved.counters, { doc: 1, var: 1, transform: 1 });

    const retry = await call('wps_create_variable', failedArgs);
    assert.equal(retry.variableId, 'var_002');
    assert.equal(retry.transformId, 'transform_002');
    const render = await call('wps_create_render', renderArgs);
    assert.equal(render.renderId, 'render_001');
    await call('wps_run_transform', { variableId });
    const calculated = await get();
    assert.equal(calculated.value, 120);
    h.appState.value = 999;
    await failSave(async () => {
      await call('wps_run_transform', { variableId }, true);
      assert.deepEqual(await get(), calculated, 'a failed recalculation must preserve the previous value and lastRun');
    });
    await call('wps_update_variable', { variableId: retry.variableId, description: 'another successful save' });
    saved = await disk();
    assert.equal(saved.variables.filter(v => v.name === 'retry').length, 1);
    assert.equal(saved.variables[0].value, 120);
    assert.deepEqual(saved.variables[0].transform.lastRun, calculated.transform.lastRun);
    assert.equal(saved.variables[0].renders.length, 1);
    assert.deepEqual(saved.counters, { doc: 1, var: 2, transform: 2, render: 1 });

    await client.close(); await h.close();
    await connect();
    assert.deepEqual(await get(), calculated, 'a fresh server must restore exactly the last committed definition and value');
    const next = await call('wps_create_variable', { ...createArgs, variableName: 'after restart' });
    assert.equal(next.variableId, 'var_003');
    assert.equal(next.transformId, 'transform_003');
  } finally {
    if (client) await client.close();
    if (h) await h.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('queries see only committed drafts while saving and concurrent document IDs survive publication', { timeout: 15000 }, async t => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'wps-variable-commit-'));
  const previousDir = process.env.WPS_MCP_DATA_DIR, previousLevel = process.env.WPS_MCP_LOG_LEVEL;
  const originalRename = fs.rename;
  let gate;
  try {
    process.env.WPS_MCP_DATA_DIR = dir; process.env.WPS_MCP_LOG_LEVEL = 'silent';
    const tools = await import('../dist/src/tools.js');
    await tools.loadState();
    const file = join(dir, 'state.json');
    t.mock.method(fs, 'rename', async (...args) => {
      if (gate && args[1] === file) { const current = gate; gate = undefined; current.entered.resolve(); await current.release.promise; }
      return originalRename(...args);
    });
    syncBuiltinESMExports();
    const connection = { id: 'commit-test', documents: new Map(), socket: {
      readyState: 1,
      send(raw, callback) {
        const { id } = JSON.parse(raw);
        queueMicrotask(() => {
          const pending = tools.pending.get(id);
          clearTimeout(pending.timer); tools.pending.delete(id);
          pending.resolve({ success: true, result: 42 });
        });
        callback?.();
      },
    } };
    tools.connections.set(connection.id, connection);
    const register = name => tools.registerDocument(connection, { documentKey: name, name, type: 'spreadsheet' });
    const idle = async () => {
      const deadline = Date.now() + 5000;
      while (tools.isToolBusy() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
      assert.equal(tools.isToolBusy(), false);
    };
    const documentId = register('first.xlsx'); await idle();
    const hold = async (action, inspect) => {
      const current = { entered: Promise.withResolvers(), release: Promise.withResolvers() };
      gate = current;
      const result = action();
      try { await current.entered.promise; await inspect(); }
      finally { current.release.resolve(); }
      const response = await result;
      assert.ok(!response.isError, response.content[0].text);
      await idle();
      return JSON.parse(response.content[0].text);
    };
    const created = await hold(() => tools.callTool('wps_create_variable', {
      variableName: 'pending', sourceDocumentId: documentId, code: 'return 1;',
    }), async () => {
      const listed = await tools.callTool('wps_list_variables', {});
      assert.deepEqual(JSON.parse(listed.content[0].text).variables, []);
      assert.deepEqual(tools.getState().variables, []);
      assert.equal(register('second.xlsx'), 'doc_002');
      assert.equal(register('third.xlsx'), 'doc_003');
    });
    assert.equal(register('fourth.xlsx'), 'doc_004'); await idle();
    await hold(() => tools.callTool('wps_create_render', {
      variableId: created.variableId, targetDocumentId: documentId, code: 'return true;',
    }), async () => {
      const definition = await tools.callTool('wps_get_variable', { variableId: created.variableId });
      assert.deepEqual(JSON.parse(definition.content[0].text).renders, []);
      assert.equal((await fs.readFile(file, 'utf8')).includes('render_001'), false);
    });
    await hold(() => tools.callTool('wps_run_transform', { variableId: created.variableId }), async () => {
      const definition = JSON.parse((await tools.callTool('wps_get_variable', { variableId: created.variableId })).content[0].text);
      assert.equal(definition.hasValue, false);
      assert.equal(definition.value, undefined);
      assert.equal(definition.transform.lastRun, undefined);
      assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).variables[0].value, undefined);
    });
    const saved = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.deepEqual(saved.counters, { doc: 4, var: 1, transform: 1, render: 1 });
    assert.equal(saved.variables.length, 1);
    assert.equal(saved.variables[0].renders.length, 1);
    assert.equal(saved.variables[0].value, 42);
    assert.equal(new Set(Object.values(saved.documentIds)).size, 4);
  } finally {
    gate?.release.resolve();
    t.mock.restoreAll(); syncBuiltinESMExports();
    if (previousDir === undefined) delete process.env.WPS_MCP_DATA_DIR; else process.env.WPS_MCP_DATA_DIR = previousDir;
    if (previousLevel === undefined) delete process.env.WPS_MCP_LOG_LEVEL; else process.env.WPS_MCP_LOG_LEVEL = previousLevel;
    await fs.rm(dir, { recursive: true, force: true });
  }
});
