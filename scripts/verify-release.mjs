import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const name = `wps-mcp-${pkg.version}`;
const archive = join(process.cwd(), 'release', `${name}.tar.gz`);
const expected = (await readFile(join('release', `${name}.sha256`), 'utf8')).split(' ')[0];
assert.equal(createHash('sha256').update(await readFile(archive)).digest('hex'), expected);
const temp = await mkdtemp(join(tmpdir(), 'wps-mcp-release-smoke-'));
let child;
let exited;
let logs = '';
try {
  const unpack = spawnSync('tar', ['-xzf', archive, '-C', temp], { stdio: 'inherit' });
  if (unpack.error) throw unpack.error;
  assert.equal(unpack.status, 0);
  const cwd = join(temp, name);
  // Invoke npm's JS entrypoint so this also works without a shell on Windows.
  assert.ok(process.env.npm_execpath, 'Run through npm run verify:release');
  const install = spawnSync(process.execPath, [process.env.npm_execpath, 'ci', '--omit=dev', '--registry=https://registry.npmjs.org'], { cwd, stdio: 'inherit' });
  if (install.error) throw install.error;
  assert.equal(install.status, 0, 'Release dependencies must install from the bundled lockfile');
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  child = spawn(process.execPath, ['dist/src/server.js'], {
    cwd, stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, WPS_MCP_TRANSPORT: 'http', WPS_MCP_PORT: String(port), WPS_MCP_DATA_DIR: join(temp, 'data') },
  });
  exited = new Promise(resolve => child.once('exit', resolve));
  child.stderr.setEncoding('utf8').on('data', data => { logs += data; });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`Release server exited: ${logs}`);
    try { ready = (await fetch(`${base}/health`)).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Release server must start: ${logs}`);
  for (const path of ['/addon/taskpane.html', '/addins/et/taskpane.js', '/addins/wpp/taskpane.css', '/addins/wps/']) {
    assert.equal((await fetch(base + path)).status, 200, `Packaged asset ${path}`);
  }
  console.log('Release smoke passed: checksum, clean production install, HTTP server and Add-in assets');
} finally {
  if (child && child.exitCode === null) { child.kill(); await exited; }
  await rm(temp, { recursive: true, force: true });
}
