import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { inflate } from 'node:zlib';
import { buildSelfExtractingExe, sfxFooter, writePayload } from '../desktop/build-sfx.mjs';

const inflateAsync = promisify(inflate);
const dir = await mkdtemp(join(tmpdir(), 'wps-sfx-test-'));
test.after(() => rm(dir, { recursive: true, force: true }));

// 页脚与条目流的字节布局由 desktop/native/src/main.rs 的解压实现读取，
// 这里把它钉住，任何一侧单独改动都会先在这个测试上失败。
test('页脚布局与原生解压侧的读取方式一致', () => {
  const footer = sfxFooter('0.1.4', 1234);
  assert.equal(footer.length, 40, '页脚固定 40 字节：8 魔数 + 24 版本 + 8 长度');
  assert.equal(footer.subarray(0, 8).toString('ascii'), 'WPSMCPX1');
  assert.equal(footer.subarray(8, 32).toString('utf8').replace(/\0+$/, ''), '0.1.4', '版本按空字节补齐');
  assert.equal(footer.readBigUInt64LE(32), 1234n, '载荷长度是小端 u64');
  assert.throws(() => sfxFooter('x'.repeat(24), 1), /版本号过长/);
});

test('载荷是带 adler32 的 zlib 流，条目流可原样还原', async () => {
  const bundle = join(dir, 'payload-source');
  await mkdir(join(bundle, 'resources/app/dist'), { recursive: true });
  await writeFile(join(bundle, 'resources/portable.json'), '{"version":"0.1.4"}\n');
  await writeFile(join(bundle, 'resources/app/dist/server.js'), 'export const ok = true;\n');
  const payload = join(dir, 'payload.zlib');
  const built = await writePayload(bundle, payload);
  assert.equal(built.entries, 2);
  assert.equal(built.payloadBytes, (await stat(payload)).size);

  const bytes = await inflateAsync(await readFile(payload));
  const restored = new Map();
  let executables = 0;
  for (let at = 0; at < bytes.length;) {
    const nameLength = bytes.readUInt32LE(at); at += 4;
    const name = bytes.subarray(at, at + nameLength).toString('utf8'); at += nameLength;
    const size = Number(bytes.readBigUInt64LE(at)); at += 8;
    if (bytes.readUInt8(at) & 1) executables++; at += 1;
    restored.set(name, bytes.subarray(at, at + size).toString('utf8')); at += size;
  }
  assert.deepEqual([...restored.keys()], ['resources/app/dist/server.js', 'resources/portable.json'], '条目按路径排序，顺序稳定');
  assert.equal(restored.get('resources/portable.json'), '{"version":"0.1.4"}\n');
  assert.equal(restored.get('resources/app/dist/server.js'), 'export const ok = true;\n');
  if (process.platform !== 'win32') assert.equal(executables, 0, '普通文件不应被标成可执行');
});

test('可执行位随条目一起记录，解压侧据此恢复权限', async () => {
  const bundle = join(dir, 'executable-source');
  await mkdir(join(bundle, 'resources/runtime'), { recursive: true });
  const node = join(bundle, 'resources/runtime/node');
  await writeFile(node, '#!/bin/sh\necho node\n', { mode: 0o755 });
  await writeFile(join(bundle, 'resources/portable.json'), '{}\n');
  const payload = join(dir, 'executable.zlib');
  await writePayload(bundle, payload);
  const bytes = await inflateAsync(await readFile(payload));
  const flags = new Map();
  for (let at = 0; at < bytes.length;) {
    const nameLength = bytes.readUInt32LE(at); at += 4;
    const name = bytes.subarray(at, at + nameLength).toString('utf8'); at += nameLength;
    const size = Number(bytes.readBigUInt64LE(at)); at += 8;
    flags.set(name, bytes.readUInt8(at)); at += 1 + size;
  }
  if (process.platform !== 'win32') {
    assert.equal(flags.get('resources/runtime/node') & 1, 1, 'node 必须带可执行标志');
    assert.equal(flags.get('resources/portable.json') & 1, 0, '普通文件不应带可执行标志');
  }
});

test('单文件按托盘、载荷、页脚依次拼接，长度自洽且可执行', async () => {
  const bundle = join(dir, 'assembled-source');
  await mkdir(bundle, { recursive: true });
  await writeFile(join(bundle, 'portable.json'), '{}');
  const tray = join(dir, 'tray-binary');
  await writeFile(tray, Buffer.from('TRAY-BYTES'));
  const output = join(dir, 'wps-assistant-0.1.4-win32-x64.exe');
  const built = await buildSelfExtractingExe({ tray, bundle, version: '0.1.4', output });

  const file = await readFile(output);
  assert.equal(built.totalBytes, file.length);
  assert.equal(file.length, 10 + built.payloadBytes + 40, '托盘 + 载荷 + 页脚');
  assert.equal(file.subarray(0, 10).toString(), 'TRAY-BYTES');
  assert.equal(file.subarray(file.length - 40, file.length - 32).toString('ascii'), 'WPSMCPX1');
  assert.equal(file.readBigUInt64LE(file.length - 8), BigInt(built.payloadBytes));
  if (process.platform !== 'win32') assert.equal((await stat(output)).mode & 0o111, 0o111, '可执行位必须保留');
});
