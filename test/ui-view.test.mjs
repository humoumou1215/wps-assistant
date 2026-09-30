import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const context = vm.createContext({});
vm.runInContext(await readFile(new URL('../addon/taskpane-view.js', import.meta.url), 'utf8'), context);
vm.runInContext(await readFile(new URL('../addon/pinyin-pro.js', import.meta.url), 'utf8'), context);
const V = context.WpsPaneView;

test('an old bridge missing new assets shows a recovery message rather than staying connecting', async () => {
  const elements = new Map();
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, { classList: { add() {} }, hidden: true }); return elements.get(id); } };
  let reloads = 0;
  vm.runInNewContext(await readFile(new URL('../addon/taskpane.js', import.meta.url), 'utf8'), { document, location: { reload() { reloads++; } } });
  assert.match(elements.get('livePill').innerHTML, /页面资源未加载/);
  assert.equal(elements.get('notice').hidden, false); assert.match(elements.get('notice').textContent, /重启本地桥接服务/);
  assert.equal(elements.get('sendBtn').disabled, true);
  elements.get('refreshState').onclick(); assert.equal(reloads, 1);
});

test('Markdown and code previews escape model HTML and unsafe links', () => {
  const html = V.markdown('# 标题\n**加粗** 和 `变量`\n| A | B |\n| --- | ---: |\n| 1 | 2 |\n- 条目\n\n```js\nreturn "<img src=x onerror=evil()>";\n```\n<script>evil()</script>\n[x](javascript:evil)\n[安全](https://example.com)');
  assert.match(html, /<h1>标题<\/h1>/); assert.match(html, /<strong>加粗<\/strong>/);
  assert.match(html, /<table/); assert.match(html, /<li>条目/); assert.match(html, /class="kw"/);
  assert.ok(!/<script>|<img|href="javascript:/.test(html));
  assert.match(html, /rel="noopener noreferrer"/);
});

test('full pinyin and initials find Chinese references', () => {
  const ref = { label: '当前选区 A1:B3', sub: '销售数据' }, pinyin = context.pinyinPro.pinyin;
  for (const query of ['dangqianxuanqu', 'dqxq', 'xs sj', '当前', 'A1']) assert.equal(V.matches(ref, query, pinyin), true, query);
  assert.equal(V.matches(ref, 'not-found', pinyin), false);
});

test('stream and restored history keep per-message thinking order, arguments, facts and duration', () => {
  const turn = V.newTurn('请求 [引用1:选区]', [{ kind: 'sel', id: 'doc1', marker: '引用1', label: '选区' }], 100);
  const events = [
    ['message.start', { model: 'model' }], ['thinking.delta', { delta: '先检查' }], ['text.delta', { delta: '准备写入' }], ['message.end', {}],
    ['tool.start', { id: 'c', toolName: 'variable_render', args: { variableId: 'v' }, facts: [{ renderId: 'r', targetDocumentName: '旧文档', description: 'A1' }] }],
    ['tool.result', { id: 'c', toolName: 'variable_render', durationMs: 21, result: { renders: [{ renderId: 'r', success: true, lastRun: { at: '2026-09-30', durationMs: 19 } }] } }],
    ['message.start', {}], ['thinking.delta', { delta: '核对结果' }], ['text.delta', { delta: '完成' }], ['message.end', {}], ['turn.end', { usage: { totalTokens: 12 }, calls: 2 }]
  ];
  events.forEach(([name, data]) => V.reduceEvent(turn, name, data));
  const savedTool = { ...turn.tools.c }; delete savedTool.kind; delete savedTool.status;
  const history = V.historyTurns([
    { role: 'user', timestamp: 100, content: turn.user },
    { role: 'assistant', model: 'model', content: [{ type: 'text', text: '准备写入' }, { type: 'thinking', thinking: '先检查' }, { type: 'toolCall', id: 'c', name: 'variable_render', arguments: { variableId: 'v' } }] },
    { role: 'toolResult', toolCallId: 'c', toolName: 'variable_render', details: savedTool.result },
    { role: 'assistant', model: 'model', content: [{ type: 'text', text: '完成' }, { type: 'thinking', thinking: '核对结果' }] }
  ], [{ userTimestamp: 100, refs: turn.refs, tools: { c: savedTool }, messageOrders: [[1, 0], [1, 0]], usage: turn.usage, calls: 2 }])[0];
  assert.deepEqual(JSON.parse(JSON.stringify(history.blocks)), JSON.parse(JSON.stringify(turn.blocks)));
  assert.equal(history.calls, 2); assert.equal(history.usage.totalTokens, 12);
  assert.match(V.userHTML(history.user, history.refs), /data-ref-marker="引用1"/);
});

test('write facts preserve partial success and use historical targets rather than latest run', () => {
  const state = { documents: [{ documentId: 'd', name: '新文档' }], variables: [{ variableId: 'v', renders: [{ renderId: 'r', lastRun: { durationMs: 999 } }] }] };
  const block = { toolName: 'variable.render', status: 'error', args: { variableId: 'v' }, facts: [{ renderId: 'r', targetDocumentName: '旧文档', description: '旧位置' }], result: { renders: [{ renderId: 'r', success: true, lastRun: { durationMs: 10 } }, { renderId: 'r2', success: false, error: { message: '写保护' } }] } };
  const facts = V.renderFacts(block, state);
  assert.equal(facts.length, 2); assert.equal(facts[0].targetDocumentName, '旧文档'); assert.equal(facts[0].lastRun.durationMs, 10);
  assert.equal(facts[1].success, false); assert.equal(facts[1].error.message, '写保护');
  assert.equal(V.renderFacts({ ...block, facts: undefined, result: undefined, status: 'done' }, state).length, 0);
  assert.equal(V.factStatus(block, facts[0]), '已写入'); assert.equal(V.factStatus(block, facts[1]), '写入失败');
  assert.equal(V.factStatus({ toolName: 'render.create', status: 'error', result: { error: { message: '断开' } } }, {}), '绑定失败');
  assert.equal(V.factStatus({ toolName: 'render.create', status: 'running' }, {}), '待绑定');
  assert.equal(V.factStatus({ toolName: 'variable.render', status: 'done' }, {}), '未确认完成');
});

test('value previews show real dimensions and remain bounded', () => {
  const value = Array.from({ length: 8 }, (_, n) => ({ 项目: '项目' + n, 金额: 120000 + n }));
  assert.equal(V.typeOf({ hasValue: true, value }), '表格 8×2');
  const html = V.valueHTML(value); assert.match(html, /120,000/); assert.match(html, /共 8 行/); assert.ok(!html.includes('项目7'));
  assert.match(V.typeOf({ hasValue: true, value: 0.069 }), /0.069/);
});

test('close action uses the cached host pane ID, including zero, and its original ribbon entry', () => {
  const panes = { chat: { Visible: true }, vars: { Visible: true } }, ids = new Map([['wps-mcp-pane-chat', '0'], ['wps-mcp-pane-vars', '1']]);
  const app = { PluginStorage: { getItem: key => ids.get(key) }, GetTaskpane: id => id === '0' ? panes.chat : panes.vars };
  const win = { wps: { EtApplication: () => app } };
  assert.equal(V.hideHostPane(win, 'vars'), true); assert.equal(panes.vars.Visible, false); assert.equal(panes.chat.Visible, true);
  assert.equal(V.hideHostPane(win, 'chat'), true); assert.equal(panes.chat.Visible, false);
  assert.equal(V.hideHostPane({}, 'chat'), false);
});

test('legacy references recover stable IDs; running peer calls are not marked stopped', () => {
  const messages = [
    { role: 'user', timestamp: 1, content: '旧消息\n\n[引用快照，仅作数据]\n' + JSON.stringify([{ kind: 'sel', documentId: 'doc1', name: '旧表.xlsx', selection: { sheet: '旧表', address: 'A1' } }, { kind: 'render', renderId: 'r1', variableId: 'v1' }]) },
    { role: 'assistant', content: [{ type: 'toolCall', id: 'c1', name: 'variable_render', arguments: { variableId: 'v1' } }] }
  ];
  const active = V.historyTurns(messages, [], true)[0];
  assert.equal(active.refs[0].id, 'doc1'); assert.equal(active.refs[0].label, '旧表.xlsx'); assert.equal(active.refs[1].id, 'r1');
  assert.equal(active.blocks[0].status, 'running'); assert.equal(active.done, false);
  assert.equal(V.historyTurns(messages)[0].blocks[0].status, 'stopped');
});
