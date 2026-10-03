// package.json is the only manually maintained application version.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export async function syncVersion(root, check = false) {
  const version = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')).version;
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Invalid application version');
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
  lock.version = version; lock.packages[''].version = version;
  const cargoPath = 'desktop/native/Cargo.toml';
  const cargo = await readFile(join(root, cargoPath), 'utf8');
  const cargoLockPath = 'desktop/native/Cargo.lock';
  const cargoLock = await readFile(join(root, cargoLockPath), 'utf8');
  const cargoPattern = /(\[package\]\r?\n[\s\S]*?\r?\nversion = ")[^"]+("\r?\n)/;
  const lockPattern = /(\[\[package\]\]\r?\nname = "wps-assistant-tray"\r?\nversion = ")[^"]+("\r?\n)/;
  if (!cargoPattern.test(cargo) || !lockPattern.test(cargoLock)) throw new Error('Missing native package version entry');
  const replacements = new Map([
    ['package-lock.json', JSON.stringify(lock, null, 2) + '\n'],
    [cargoPath, cargo.replace(cargoPattern, (_, before, after) => before + version + after)],
    [cargoLockPath, cargoLock.replace(lockPattern, (_, before, after) => before + version + after)],
    ['addon/version.js', `// Generated from package.json by scripts/sync-version.mjs.\nexport const APP_VERSION = ${JSON.stringify(version)};\n`],
  ]);
  for (const [path, content] of replacements) {
    let current;
    try { current = await readFile(join(root, path), 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (current?.replace(/\r\n/g, '\n') === content.replace(/\r\n/g, '\n')) continue;
    if (check) throw new Error(`${path} version is stale; run npm run version:sync`);
    await writeFile(join(root, path), content);
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await syncVersion(fileURLToPath(new URL('../', import.meta.url)), process.argv.includes('--check'));
