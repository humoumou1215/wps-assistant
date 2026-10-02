import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
const context = vm.createContext({});
vm.runInContext(await readFile(new URL('../addon/taskpane-view.js', import.meta.url), 'utf8'), context);
const V = context.WpsPaneView;
function fixture() {
  const { document, Event } = parseHTML('<div id="chat"></div>');
  const root = document.getElementById('chat');
  const renderer = V.createChatRenderer(root, {
    clock: () => '09:15:37', modelName: () => 'test', factsHTML: () => '',
    blockHTML: (b, t, i) => b.kind === 'text' ? '<div class="body-text">' + V.markdown(b.text) + '</div>' : '<div class="tool"><details data-detail="' + t.key + '-' + (b.id || i) + '"><summary><span>' + b.toolName + '</span><span>' + b.status + '</span></summary><pre>' + V.esc(JSON.stringify(b.result || b.args)) + '</pre></details></div>',
  });
  return { root, renderer, Event };
}
test('long thinking streams retain details, summary, text node and user scroll; closed bodies stay lazy', () => {
  const { root, renderer, Event } = fixture(), turn = V.newTurn('任务', [], 100);
  V.reduceEvent(turn, 'thinking.delta', { delta: 'plan\n'.repeat(14000) }, 200);
  renderer.render([turn], 'session');
  const details = root.querySelector('.thinking-block'), summary = details.querySelector('summary'), body = details.querySelector('.thinking-text'), content = body.firstChild;
  assert.equal(body.textContent, '', 'do not parse or lay out a collapsed 70k thinking body');
  details.open = true; details.dispatchEvent(new Event('toggle'));
  assert.equal(body.textContent.length, 70000);
  Object.defineProperties(body, { scrollHeight: { value: 3000 }, clientHeight: { value: 280 } }); body.scrollTop = 190;
  V.reduceEvent(turn, 'thinking.delta', { delta: '\nnew output' }, 300);
  renderer.render([turn], 'session');
  assert.equal(root.querySelector('.thinking-block'), details);
  assert.equal(details.querySelector('summary'), summary);
  assert.equal(body.firstChild, content);
  assert.equal(body.scrollTop, 190);
  assert.equal(body.textContent.length, 70011);
  details.open = false;
  V.reduceEvent(turn, 'thinking.delta', { delta: ' more' }, 400); renderer.render([turn], 'session');
  assert.equal(details.open, false); assert.equal(body.textContent.length, 70011);
  details.open = true; details.dispatchEvent(new Event('toggle'));
  assert.equal(body.textContent.length, 70016); assert.equal(body.scrollTop, 190);
});
test('completed process groups respect explicit close across history refreshes and later turns', () => {
  const { root, renderer } = fixture(), turn = V.newTurn('任务', [], 100);
  V.reduceEvent(turn, 'thinking.delta', { delta: 'plan' }); V.reduceEvent(turn, 'turn.end', {});
  renderer.render([turn], 'session'); const group = root.querySelector('.process-group');
  assert.equal(group.open, true); group.open = false;
  const restored = structuredClone(turn); renderer.render([restored], 'session');
  assert.equal(root.querySelector('.process-group'), group); assert.equal(group.open, false);
  renderer.render([restored, V.newTurn('继续', [], 200)], 'session'); assert.equal(group.open, false);
});
test('tool completion and final grouping preserve native details and escaped contents', () => {
  const { root, renderer } = fixture(), turn = V.newTurn('任务', [], 100);
  V.reduceEvent(turn, 'tool.start', { id: 'call1', toolName: 'read', args: { code: '<script>bad()</script>' } }); renderer.render([turn], 's');
  const details = root.querySelector('.tool details'), summary = details.querySelector('summary'); details.open = true;
  V.reduceEvent(turn, 'tool.result', { id: 'call1', toolName: 'read', result: { value: '<img onerror=bad()>' } }); renderer.render([turn], 's');
  assert.equal(root.querySelector('.tool details'), details); assert.equal(details.querySelector('summary'), summary); assert.equal(details.open, true);
  assert.equal(root.querySelector('script,img'), null);
  V.reduceEvent(turn, 'text.delta', { delta: '**完成**' }); V.reduceEvent(turn, 'turn.end', {}); renderer.render([turn], 's');
  assert.equal(root.querySelector('.tool details'), details); assert.equal(details.open, true);
  assert.match(root.querySelector('.final-answer').textContent, /完成/);
  assert.equal(root.querySelector('.live-blocks').children.length, 0);
});
test('stopping a waiting turn immediately hides progress and shows the stopped state', () => {
  const { root, renderer } = fixture(), turn = V.newTurn('慢响应', [], Date.now());
  renderer.render([turn], 's'); assert.equal(root.querySelector('.chat-progress').hidden, false);
  V.reduceEvent(turn, 'turn.end', { stopped: true }); renderer.render([turn], 's');
  assert.equal(root.querySelector('.chat-progress').hidden, true); assert.equal(root.querySelector('.stopped-state').hidden, false);
});
test('switching sessions clears old expansion and empty history renders again', () => {
  const { root, renderer } = fixture(); renderer.render([], 'a'); renderer.render([], 'b'); assert.ok(root.querySelector('#chatEmpty'));
  const t = V.newTurn('task', [], 100); V.reduceEvent(t, 'thinking.delta', { delta: 'test' }); renderer.render([t], 'b');
  root.querySelector('.thinking-block').open = true; renderer.render([structuredClone(t)], 'c'); assert.ok(!root.querySelector('.thinking-block').open);
  renderer.render([], 'c'); assert.ok(root.querySelector('#chatEmpty')); assert.equal(root.querySelector('.turn'), null);
});
test('progress distinguishes thinking, silent waits, argument generation and parallel tools', () => {
  const t = V.newTurn('task', [], 1000);
  V.reduceEvent(t, 'thinking.delta', { delta: 'plan' }, 2000);
  assert.equal(V.turnProgress(t, 5000).label, '正在思考'); assert.equal(V.turnProgress(t, 5000).sinceOutput, 3);
  V.reduceEvent(t, 'tool.prepare', { chars: 30 }, 6000);
  assert.equal(V.turnProgress(t, 8000).label, '正在准备工具参数'); assert.equal(V.turnProgress(t, 8000).outputChars, 34);
  V.reduceEvent(t, 'tool.start', { id: '1', toolName: 'read' }, 9000); V.reduceEvent(t, 'tool.start', { id: '2', toolName: 'read' }, 9100);
  V.reduceEvent(t, 'tool.result', { id: '1', toolName: 'read', result: {} }, 9200); assert.equal(t.phase, 'executing');
  V.reduceEvent(t, 'tool.result', { id: '2', toolName: 'read', result: {} }, 9300); assert.equal(t.phase, 'waiting');
  assert.equal(V.turnProgress(t, 11300).seconds, 2); assert.equal(V.turnProgress(t, 11300).sinceOutput, 5);
});
test('history polling skips an owned stream and discards snapshots predating a new send', async () => {
  const source = await readFile(new URL('../addon/taskpane.js', import.meta.url), 'utf8');
  const start = source.indexOf('  async function history() {');
  const historySource = source.slice(start, source.indexOf("  $('chatInner').onclick", start));
  let resolve, reads = 0, renders = 0;
  const nodes = { sessionMenu: { hidden: true }, sessionBtn: {}, sessionButton: {} };
  const c = vm.createContext({
    controller: {}, commandBusy: false, historyRequest: 0, currentSessionId: 's', lastHistory: '', peerBusy: false,
    sessionButton: nodes.sessionButton, V,
    api: () => { reads++; return new Promise(r => { resolve = r; }); },
    $: id => nodes[id], updateSendButton() {}, notice() {}, renderTurns: () => { renders++; }, showUsage() {},
  });
  vm.runInContext(historySource, c);
  await c.history(); assert.equal(reads, 0);
  c.controller = undefined;
  const pending = c.history(); assert.equal(reads, 1);
  vm.runInContext('historyRequest++', c); // Sending invalidates the request even if its stream has already ended.
  resolve({ sessionId: 's', busy: true }); await pending;
  assert.equal(renders, 0); assert.equal(c.peerBusy, false); assert.equal(c.lastHistory, '');
  const fresh = c.history();
  resolve({ sessionId: 's', busy: false, messages: [], turns: [] }); await fresh;
  assert.equal(renders, 1);
});
