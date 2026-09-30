// Pi's bundled dependencies include esbuild binaries for every operating system.
// Keep all binaries for this OS (including other architectures), so native and
// translated Node installations can share the same checkout.
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: node scripts/clean-local-deps.mjs [--dry-run]');
const dryRun = args.includes('--dry-run');
const scopes = [
  'node_modules/@esbuild',
  'node_modules/@earendil-works/pi-coding-agent/node_modules/@esbuild',
];

async function size(directory) {
  let bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) bytes += await size(path);
    else if (entry.isFile()) bytes += (await stat(path)).size;
  }
  return bytes;
}

let count = 0, bytes = 0;
for (const scope of scopes) {
  let entries;
  try { entries = await readdir(join(root, scope), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  for (const entry of entries) {
    // Never traverse package symlinks or remove packages without explicit OS metadata.
    if (!entry.isDirectory()) continue;
    const path = join(root, scope, entry.name);
    const pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
    if (pkg.name !== `@esbuild/${entry.name}` || !Array.isArray(pkg.os) ||
        pkg.os.length !== 1 || pkg.os[0].startsWith('!') ||
        pkg.os[0] === process.platform || pkg.os[0] === 'any') continue;
    bytes += await size(path);
    count++;
    console.log(`${dryRun ? 'Would remove' : 'Removing'} ${scope}/${entry.name}`);
    if (!dryRun) await rm(path, { recursive: true });
  }
}
console.log(`${dryRun ? 'Would remove' : 'Removed'} ${count} packages, ${(bytes / 1024 / 1024).toFixed(1)} MiB; kept ${process.platform} binaries.`);
