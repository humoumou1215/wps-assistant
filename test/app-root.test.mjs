import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

test('source and compiled API imports find the package from an unrelated working directory', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  for (const folder of ['src', 'dist/src']) {
    const api = new URL(`../${folder}/api.${folder === 'src' ? 'ts' : 'js'}`, import.meta.url);
    const tools = new URL(`../${folder}/tools.${folder === 'src' ? 'ts' : 'js'}`, import.meta.url);
    const args = folder === 'src' ? ['--import', new URL('../node_modules/tsx/dist/loader.mjs', import.meta.url).href] : [];
    const code = `await import(${JSON.stringify(api.href)}); const { APP_DIR } = await import(${JSON.stringify(tools.href)}); console.log(APP_DIR);`;
    const result = spawnSync(process.execPath, [...args, '--input-type=module', '-e', code], { cwd: tmpdir(), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), root.replace(/[\\/]$/, ''));
  }
});
