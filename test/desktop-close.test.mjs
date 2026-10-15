import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { createServer, request } from 'node:http';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const data = await mkdtemp(join(tmpdir(), 'wps-close-test-'));
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
process.env.WPS_MCP_DATA_DIR = data;
process.env.WPS_MCP_ADDINS_DIR = join(data, 'addins');
process.env.WPS_MCP_PORT = String(port);
const platform = Object.getOwnPropertyDescriptor(process, 'platform');
const realExec = childProcess.execFile;
const realNow = Date.now;
let calls, running, scenario, clock;
const missing = () => Object.assign(new Error('No process'), { code: 1 });
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = async (file, args, options) => {
  calls.push({ file, args, options });
  if (options.timeout !== undefined) assert.ok(options.timeout > 0 && options.timeout <= 15_000);
  if (file.endsWith('/pgrep')) {
    if (scenario === 'slow-probe') clock += 16_000;
    if (!running.has(args[1])) throw missing();
    return { stdout: '123\n', stderr: '' };
  }
  if (file === 'powershell.exe') {
    const names = args.at(-1).match(/-Name ([\w,]+)/)[1].split(',');
    if (scenario === 'save-prompt' && calls.some(c => c.file === 'taskkill.exe')) clock += 16_000;
    return { stdout: String(names.filter(name => running.has(name)).length), stderr: '' };
  }
  if (file.endsWith('/osascript')) {
    if (scenario === 'cancel') throw new Error('User canceled (-128)');
    if (scenario === 'slow-quit') clock += 60_000;
    running.delete('wpsoffice');
  } else if (file.endsWith('/pkill')) {
    assert.ok(!running.has('wpsoffice'), 'never end CEF while documents remain open');
    running.delete('promecefpluginhost');
  } else if (file === 'taskkill.exe') {
    const name = args[1].replace(/\.exe$/, '');
    if (args.includes('/F')) assert.ok(!['wps', 'et', 'wpp'].some(name => running.has(name)), 'documents must exit before background termination');
    else assert.ok(!args.includes('/F'));
    if (scenario !== 'save-prompt') running.delete(name);
  } else throw new Error(`Unexpected process command: ${file}`);
  return { stdout: '', stderr: '' };
};
childProcess.execFile = fakeExec;
syncBuiltinESMExports();
const { desktopCommand } = await import('../dist/src/desktop-runtime.js');
function reset(target = 'darwin', mode = '') {
  Object.defineProperty(process, 'platform', { ...platform, value: target });
  calls = []; scenario = mode; clock = 0;
  Date.now = () => clock;
  running = new Set(target === 'darwin' ? ['wpsoffice', 'promecefpluginhost'] : ['wps', 'wpscenter', 'promecefpluginhost']);
}
test.beforeEach(() => reset());
test.afterEach(() => { Date.now = realNow; Object.defineProperty(process, 'platform', platform); });
test.after(async () => {
  childProcess.execFile = realExec; syncBuiltinESMExports();
  await desktopCommand('stop');
  await rm(data, { recursive: true, force: true });
});

for (const target of ['darwin', 'win32']) {
  test(`${target} closes documents before background hosts without forcing documents`, async () => {
    reset(target);
    assert.equal(await desktopCommand('close-wps'), 'WPS 已关闭');
    assert.equal(running.size, 0);
    assert.ok(calls.every(c => c.options.timeout > 0 && c.options.timeout <= 15_000), 'every close command has a bounded timeout');
    assert.ok(calls.some(c => c.file.endsWith('/pkill') || c.args.includes('/F')));
  });
}
test('a canceled macOS quit never ends CEF or changes registration', async () => {
  reset('darwin', 'cancel');
  await assert.rejects(desktopCommand('unregister-close-wps'), /关闭已取消或失败/);
  assert.ok(!calls.some(c => c.file.endsWith('/pkill')));
  assert.equal(running.size, 2);
  await assert.rejects(readFile(join(data, 'desktop-registration.json')), { code: 'ENOENT' });
});
for (const mode of ['slow-quit', 'slow-probe']) {
  test(`${mode} cannot restart the 15-second close deadline`, async () => {
    reset('darwin', mode);
    await assert.rejects(desktopCommand('close-wps'), /15 秒/);
    assert.ok(!calls.some(c => c.file.endsWith('/pkill')));
  });
}
test('a Windows save prompt prevents forced background termination', async () => {
  reset('win32', 'save-prompt');
  await assert.rejects(desktopCommand('close-wps'), /15 秒/);
  assert.ok(!calls.some(c => c.args.includes('/F')));
  assert.ok(running.has('wps'));
});
test('combined close and removal holds the operation through registration', async () => {
  reset();
  await desktopCommand('register-close-wps');
  reset();
  assert.match(await desktopCommand('unregister-close-wps'), /已移除/);
  assert.equal(JSON.parse(await readFile(join(data, 'desktop-registration.json'), 'utf8')).removed, true);
  assert.ok(!(await readFile(join(data, 'addins/publish.xml'), 'utf8')).includes('WpsMcp'));
});
test('busy work blocks closing; idle and failed closes restore the owned service', { timeout: 45000 }, async () => {
  Date.now = realNow;
  Object.defineProperty(process, 'platform', platform);
  await writeFile(join(data, 'desktop-registration.json'), JSON.stringify({ port, addinsDir: join(data, 'addins'), removed: true }));
  await desktopCommand('initialize');
  const health = async () => (await fetch(`http://127.0.0.1:${port}/health`)).json();
  const waitIdle = async () => {
    for (let i = 0; i < 100; i++) {
      if (!(await health()).busy) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.fail('service stayed busy');
  };
  let held;
  try {
    await waitIdle();
    held = request(`http://127.0.0.1:${port}/api/config`, { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '100' } });
    held.on('error', () => {}); held.write('{');
    for (let i = 0; i < 100 && !(await health()).busy; i++) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal((await health()).busy, true);
    calls = [];
    await assert.rejects(desktopCommand('close-wps'), /正在运行/);
    assert.equal(calls.length, 0, 'busy rejection happens before any WPS command');
    held.destroy(); held = undefined;
    await waitIdle();
    for (const mode of ['', 'cancel']) {
      const old = JSON.parse(await readFile(join(data, 'desktop-service.json'), 'utf8'));
      reset('darwin', mode); Date.now = realNow;
      if (mode) await assert.rejects(desktopCommand('close-wps'), /关闭已取消或失败/);
      else assert.equal(await desktopCommand('close-wps'), 'WPS 已关闭');
      const next = JSON.parse(await readFile(join(data, 'desktop-service.json'), 'utf8'));
      assert.notEqual(next.pid, old.pid, 'the service stops before close and starts again afterwards');
      assert.equal((await health()).ok, true);
      await waitIdle();
    }
  } finally {
    held?.destroy(); Date.now = realNow; Object.defineProperty(process, 'platform', platform);
    await waitIdle(); await desktopCommand('stop');
  }
});
