import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
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
let calls, running, scenario, clock, quitRequested, relaunched;
const documentNames = ['wps', 'et', 'wpp'];
// 本机实测的真实命令行：WPS 12.x 用同一个 wps.exe 兼任文档宿主与多种辅助宿主，
// 辅助宿主的首参固定是 Run 子命令。测试替身按同一规则分类，才能覆盖 0.1.22 的误判。
const PROCESSES = {
  wps: '"C:\\Program Files\\Kingsoft\\WPS Office\\12.1\\office6\\wps.exe"  "C:\\Users\\me\\report.docx"',
  et: '"C:\\Program Files\\Kingsoft\\WPS Office\\12.1\\office6\\et.exe"  "C:\\Users\\me\\book.xlsx"',
  wpp: '"C:\\Program Files\\Kingsoft\\WPS Office\\12.1\\office6\\wpp.exe"  "C:\\Users\\me\\deck.pptx"',
  'wps.entry': '"C:\\Program Files\\Kingsoft\\WPS Office\\12.1\\office6\\wps.exe"  Run -Entry=EntryPoint C:\\addons\\pool\\aspcenter.dll --host',
  'wps.cef': '"C:\\Program Files\\Kingsoft\\WPS Office\\12.1\\office6\\wps.exe" Run /AppUserModelID=Kingsoft.Office.cefhomepage -Entry=CefRenderEntryPoint -CefParentID=21816 "C:/x/promecefpluginhost.exe" --type=renderer',
  'wps.yunbox': '"C:\\Program Files\\Kingsoft\\WPS Office\\12.1\\office6\\wps.exe"  Run /InstanceId=yunbox "C:/x/addons/yunbox/yunbox.dll" /show /from:tray',
  promecefpluginhost: '"C:/x\\promecefpluginhost.exe" --type=gpu-process --no-sandbox',
  wpsoffice: '"C:\\Program Files\\Kingsoft\\WPS Office\\12.1\\office6\\wps.exe"  "C:\\Users\\me\\report.docx"',
};
const hostName = token => token.split('.')[0];
// 与 src/desktop-runtime.ts 的 Test-WpsDocumentHost 一一对应。
const isDocumentHost = commandLine => {
  const cmd = commandLine ?? '';
  const quoted = /^"[^"]*"/.exec(cmd);
  const rest = quoted ? cmd.slice(quoted[0].length) : cmd.replace(/^\S+/, '');
  if (/^\s*Run(\s|$)/i.test(rest)) return false;
  if (/-Entry=|--type=|\/InstanceId=/i.test(cmd)) return false;
  return true;
};
const documentHosts = () => [...running].filter(token => documentNames.includes(hostName(token)) && isDocumentHost(PROCESSES[token]));
const missing = () => Object.assign(new Error('No process'), { code: 1 });
const fakeExec = () => { throw new Error('Unexpected callback invocation'); };
fakeExec[promisify.custom] = async (file, args, options) => {
  calls.push({ file, args, options });
  if (options.timeout !== undefined) assert.ok(options.timeout > 0 && options.timeout <= 16_000);
  assert.ok(!file.endsWith('/pkill') && !args.includes('/F'), 'never terminate document hosts forcibly, including after a relaunch');
  if (file.endsWith('/pgrep')) {
    if (quitRequested && scenario === 'relaunch' && args[1] === 'wpsoffice') { running.add('wpsoffice'); relaunched = true; clock += 8_000; }
    if (scenario === 'slow-probe') clock += 16_000;
    if (!running.has(args[1])) throw missing();
    return { stdout: '123\n', stderr: '' };
  }
  if (file === 'powershell.exe') {
    const script = args.at(-1);
    // 长驻等待脚本：文档宿主仍在时自己耗尽剩余预算并以 2 退出。
    if (script.includes('WPS_DOC_WAIT')) {
      if (quitRequested && scenario === 'relaunch') { running.add('wps'); relaunched = true; }
      if (documentHosts().length) {
        clock += Number(script.match(/AddMilliseconds\((\d+)\)/)[1]);
        throw Object.assign(new Error('Command failed: powershell.exe'), { code: 2 });
      }
      return { stdout: '', stderr: '' };
    }
    // 一次性探测：命令行首参为 Run 的加载项/CEF/云盘宿主只计入 backgrounds。
    if (quitRequested && scenario === 'relaunch') { running.add('wps'); relaunched = true; }
    if (scenario === 'slow-close') clock += 8_000;
    const open = documentHosts();
    return {
      stdout: JSON.stringify({
        wps: open.filter(token => hostName(token) === 'wps').length,
        et: open.filter(token => hostName(token) === 'et').length,
        wpp: open.filter(token => hostName(token) === 'wpp').length,
        backgrounds: [...running].filter(token => !open.includes(token)).length,
      }),
      stderr: '',
    };
  }
  if (file.endsWith('/osascript')) {
    if (scenario === 'cancel') throw new Error('User canceled (-128)');
    if (scenario === 'slow-quit') clock += 60_000;
    running.delete('wpsoffice');
  } else if (file === 'taskkill.exe') {
    const name = args[1].replace(/\.exe$/, '');
    if (scenario !== 'save-prompt') running.delete(name);
  } else throw new Error(`Unexpected process command: ${file}`);
  quitRequested = true;
  return { stdout: '', stderr: '' };
};
childProcess.execFile = fakeExec;
syncBuiltinESMExports();
const { desktopCommand } = await import('../dist/src/desktop-runtime.js');
function reset(target = 'darwin', mode = '') {
  Object.defineProperty(process, 'platform', { ...platform, value: target });
  calls = []; scenario = mode; clock = 0; quitRequested = false; relaunched = false;
  Date.now = () => clock;
  running = new Set(target === 'darwin' ? ['wpsoffice', 'promecefpluginhost'] : ['wps', 'wps.entry', 'promecefpluginhost']);
  // 文档窗口全关了，只剩常驻的辅助宿主：WPS 12.x 的加载项宿主、CEF 渲染宿主、云盘实例。
  if (mode === 'helpers-only') ['wpsoffice', 'wps'].forEach(name => running.delete(name));
  if (mode === 'aux-hosts') running = new Set(target === 'darwin' ? ['promecefpluginhost'] : ['wps.entry', 'wps.cef', 'wps.yunbox', 'promecefpluginhost']);
}
test.beforeEach(() => reset());
test.afterEach(() => { Date.now = realNow; Object.defineProperty(process, 'platform', platform); });
test.after(async () => {
  childProcess.execFile = realExec; syncBuiltinESMExports();
  await desktopCommand('stop');
  await rm(data, { recursive: true, force: true });
});

for (const target of ['darwin', 'win32']) {
  test(`${target} requests a normal quit of document hosts and leaves background hosts running`, async () => {
    reset(target);
    assert.equal(await desktopCommand('close-wps'), 'WPS 已关闭');
    assert.deepEqual(documentHosts(), [], 'every document host is closed');
    assert.ok(running.has('promecefpluginhost'), 'resident background hosts are neither waited for nor terminated');
    assert.ok(calls.every(c => c.options.timeout > 0 && c.options.timeout <= 16_000), 'every close command has a bounded timeout');
    assert.ok(calls.some(c => c.file.endsWith('/osascript') || c.file === 'taskkill.exe'));
  });
}
for (const target of ['darwin', 'win32']) {
  for (const command of ['register-close-wps', 'unregister-close-wps']) {
    test(`${target} ${command} completes while background hosts linger`, async () => {
      reset(target);
      assert.match(await desktopCommand(command), command.startsWith('unregister') ? /已移除/ : /已注册/);
      assert.equal(documentHosts().length, 0);
      assert.ok(running.has('promecefpluginhost'), 'the remaining background host is never terminated');
      assert.ok(!calls.some(c => c.args.includes('/F')));
    });
  }
}
for (const target of ['darwin', 'win32']) {
  for (const command of ['register', 'unregister', 'register-close-wps', 'unregister-close-wps']) {
    test(`${target} ${command} ignores resident add-in hosts`, async () => {
      reset(target, 'helpers-only');
      assert.match(await desktopCommand(command), command.startsWith('unregister') ? /已移除/ : /已注册/);
      assert.ok(!calls.some(c => c.file === 'taskkill.exe' || c.file.endsWith('/osascript')), 'no close is attempted without a document host');
    });
  }
}
for (const target of ['darwin', 'win32']) {
  for (const command of ['register', 'unregister', 'register-close-wps', 'unregister-close-wps']) {
    test(`${target} ${command} ignores CEF render and cloud hosts`, async () => {
      reset(target, 'aux-hosts');
      assert.deepEqual(documentHosts(), [], 'only auxiliary hosts are running');
      assert.match(await desktopCommand(command), command.startsWith('unregister') ? /已移除/ : /已注册/);
      assert.ok(!calls.some(c => c.file === 'taskkill.exe' || c.file.endsWith('/osascript')), 'no document window means no close attempt');
    });
  }
}
test('a real document window still blocks registration', async () => {
  reset('win32');
  assert.deepEqual(documentHosts(), ['wps'], 'a document host is detected next to the auxiliary ones');
  await assert.rejects(desktopCommand('register'), /请关闭 WPS 中已打开的文档/);
  assert.ok(!calls.some(c => c.file === 'taskkill.exe'), 'registration never closes WPS on its own');
});
for (const target of ['darwin', 'win32']) {
  for (const command of ['register-close-wps', 'unregister-close-wps']) {
    test(`${target} ${command} leaves registration unchanged when WPS relaunches`, async () => {
      reset(target);
      await desktopCommand('register-close-wps');
      const publishPath = join(data, 'addins/publish.xml');
      const markerPath = join(data, 'desktop-registration.json');
      const before = await readFile(publishPath, 'utf8'), marker = await readFile(markerPath, 'utf8');
      reset(target, 'relaunch');
      await assert.rejects(desktopCommand(command), /15 秒/);
      assert.equal(relaunched, true);
      assert.equal(await readFile(publishPath, 'utf8'), before);
      assert.equal(await readFile(markerPath, 'utf8'), marker);
      reset(target);
      await desktopCommand('register-close-wps');
    });
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
test('a slow close cannot consume the registration budget', async () => {
  reset('win32', 'slow-close');
  assert.match(await desktopCommand('register-close-wps'), /已注册/);
  assert.ok(clock > 15_000, 'the operation spans more than the close budget yet still registers');
});
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
    for (const [target, mode, command, failure] of [
      ['darwin', '', 'close-wps', ''],
      ['darwin', 'cancel', 'close-wps', 'cancel'],
      ['win32', 'save-prompt', 'register-close-wps', '15 秒'],
      ['darwin', 'relaunch', 'register-close-wps', '15 秒'],
      ['win32', '', 'unregister-close-wps', ''],
    ]) {
      const old = JSON.parse(await readFile(join(data, 'desktop-service.json'), 'utf8'));
      reset(target, mode);
      if (!['relaunch', 'save-prompt'].includes(mode)) Date.now = realNow;
      if (failure) await assert.rejects(desktopCommand(command), failure === 'cancel' ? /关闭已取消或失败/ : /15 秒/);
      else assert.match(await desktopCommand(command), command === 'close-wps' ? /WPS 已关闭/ : /已(注册|移除)/);
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

for (const failure of ['lost-response', 'metadata-cleanup']) {
  test(`a ${failure} failure after accepting stop restores service without touching WPS`, { timeout: 15000 }, async t => {
    Date.now = realNow;
    Object.defineProperty(process, 'platform', platform);
    const markerPath = join(data, 'desktop-registration.json');
    await writeFile(markerPath, JSON.stringify({ port, addinsDir: join(data, 'addins'), removed: true }));
    await desktopCommand('initialize');
    const metaPath = join(data, 'desktop-service.json');
    const old = JSON.parse(await readFile(metaPath, 'utf8'));
    const originalFetch = globalThis.fetch;
    let accepted = false;
    try {
      for (let i = 0; i < 100; i++) {
        if (!(await (await originalFetch(`http://127.0.0.1:${port}/health`)).json()).busy) break;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      if (failure === 'lost-response') {
        t.mock.method(globalThis, 'fetch', async (url, options) => {
          const response = await originalFetch(url, options);
          if (String(url).endsWith('/api/desktop/stop')) {
            assert.equal(response.status, 202);
            accepted = true;
            await response.text();
            throw new TypeError('simulated lost stop response');
          }
          return response;
        });
      } else {
        const originalUnlink = fsPromises.unlink;
        t.mock.method(fsPromises, 'unlink', async path => {
          if (path === metaPath && !accepted) {
            accepted = true;
            throw Object.assign(new Error('simulated metadata cleanup failure'), { code: 'EACCES' });
          }
          return originalUnlink(path);
        });
        syncBuiltinESMExports();
      }
      calls = [];
      await assert.rejects(desktopCommand('unregister-close-wps'), /simulated/);
      assert.equal(accepted, true);
      assert.equal(calls.length, 0, 'no WPS commands after a failed stop');
      const next = JSON.parse(await readFile(metaPath, 'utf8'));
      assert.notEqual(next.pid, old.pid, 'the accepted stop is followed by a new service');
      assert.equal((await (await originalFetch(`http://127.0.0.1:${port}/health`)).json()).ok, true);
      assert.equal(JSON.parse(await readFile(markerPath, 'utf8')).removed, true);
    } finally {
      t.mock.restoreAll(); syncBuiltinESMExports();
      await desktopCommand('stop');
    }
  });
}

for (const target of ['darwin', 'win32']) {
  for (const command of ['register', 'unregister']) {
    for (const failure of ['partial-write', 'replacement']) {
      test(`${target} ${command} rolls back registries and preserves startup after marker ${failure}`, { timeout: 15000 }, async t => {
        reset(target); running.clear(); Date.now = realNow;
        await desktopCommand(command === 'register' ? 'unregister' : 'register');
        const markerPath = join(data, 'desktop-registration.json');
        const paths = [markerPath, join(data, 'addins/publish.xml'), ...(target === 'darwin' ? [join(data, 'addins/authaddin.json')] : [])];
        const before = await Promise.all(paths.map(path => readFile(path, 'utf8')));
        const dataFiles = (await readdir(data)).sort();
        const addinFiles = (await readdir(join(data, 'addins'))).sort();
        try {
          if (failure === 'partial-write') {
            const originalWrite = fs.writeFileSync;
            t.mock.method(fs, 'writeFileSync', (path, content, ...options) => {
              if (String(path).startsWith(markerPath + '.wps-mcp-') && String(path).endsWith('.tmp')) {
                originalWrite(path, String(content).slice(0, 4), ...options);
                throw Object.assign(new Error('simulated marker ENOSPC'), { code: 'ENOSPC' });
              }
              return originalWrite(path, content, ...options);
            });
          } else {
            const originalRename = fs.renameSync;
            t.mock.method(fs, 'renameSync', (from, to) => {
              if (to === markerPath) throw Object.assign(new Error('simulated marker EBUSY'), { code: 'EBUSY' });
              return originalRename(from, to);
            });
          }
          syncBuiltinESMExports();
          await assert.rejects(desktopCommand(command), /simulated marker/);
          assert.deepEqual(await Promise.all(paths.map(path => readFile(path, 'utf8'))), before);
          assert.deepEqual((await readdir(data)).sort(), dataFiles);
          assert.deepEqual((await readdir(join(data, 'addins'))).sort(), addinFiles);
        } finally { t.mock.restoreAll(); syncBuiltinESMExports(); }
        // A failed marker update must not poison the next start or removal intent.
        Object.defineProperty(process, 'platform', platform);
        try {
          await desktopCommand('start');
          assert.equal((await (await fetch(`http://127.0.0.1:${port}/health`)).json()).ok, true);
          assert.equal(await readFile(markerPath, 'utf8'), before[0]);
        } finally { await desktopCommand('stop'); }
      });
    }
  }
}
