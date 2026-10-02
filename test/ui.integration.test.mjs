import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { startHarness } from './helpers/ui-harness.mjs';

test('task pane API, isolated pi session, full tool loop, errors, cancellation and config privacy', { timeout: 60000 }, async () => {
  const h = await startHarness();
  const get = async path => (await fetch(h.base + path)).json();
  const post = async (path, data, headers = {}) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  try {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal((await get('/api/state')).pluginVersion, pkg.version);
    const resources = await get('/api/agent');
    assert.equal(h.requests.length, 0, 'resources can be inspected before configuring a model, without a model request');
    assert.match(resources.systemPrompt, /<available_skills>/);
    assert.match(resources.systemPrompt, /wps-api/);
    assert.equal(resources.skills.find(s => s.name === 'wps-api').content, await readFile(new URL('../skills/wps-api/SKILL.md', import.meta.url), 'utf8'));
    assert.match(await readFile(h.dir + '/pi/skills/wps-api/references/spreadsheet.md', 'utf8'), /Range/);
    assert.equal(resources.tools.length, 11);
    assert.ok(resources.tools.filter(t => t.name !== 'read').every(t => /^wps_[a-z]+(?:_[a-z]+)*$/.test(t.name)));
    assert.ok(resources.tools.some(t => t.name === 'read' && t.parameters.properties.path));
    assert.equal((await fetch(h.base + '/api/agent', { headers: { Origin: 'https://evil.example' } })).status, 403);
    for (const path of ['/addon/taskpane.html', '/addins/et/taskpane.js', '/addins/wpp/taskpane.css', '/addins/wps/taskpane.html']) assert.equal((await fetch(h.base + path)).status, 200);
    for (const prefix of ['/addon', '/addins/et', '/addins/wpp', '/addins/wps']) {
      for (const icon of ['assistant', 'variables', 'status']) {
        const response = await fetch(`${h.base}${prefix}/ribbon-${icon}.png`);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('content-type'), 'image/png');
        assert.deepEqual([...new Uint8Array(await response.arrayBuffer()).slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
      }
    }
    assert.equal((await fetch(h.base + '/addins/et/taskpane.html/extra')).status, 404);
    assert.equal((await post('/api/config', h.cfg, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await fetch(h.base + '/api/config', { method: 'POST', body: '{}' })).status, 415);
    assert.equal((await post('/api/config', { ...h.cfg, model: { ...h.cfg.model, maxTokens: 999999 } })).status, 400);
    const saved = await (await post('/api/config', h.cfg)).json();
    assert.equal(saved.hasKey, true); assert.equal(saved.hasHeaders, true);
    assert.ok(!JSON.stringify(saved).includes('secret'));
    assert.equal((await post('/api/config/test', { ...h.cfg, apiKey: undefined, headers: undefined })).status, 200);
    assert.equal(h.requests.at(-1).headers.authorization, 'Bearer ui-test-secret');
    assert.equal(h.requests.at(-1).headers['x-test'], 'header-secret');
    // NTFS carries no POSIX permission bits; Node reports 0o666 for any writable file on Windows.
    if (process.platform !== 'win32') assert.equal((await stat(h.dir + '/config.json')).mode & 0o777, 0o600);
    const stream = await (await post('/api/chat', { message: '验证绑定', refs: [{ kind: 'sel', id: 'doc_001', selection: { sheet: '销售数据', address: 'A1:B3' } }] })).text();
    assert.match(stream, /event: tool.start/); assert.match(stream, /绑定已完成/); assert.match(stream, /event: turn.end/);
    assert.equal(h.appState.written, 120);
    const state = await get('/api/state'); assert.equal(state.variables.length, 1);
    assert.equal(state.variables[0].transform.sourceRef, '销售数据!A1:B3');
    assert.ok(state.variables[0].transform.lastRun); assert.ok(state.variables[0].renders[0].lastRun);
    const chatRequest = h.requests.find(r => r.body.tools?.length);
    assert.equal(chatRequest.body.tools.length, 11);
    assert.ok(chatRequest.body.tools.every(t => !['write', 'edit', 'bash', 'powershell'].includes(t.function.name)));
    assert.match(JSON.stringify(chatRequest.body.messages), /引用快照/);
    const currentResources = await get('/api/agent');
    const sentSystem = chatRequest.body.messages.find(m => m.role === 'system');
    const sentSystemText = typeof sentSystem.content === 'string' ? sentSystem.content : sentSystem.content.map(c => c.text || '').join('');
    assert.equal(sentSystemText, currentResources.systemPrompt, 'inspector shows the exact system prompt sent to the model');
    assert.deepEqual(currentResources.tools.map(t => t.name).sort(), chatRequest.body.tools.map(t => t.function.name).sort());
    const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
    const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
    const mcp = new Client({ name: 'tool-names-test', version: '1.0.0' });
    try {
      await mcp.connect(new StreamableHTTPClientTransport(new URL(h.base + '/mcp')));
      const exposed = await mcp.listTools();
      assert.deepEqual(exposed.tools.map(t => t.name).sort(), currentResources.tools.filter(t => t.name !== 'read').map(t => t.name).sort(), 'MCP and pi expose the same WPS names');
    } finally { await mcp.close(); }
    const skillsStream = await (await post('/api/chat', { message: '技能读取' })).text();
    assert.match(skillsStream, /技能资料已读取/);
    const skillsHistory = await get('/api/chat');
    const readResults = skillsHistory.messages.filter(m => m.role === 'toolResult' && m.toolName === 'read');
    assert.equal(readResults.length, 2);
    assert.match(readResults[0].content[0].text, /WPS API skill/);
    assert.match(readResults[1].content[0].text, /Range/);
    const variableId = state.variables[0].variableId;
    h.appState.value = 340;
    assert.equal((await post('/api/actions', { op: 'transform', variableId })).status, 200);
    assert.equal((await post('/api/actions', { op: 'render', variableId })).status, 200);
    assert.equal(h.appState.written, 340);
    h.appState.failRender = true;
    const failed = await post('/api/actions', { op: 'render', variableId }); assert.equal(failed.status, 422); assert.match(await failed.text(), /模拟文档写保护/);
    h.appState.failRender = false;
    const blocked = await (await post('/api/chat', { message: '守卫验证' })).text();
    assert.equal((blocked.match(/event: tool.start/g) || []).length, 3);
    assert.equal((await get('/api/state')).variables.length, 1);
    const failure = await (await post('/api/chat', { message: '模拟失败' })).text(); assert.match(failure, /event: error/);
    assert.ok((await get('/api/chat')).messages.length > 1);
    const disk = JSON.parse(await readFile(h.dir + '/state.json', 'utf8')); assert.equal(disk.variables[0].value, 340);
    const controller = new AbortController();
    const slow = await fetch(h.base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '慢响应' }), signal: controller.signal });
    assert.equal((await post('/api/chat', { message: '同时发送' })).status, 409);
    assert.equal((await post('/api/config', h.cfg)).status, 409);
    controller.abort();
    for (let i = 0; i < 30 && (await get('/api/chat')).busy; i++) await new Promise(r => setTimeout(r, 100));
    assert.equal((await get('/api/chat')).busy, false);
    await post('/api/config', { ...h.cfg, baseUrl: `http://localhost:${h.modelPort}/v1`, apiKey: undefined, headers: undefined });
    assert.equal((await get('/api/config')).hasKey, false);
    assert.equal((await get('/api/config')).hasHeaders, false);
  } finally { await h.close(); }
});

test('a later chat turn updates the original rules, recalculates and writes without duplicate bindings', { timeout: 30000 }, async () => {
  const h = await startHarness();
  const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const state = async () => (await (await fetch(h.base + '/api/state')).json()).variables;
  try {
    await post('/api/config', h.cfg);
    await (await post('/api/chat', { message: '验证绑定' })).text();
    const original = (await state())[0];
    const stream = await (await post('/api/chat', { message: '修改规则：计算三条数据的平均值，写入时乘以十。', refs: [{ kind: 'var', id: original.variableId }] })).text();
    assert.match(stream, /原规则已修改/);
    const variables = await state();
    assert.equal(variables.length, 1);
    const updated = variables[0];
    assert.equal(updated.variableId, original.variableId);
    assert.equal(updated.transform.transformId, original.transform.transformId);
    assert.equal(updated.renders.length, 1);
    assert.equal(updated.renders[0].renderId, original.renders[0].renderId);
    assert.equal(updated.value, 40); assert.equal(h.appState.written, 400);
    const history = await (await fetch(h.base + '/api/chat')).json();
    const last = history.turns.at(-1);
    assert.deepEqual(Object.values(last.tools).map(t => t.toolName), ['wps_get_variable', 'wps_update_variable', 'wps_run_transform', 'wps_update_render', 'wps_run_render']);
    const read = Object.values(last.tools)[0].result;
    assert.equal(read.transform.code, original.transform.code);
    assert.equal(read.renders[0].code, original.renders[0].code);
    assert.equal(Object.values(last.tools).at(-1).args.renderId, original.renders[0].renderId);
  } finally { await h.close(); }
});

test('saved bindings and legacy pi tool calls survive restart and use canonical names in later model requests', { timeout: 30000 }, async () => {
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = await mkdtemp(join(tmpdir(), 'wps-ui-restart-'));
  let h;
  try {
    h = await startHarness({ dataDir: dir });
    const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    await post('/api/config', h.cfg);
    await (await post('/api/chat', { message: '验证绑定' })).text();
    await (await post('/api/chat', { message: '修改规则' })).text();
    const beforeStats = (await (await fetch(h.base + '/api/chat')).json()).sessionStats;
    await h.close();
    const oldNames = { wps_list_documents: 'workspace_list_documents', wps_get_document: 'document_get', wps_run_readonly_code: 'wps_exec', wps_create_variable: 'transform_create', wps_update_variable: 'wps_update_transform', wps_create_render: 'render_create', wps_get_variable: 'variable_get', wps_run_transform: 'variable_transform', wps_run_render: 'variable_render' };
    const legacy = value => {
      if (Array.isArray(value)) return value.map(legacy);
      if (!value || typeof value !== 'object') return value;
      const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, legacy(item)]));
      if (result.type === 'toolCall' && oldNames[result.name]) result.name = oldNames[result.name];
      if (oldNames[result.toolName]) result.toolName = oldNames[result.toolName];
      return result;
    };
    const sessionFiles = (await readdir(dir + '/pi/sessions')).filter(name => name.endsWith('.jsonl'));
    assert.ok(sessionFiles.length);
    for (const name of sessionFiles) {
      const file = dir + '/pi/sessions/' + name;
      const lines = (await readFile(file, 'utf8')).trim().split('\n').map(line => JSON.stringify(legacy(JSON.parse(line))));
      await writeFile(file, lines.join('\n') + '\n');
    }
    h = await startHarness({ dataDir: dir });
    const state = await (await fetch(h.base + '/api/state')).json();
    assert.equal(state.documents[0].documentId, state.variables[0].transform.sourceDocumentId);
    assert.equal(state.variables[0].value, 40);
    const history = await (await fetch(h.base + '/api/chat')).json();
    assert.ok(history.messages.some(m => m.role === 'assistant'));
    assert.deepEqual(history.sessionStats, beforeStats, 'complete statistics survive restarting without another model call');
    assert.equal((await post('/api/actions', { op: 'render', variableId: state.variables[0].variableId })).status, 200);
    assert.equal(h.appState.written, 400);
    await post('/api/config', h.cfg);
    const correction = await (await post('/api/chat', { message: '修改规则' })).text();
    assert.match(correction, /原规则已修改/); assert.equal(h.appState.written, 400);
    const request = h.requests.find(r => r.body.tools?.length).body;
    const calls = request.messages.flatMap(m => m.tool_calls || []).map(c => c.function.name);
    assert.ok(calls.includes('wps_create_variable'));
    assert.ok(calls.includes('wps_update_variable'));
    assert.ok(!calls.includes('wps_update_transform'), 'previous update calls use the new name in model context');
    assert.ok(calls.every(name => name.startsWith('wps_')), 'historical calls are normalized before reaching the model');
    const { normalizeToolMessages } = await import('../dist/src/tool-names.js');
    const normalized = normalizeToolMessages(history.messages);
    const results = normalized.filter(m => m.role === 'toolResult');
    assert.ok(results.length && results.every(m => m.toolName.startsWith('wps_')));
    assert.ok(history.messages.some(m => m.role === 'toolResult' && m.toolName === 'variable_get'), 'normalizing model context leaves saved tool results intact');
    assert.ok(history.messages.some(m => m.role === 'toolResult' && m.toolName === 'wps_update_transform'));
    const saved = (await Promise.all(sessionFiles.map(name => readFile(dir + '/pi/sessions/' + name, 'utf8')))).join('');
    assert.match(saved, /"name":"transform_create"/, 'original persisted history is retained');
    assert.match(saved, /"name":"wps_update_transform"/);
  } finally { if (h) await h.close(); await rm(dir, { recursive: true, force: true }); }
});

test('session statistics separate cached input and count every model/tool message', { timeout: 30000 }, async () => {
  const h = await startHarness({ usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120, prompt_tokens_details: { cached_tokens: 80 } } });
  const get = async () => (await fetch(h.base + '/api/chat')).json();
  const post = (path, body) => fetch(h.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const empty = (await get()).sessionStats;
    assert.equal(empty.userMessages, 0);
    assert.equal(empty.cacheHitRate, null, 'empty usage has no cache rate');
    assert.equal(h.requests.length, 0, 'reading stats never calls the model');
    await post('/api/config', h.cfg);
    const stream = await (await post('/api/chat', { message: '验证绑定' })).text();
    const end = JSON.parse(stream.match(/event: turn.end\ndata: ([^\n]+)/)[1]);
    const stats = (await get()).sessionStats;
    assert.deepEqual(stats.tokens, { input: 180, output: 180, cacheRead: 720, cacheWrite: 0, total: 1080 });
    assert.equal(stats.cacheHitRate, 80);
    assert.equal(stats.rounds, 1);
    assert.equal(stats.modelCalls, 9);
    assert.equal(stats.userMessages, 1);
    assert.equal(stats.assistantMessages, 9);
    assert.equal(stats.toolCalls, 8);
    assert.equal(stats.toolResults, 8);
    assert.equal(stats.otherMessages, 1, 'SDK also counts the system message');
    assert.equal(stats.totalMessages, 19);
    assert.equal(stats.costComplete, false, 'zero configured custom prices do not mean free usage');
    assert.ok(stats.activeDurationMs > 0);
    assert.ok(stats.sessionId);
    assert.match(stats.sessionFile, /\.jsonl$/);
    assert.equal(stats.projectDirectory, join(h.dir, 'pi'));
    assert.deepEqual(end.sessionStats.tokens, stats.tokens, 'streaming completion carries updated totals');
    await (await post('/api/chat', { message: '第二轮' })).text();
    const next = (await get()).sessionStats;
    assert.equal(next.rounds, 2);
    assert.equal(next.modelCalls, 10);
    assert.equal(next.cacheHitRate, 80);
    assert.deepEqual(next.tokens, { input: 200, output: 200, cacheRead: 800, cacheWrite: 0, total: 1200 });
  } finally { await h.close(); }
});
