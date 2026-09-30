import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version = pkg.version;
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Invalid release version');
const tag = process.env.RELEASE_TAG;
if (tag && tag !== `v${version}`) throw new Error(`Tag ${tag} does not match package version v${version}`);
const outDir = join(root, 'release');
await mkdir(outDir, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'wps-mcp-package-'));
const name = `wps-mcp-${version}`;
const stage = join(temp, name);
try {
  await mkdir(stage);
  // Explicit allowlist excludes local credentials, logs, screenshots and node_modules.
  const files = [
    'package.json', 'package-lock.json', 'README.md', 'LICENSE', 'dist/src', 'addon', 'skills',
    'scripts/install-addin.mjs', 'scripts/install-macos-addin.sh', 'scripts/install-macos-service.sh',
  ];
  for (const file of files) {
    await cp(join(root, file), join(stage, file), { recursive: true });
  }
  const archive = join(outDir, `${name}.tar.gz`);
  const result = spawnSync('tar', ['-czf', archive, '-C', temp, name], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`tar failed with exit code ${result.status}`);
  const hash = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(join(outDir, `${name}.sha256`), `${hash}  ${name}.tar.gz\n`);
  console.log(`Created ${archive}`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
