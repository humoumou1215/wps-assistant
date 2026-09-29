(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let state = { documents: [], variables: [] }, online = false, config, models = [], kind = 'builtin', level = 'off';
  let actionBusy = false, controller, selectedRefs = [], filter = '', lastState = '', clearKey = false;
  const actionErrors = new Map();
  async function api(path, body) {
    const response = await fetch(path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const value = await response.json();
    if (!response.ok) {
      const failures = value.renders?.filter(r => !r.success).map(r => `${r.renderId}: ${r.error?.message}`).join('\n');
      throw new Error(failures || value.error?.message || value.error || `请求失败 (${response.status})`);
    }
    return value;
  }
  function notice(message, error = false) { $('notice').textContent = message; $('notice').hidden = !message; $('notice').classList.toggle('error', error); }
  function page(name) {
    if (!['chat', 'vars', 'settings'].includes(name)) name = 'chat';
    document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === name)));
    ['chat', 'vars', 'settings'].forEach(tab => { $('panel-' + tab).hidden = tab !== name; });
    location.hash = name;
  }
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => page(button.dataset.tab)));
  window.addEventListener('hashchange', () => page(location.hash.slice(1)));
  page(location.hash.slice(1) || new URLSearchParams(location.search).get('page') || 'chat');
  const doc = id => state.documents.find(d => d.documentId === id);
  const docName = id => doc(id)?.name || id + '（未注册）';
  const connected = id => online && !!doc(id)?.connected;
  const stamp = run => run ? `${new Date(run.at).toLocaleString()} · ${run.durationMs} ms` : '尚未执行';
  function typeOf(v) {
    if (!v.hasValue) return '尚未取值';
    if (Array.isArray(v.value)) return Array.isArray(v.value[0]) ? `表格 ${v.value.length} × ${v.value[0].length}` : `数组 ${v.value.length} 项`;
    return v.value === null ? '空值' : ({ number: '数值', string: '文本', boolean: '布尔值', object: '对象' }[typeof v.value] || '值');
  }
  function preview(value) { const text = JSON.stringify(value, null, 2) ?? '尚未取值'; return text.length > 12000 ? text.slice(0, 12000) + '\n…预览已截断' : text; }
  function renderVars() {
    const expanded = new Set([...$('varsList').querySelectorAll('details[open]')].map(n => n.dataset.detail));
    $('varCount').textContent = state.variables.length;
    const sourceIds = [...new Set(state.variables.map(v => v.transform.sourceDocumentId))];
    if (!sourceIds.includes(filter)) filter = '';
    $('varsStrip').innerHTML = `<button class="doc-filter" data-filter="" aria-pressed="${!filter}">全部 ${state.variables.length}</button>` + sourceIds.map(id => `<button class="doc-filter" data-filter="${esc(id)}" aria-pressed="${filter === id}">${esc(docName(id))}</button>`).join('');
    const query = $('varSearch').value.toLowerCase();
    const list = state.variables.filter(v => (!filter || v.transform.sourceDocumentId === filter) && [v.name, v.description, v.transform.sourceRef, docName(v.transform.sourceDocumentId)].join(' ').toLowerCase().includes(query));
    $('recalcAll').disabled = actionBusy || !online || !state.variables.length;
    $('rerenderAll').disabled = actionBusy || !online || !state.variables.some(v => v.hasValue && v.renders.length);
    $('varsList').innerHTML = list.length ? list.map(v => `<article class="var-card">
      <div class="var-heading"><strong>${esc(v.name)}</strong><span class="chip">${typeOf(v)}</span>
        <button class="mini" data-op="transform" data-var="${esc(v.variableId)}" ${actionBusy || !connected(v.transform.sourceDocumentId) ? 'disabled' : ''}>重算</button>
        <button class="mini" data-op="render" data-var="${esc(v.variableId)}" ${actionBusy || !v.hasValue || !v.renders.length || !v.renders.some(r => connected(r.targetDocumentId)) ? 'disabled' : ''}>全部重写</button></div>
      <div class="var-source">${esc(docName(v.transform.sourceDocumentId))} › ${esc(v.transform.sourceRef || '未标注源区域')}${connected(v.transform.sourceDocumentId) ? '' : ' · 已断开'}</div>
      ${v.description ? `<p>${esc(v.description)}</p>` : ''}<div class="run-meta">上次重算 ${stamp(v.transform.lastRun)}</div>
      ${actionErrors.has(v.variableId) ? `<div class="action-error" role="alert">${esc(actionErrors.get(v.variableId))}</div>` : ''}
      <details data-detail="${esc(v.variableId)}-value"><summary>取值预览</summary><pre class="value">${esc(preview(v.value))}</pre></details>
      <details data-detail="${esc(v.variableId)}-transform"><summary>Transform · ${esc(v.transform.transformId)}</summary><pre class="code">${esc(v.transform.code)}</pre></details>
      ${v.renders.length ? v.renders.map(r => `<details data-detail="${esc(r.renderId)}"><summary>${esc(r.renderId)} · ${esc(docName(r.targetDocumentId))}</summary>
        <div class="render-title"><span>${esc(r.description || '未标注写入位置')}${connected(r.targetDocumentId) ? '' : ' · 已断开'}</span><button class="mini" data-op="render" data-var="${esc(v.variableId)}" data-render="${esc(r.renderId)}" ${actionBusy || !v.hasValue || !connected(r.targetDocumentId) ? 'disabled' : ''}>重写</button></div>
        <div class="run-meta">上次重写 ${stamp(r.lastRun)}</div><pre class="code">${esc(r.code)}</pre></details>`).join('') : '<div class="run-meta">尚未绑定 Render，可在会话中描述写入目标。</div>'}
      </article>`).join('') : `<div class="empty-state">${state.variables.length ? '没有匹配的变量，请调整搜索或文档筛选。' : '还没有变量<br>在会话中描述需要提取的数据，助手会创建变量与绑定。'}</div>`;
    $('varsList').querySelectorAll('details').forEach(n => { n.open = expanded.has(n.dataset.detail); });
  }
  async function refresh() {
    try {
      const next = await api('/api/state'); const changed = !online || JSON.stringify(next) !== lastState;
      online = true; state = next; lastState = JSON.stringify(next);
      const count = state.documents.filter(d => d.connected).length;
      $('livePill').textContent = count ? `已连接 · ${count} 个文档` : '桥接就绪 · 无文档'; $('livePill').classList.toggle('off', !count);
      $('footMsg').textContent = count ? '变量与会话保存在本机' : '请在 WPS 中打开文档并加载 Add-in';
      $('footClock').textContent = new Date().toLocaleTimeString();
      if (changed) renderVars();
    } catch {
      online = false; $('livePill').textContent = '桥接已断开'; $('livePill').classList.add('off'); $('footMsg').textContent = '无法连接本机服务，正在重试'; renderVars();
    }
  }
  $('refreshState').onclick = refresh;
  $('varSearch').oninput = renderVars;
  $('varsStrip').onclick = event => { const target = event.target.closest('[data-filter]'); if (target) { filter = target.dataset.filter; renderVars(); } };
  async function actions(items) {
    if (actionBusy) return;
    actionBusy = true; renderVars(); let succeeded = 0, failed = 0;
    for (const item of items) {
      actionErrors.delete(item.variableId);
      try { await api('/api/actions', item); succeeded++; }
      catch (error) { failed++; actionErrors.set(item.variableId, error.message); }
    }
    actionBusy = false; await refresh(); renderVars();
    notice(`${items[0]?.op === 'render' ? '重写' : '重算'}结束：成功 ${succeeded}，失败 ${failed}${failed ? '。请查看变量卡上的错误。' : ''}`, !!failed);
  }
  $('varsList').onclick = event => { const target = event.target.closest('[data-op]'); if (target) actions([{ op: target.dataset.op, variableId: target.dataset.var, ...(target.dataset.render ? { renderId: target.dataset.render } : {}) }]); };
  $('recalcAll').onclick = () => actions(state.variables.map(v => ({ op: 'transform', variableId: v.variableId })));
  $('rerenderAll').onclick = () => actions(state.variables.filter(v => v.renders.length).map(v => ({ op: 'render', variableId: v.variableId })));

  function modelFields() {
    const builtin = kind === 'builtin';
    ['stRowName', 'stRowBase', 'stCustom'].forEach(id => { $(id).hidden = builtin; }); $('stBuiltin').hidden = !builtin;
    document.querySelectorAll('[data-kind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
    $('stModelSrc').textContent = builtin ? '来自内置目录' : '自定义端点';
    $('stKindHint').textContent = builtin ? '只需填写 API Key，模型参数由内置目录提供。' : '填写 OpenAI 兼容端点的地址及模型 ID，本地服务可以不填密钥。';
    const model = models.find(m => m.id === $('stPreset').value);
    $('stBiCtx').textContent = model?.contextWindow.toLocaleString() || '—'; $('stBiMax').textContent = model?.maxTokens.toLocaleString() || '—';
    $('stBiCap').textContent = model ? [model.reasoning ? '推理' : '文本', model.vision ? '图片' : ''].filter(Boolean).join(' / ') : '—';
  }
  function showEffective() {
    $('stNowName').textContent = config.configured ? (config.label || config.model.id) : '尚未保存配置';
    $('stNowDetail').textContent = `${config.model.id} · 上下文 ${config.model.contextWindow.toLocaleString()} · 思考 ${config.thinkingLevel}${config.hasKey ? ' · 密钥已保存' : ' · 无密钥'}`;
    $('modelChip').textContent = config.configured ? config.model.id : '尚未配置模型';
  }
  async function loadSettings() {
    config = await api('/api/config'); models = config.builtinModels; kind = config.kind; level = config.thinkingLevel;
    $('stPreset').innerHTML = models.map(m => `<option value="${esc(m.id)}">${esc(m.name || m.id)}</option>`).join('');
    $('stPreset').value = config.model.id;
    const fields = { stName: config.label, stBase: config.baseUrl, stModelId: kind === 'custom' ? config.model.id : '', stModelName: kind === 'custom' ? config.model.name : '', stCtx: config.model.contextWindow, stMax: config.model.maxTokens, stApi: config.api, stThinkFmt: config.compat.thinkingFormat, stMaxField: config.compat.maxTokensField };
    Object.entries(fields).forEach(([id, value]) => { $(id).value = value; });
    $('stReasoning').checked = config.model.reasoning; $('stVision').checked = config.model.vision;
    $('stKey').value = ''; $('stKey').placeholder = config.hasKey ? '已保存密钥 · 留空保留' : 'API Key（本地服务可留空）';
    $('stHeaders').value = ''; $('stHeaders').placeholder = config.hasHeaders ? '已有请求头 · 留空保留，{} 清空' : '{"X-Corp-Auth":"…"}';
    clearKey = false;
    document.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lv === level)));
    showEffective(); modelFields();
  }
  function formConfig() {
    const model = kind === 'builtin' ? models.find(m => m.id === $('stPreset').value) : { id: $('stModelId').value.trim(), name: $('stModelName').value.trim(), contextWindow: Number($('stCtx').value), maxTokens: Number($('stMax').value), reasoning: $('stReasoning').checked, vision: $('stVision').checked };
    if (!model?.id) throw new Error('请填写或选择模型 ID');
    if (!Number.isInteger(model.contextWindow) || model.contextWindow < 1024 || !Number.isInteger(model.maxTokens) || model.maxTokens < 1 || model.maxTokens > model.contextWindow) throw new Error('请检查上下文长度和最大输出（正整数，最大输出不能超过上下文）');
    let headers;
    if ($('stHeaders').value.trim()) { try { headers = JSON.parse($('stHeaders').value); } catch { throw new Error('额外 Headers 必须是有效 JSON 对象'); } }
    return { kind, label: kind === 'builtin' ? 'DeepSeek 官方' : $('stName').value.trim(), baseUrl: kind === 'builtin' ? '' : $('stBase').value.trim(), api: $('stApi').value,
      ...(clearKey ? { apiKey: '' } : $('stKey').value ? { apiKey: $('stKey').value } : {}), model,
      compat: { thinkingFormat: $('stThinkFmt').value, maxTokensField: $('stMaxField').value }, ...(headers === undefined ? {} : { headers }), thinkingLevel: level };
  }
  function settingResult(text, error = false) { $('stResult').style.display = 'block'; $('stResult').textContent = text; $('stResult').style.color = error ? '#b42318' : '#187242'; }
  document.querySelectorAll('[data-kind]').forEach(b => { b.onclick = () => { kind = b.dataset.kind; modelFields(); }; });
  document.querySelectorAll('[data-lv]').forEach(b => { b.onclick = () => { level = b.dataset.lv; document.querySelectorAll('[data-lv]').forEach(n => n.setAttribute('aria-pressed', String(n === b))); }; });
  $('stPreset').onchange = modelFields;
  $('stEye').onclick = () => { $('stKey').type = $('stKey').type === 'password' ? 'text' : 'password'; $('stEye').setAttribute('aria-pressed', String($('stKey').type === 'text')); };
  $('clearKey').onclick = () => { clearKey = true; $('stKey').value = ''; settingResult('保存后将清除已有密钥。'); };
  $('stKey').oninput = () => { clearKey = false; };
  $('stAdvBtn').onclick = () => { const open = $('stFoldAdv').classList.toggle('open'); $('stAdvBtn').setAttribute('aria-expanded', String(open)); };
  for (const [id, endpoint] of [['stSave', '/api/config'], ['stTest', '/api/config/test']]) $(id).onclick = async () => {
    $('stSave').disabled = $('stTest').disabled = true;
    try {
      const value = formConfig(); settingResult(id === 'stTest' ? '正在请求所选模型…' : '正在保存…');
      const result = await api(endpoint, value);
      if (id === 'stSave') { await loadSettings(); settingResult('配置已保存，下一轮会话生效。'); }
      else settingResult(`连接成功 · ${result.model} · ${result.durationMs} ms`);
    } catch (error) { settingResult(error.message, true); }
    finally { $('stSave').disabled = $('stTest').disabled = false; }
  };
  document.querySelectorAll('.st-row').forEach(row => { const label = row.querySelector('label'); const input = row.querySelector('input[id],select[id]'); if (label && input && !label.querySelector('input')) label.htmlFor = input.id; });

  function catalog() {
    return [...state.documents.filter(d => d.connected).flatMap(d => [{ kind: 'doc', id: d.documentId, label: d.name }, ...(d.selection ? [{ kind: 'sel', id: d.documentId, label: `${d.name} › ${d.selection.address || (d.activeSlide ? '第 ' + d.activeSlide + ' 页' : '当前选区')}`, selection: structuredClone(d.selection), activeSheet: d.activeSheet, activeSlide: d.activeSlide }] : [])]),
      ...state.variables.flatMap(v => [{ kind: 'var', id: v.variableId, label: v.name }, ...v.renders.map(r => ({ kind: 'render', id: r.renderId, label: `${r.renderId} · ${v.name} → ${docName(r.targetDocumentId)}` }))])];
  }
  function chips() {
    $('selectedRefs').innerHTML = selectedRefs.map((r, i) => `<button type="button" data-remove="${i}" title="移除引用">@ ${esc(r.label)} ×</button>`).join('');
  }
  let mentionItems = [];
  function mentions() {
    const before = $('editor').value.slice(0, $('editor').selectionStart);
    const query = before.match(/@([^@\n]*)$/)?.[1] || '';
    mentionItems = online ? catalog().filter(r => r.label.toLowerCase().includes(query.toLowerCase())) : [];
    $('mentionPop').innerHTML = mentionItems.length ? mentionItems.map((r, i) => `<button type="button" data-ref="${i}">${{ doc: '文档', sel: '选区快照', var: '变量', render: 'Render' }[r.kind]} · ${esc(r.label)}</button>`).join('') : '<div class="empty-state">没有可引用的对象</div>';
    $('mentionPop').classList.add('show');
  }
  $('atBtn').onclick = () => { if ($('mentionPop').classList.contains('show')) $('mentionPop').classList.remove('show'); else { mentions(); $('mentionPop').querySelector('button')?.focus(); } };
  $('editor').oninput = () => { if (/@[^@\n]*$/.test($('editor').value.slice(0, $('editor').selectionStart))) mentions(); else $('mentionPop').classList.remove('show'); };
  $('mentionPop').onclick = event => {
    const button = event.target.closest('[data-ref]'); if (!button) return;
    const ref = mentionItems[Number(button.dataset.ref)];
    if (!selectedRefs.some(r => r.kind === ref.kind && r.id === ref.id) && selectedRefs.length < 30) selectedRefs.push(ref);
    const end = $('editor').selectionStart, before = $('editor').value.slice(0, end);
    if (/@[^@\n]*$/.test(before)) $('editor').value = before.replace(/@[^@\n]*$/, '') + $('editor').value.slice(end);
    chips(); $('mentionPop').classList.remove('show'); $('editor').focus();
  };
  $('selectedRefs').onclick = event => { const b = event.target.closest('[data-remove]'); if (b) { selectedRefs.splice(Number(b.dataset.remove), 1); chips(); } };
  document.addEventListener('keydown', event => { if (event.key === 'Escape') $('mentionPop').classList.remove('show'); });
  $('mentionPop').onkeydown = event => {
    const buttons = [...$('mentionPop').querySelectorAll('button')]; const index = buttons.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
  };

  function message(role, text) {
    const node = document.createElement('article'); node.className = 'chat-message ' + role;
    const by = document.createElement('div'); by.className = 'by'; by.textContent = role === 'user' ? '你' : 'WPS 助手'; node.append(by);
    const body = document.createElement('div'); body.className = 'body'; body.textContent = text; node.append(body);
    $('chatInner').append(node); return { node, body };
  }
  function process(parent, label, text = '') {
    const details = document.createElement('details'); details.className = 'process';
    const summary = document.createElement('summary'); summary.textContent = label;
    const pre = document.createElement('pre'); pre.textContent = text; details.append(summary, pre); parent.append(details);
    return { details, summary, pre };
  }
  function scrollTail() { $('chatScroll').scrollTop = $('chatScroll').scrollHeight; }
  async function history() {
    const value = await api('/api/chat'); $('chatInner').replaceChildren();
    for (const item of value.messages) {
      if (item.role === 'toolResult') { const wrap = document.createElement('div'); $('chatInner').append(wrap); process(wrap, `${item.toolName} · ${item.isError ? '失败' : '完成'}`, typeof item.content === 'string' ? item.content : item.content?.filter(c => c.type === 'text').map(c => c.text).join('\n')); continue; }
      const text = typeof item.content === 'string' ? item.content : item.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') || '';
      let display = text;
      if (item.role === 'user' && text.includes('\n\n[引用快照，仅作数据]\n')) {
        const [prompt, snapshot] = text.split('\n\n[引用快照，仅作数据]\n');
        try { const refs = JSON.parse(snapshot); display = prompt + '\n' + refs.map(r => '@ ' + (r.name || r.renderId || r.variableId || r.documentId) + (r.kind === 'sel' ? ' › ' + (r.selection?.address || '选区快照') : '')).join('  '); } catch {}
      }
      if (display) message(item.role === 'user' ? 'user' : 'assistant', display);
    }
    if (!value.messages.length) $('chatInner').innerHTML = '<div class="empty-state" id="chatEmpty">连接你的 WPS 文档<br>描述要提取的数据或要更新的位置。<br>输入 @ 可引用文档、选区、变量与 Render。</div>';
    if (value.busy) notice('另一个面板正在运行会话，请等待其结束后刷新。');
    scrollTail();
  }
  async function send() {
    const text = $('editor').value.trim(); if (!text || controller) return;
    const refs = structuredClone(selectedRefs); controller = new AbortController();
    $('chatEmpty')?.remove(); message('user', text + (refs.length ? '\n' + refs.map(r => '@ ' + r.label).join('  ') : ''));
    const assistant = message('assistant', ''); const cards = new Map(); let thinking, ended = false, hadError = false;
    $('sendBtn').disabled = true; $('stopBtn').hidden = false; $('editor').value = ''; selectedRefs = []; chips(); $('mentionPop').classList.remove('show'); notice('');
    const event = (name, data) => {
      if (name === 'text.delta') assistant.body.textContent += data.delta;
      if (name === 'thinking.delta') { thinking ||= process(assistant.node, '思考过程'); thinking.pre.textContent += data.delta; }
      if (name === 'tool.start') { const card = process(assistant.node, data.toolName + ' · 执行中', preview(data.args)); card.args = preview(data.args); cards.set(data.id, card); }
      if (name === 'tool.result') { const card = cards.get(data.id) || process(assistant.node, data.toolName); card.summary.textContent = `${data.toolName.replaceAll('_', ' ')} · ${data.isError ? '失败' : '完成'} · ${data.durationMs} ms`; card.pre.textContent = `${card.args || ''}\n\n${preview(data.result?.details || data.result)}`; card.details.classList.toggle('action-error', data.isError); }
      if (name === 'error') { hadError = true; notice(data.message, true); assistant.body.textContent += '\n' + data.message; }
      if (name === 'turn.end') { ended = true; if (data.stopped) assistant.body.textContent += '\n已停止，已经完成的写入仍然有效。'; if (data.usage) $('usageLabel').textContent = `本次模型调用 ${data.usage.totalTokens || (data.usage.input + data.usage.output)} tokens`; }
      scrollTail();
    };
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, refs }), signal: controller.signal });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || '发送失败'); }
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
      const drain = () => { let split; while ((split = buffer.indexOf('\n\n')) >= 0) { const part = buffer.slice(0, split); buffer = buffer.slice(split + 2); const name = part.match(/^event: (.+)$/m)?.[1]; const data = part.match(/^data: (.+)$/m)?.[1]; if (name && data) event(name, JSON.parse(data)); } };
      while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); drain(); }
      buffer += decoder.decode(); drain(); if (!ended) throw new Error('连接意外中断，请刷新确认已执行的操作后再继续。');
    } catch (error) {
      hadError = true; const stopped = error.name === 'AbortError'; const msg = stopped ? '已停止生成。已经完成的写入仍然有效。' : error.message;
      assistant.body.textContent += '\n' + msg; notice(msg, !stopped);
      if (!stopped) { $('editor').value = text; selectedRefs = refs; chips(); }
    } finally {
      controller = undefined; $('sendBtn').disabled = false; $('stopBtn').hidden = true;
      if (hadError && !$('editor').value) { $('editor').value = text; selectedRefs = refs; chips(); }
      await refresh(); scrollTail();
    }
  }
  $('sendBtn').onclick = send; $('stopBtn').onclick = () => controller?.abort();
  $('editor').onkeydown = event => {
    if (event.isComposing) return;
    if (event.key === 'ArrowDown' && $('mentionPop').classList.contains('show')) { event.preventDefault(); $('mentionPop').querySelector('button')?.focus(); }
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if ($('mentionPop').classList.contains('show')) $('mentionPop').querySelector('button')?.click(); else send(); }
  };
  refresh(); loadSettings().catch(error => notice('模型配置加载失败：' + error.message, true)); history().catch(error => notice('会话加载失败：' + error.message, true));
  // Wait for each refresh before scheduling another; offline/slow requests never accumulate.
  async function poll() { await refresh(); setTimeout(poll, 2500); } setTimeout(poll, 2500);
})();
