import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

export async function startHarness({ port = 0, modelPort = 0, dataDir, toolSteps, serviceEnv = {}, usage = { prompt_tokens: 40, completion_tokens: 10, total_tokens: 50 } } = {}) {
  if (!port) { const probe = createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r)); port = probe.address().port; await new Promise(r => probe.close(r)); }
  const dir = dataDir || await mkdtemp(join(tmpdir(), 'wps-ui-test-'));
  const requests = [], appState = { value: 120, written: null, failRender: false, type: 'spreadsheet', activeSheet: '销售数据', selection: { sheet: '销售数据', address: 'A1:B3' }, inspected: 0, reads: [] };
  const model = createServer(async (req, res) => {
    let raw = ''; for await (const data of req) raw += data;
    const body = JSON.parse(raw || '{}'); requests.push({ body, headers: req.headers });
    const messages = body.messages || []; const userIndex = messages.findLastIndex(m => m.role === 'user');
    const userContent = messages[userIndex]?.content;
    const user = typeof userContent === 'string' ? userContent : (userContent || []).map(c => c.text || '').join('');
    if (user.includes('模拟失败')) { res.writeHead(401); res.end(JSON.stringify({ error: { message: 'invalid key' } })); return; }
    if (user.includes('慢响应')) await new Promise(r => { const timer = setTimeout(r, 10000); res.on('close', () => { clearTimeout(timer); r(); }); });
    if (res.destroyed) return;
    const results = messages.slice(userIndex + 1).filter(m => m.role === 'tool');
    const parsed = results.map(m => { try { return JSON.parse(m.content); } catch { return {}; } });
    const variableId = parsed.find(v => v.variableId)?.variableId || 'var_001';
    const steps = toolSteps ?? [
      ['wps_list_documents', {}], ['wps_get_document', { documentId: 'doc_001' }],
      ['wps_run_readonly_code', { documentId: 'doc_001', code: 'return Application.ActiveWorkbook.Name;' }],
      ['wps_create_variable', { variableName: '销售合计', sourceDocumentId: 'doc_001', sourceRef: '销售数据!A1:B3', description: 'UI 验证变量', code: 'return Application.ActiveSheet.Range("B3").Value2;' }],
      ['wps_run_transform', { variableId }],
      ['wps_create_render', { variableId, targetDocumentId: 'doc_001', description: '销售数据!D3', code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return Application.ActiveSheet.Range("D3").Value2;' }],
      ['wps_run_render', { variableId }], ['wps_get_variable', { variableId }],
    ];
    let step = toolSteps || user.includes('验证绑定') ? steps[results.length] : null;
    if (user.includes('修改规则')) step = [
      ['wps_get_variable', { variableId }],
      ['wps_update_variable', { variableId, code: 'return Application.ActiveSheet.Range("B3").Value2 / 3;' }],
      ['wps_run_transform', { variableId }],
      ['wps_update_render', { variableId, renderId: parsed.find(v => v.renders)?.renders[0]?.renderId, code: 'Application.ActiveSheet.Range("D3").Value2 = variable.value * 10; return Application.ActiveSheet.Range("D3").Value2;' }],
      ['wps_run_render', { variableId, renderId: parsed.find(v => v.renders)?.renders[0]?.renderId }],
    ][results.length];
    if (user.includes('技能读取')) step = [['read', { path: 'wps-api/SKILL.md' }], ['read', { path: 'wps-api/references/spreadsheet.md' }]][results.length];
    if (user.includes('守卫验证')) step = ['wps_create_variable', { variableName: 'blocked', sourceDocumentId: 'doc_001', code: 'Application.ActiveSheet.Name = "bad"; return true;' }];
    const content = step ? null : user.includes('修改规则') ? '原规则已修改，重算并重写完成。' : user.includes('技能读取') ? '技能资料已读取。' : user.includes('原型回归') ? '## 绑定已完成\n已将 **销售合计** 写入 `销售数据!D3`。\n\n| 指标 | 数值 |\n| --- | ---: |\n| 销售合计 | 120 |\n\n- 目标：UI验证.xlsx\n- 可在变量页重算、逐条重写。\n\n```js\nreturn variable.value;\n```' : user.includes('验证绑定') ? '绑定已完成：销售合计已写入销售数据!D3。' : 'OK，模型连接正常。';
    const toolCalls = step ? [{ index: 0, id: 'call_' + results.length, type: 'function', function: { name: step[0], arguments: JSON.stringify(step[1]) } }] : undefined;
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    const chunk = (delta, finish_reason = null) => res.write(`data: ${JSON.stringify({ id: 'completion-test', object: 'chat.completion.chunk', created: 1, model: body.model, choices: [{ index: 0, delta, finish_reason }] })}\n\n`);
    if (user.includes('原型回归')) chunk({ role: 'assistant', reasoning_content: '先核对引用快照与明确文档，再检查工具结果。' });
    chunk({ role: 'assistant', ...(toolCalls ? { tool_calls: toolCalls } : { content }) });
    res.write(`data: ${JSON.stringify({ id: 'completion-test', choices: [], usage })}\n\n`);
    chunk({}, step ? 'tool_calls' : 'stop'); res.end('data: [DONE]\n\n');
  });
  await new Promise(r => model.listen(modelPort, '127.0.0.1', r)); modelPort = model.address().port;
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [fileURLToPath(new URL('../../dist/src/server.js', import.meta.url))], { env: { ...process.env, ...serviceEnv, WPS_MCP_PORT: String(port), WPS_MCP_DATA_DIR: dir, WPS_MCP_TRANSPORT: 'http' }, stdio: ['ignore', 'ignore', 'pipe'] });
  let log = ''; child.stderr.on('data', chunk => { log += chunk; });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/health')).ok) break; } catch {} if (child.exitCode !== null) throw new Error(log); await new Promise(r => setTimeout(r, 100)); }
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const workbook = { Name: 'UI验证.xlsx' };
  const app = { ActiveWorkbook: workbook, ActiveSheet: { Range(address) { appState.reads.push(address); return { get Value2() { return address === 'D3' ? appState.written : appState.value; }, set Value2(value) { if (appState.failRender) throw new Error('模拟文档写保护'); appState.written = value; } }; } } };
  workbook.Worksheets = { Item(name) { if (!['销售数据', 'Summary'].includes(name)) throw new Error('工作表不存在'); return app.ActiveSheet; } };
  app.Workbooks = { Item(name) { if (name !== workbook.Name) throw new Error('文档不存在'); return workbook; } };
  function executeFixture(code, variable) {
    // This is a closed fixture interpreter, not a JavaScript execution host.
    // Unknown source is rejected instead of executing network-provided code.
    if (code === 'return Application.ActiveWorkbook.Name;') return workbook.Name;
    if (code === 'return Application.ActiveSheet.Range("B3").Value2;') return app.ActiveSheet.Range('B3').Value2;
    if (code === 'return Application.ActiveSheet.Range("B3").Value2 / 3;') return app.ActiveSheet.Range('B3').Value2 / 3;
    if (code === 'return variable.value;') return variable.value;
    if (code === 'Application.ActiveSheet.Range("D3").Value2 = variable.value * 10; return true;') {
      app.ActiveSheet.Range('D3').Value2 = variable.value * 10; return true;
    }
    if (code === 'Application.ActiveSheet.Range("D3").Value2 = variable.value * 10; return Application.ActiveSheet.Range("D3").Value2;') {
      app.ActiveSheet.Range('D3').Value2 = variable.value * 10; return app.ActiveSheet.Range('D3').Value2;
    }
    if (code === 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return Application.ActiveSheet.Range("D3").Value2;') {
      app.ActiveSheet.Range('D3').Value2 = variable.value; return app.ActiveSheet.Range('D3').Value2;
    }
    if (code === 'Application.ActiveSheet.Range("D3").Value2 = variable.value; return true;') {
      app.ActiveSheet.Range('D3').Value2 = variable.value; return true;
    }
    if (code === 'return new Promise(resolve => setTimeout(() => { Application.ActiveSheet.Range("D3").Value2 = variable.value; resolve(true); }, 150));') {
      return new Promise(resolve => setTimeout(() => { app.ActiveSheet.Range('D3').Value2 = variable.value; resolve(true); }, 150));
    }
    if (code === 'return Application.reviewGate.then(() => { Application.ActiveSheet.Range("D3").Value2 = variable.value; return true; });') {
      return app.reviewGate.then(() => { app.ActiveSheet.Range('D3').Value2 = variable.value; return true; });
    }
    if (code === 'throw new Error("目标不可写");') throw new Error('目标不可写');
    const constant = code.match(/^return (.*);$/s)?.[1];
    if (constant !== undefined) { try { return JSON.parse(constant); } catch {} }
    const list = code.match(/^return \[(.*)\];$/s)?.[1];
    if (list !== undefined) {
      const jsonString = '"(?:[^"\\\\]|\\\\.)*"';
      const range = new RegExp('Application\\.Workbooks\\.Item\\((' + jsonString + ')\\)\\.Worksheets\\.Item\\((' + jsonString + ')\\)\\.Range\\((' + jsonString + ')\\)\\.Value2', 'g');
      const matches = [...list.matchAll(range)];
      if (matches.length && matches.map(match => match[0]).join(',') === list) {
        return matches.map(match => app.Workbooks.Item(JSON.parse(match[1])).Worksheets.Item(JSON.parse(match[2])).Range(JSON.parse(match[3])).Value2);
      }
    }
    throw new Error('Unsupported fixture code');
  }
  await new Promise((resolve, reject) => {
    socket.on('error', reject);
    socket.on('message', async raw => {
      const message = JSON.parse(raw);
      if (message.type === 'welcome') socket.send(JSON.stringify({ type: 'register', documents: [{ documentKey: 'ui-fixture', name: workbook.Name, type: 'spreadsheet', selectionVersion: 2, activeSheet: '销售数据', selection: { sheet: '销售数据', address: 'A1:B3' } }] }));
      if (message.type === 'registered') resolve();
      if (message.type === 'request') {
        if (message.method === 'navigate') {
          appState.navigation = { documentKey: message.documentKey, ...message.location };
          socket.send(JSON.stringify({ type: 'response', id: message.id, payload: { success: true, result: message.location } }));
          return;
        }
        try {
          if (message.method === 'inspect') appState.inspected++;
          const result = message.method === 'inspect'
            ? { documentKey: 'ui-fixture', name: workbook.Name, type: appState.type, selectionVersion: 2, activeSheet: appState.activeSheet, ...(appState.selection ? { selection: appState.selection } : {}) }
            : await executeFixture(message.code, message.variable);
          socket.send(JSON.stringify({ type: 'response', id: message.id, payload: { success: true, result } }));
        }
        catch (error) { socket.send(JSON.stringify({ type: 'response', id: message.id, payload: { success: false, error: error.message } })); }
      }
    });
  });
  const cfg = { kind: 'custom', label: '本地验证模型', baseUrl: `http://127.0.0.1:${modelPort}/v1`, api: 'openai-completions', apiKey: 'ui-test-secret', model: { id: 'ui-test-model', name: 'UI 验证模型', contextWindow: 32768, maxTokens: 2048, reasoning: false, vision: false }, compat: { thinkingFormat: '', maxTokensField: '' }, headers: { 'X-Test': 'header-secret' }, thinkingLevel: 'off' };
  return { base, port, modelPort, dir, cfg, child, socket, requests, appState, app,
    async close() { socket.close(); child.kill(); await new Promise(r => child.exitCode !== null ? r() : child.once('exit', r)); model.closeAllConnections(); await new Promise(r => model.close(r)); if (!dataDir) await rm(dir, { recursive: true, force: true }); } };
}
