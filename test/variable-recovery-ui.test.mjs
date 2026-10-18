import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';

const source = await readFile(new URL('../addon/taskpane.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../addon/taskpane.html', import.meta.url), 'utf8');
const view = await readFile(new URL('../addon/taskpane-view.js', import.meta.url), 'utf8');
const start = source.indexOf('  function renderDeleted()');
const end = source.indexOf('  async function refresh() {', start);
assert.ok(start > 0 && end > start);
function fixture(extra = {}) {
  const { document } = parseHTML(html);
  const context = vm.createContext({ document, $: id => document.getElementById(id),
    state: { variables: [], documents: [] }, online: true, actionBusy: false,
    deletedView: true, deletedState: undefined, deletedError: '', deletedRequest: 0, stateRequest: 0,
    deletedDetails: new Map(), syncStripEdge() {}, notice() {}, refresh: async () => {},
    api: async () => ({ variables: [] }), ...extra });
  vm.runInContext(view, context);
  vm.runInContext("const V = WpsPaneView; const esc = V.esc; function renderVars() { renderDeleted(); }", context);
  vm.runInContext(source.slice(start, end), context);
  return { context, document };
}

test('recovery view disables execution, requires parent recovery, warns on matching targets and escapes retained content', () => {
  const variable = { variableId: 'v', name: '<script>bad</script>', deletedAt: '2026-10-18T00:00:00Z', sourceDocumentId: 'd', renders: [
    { renderId: 'r1', targetDocumentId: 'd', targetRef: 'Sheet!A1' },
    { renderId: 'r2', targetDocumentId: 'd', deletedAt: '2026-10-17T00:00:00Z' },
  ] };
  const { context, document } = fixture({ deletedState: { variables: [variable] }, state: { variables: [{ renders: [{ targetDocumentId: 'd', targetRef: 'Sheet!A1' }] }] } });
  context.deletedDetails.set('v', { hasValue: true, value: 0, retainedValue: 999, transform: { code: 'return "<script>";' }, renders: [] });
  context.renderDeleted();
  assert.equal(document.getElementById('recalcAll').disabled, true);
  assert.equal(document.getElementById('rerenderAll').disabled, true);
  assert.equal(document.querySelectorAll('[data-op], [data-delete], [data-navigate]').length, 0);
  assert.equal(document.querySelector('[data-restore]:not([data-render])').disabled, false);
  assert.ok([...document.querySelectorAll('[data-render]')].every(button => button.disabled));
  const list = document.getElementById('varsList');
  assert.equal(list.querySelectorAll('script').length, 0);
  assert.match(list.textContent, /相同目标位置/);
  assert.match(list.textContent, /需先重算/);
  assert.equal(list.querySelector('td:last-child').textContent, '0');
  assert.doesNotMatch(list.textContent, /999/);
  assert.match(list.textContent, /数据|保留/);
});

test('recovery polling discards late responses after leaving the view and distinguishes failure from an empty recycle view', async () => {
  let release;
  const { context, document } = fixture({ api: () => new Promise(resolve => { release = resolve; }) });
  const reading = context.refreshDeleted();
  vm.runInContext('deletedView = false; deletedRequest++;', context);
  release({ variables: [{ variableId: 'stale' }] }); await reading;
  assert.equal(context.deletedState, undefined);
  vm.runInContext('deletedView = true; deletedError = "网络错误";', context);
  context.renderDeleted();
  assert.match(document.getElementById('varsList').textContent, /读取已删除规则失败/);
  assert.doesNotMatch(document.getElementById('varsList').textContent, /没有已删除规则/);
});
