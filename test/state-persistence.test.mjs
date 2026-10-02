import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('state replacement retries Windows reader locks, stays busy until commit and recovers after failure', async t => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'wps-state-replace-'));
  const previousDir = process.env.WPS_MCP_DATA_DIR, previousLevel = process.env.WPS_MCP_LOG_LEVEL;
  const platform = Object.getOwnPropertyDescriptor(process, 'platform');
  const originalRename = fs.rename;
  let release, mode = 'retry', attempts = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const file = join(dir, 'state.json');
  try {
    process.env.WPS_MCP_DATA_DIR = dir; process.env.WPS_MCP_LOG_LEVEL = 'silent';
    const tools = await import('../dist/src/tools.js');
    await fs.writeFile(file, JSON.stringify({ variables: [], counters: {}, documentIds: {}, documentMetadata: {} }));
    await tools.loadState();
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    t.mock.method(fs, 'rename', async (...args) => {
      attempts++;
      if (mode === 'retry' && attempts <= 2) throw Object.assign(new Error('reader still open'), { code: 'EPERM' });
      if (mode === 'retry') await gate;
      if (mode === 'fail') throw Object.assign(new Error('disk failed'), { code: 'EIO' });
      return originalRename(...args);
    });
    syncBuiltinESMExports();
    const connection = { id: 'state-test', documents: new Map(), socket: {} };
    const document = { documentKey: 'state-doc', name: '保存测试.xlsx', type: 'spreadsheet' };
    const waitFor = async ready => {
      const deadline = Date.now() + 5000;
      while (!ready() && Date.now() < deadline) await new Promise(r => setTimeout(r, 10));
      assert.ok(ready(), 'persistence must settle');
    };
    const id = tools.registerDocument(connection, document);
    await waitFor(() => attempts === 3);
    assert.equal(tools.isToolBusy(), true);
    assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')).documentMetadata, {}, 'old state stays intact before replacement');
    release(); await waitFor(() => !tools.isToolBusy());
    assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).documentMetadata[id].name, document.name);
    mode = 'fail'; attempts = 0;
    tools.registerDocument(connection, { ...document, name: '未保存.xlsx' });
    await waitFor(() => !tools.isToolBusy());
    assert.equal(attempts, 1, 'permanent failures are not retried');
    assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).documentMetadata[id].name, document.name);
    assert.equal((await fs.readdir(dir)).some(name => name.endsWith('.tmp')), false);
    mode = 'success';
    tools.registerDocument(connection, { ...document, name: '已恢复.xlsx' });
    await waitFor(() => !tools.isToolBusy());
    assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).documentMetadata[id].name, '已恢复.xlsx');
  } finally {
    release(); t.mock.restoreAll(); syncBuiltinESMExports(); Object.defineProperty(process, 'platform', platform);
    if (previousDir === undefined) delete process.env.WPS_MCP_DATA_DIR; else process.env.WPS_MCP_DATA_DIR = previousDir;
    if (previousLevel === undefined) delete process.env.WPS_MCP_LOG_LEVEL; else process.env.WPS_MCP_LOG_LEVEL = previousLevel;
    await fs.rm(dir, { recursive: true, force: true });
  }
});
