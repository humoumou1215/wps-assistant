import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const bundle = resolve(process.argv[2]);
const resources = join(bundle, process.platform === 'darwin' ? 'Contents/Resources' : 'resources');
const app = join(resources, 'app');
const node = join(resources, 'runtime', process.platform === 'win32' ? 'node.exe' : 'node');
const binary = join(bundle, process.platform === 'darwin' ? 'Contents/MacOS/wps-assistant' : 'wps-assistant.exe');
const data = await mkdtemp(join(tmpdir(), 'wps-portable-'));
const addinsDir = join(data, 'addins');
const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r));
const port = probe.address().port; await new Promise(r => probe.close(r));
const env = { ...process.env, PATH: '', WPS_MCP_DATA_DIR: data, WPS_MCP_ADDINS_DIR: addinsDir, WPS_MCP_PORT: String(port), WPS_MCP_DESKTOP_PARENT_PID: String(process.pid) };
delete env.NODE_PATH; delete env.NODE_OPTIONS;
const base = `http://127.0.0.1:${port}`;
async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, cwd: app, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = ''; child.stdout.on('data', b => { stdout += b; }); child.stderr.on('data', b => { stderr += b; });
    child.once('error', reject); child.once('exit', code => code === 0 ? resolve(stdout) : reject(new Error(`Smoke command failed (${code}): ${stdout}\n${stderr}`)));
  });
}
const helper = command => run(node, ['dist/src/desktop-runtime.js', command, binary]);
const get = async path => (await fetch(base + path)).json();
const post = (path, value, headers = {}) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(value) });
let modelRequests = 0;
const model = createServer(async (req, res) => {
  let raw = ''; for await (const part of req) raw += part;
  const body = JSON.parse(raw); modelRequests++;
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  const chunk = (delta, finish_reason = null) => res.write(`data: ${JSON.stringify({ id: 'smoke', object: 'chat.completion.chunk', created: 1, model: body.model, choices: [{ index: 0, delta, finish_reason }] })}\n\n`);
  chunk({ role: 'assistant', content: 'PORTABLE_OK' }); chunk({}, 'stop'); res.end('data: [DONE]\n\n');
});
await new Promise(r => model.listen(0, '127.0.0.1', r));
let started = false;
try {
  if (process.platform === 'win32') {
    // A CI runner has VC redistributables installed, so execution alone cannot prove portability.
    for (const executable of [binary, node]) {
      const bytes = await readFile(executable), pe = bytes.readUInt32LE(0x3c), optional = pe + 24;
      const directories = optional + (bytes.readUInt16LE(optional) === 0x20b ? 112 : 96);
      const sectionCount = bytes.readUInt16LE(pe + 6), sections = optional + bytes.readUInt16LE(pe + 20);
      function offset(rva) {
        for (let i = 0; i < sectionCount; i++) {
          const section = sections + i * 40, address = bytes.readUInt32LE(section + 12), size = Math.max(bytes.readUInt32LE(section + 8), bytes.readUInt32LE(section + 16));
          if (rva >= address && rva < address + size) return bytes.readUInt32LE(section + 20) + rva - address;
        }
        throw new Error('Invalid PE import address');
      }
      for (const [directory, step, nameField] of [[1, 20, 12], [13, 32, 4]]) {
        const rva = bytes.readUInt32LE(directories + directory * 8); if (!rva) continue;
        for (let cursor = offset(rva); bytes.readUInt32LE(cursor + nameField); cursor += step) {
          const start = offset(bytes.readUInt32LE(cursor + nameField));
          const dll = bytes.subarray(start, bytes.indexOf(0, start)).toString();
          assert.ok(!/^(?:vcruntime|msvcp|msvcr)\d+.*\.dll$/i.test(dll), `Portable executable requires external VC runtime: ${dll}`);
        }
      }
    }
  }
  await run(binary, ['--smoke']);
  const version = JSON.parse(await readFile(join(app, 'package.json'), 'utf8')).version;
  assert.equal((await run(binary, ['--version'])).trim(), version);
  assert.equal(JSON.parse(await readFile(join(app, 'node_modules/@earendil-works/pi-coding-agent/node_modules/brace-expansion/package.json'), 'utf8')).version, '5.0.12', 'shipped SDK uses the security-patched dependency');
  assert.match(await run(node, ['--version']), /^v24\.21\.0/);
  // Register in a disposable directory; never touch the build machine's actual WPS.
  await run(node, ['--input-type=module', '-e', 'import { registerAddins } from "./dist/src/addin-registration.js"; registerAddins(process.env.WPS_MCP_ADDINS_DIR, process.env.WPS_MCP_PORT, "enable_dev", process.platform);']);
  await writeFile(join(data, 'desktop-registration.json'), JSON.stringify({ port, addinsDir }));
  assert.equal(JSON.parse(await helper('initialize')).ok, true); started = true;
  const metadata = JSON.parse(await readFile(join(data, 'desktop-service.json'), 'utf8'));
  assert.equal(metadata.parentPid, process.pid);
  assert.equal(JSON.parse(await helper('start')).ok, true);
  assert.equal(JSON.parse(await readFile(join(data, 'desktop-service.json'), 'utf8')).pid, metadata.pid, 'start reuses the service');
  assert.equal((await get('/health')).desktopManaged, true);
  assert.equal((await get('/health')).version, version);
  for (const asset of ['taskpane.html', 'mcp-debug.html', 'mcp-guide.html', 'mcp-client.js', 'mcp-pages.css']) assert.equal((await fetch(`${base}/addon/${asset}`)).status, 200);
  const headers = { accept: 'application/json, text/event-stream' };
  const init = await (await post('/mcp', { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'portable-smoke', version: '1' } } }, headers)).text();
  assert.match(init, /protocolVersion/);
  assert.ok(init.includes(`"version":"${version}"`));
  assert.match(await (await post('/mcp', { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, headers)).text(), /wps_run_render/);
  const agent = await get('/api/agent'); assert.equal(agent.tools.length, 11); assert.ok(agent.skills.some(s => s.name === 'wps-api'));
  const cfg = { kind: 'custom', label: 'Offline smoke', baseUrl: `http://127.0.0.1:${model.address().port}/v1`, api: 'openai-completions', apiKey: 'fixture', model: { id: 'fixture', name: 'fixture', contextWindow: 32768, maxTokens: 1024, reasoning: false, vision: false }, thinkingLevel: 'off', compat: { thinkingFormat: '', maxTokensField: '' }, revision: (await get('/api/config')).revision };
  assert.equal((await post('/api/config', cfg)).status, 200);
  const stream = await (await post('/api/chat', { message: '离线包模拟模型验证' })).text();
  assert.match(stream, /PORTABLE_OK/); assert.match(stream, /event: turn.end/); assert.equal(modelRequests, 1);
  assert.equal((await post('/api/desktop/stop', {})).status, 403, 'browser cannot stop the service without the private token');
  assert.equal(JSON.parse(await helper('restart')).ok, true);
  assert.notEqual(JSON.parse(await readFile(join(data, 'desktop-service.json'), 'utf8')).pid, metadata.pid);
  assert.ok((await get('/api/chat')).turns.length > 0, 'restart preserves sessions');
  assert.equal(JSON.parse(await helper('quit')).ok, true); started = false;
  console.log('Portable smoke passed: bundled Node, native executable, registration, MCP, resources, local model, duplicate start, restart and data retention (PATH empty).');
} finally {
  if (started) await helper('stop').catch(console.error);
  model.closeAllConnections(); await new Promise(r => model.close(r));
  await rm(data, { recursive: true, force: true });
}
