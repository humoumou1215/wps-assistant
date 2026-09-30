import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLogger } from '../dist/src/logger.js';

async function fixture(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'wps-logger-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const lines = [];
  const log = createLogger({ directory, stderr: line => lines.push(line), ...options });
  return { log, directory, lines };
}

test('logger filters levels, writes JSONL to stderr/file and protects reserved fields', async t => {
  const { log, lines } = await fixture(t, { level: 'warn' });
  log.debug('hidden.debug'); log.info('hidden.info');
  log.warn('visible.warn', { level: 'debug', event: 'spoofed', pid: 0, durationMs: 12 });
  log.error('visible.error', { error: new Error('failure') });
  await log.flush();
  const records = lines.map(JSON.parse);
  assert.equal(records.length, 2);
  assert.equal(records[0].event, 'visible.warn');
  assert.equal(records[0].level, 'warn');
  assert.equal(records[0].pid, process.pid);
  assert.match(records[0].time, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(records[1].error.message, 'failure');
  assert.equal(await readFile(log.file, 'utf8'), lines.join(''));
  if (process.platform !== 'win32') assert.equal((await stat(log.file)).mode & 0o777, 0o600);
});

test('logger redacts nested content, saved and scoped secrets, errors and authorization', async t => {
  const { log, lines } = await fixture(t);
  log.setSecrets(['saved-key', 'custom-header-secret']);
  const cycle = {}; cycle.self = cycle;
  await log.withSecrets(['unsaved-key'], async () => {
    log.error('test.redaction', {
      error: new Error('saved-key unsaved-key custom-header-secret Bearer other-secret'),
      nested: { apiKey: 'unknown-key', headers: { X: 'private-header' }, code: 'private-code', result: 'private-result', value: 'private-value' },
      args: { message: 'private-prompt' }, body: 'private-body', cycle,
    });
  });
  await log.flush();
  const raw = lines.join('') + await readFile(log.file, 'utf8');
  for (const value of ['saved-key', 'unsaved-key', 'custom-header-secret', 'other-secret', 'unknown-key', 'private-header', 'private-code', 'private-result', 'private-value', 'private-prompt', 'private-body']) assert.ok(!raw.includes(value), value);
  assert.match(raw, /REDACTED/);
  assert.equal(JSON.parse(lines[0]).cycle.self, '[Circular]');
});

test('async contexts correlate nested calls and isolate concurrent requests and secrets', async t => {
  const { log, lines } = await fixture(t);
  await Promise.all(['one', 'two'].map(id => log.withContext({ requestId: id }, () =>
    log.withSecrets([`secret-${id}`], async () => {
      await new Promise(resolve => setImmediate(resolve));
      await log.withContext({ toolCallId: `tool-${id}` }, async () => {
        await Promise.resolve();
        log.info('nested', { detail: `secret-${id}` });
      });
    }))));
  log.info('outside');
  await log.flush();
  const records = lines.map(JSON.parse);
  for (const id of ['one', 'two']) {
    const record = records.find(r => r.requestId === id);
    assert.equal(record.toolCallId, `tool-${id}`);
    assert.equal(record.detail, '[REDACTED]');
  }
  assert.equal(records.at(-1).requestId, undefined);
});

test('rotation bounds file count and size, preserves newest records and handles existing files', async t => {
  const { log, directory } = await fixture(t, { maxBytes: 1024, maxFiles: 3 });
  await writeFile(log.file, JSON.stringify({ event: 'old', padding: 'x'.repeat(1200) }) + '\n');
  for (let i = 0; i < 30; i++) log.info('rotation', { sequence: i, detail: 'x'.repeat(180) });
  log.info('oversized', { detail: 'x'.repeat(5000) });
  await log.flush();
  const files = await readdir(directory);
  assert.deepEqual(files.sort(), ['wps-mcp.log', 'wps-mcp.log.1', 'wps-mcp.log.2']);
  for (const file of files) {
    const raw = await readFile(join(directory, file), 'utf8');
    assert.ok(Buffer.byteLength(raw) <= 1024);
    for (const line of raw.trim().split('\n')) JSON.parse(line);
  }
  const newest = (await readFile(log.file, 'utf8')).trim().split('\n').map(JSON.parse).at(-1);
  assert.equal(newest.event, 'oversized'); assert.equal(newest.truncated, true);
});

test('file failures and queue overflow keep stderr usable without rejecting flush', async t => {
  const { directory, lines } = await fixture(t);
  const blocked = join(directory, 'blocked'); await writeFile(blocked, 'not a directory');
  const log = createLogger({ directory: blocked, stderr: line => lines.push(line) });
  log.info('before'); await log.flush(); log.info('after'); await log.flush();
  assert.equal(lines.map(JSON.parse).filter(r => r.event === 'logger.file_unavailable').length, 1);
  assert.ok(lines.map(JSON.parse).some(r => r.event === 'after'));
  const bounded = createLogger({ directory, maxPending: 1, stderr: line => lines.push(line) });
  for (let i = 0; i < 20; i++) bounded.info('burst');
  await bounded.flush();
  assert.equal(lines.map(JSON.parse).filter(r => r.event === 'logger.queue_full').length, 1);
  assert.equal((await readFile(bounded.file, 'utf8')).trim().split('\n').length, 1);
});

test('silent and stderr-only modes do not create log files', async t => {
  const { log, directory, lines } = await fixture(t, { level: 'silent' });
  log.error('hidden'); await log.flush();
  assert.deepEqual(lines, []); assert.deepEqual(await readdir(directory), []);
  const stderrOnly = createLogger({ directory, file: false, stderr: line => lines.push(line) });
  stderrOnly.info('visible'); await stderrOnly.flush();
  assert.equal(lines.length, 1); assert.deepEqual(await readdir(directory), []);
});

test('a reduced retention limit cleans only numbered archives on restart', async t => {
  const { directory, log } = await fixture(t);
  for (const name of ['wps-mcp.log.1', 'wps-mcp.log.2', 'wps-mcp.log.4', 'bridge.stderr.log']) await writeFile(join(directory, name), 'previous log\n');
  const reduced = createLogger({ directory, maxFiles: 1, stderr: () => {} });
  reduced.info('restarted'); await reduced.flush();
  assert.deepEqual((await readdir(directory)).sort(), ['bridge.stderr.log', 'wps-mcp.log']);
  assert.match(await readFile(log.file, 'utf8'), /restarted/);
});
