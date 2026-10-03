import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { syncVersion } from '../scripts/sync-version.mjs';
import { APP_VERSION } from '../dist/src/version.js';
import { APP_VERSION as browserVersion } from '../addon/version.js';

test('all runtime application versions match package.json', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(APP_VERSION, pkg.version); assert.equal(browserVersion, pkg.version);
  await syncVersion(fileURLToPath(new URL('../', import.meta.url)), true);
});

test('version updates synchronize generated consumers, detect drift and preserve dependency versions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wps-version-'));
  try {
    await mkdir(join(root, 'desktop/native'), { recursive: true }); await mkdir(join(root, 'addon'));
    await writeFile(join(root, 'package.json'), '{"version":"2.3.4-rc.1"}');
    await writeFile(join(root, 'package-lock.json'), JSON.stringify({ version: '1.0.0', packages: { '': { version: '1.0.0' }, 'node_modules/foreign': { version: '9.8.7' } } }));
    await writeFile(join(root, 'desktop/native/Cargo.toml'), '[package]\nname = "wps-assistant-tray"\nversion = "1.0.0"\n\n[dependencies]\nforeign = "9.8.7"\n');
    await writeFile(join(root, 'desktop/native/Cargo.lock'), 'version = 4\n\n[[package]]\nname = "foreign"\nversion = "9.8.7"\n\n[[package]]\nname = "wps-assistant-tray"\nversion = "1.0.0"\n');
    await assert.rejects(syncVersion(root, true), /stale/);
    await syncVersion(root); await syncVersion(root, true);
    const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
    assert.equal(lock.version, '2.3.4-rc.1'); assert.equal(lock.packages[''].version, '2.3.4-rc.1');
    assert.equal(lock.packages['node_modules/foreign'].version, '9.8.7');
    assert.match(await readFile(join(root, 'desktop/native/Cargo.lock'), 'utf8'), /name = "foreign"\nversion = "9.8.7"/);
    for (const path of ['desktop/native/Cargo.toml', 'desktop/native/Cargo.lock', 'addon/version.js', 'package-lock.json']) {
      const content = await readFile(join(root, path), 'utf8');
      await writeFile(join(root, path), content.replace(/\n/g, '\r\n'));
    }
    await syncVersion(root, true);
    await writeFile(join(root, 'addon/version.js'), 'export const APP_VERSION = "stale";\n');
    await assert.rejects(syncVersion(root, true), /addon\/version.js version is stale/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
