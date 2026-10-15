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
let calls, running, scenario, clock, emptyProbes, quitRequested, relaunched;
const missing = () => Object.assign(new Error('No process'), { code: 1 });
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = async (file, args, options) => {
  calls.push({ file, args, options });
  if (options.timeout !== undefined) assert.ok(options.timeout > 0 && options.timeout <= 15_000);
  assert.ok(!file.endsWith('/pkill') && !args.includes('/F'), 'never terminate background hosts, including after a relaunch');
  if (quitRequested && (file.endsWith('/pgrep') || file === 'powershell.exe')) {
    if (scenario === 'relaunch') {
      running.add(process.platform === 'darwin' ? 'wpsoffice' : 'wps'); relaunched = true;
    }
    if (scenario === 'relaunch' || scenario === 'lingering-background') clock += 8_000;
  }
  // The close phase has one empty full-process probe before registration checks again.
  if (running.size === 0 && (file.endsWith('/pgrep') || file === 'powershell.exe')) {
    emptyProbes++;
    const closeProbes = process.platform === 'darwin' ? 2 : 1;
    if (scenario === 'slow-final-probe' && emptyProbes > closeProbes) clock += 2_000;
  }
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
    if (scenario === 'slow-final-probe') clock += 14_000;
    running.delete('wpsoffice');
  } else if (file === 'taskkill.exe') {
    const name = args[1].replace(/\.exe$/, '');
    if (scenario === 'slow-final-probe' && name === 'wps') clock += 14_000;
    if (scenario !== 'save-prompt') running.delete(name);
  } else throw new Error(`Unexpected process command: ${file}`);
  quitRequested = true;
  if (!['save-prompt', 'relaunch', 'lingering-background'].includes(scenario)) running.clear();
  return { stdout: '', stderr: '' };
};
childProcess.execFile = fakeExec;
syncBuiltinESMExports();
const { desktopCommand } = await import('../dist/src/desktop-runtime.js');
function reset(target = 'darwin', mode = '') {
  Object.defineProperty(process, 'platform', { ...platform, value: target });
  calls = []; scenario = mode; clock = 0; emptyProbes = 0; quitRequested = false; relaunched = false;
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
  test(`${target} requests a normal quit and waits for all hosts to exit naturally`, async () => {
    reset(target);
    assert.equal(await desktopCommand('close-wps'), 'WPS 已关闭');
    assert.equal(running.size, 0);
    assert.ok(calls.every(c => c.options.timeout > 0 && c.options.timeout <= 15_000), 'every close command has a bounded timeout');
    assert.ok(calls.some(c => c.file.endsWith('/osascript') || c.file === 'taskkill.exe'));
  });
}
for (const target of ['darwin', 'win32']) {
  for (const mode of ['relaunch', 'lingering-background']) {
    for (const command of ['register-close-wps', 'unregister-close-wps']) {
      test(`${target} ${command} leaves registration unchanged after ${mode} without terminating backgrounds`, async () => {
        reset(target);
        await desktopCommand('register-close-wps');
        const publishPath = join(data, 'addins/publish.xml');
        const markerPath = join(data, 'desktop-registration.json');
        const before = await readFile(publishPath, 'utf8'), marker = await readFile(markerPath, 'utf8');
        reset(target, mode);
        await assert.rejects(desktopCommand(command), /15 秒/);
        assert.ok(running.has('promecefpluginhost'), 'the remaining CEF host is never terminated');
        if (mode === 'relaunch') assert.equal(relaunched, true);
        else assert.ok(!running.has(target === 'darwin' ? 'wpsoffice' : 'wps'), 'only background hosts remain');
        assert.equal(await readFile(publishPath, 'utf8'), before);
        assert.equal(await readFile(markerPath, 'utf8'), marker);
        reset(target);
        await desktopCommand('register-close-wps');
      });
    }
  }
}
test('a canceled macOS quit never ends CEF or changes registration', async () => {
  reset();
  await desktopCommand('register-close-wps');
  const publish = await readFile(join(data, 'addins/publish.xml'), 'utf8');
  const marker = await readFile(join(data, 'desktop-registration.json'), 'utf8');
  reset('darwin', 'cancel');
  await assert.rejects(desktopCommand('unregister-close-wps'), /关闭已取消或失败/);
  assert.ok(!calls.some(c => c.file.endsWith('/pkill')));
  assert.equal(running.size, 2);
  assert.equal(await readFile(join(data, 'addins/publish.xml'), 'utf8'), publish);
  assert.equal(await readFile(join(data, 'desktop-registration.json'), 'utf8'), marker);
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
for (const target of ['darwin', 'win32']) {
  for (const command of ['register-close-wps', 'unregister-close-wps']) {
    test(`${target} ${command} bounds the final probe and leaves registration unchanged on timeout`, async () => {
      reset(target);
      await desktopCommand('register-close-wps');
      reset(target, 'slow-final-probe');
      const publishPath = join(data, 'addins/publish.xml');
      const markerPath = join(data, 'desktop-registration.json');
      const before = await readFile(publishPath, 'utf8');
      const marker = await readFile(markerPath, 'utf8');
      await assert.rejects(desktopCommand(command), /15 秒/);
      assert.equal(running.size, 0, 'the timeout occurs after closing WPS');
      assert.ok(calls.every(c => c.options.timeout > 0), 'final probes must also have a timeout');
      assert.ok(calls.at(-1).options.timeout <= 1_000, 'the final probe only gets the unused close budget');
      assert.equal(await readFile(publishPath, 'utf8'), before);
      assert.equal(await readFile(markerPath, 'utf8'), marker);
      // The failed operation releases its lock so a later operation can complete.
      reset(target);
      await desktopCommand('register-close-wps');
    });
  }
}
test('closing refuses another tray owner even when the local metadata is changed to match', { timeout: 15000 }, async () => {
  Date.now = realNow;
  const previousParent = process.env.WPS_MCP_DESKTOP_PARENT_PID;
  process.env.WPS_MCP_DESKTOP_PARENT_PID = String(process.pid);
  await desktopCommand('initialize');
  const path = join(data, 'desktop-service.json');
  const original = await readFile(path, 'utf8');
  const meta = JSON.parse(original);
  try {
    process.env.WPS_MCP_DESKTOP_PARENT_PID = String(process.ppid);
    for (const record of [meta, { ...meta, parentPid: process.ppid }, { ...meta, parentPid: undefined }]) {
      const content = JSON.stringify(record);
      await writeFile(path, content);
      for (const command of ['close-wps', 'register-close-wps', 'unregister-close-wps']) {
        calls = [];
        await assert.rejects(desktopCommand(command), /绑定其他托盘/);
        assert.equal(calls.length, 0, 'ownership rejection happens before any WPS command');
        assert.equal(await readFile(path, 'utf8'), content);
        const status = await (await fetch(`http://127.0.0.1:${port}/health`)).json();
        assert.equal(status.ok, true, 'the original service remains running');
        assert.doesNotThrow(() => process.kill(meta.pid, 0));
      }
    }
  } finally {
    const current = JSON.parse(await readFile(path, 'utf8'));
    if (current.pid === meta.pid) await writeFile(path, original);
    await desktopCommand('stop');
    if (previousParent === undefined) delete process.env.WPS_MCP_DESKTOP_PARENT_PID;
    else process.env.WPS_MCP_DESKTOP_PARENT_PID = previousParent;
  }
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
    for (const [target, mode, command] of [
      ['darwin', '', 'close-wps'],
      ['darwin', 'cancel', 'close-wps'],
      ['darwin', 'slow-final-probe', 'register-close-wps'],
      ['win32', 'slow-final-probe', 'unregister-close-wps'],
      ['darwin', 'relaunch', 'register-close-wps'],
      ['win32', 'lingering-background', 'unregister-close-wps'],
    ]) {
      const old = JSON.parse(await readFile(join(data, 'desktop-service.json'), 'utf8'));
      reset(target, mode);
      if (!['slow-final-probe', 'relaunch', 'lingering-background'].includes(mode)) Date.now = realNow;
      if (mode) await assert.rejects(desktopCommand(command), mode === 'cancel' ? /关闭已取消或失败/ : /15 秒/);
      else assert.equal(await desktopCommand(command), 'WPS 已关闭');
      Date.now = realNow;
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
