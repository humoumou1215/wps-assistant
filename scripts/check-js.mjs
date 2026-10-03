import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

let count = 0;
for (const root of ['addon', 'scripts', 'test', 'desktop']) {
  for (const entry of await readdir(root, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.(mjs|js)$/.test(entry.name)) continue;
    const path = `${entry.parentPath}/${entry.name}`;
    const result = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
    count++;
  }
}
console.log(`JavaScript syntax checked: ${count} files`);
