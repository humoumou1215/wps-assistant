import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';

const source = await readFile(new URL('../addon/taskpane.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../addon/taskpane.html', import.meta.url), 'utf8');
const helperStart = source.indexOf("  const composerHint = $('editor').dataset.placeholder;");
const helperEnd = source.indexOf('  new MutationObserver(', helperStart);
assert.ok(helperStart > 0 && helperEnd > helperStart);

function fixture(extra = {}) {
  const { document, MutationObserver } = parseHTML(html);
  const context = vm.createContext({
    document, $: id => document.getElementById(id),
    config: { configured: true, model: { name: '测试模型', id: 'test-model' } },
    window: {}, navigator: {}, triggerComposer() {}, notice() {}, ...extra,
  });
  vm.runInContext(source.slice(helperStart, helperEnd), context);
  return { context, document, MutationObserver, editor: document.getElementById('editor'), placeholder: document.getElementById('editorPlaceholder') };
}

test('empty composer hints survive browser line-break nodes and include the effective model', () => {
  const { context, editor, placeholder } = fixture();
  for (const content of ['', '<br>', '<div><br></div>', ' \u00a0\u200b']) {
    editor.innerHTML = content;
    context.syncEditorPlaceholder();
    assert.equal(placeholder.hidden, false);
    assert.match(placeholder.textContent, /输入 \/ 选择命令，@ 引用文档/);
    assert.match(placeholder.textContent, /当前模型：测试模型/);
  }
  for (const content of ['草稿', '<span data-refkey="1"></span>']) {
    editor.innerHTML = content;
    context.syncEditorPlaceholder();
    assert.equal(placeholder.hidden, true, 'a reference chip counts as content even without text');
  }
  editor.replaceChildren(); context.config.configured = false; context.syncEditorPlaceholder();
  assert.match(placeholder.textContent, /当前模型：尚未配置/);
});

test('placeholder synchronization settles after an editor mutation', async () => {
  const { context, editor, MutationObserver } = fixture();
  context.syncEditorPlaceholder();
  let updates = 0;
  const observer = new MutationObserver(() => {
    updates++;
    if (updates > 5) { observer.disconnect(); return; }
    context.syncEditorPlaceholder();
  });
  observer.observe(editor, { childList: true, subtree: true, characterData: true, attributes: false });
  try {
    editor.innerHTML = '<div><br></div>';
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.ok(updates > 0 && updates <= 2, 'repeated attribute writes must not create an observer loop');
  } finally { observer.disconnect(); }
});

test('macOS Control editing shortcuts stay in the composer and Command shortcuts keep native behavior', () => {
  const calls = [], selection = { removeAllRanges() {}, addRange(range) { calls.push(['select', range.node]); } };
  const { context, document, editor } = fixture({
    navigator: { platform: 'MacIntel' }, window: { getSelection: () => selection },
    pasteComposerShortcut: () => calls.push(['paste']),
  });
  // The helper declaration shadows this callback, so replace it after loading.
  context.pasteComposerShortcut = () => calls.push(['paste']);
  document.createRange = () => ({ selectNodeContents(node) { this.node = node; } });
  document.execCommand = command => { calls.push([command]); return true; };
  const start = source.indexOf("  $('editor').onkeydown = event => {");
  const end = source.indexOf('    // Let native chip buttons', start);
  assert.ok(start > 0 && end > start);
  vm.runInContext(source.slice(start, end) + '\n  };', context);
  const press = (key, modifiers = {}) => {
    const event = { key, ctrlKey: true, metaKey: false, ...modifiers, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
    editor.onkeydown(event); return event;
  };
  for (const key of ['a', 'c', 'v', 'x']) {
    const event = press(key); assert.equal(event.prevented, true); assert.equal(event.stopped, true);
  }
  assert.deepEqual(calls, [['select', editor], ['copy'], ['paste'], ['cut']]);
  const native = press('a', { ctrlKey: false, metaKey: true });
  assert.equal(native.prevented, false); assert.equal(native.stopped, true);
  context.navigator.platform = 'Win32';
  assert.equal(press('v').prevented, false, 'Windows uses the browser native paste action');
});

test('an async clipboard read cannot overwrite a newer draft or another focused field', async () => {
  for (const change of ['draft', 'focus']) {
    let resolve, inserted = false;
    const { context, document, editor } = fixture({ navigator: { clipboard: { readText: () => new Promise(r => { resolve = r; }) } } });
    context.editorRange = () => ({});
    context.insertComposerText = () => { inserted = true; };
    document.execCommand = () => false;
    Object.defineProperty(document, 'activeElement', { configurable: true, value: editor });
    const pending = context.pasteComposerShortcut();
    if (change === 'draft') editor.textContent = 'newer draft';
    else Object.defineProperty(document, 'activeElement', { value: document.getElementById('varSearch') });
    resolve('clipboard text'); await pending;
    assert.equal(inserted, false);
  }
});

test('source and Render location cards share inline descriptions and distinguish missing documents', () => {
  const docs = [{ documentId: 'live', connected: true, name: '在线.xlsx' }, { documentId: 'offline', connected: false, name: '离线.xlsx' }];
  const context = vm.createContext({
    doc: id => docs.find(doc => doc.documentId === id),
    docName: id => docs.find(doc => doc.documentId === id)?.name || id + '（未注册）',
    connected: id => !!docs.find(doc => doc.documentId === id)?.connected,
    esc: value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])), actionBusy: false,
  });
  const start = source.indexOf('  function locationButton('), end = source.indexOf('  function deleteButton(', start);
  assert.ok(start > 0 && end > start); vm.runInContext(source.slice(start, end), context);
  const location = { ref: 'Sheet!A1:B2' }, variable = { variableId: 'v', description: '来源说明', transform: { sourceDocumentId: 'live', sourceLocations: [location] } };
  const sourceHTML = context.sourceSummary(variable);
  const renderHTML = context.renderDestination(variable, { renderId: 'r', targetDocumentId: 'live', targetLocations: [location, { ref: 'Sheet!C1:D2' }], description: '写入说明' });
  for (const html of [sourceHTML, renderHTML]) {
    const { document } = parseHTML(html);
    assert.equal(document.querySelector('.location-role'), null);
    assert.equal(document.querySelector('.location-path').nextElementSibling.className, 'location-description');
    assert.ok(document.querySelector('.location-link.available[data-navigate]'));
  }
  assert.equal(parseHTML(renderHTML).document.querySelectorAll('[data-navigate]')[1].dataset.locationIndex, '1');
  for (const [id, reason] of [['offline', /已断开/], ['missing', /未注册/]]) {
    const { document } = parseHTML(context.locationButton('位置', 'v', id, location));
    assert.equal(document.querySelector('[data-navigate]'), null);
    assert.match(document.querySelector('.location-link.unavailable').title, reason);
  }
});
