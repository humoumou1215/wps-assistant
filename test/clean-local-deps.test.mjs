import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

test('dependency cleanup is opt-in and preserves native binaries, unrelated packages and links', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wps-clean-deps-'));
  const otherOS = process.platform === 'win32' ? 'linux' : 'win32';
  const scopes = ['node_modules/@esbuild', 'node_modules/@earendil-works/pi-coding-agent/node_modules/@esbuild'];
  const script = join(root, 'scripts/clean-local-deps.mjs');
  try {
    await mkdir(join(root, 'scripts'));
    await cp(new URL('../scripts/clean-local-deps.mjs', import.meta.url), script);
    for (const scope of scopes) {
      for (const [name, metadata] of [
        ['native-arm64', { os: [process.platform], cpu: ['arm64'] }],
        ['native-x64', { os: [process.platform], cpu: ['x64'] }],
        ['foreign', { os: [otherOS] }],
        ['unknown', {}],
        ['unrelated', { name: 'another-package', os: [otherOS] }],
      ]) {
        const dir = join(root, scope, name);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'package.json'), JSON.stringify({ name: `@esbuild/${name}`, ...metadata }));
        await writeFile(join(dir, 'binary'), 'fixture');
      }
    }
    const outside = join(root, 'outside');
    await mkdir(outside);
    await writeFile(join(outside, 'package.json'), JSON.stringify({ name: '@esbuild/linked', os: [otherOS] }));
    await symlink(outside, join(root, scopes[0], 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    const run = args => {
      const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      return result.stdout;
    };
    assert.match(run(['--dry-run']), /Would remove 2 packages/);
    for (const scope of scopes) assert.equal(await readFile(join(root, scope, 'foreign/binary'), 'utf8'), 'fixture');
    assert.match(run([]), /Removed 2 packages/);
    for (const scope of scopes) {
      await assert.rejects(readFile(join(root, scope, 'foreign/binary')), { code: 'ENOENT' });
      for (const name of ['native-arm64', 'native-x64', 'unknown', 'unrelated']) assert.equal(await readFile(join(root, scope, name, 'binary'), 'utf8'), 'fixture');
    }
    assert.equal(await readFile(join(root, scopes[0], 'linked/package.json'), 'utf8'), await readFile(join(outside, 'package.json'), 'utf8'));
    assert.match(run([]), /Removed 0 packages/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
