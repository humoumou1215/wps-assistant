import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const context = vm.createContext({ structuredClone });
vm.runInContext(await readFile(new URL('../addon/taskpane-view.js', import.meta.url), 'utf8'), context);
vm.runInContext(await readFile(new URL('../addon/pinyin-pro.js', import.meta.url), 'utf8'), context);
const V = context.WpsPaneView;

test('selection chips follow current sheet and text ranges while fixed and sent snapshots stay put', () => {
  const state = { documents: [{ documentId: 'd', connected: true, name: '经营.xlsx', activeSheet: 'Sales', selection: { sheet: 'Sales', address: '$A$1:$B$4' } }], variables: [] };
  const refs = V.referenceCatalog(state).filter(r => r.kind === 'sel');
  const current = refs.find(r => r.selectionMode === 'current'), fixed = refs.find(r => r.selectionMode === 'fixed');
  assert.match(current.label, /当前选区.*经营.xlsx.*Sales!\$A\$1:\$B\$4/);
  assert.match(fixed.label, /固定选区.*Sales!/);
  state.documents[0].activeSheet = 'Summary'; state.documents[0].selection = { sheet: 'Summary', address: 'D1:D4' };
  const moved = V.selectionReference(current, state);
  assert.match(moved.label, /Summary!D1:D4/); assert.equal(moved.selection.address, 'D1:D4');
  assert.equal(V.selectionReference(fixed, state).selection.address, '$A$1:$B$4');
  const sent = { ...moved, selectionResolved: true };
  state.documents[0].selection.address = 'Z9';
  assert.equal(V.selectionReference(sent, state).selection.address, 'D1:D4');
  const turn = V.newTurn('[引用1:旧标签]', [{ ...current, marker: '引用1' }]);
  V.reduceEvent(turn, 'refs.resolved', { refs: [{ ...sent, marker: '引用1' }] });
  assert.match(V.userHTML(turn.user, turn.refs), /Summary!D1:D4/);
  state.documents[0].connected = false;
  assert.equal(V.selectionReference(current, state).selection, undefined);
  assert.match(V.selectionReference(current, state).label, /不可用/);
  const text = { kind: 'sel', name: '汇报.pptx', selectionMode: 'fixed', activeSlide: 1, selection: { type: 'text', shapeNames: ['TextBox 1'], text: '经营<script>', start: 3, length: 2 } };
  assert.match(V.selectionLabel(text), /汇报.pptx.*第 1 页.*TextBox 1.*经营/);
  const details = V.selectionDetailsHTML(text);
  assert.match(details, /起点 3 · 2 字符/); assert.match(details, /经营&lt;script&gt;/); assert.ok(!details.includes('<script>'));
});

test('composer variable and Render candidates follow the mode while document and selection candidates remain online', () => {
  const state = {
    documents: [{ documentId: 'live', name: '在线.xlsx', type: 'spreadsheet', connected: true, activeSheet: 'Sheet1', selection: { address: 'A1:B4' } }],
    variables: [
      { variableId: 'source', name: '在线来源', transform: { sourceDocumentId: 'live' }, renders: [] },
      { variableId: 'target', name: '在线目标', transform: { sourceDocumentId: 'offline' }, renders: [{ renderId: 'r_live', targetDocumentId: 'live' }, { renderId: 'r_offline', targetDocumentId: 'offline' }] },
      { variableId: 'history', name: '历史变量', transform: { sourceDocumentId: 'offline' }, renders: [{ renderId: 'r_history', targetDocumentId: 'offline' }] },
    ],
  };
  const current = V.referenceCatalog(state, 'current');
  assert.equal(Array.from(current.filter(ref => ref.kind === 'var'), ref => ref.id).join(','), 'source,target');
  assert.equal(Array.from(current.filter(ref => ref.kind === 'render'), ref => ref.id).join(','), 'r_live,r_offline');
  assert.equal(Array.from(current.filter(ref => ['doc', 'sel'].includes(ref.kind)), ref => ref.kind).join(','), 'doc,sel,sel');
  const all = V.referenceCatalog(state, 'all');
  assert.equal(all.filter(ref => ref.kind === 'var').length, 3);
  assert.equal(all.filter(ref => ref.kind === 'render').length, 3);
  assert.equal(current.filter(ref => V.matches(ref, '历史变量')).length, 0);
  assert.equal(all.filter(ref => V.matches(ref, '历史变量')).length, 2);
  state.documents[0].selection.address = 'D9';
  assert.equal(current.find(ref => ref.selectionMode === 'fixed').selection.address, 'A1:B4', 'fixed selection candidates retain their original snapshot');
  const liveSelection = current.find(ref => ref.selectionMode === 'current');
  assert.equal(V.selectionReference(liveSelection, state).selection.address, 'D9');
  for (const mode of ['current', 'all']) {
    assert.equal(Array.from(V.referenceCatalog(state, mode).filter(ref => ref.kind === 'sel'), ref => ref.selectionMode).join(','), 'current,fixed', 'variable display mode preserves both selection types');
  }
  state.documents[0].connected = false;
  assert.equal(V.referenceCatalog(state, 'current').length, 0);
  assert.equal(V.referenceCatalog(state, 'all').length, 6);
  assert.equal(V.referenceCatalog(state, 'all', false).length, 0);
});

test('draft and restored variable references mark deleted definitions, retain labels and preserve unrelated bindings', () => {
  const state = { documents: [], variables: [{ variableId: 'var_001', name: '销售合计', renders: [{ renderId: 'render_001' }, { renderId: 'render_002' }] }] };
  const variable = { kind: 'var', id: 'var_001', label: '销售合计', marker: '引用1' };
  const render = { kind: 'render', id: 'render_001', label: 'render_001 · 销售合计', marker: '引用2' };
  const other = { kind: 'render', id: 'render_002', label: 'render_002 · 销售合计' };
  assert.equal(V.variableReference(variable, state).unavailable, false, 'offline definitions remain valid');
  const sent = structuredClone(render);
  state.variables[0].renders.shift();
  const deleted = V.variableReference(render, state);
  assert.equal(deleted.unavailable, true); assert.equal(deleted.label, render.label); assert.equal(deleted.marker, render.marker);
  assert.match(V.referenceChipLabel(deleted), /已删除/);
  assert.equal(V.variableReference(variable, state).unavailable, false);
  assert.equal(V.variableReference(other, state).unavailable, false);
  assert.equal(sent.unavailable, undefined, 'history snapshots are not mutated by draft validation');
  state.variables.length = 0;
  assert.equal(V.variableReference(variable, state).unavailable, true);
  assert.equal(V.variableReference(other, state).unavailable, true);
  assert.equal(V.variableReference({ kind: 'render', renderId: 'render_002' }, state).unavailable, true, 'legacy restored references are also checked');
  const doc = { kind: 'doc', id: 'doc_001' }; assert.equal(V.variableReference(doc, state), doc);
});

test('current variables match online source OR target by ID, preserve every binding and deduplicate', () => {
  const variable = (id, source, targets = []) => ({ variableId: id, transform: { sourceDocumentId: source }, renders: targets.map(targetDocumentId => ({ targetDocumentId })) });
  const state = { documents: [{ documentId: 'online', name: '同名', connected: true }, { documentId: 'offline', name: '同名', connected: false }], variables: [
    variable('source', 'online', ['offline']), variable('target', 'offline', ['online', 'offline']), variable('hidden', 'offline', ['offline']),
    variable('unbound', 'online'), variable('offlineUnbound', 'offline'), variable('duplicate', 'online', ['online', 'online']), variable('unknown', 'unknown', ['closed']),
  ] };
  assert.equal(Array.from(V.variablesInMode(state, 'current'), v => v.variableId).join(','), 'source,target,unbound,duplicate');
  assert.equal(V.variablesInMode(state, 'current')[1].renders.length, 2);
  assert.equal(V.variablesInMode(state, 'all').length, 7);
  assert.equal(V.variablesInMode(state, 'current', false).length, 0);
  state.documents[0].connected = false;
  assert.equal(V.variablesInMode(state, 'current').length, 0);
  state.documents[1].connected = true;
  assert.equal(Array.from(V.variablesInMode(state, 'current'), v => v.variableId).join(','), 'source,target,hidden,offlineUnbound');
});

test('mode batch actions skip offline sources and individual offline or valueless Render targets', () => {
  const state = { documents: [{ documentId: 'online', connected: true }], variables: [
    { variableId: 'source', hasValue: true, transform: { sourceDocumentId: 'online' }, renders: [{ renderId: 'off', targetDocumentId: 'offline' }] },
    { variableId: 'target', hasValue: true, transform: { sourceDocumentId: 'offline' }, renders: [{ renderId: 'on', targetDocumentId: 'online' }, { renderId: 'off2', targetDocumentId: 'offline' }] },
    { variableId: 'empty', hasValue: false, transform: { sourceDocumentId: 'online' }, renders: [{ renderId: 'unset', targetDocumentId: 'online' }] },
    { variableId: 'hidden', hasValue: true, transform: { sourceDocumentId: 'offline' }, renders: [] },
  ] };
  for (const mode of ['all', 'current']) {
    assert.equal(Array.from(V.variableActions(state, mode, 'transform'), action => action.variableId).join(','), 'source,empty');
    assert.equal(Array.from(V.variableActions(state, mode, 'render'), action => action.renderId).join(','), 'on');
    assert.equal(V.variableActions(state, mode, 'render', false).length, 0);
  }
});

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
