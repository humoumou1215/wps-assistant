import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('RPC timeouts, send failures and disconnects log correlated failures and clear pending requests', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'wps-rpc-log-'));
  process.env.WPS_MCP_DATA_DIR = directory;
  process.env.WPS_MCP_LOG_DIR = join(directory, 'logs');
  const { callTool, connections, documents, pending } = await import('../dist/src/tools.js');
  const { logger } = await import('../dist/src/logger.js');
  t.after(async () => { t.mock.timers.reset(); await logger.flush(); await rm(directory, { recursive: true, force: true }); });
  const socket = { readyState: 1, send() {} };
  connections.set('rpc-fixture', { id: 'rpc-fixture', socket, documents: new Map() });
  documents.set('doc_001', { documentId: 'doc_001', connectionId: 'rpc-fixture', documentKey: 'private-document-key', name: 'private-document-name', connected: true, type: 'spreadsheet' });
  const execute = () => logger.withContext({ requestId: 'rpc-request' }, () => callTool('wps.exec', { documentId: 'doc_001', code: 'return 123;' }));

  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.now() });
  const timeout = execute(); assert.equal(pending.size, 1);
  t.mock.timers.tick(45_000);
  const timedOut = await timeout;
  assert.equal(timedOut.isError, true);
  assert.match(timedOut.content[0].text, /timed out/);
  assert.equal(pending.size, 0);
  t.mock.timers.reset();

  socket.send = (_message, callback) => callback(new Error('private-send-error'));
  const failedSend = await execute(); assert.equal(failedSend.isError, true); assert.equal(pending.size, 0);
  socket.send = () => { throw new Error('private-sync-send-error'); };
  const failedSync = await execute(); assert.equal(failedSync.isError, true); assert.equal(pending.size, 0);
  socket.send = () => {};
  const disconnected = execute(); assert.equal(pending.size, 1);
  pending.values().next().value.reject(new Error('private-disconnect-error'));
  assert.equal((await disconnected).isError, true); assert.equal(pending.size, 0);

  await logger.flush();
  const raw = await readFile(logger.file, 'utf8');
  const records = raw.trim().split('\n').map(JSON.parse);
  const failures = records.filter(r => r.event === 'rpc.failed');
  assert.equal(failures.length, 4);
  assert.ok(failures.every(r => r.rpcId && r.toolCallId && r.requestId === 'rpc-request' && r.connectionId === 'rpc-fixture'));
  assert.equal(failures[0].timeout, true); assert.equal(failures[0].durationMs, 45_000);
  assert.ok(records.filter(r => r.event === 'tool.end').every(r => !r.success));
  for (const privateValue of ['private-document-key', 'private-document-name', 'private-send-error', 'private-sync-send-error', 'private-disconnect-error', 'return 123;']) assert.ok(!raw.includes(privateValue), privateValue);
});
