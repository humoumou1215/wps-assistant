(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const V = globalThis.WpsPaneView;
  if (!V) {
    $('livePill').innerHTML = '<span class="dot"></span>页面资源未加载'; $('livePill').classList.add('off');
    $('notice').textContent = '助手页面初始化失败：taskpane-view.js 未加载。请重启本地桥接服务，再重新打开窗格。'; $('notice').hidden = false; $('notice').classList.add('error');
    $('footMsg').textContent = '页面资源与桥接服务版本不一致'; $('sendBtn').disabled = true;
    $('refreshState').onclick = () => location.reload();
    return;
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let state = { documents: [], variables: [] }, online = false, config, models = [], kind = 'builtin', level = 'off';
  let actionBusy = false, controller, filter = '', lastState = '', clearKey = false;
  let turns = [], peerBusy = false, lastHistory = '', syncing, settingsDirty = false, configConflict = false, formRevision, settingsBusy = false, followTail = true;
  const actionErrors = new Map(), composerRefs = new Map();
  let refSerial = 0;
  const duration = ms => ms === undefined ? '历史耗时未记录' : ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(1) + 's';
  const clock = at => new Date(at).toLocaleTimeString('zh-CN', { hour12: false });
  async function api(path, body) {
    const response = await fetch(path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const value = await response.json();
    if (!response.ok) {
      const failures = value.renders?.filter(r => !r.success).map(r => `${r.renderId}: ${r.error?.message}`).join('\n');
      const error = new Error(failures || value.error?.message || value.error || `请求失败 (${response.status})`); error.payload = value; throw error;
    }
    return value;
  }
  function notice(message, error = false) { $('notice').textContent = message; $('notice').hidden = !message; $('notice').classList.toggle('error', error); }
  let agentView = 'system', agentData, agentRequest = 0, agentReturnFocus;
  function renderAgentResources() {
    const titles = { system: '系统提示词', skills: '已安装技能', tools: '当前会话工具' };
    $('agentTitle').textContent = titles[agentView];
    document.querySelectorAll('[data-agent-view]').forEach(button => button.setAttribute('aria-expanded', String(button.dataset.agentView === agentView && !$('agentOverlay').hidden)));
    document.querySelectorAll('[data-agent-section]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.agentSection === agentView)));
    if (!agentData) { $('agentContent').textContent = '正在读取当前会话资源…'; return; }
    if (agentView === 'system') {
      $('agentContent').innerHTML = '<p class="agent-description">当前会话实际使用的系统提示词，包含可按需读取的技能列表。</p><pre>' + esc(agentData.systemPrompt) + '</pre>';
    } else if (agentView === 'skills') {
      const skills = agentData.skills || [];
      $('agentContent').innerHTML = '<p class="agent-description">已安装 ' + skills.length + ' 个技能。助手会按任务需要读取技能和参考资料。</p><div class="agent-path">' + esc(agentData.skillDirectory) + '</div>' +
        (skills.length ? skills.map(skill => '<details><summary>' + esc(skill.name) + (skill.disableModelInvocation ? ' · 仅手动调用' : '') + '</summary><p class="agent-description">' + esc(skill.description) + '</p><div class="agent-path">' + esc(skill.filePath) + '</div><div class="body-text">' + V.markdown(skill.content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')) + '</div></details>').join('') : '<p>暂无已安装技能。</p>') +
        (agentData.diagnostics?.length ? '<details><summary>技能加载提示</summary><pre>' + esc(JSON.stringify(agentData.diagnostics, null, 2)) + '</pre></details>' : '');
    } else {
      const tools = agentData.tools || [];
      $('agentContent').innerHTML = '<p class="agent-description">当前启用 ' + tools.length + ' 个工具。</p>' + tools.map(tool => '<details><summary>' + esc(tool.name) + '</summary><p class="agent-description">' + esc(tool.description) + '</p><div class="agent-description">参数定义</div><pre>' + esc(JSON.stringify(tool.parameters, null, 2)) + '</pre></details>').join('');
    }
  }
  async function openAgentResources(view, trigger) {
    if ($('agentOverlay').hidden) agentReturnFocus = trigger || document.activeElement;
    agentView = view; agentData = undefined; $('agentOverlay').hidden = false; hideRefPop();
    renderAgentResources(); $('agentClose').focus();
    const request = ++agentRequest;
    try {
      const value = await api('/api/agent');
      if (request !== agentRequest || $('agentOverlay').hidden) return;
      agentData = value; renderAgentResources();
    } catch (error) {
      if (request === agentRequest && !$('agentOverlay').hidden) $('agentContent').textContent = '读取会话资源失败：' + error.message;
    }
  }
  function closeAgentResources() {
    agentRequest++; $('agentOverlay').hidden = true; agentReturnFocus?.focus();
    document.querySelectorAll('[data-agent-view]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  }
  document.querySelectorAll('[data-agent-view]').forEach(button => { button.onclick = () => openAgentResources(button.dataset.agentView, button); });
  document.querySelectorAll('[data-agent-section]').forEach(button => { button.onclick = () => { agentView = button.dataset.agentSection; renderAgentResources(); }; });
  $('agentClose').onclick = closeAgentResources;
  $('agentOverlay').onclick = event => { if (event.target === $('agentOverlay')) closeAgentResources(); };
  document.addEventListener('keydown', event => {
    if ($('agentOverlay').hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeAgentResources(); }
    if (event.key === 'Tab') {
      const controls = [...$('agentDialog').querySelectorAll('button, summary, a[href]')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !$('agentDialog').contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !$('agentDialog').contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    }
  });
  function page(name) {
    if (!['chat', 'vars', 'settings'].includes(name)) name = 'chat';
    document.querySelectorAll('[data-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.tab === name)));
    ['chat', 'vars', 'settings'].forEach(tab => { $('panel-' + tab).hidden = tab !== name; });
    if (location.hash !== '#' + name) location.hash = name;
    if (config) void syncShared();
    if (name === 'vars') requestAnimationFrame(syncStripEdge);
  }
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => page(button.dataset.tab)));
  window.addEventListener('hashchange', () => page(location.hash.slice(1)));
  page(location.hash.slice(1) || new URLSearchParams(location.search).get('page') || 'chat');
  const doc = id => state.documents.find(d => d.documentId === id);
  const docName = id => doc(id)?.name || id + '（未注册）';
  const connected = id => online && !!doc(id)?.connected;
  const stamp = run => run ? clock(run.at) : '尚未执行';
  const stampTitle = run => run ? new Date(run.at).toLocaleString('zh-CN') + ' · 耗时 ' + duration(run.durationMs) : '尚未执行';
  const typeOf = V.typeOf, preview = V.jsonPreview;
  function syncStripEdge() { const n = $('varsStrip'); $('varsBar').classList.toggle('over', n.scrollWidth - n.clientWidth - n.scrollLeft > 2); }
  function renderVars() {
    const expanded = new Set([...$('varsList').querySelectorAll('details[open]')].map(n => n.dataset.detail));
    $('varCount').textContent = state.variables.length;
    const sources = new Map(); state.variables.forEach(v => sources.set(v.transform.sourceDocumentId, (sources.get(v.transform.sourceDocumentId) || 0) + 1));
    if (!sources.has(filter)) filter = '';
    const renderTotal = state.variables.reduce((n, v) => n + v.renders.length, 0), unbound = state.variables.filter(v => !v.renders.length).length;
    const left = $('varsStrip').scrollLeft;
    $('varsStrip').innerHTML = '<span class="p"><b>' + state.variables.length + '</b> 变量<span class="d">·</span><b>' + renderTotal + '</b> Render 绑定<span class="d">·</span><span class="warn"><b>' + unbound + '</b> 未绑定</span></span><span class="divider"></span><button class="ftag ' + (!filter ? 'on' : '') + '" data-filter="" aria-pressed="' + !filter + '">全部 <b>' + state.variables.length + '</b></button>' +
      [...sources].map(([id, n]) => '<button class="ftag ' + (filter === id ? 'on' : '') + '" data-filter="' + esc(id) + '" aria-pressed="' + (filter === id) + '" title="' + esc(docName(id)) + '"><span class="fn">▦ ' + esc(docName(id)) + '</span> <b>' + n + '</b></button>').join('');
    $('varsStrip').scrollLeft = left;
    const query = $('varSearch').value.trim().toLowerCase();
    const list = state.variables.filter(v => (!filter || v.transform.sourceDocumentId === filter) && [v.name, v.description, v.transform.sourceRef, docName(v.transform.sourceDocumentId)].join(' ').toLowerCase().includes(query));
    $('recalcAll').disabled = actionBusy || !online || !state.variables.length;
    $('rerenderAll').disabled = actionBusy || !online || !renderTotal;
    $('varsList').innerHTML = list.length ? list.map(v => {
      const lastRender = v.renders.map(r => r.lastRun).filter(Boolean).sort((a, b) => b.at.localeCompare(a.at))[0];
      const renders = v.renders.map(r => '<div class="render"><div class="rhead"><details class="render-detail" data-detail="' + esc(r.renderId) + '"><summary title="展开写入代码"><span class="tgt"><span class="t1">' + esc(docName(r.targetDocumentId)) + ' › ' + esc(r.description || '未标注写入位置') + '</span><span class="t2" title="' + esc(stampTitle(r.lastRun)) + '">' + esc(r.renderId) + ' · 上次写入 ' + stamp(r.lastRun) + (r.lastRun ? '（' + duration(r.lastRun.durationMs) + '）' : '') + (connected(r.targetDocumentId) ? '' : ' · 已断开') + '</span></span></summary><div class="rbody"><div class="rkv"><span class="k">目标</span><span class="v">' + esc(docName(r.targetDocumentId)) + ' › ' + esc(r.description || '未标注写入位置') + '</span></div><div class="rkv"><span class="k">来源变量</span><span class="v">' + esc(v.name) + ' · ' + esc(typeOf(v)) + '</span></div><div class="rkv"><span class="k">上次写入</span><span class="v">' + esc(stampTitle(r.lastRun)) + '</span></div><pre class="code">' + V.highlight(r.code) + '</pre></div></details><button data-op="render" data-var="' + esc(v.variableId) + '" data-render="' + esc(r.renderId) + '" title="只重写这一条 Render" ' + (actionBusy || !v.hasValue || !connected(r.targetDocumentId) ? 'disabled' : '') + '>重写</button></div></div>').join('');
      return '<article class="var" data-variable-id="' + esc(v.variableId) + '"><div class="var-head"><button class="var-toggle" data-toggle="' + esc(v.variableId) + '" aria-expanded="' + expanded.has(v.variableId) + '" title="展开当前值与 Transform">›</button><div class="mid"><div class="line1"><strong class="var-name">' + esc(v.name) + '</strong><span class="type ' + (typeof v.value === 'number' ? 'number' : 'table') + '">' + esc(typeOf(v)) + '</span><span class="sp"></span><span class="stamp" title="上次重算 ' + esc(stampTitle(v.transform.lastRun)) + '">' + stamp(v.transform.lastRun) + '</span><button class="act primary sm" data-op="transform" data-var="' + esc(v.variableId) + '" ' + (actionBusy || !connected(v.transform.sourceDocumentId) ? 'disabled' : '') + '>重算</button>' +
        (v.renders.length ? '<span class="stamp" title="上次重写 ' + esc(stampTitle(lastRender)) + '">' + stamp(lastRender) + '</span><button class="act sm" data-op="render" data-var="' + esc(v.variableId) + '" title="重写该变量下全部 Render" ' + (actionBusy || !v.hasValue || !v.renders.some(r => connected(r.targetDocumentId)) ? 'disabled' : '') + '>重写</button>' : '<span class="stamp none">尚未绑定 Render</span>') +
        '</div><div class="line2"><span class="path" title="' + esc(docName(v.transform.sourceDocumentId)) + '">▦ ' + esc(docName(v.transform.sourceDocumentId)) + ' › ' + esc(v.transform.sourceRef || '未标注源区域') + '</span><span class="dotsep">·</span><span class="desc">' + esc(v.description || '未添加描述') + (connected(v.transform.sourceDocumentId) ? '' : ' · 已断开') + '</span></div></div></div>' +
        (actionErrors.has(v.variableId) ? '<div class="action-error" role="alert">' + esc(actionErrors.get(v.variableId)) + '</div>' : '') +
        '<div class="var-renders"><div class="rl-head">Render 清单 <b>' + v.renders.length + '</b><span class="rl-tip">' + (v.renders.length ? '常驻展示 · 点 › 看代码' : '') + '</span></div>' + (renders || '<div class="render-empty">还没有绑定 Render · 在会话里描述写入目标。</div>') + '</div><details class="var-data" data-detail="' + esc(v.variableId) + '"><summary>当前值与 Transform</summary><div class="sect"><div class="sh">当前值<span class="r">' + esc(typeOf(v)) + '</span></div>' + V.valueHTML(v.value, v.hasValue) + '</div><div class="sect"><div class="sh">数据来源 · Transform<span class="r">' + esc(v.transform.transformId) + '</span></div><pre class="code">' + V.highlight(v.transform.code) + '</pre></div></details></article>';
    }).join('') : '<div class="empty-state">' + (state.variables.length ? '没有匹配的变量，请调整搜索或文档筛选。' : '还没有变量<br>在会话中描述需要提取的数据，助手会创建变量与绑定。') + '</div>';
    $('varsList').querySelectorAll('[data-detail]').forEach(n => { n.open = expanded.has(n.dataset.detail); }); syncStripEdge();
  }
  async function refresh() {
    try {
      const next = await api('/api/state'); const changed = !online || JSON.stringify(next) !== lastState;
      online = true; state = next; lastState = JSON.stringify(next);
      const count = state.documents.filter(d => d.connected).length;
      $('livePill').innerHTML = '<span class="dot"></span>' + (count ? `已连接 · ${count} 个文档` : '桥接就绪 · 无文档'); $('livePill').classList.toggle('off', !count);
      $('pluginVersion').textContent = state.pluginVersion ? `v${state.pluginVersion}` : ''; $('pluginVersion').hidden = !state.pluginVersion;
      $('footMsg').textContent = count ? '变量与会话保存在本机' : '请在 WPS 中打开文档并加载 Add-in';
      $('footClock').textContent = new Date().toLocaleTimeString();
      if (changed) { renderVars(); if (!controller) renderTurns(); }
    } catch {
      online = false; $('livePill').innerHTML = '<span class="dot"></span>桥接已断开'; $('livePill').classList.add('off'); $('footMsg').textContent = '无法连接本机服务，正在重试'; renderVars();
    }
  }
  $('refreshState').onclick = () => syncShared();
  $('varsStrip').onscroll = syncStripEdge;
  $('varsStrip').addEventListener('wheel', e => { const n = $('varsStrip'); if (n.scrollWidth <= n.clientWidth || (e.deltaY < 0 && n.scrollLeft <= 0) || (e.deltaY > 0 && n.scrollLeft + n.clientWidth >= n.scrollWidth - 1)) return; e.preventDefault(); n.scrollLeft += e.deltaY; }, { passive: false });
  window.addEventListener('resize', syncStripEdge);
  $('varSearch').oninput = renderVars;
  $('varsStrip').onclick = event => { const target = event.target.closest('[data-filter]'); if (target) { filter = target.dataset.filter; renderVars(); $('varsScroll').scrollTop = 0; } };
  async function actions(items) {
    if (actionBusy || !items.length) return;
    actionBusy = true; renderVars(); let succeeded = 0, failed = 0;
    for (const item of items) {
      actionErrors.delete(item.variableId);
      try { const value = await api('/api/actions', item); succeeded += item.op === 'render' ? value.renders?.length || 0 : 1; }
      catch (error) { if (item.op === 'render' && error.payload?.renders) { succeeded += error.payload.renders.filter(r => r.success).length; failed += error.payload.renders.filter(r => !r.success).length; } else failed++; actionErrors.set(item.variableId, error.message); }
    }
    actionBusy = false; await refresh(); renderVars();
    notice(`${items[0]?.op === 'render' ? '重写' : '重算'}结束：成功 ${succeeded}，失败 ${failed}（${items[0]?.op === 'render' ? '条 Render' : '个变量'}）${failed ? '。请查看变量卡上的错误，成功写入仍然有效。' : ''}`, !!failed);
  }
  $('varsList').onclick = event => { const toggle = event.target.closest('[data-toggle]'); if (toggle) { const detail = [...$('varsList').querySelectorAll('.var-data')].find(n => n.dataset.detail === toggle.dataset.toggle); detail.open = !detail.open; toggle.setAttribute('aria-expanded', String(detail.open)); return; } const target = event.target.closest('[data-op]'); if (target) actions([{ op: target.dataset.op, variableId: target.dataset.var, ...(target.dataset.render ? { renderId: target.dataset.render } : {}) }]); };
  $('recalcAll').onclick = () => actions(state.variables.map(v => ({ op: 'transform', variableId: v.variableId })));
  $('rerenderAll').onclick = () => actions(state.variables.filter(v => v.renders.length).map(v => ({ op: 'render', variableId: v.variableId })));

  function markDirty() {
    settingsDirty = true; $('stDraftNotice').hidden = false;
    if (!configConflict) $('stDraftNotice').textContent = '有未保存的修改；上方摘要仍为当前生效配置。';
  }
  function thinkHint() {
    const reasoning = kind === 'builtin' ? models.find(m => m.id === $('stPreset').value)?.reasoning : $('stReasoning').checked;
    $('stThinkHint').textContent = reasoning ? '推理模型：等级按所选端点的兼容方式映射。' : '当前模型不支持推理，运行时会将思考等级降到 off。';
  }
  function modelFields() {
    const builtin = kind === 'builtin';
    ['stRowName', 'stRowBase', 'stCustom'].forEach(id => { $(id).hidden = builtin; }); $('stBuiltin').hidden = !builtin;
    document.querySelectorAll('[data-kind]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
    $('stModelSrc').textContent = builtin ? '来自内置目录' : '自定义端点';
    $('stKindHint').textContent = builtin ? '只需填写 API Key，模型参数由内置目录提供。' : '填写 OpenAI 兼容端点的地址及模型 ID，本地服务可以不填密钥。';
    ['stApi', 'stThinkFmt', 'stMaxField'].forEach(id => { $(id).disabled = builtin; }); $('stBuiltinHint').hidden = !builtin;
    if (builtin) { $('stApi').value = 'openai-completions'; $('stThinkFmt').value = ''; $('stMaxField').value = ''; }
    const model = models.find(m => m.id === $('stPreset').value);
    $('stBiCtx').textContent = model?.contextWindow.toLocaleString() || '—'; $('stBiMax').textContent = model?.maxTokens.toLocaleString() || '—';
    $('stBiCap').textContent = model ? [model.reasoning ? '推理' : '文本', model.vision ? '图片输入' : '', model.cost ? '目录参考价 / 百万 tokens：输入 $' + model.cost.input + ' / 输出 $' + model.cost.output : ''].filter(Boolean).join(' · ') : '—'; thinkHint();
  }
  function showEffective() {
    $('stNowName').textContent = config.configured ? (config.label || config.model.id) : '尚未保存配置';
    $('stNowDetail').textContent = `provider=${config.kind === 'builtin' ? 'deepseek' : 'wps-custom'}${config.kind === 'custom' ? ' · ' + config.baseUrl : ''} · model=${config.model.id} · 上下文 ${config.model.contextWindow.toLocaleString()} · 最大输出 ${config.model.maxTokens.toLocaleString()} · 思考 ${config.model.reasoning ? config.thinkingLevel : 'off'}${config.hasKey ? ' · 密钥已保存' : ' · 无密钥'}`;
    $('modelChip').textContent = config.configured ? config.model.id : '尚未配置模型';
    $('modelChip').title = $('modelChip').textContent;
  }
  async function loadSettings(force = false) {
    const next = await api('/api/config'), changed = !config || config.revision !== next.revision; config = next; models = config.builtinModels;
    showEffective();
    if (changed && !controller) renderTurns();
    if (!force && settingsDirty) {
      if (formRevision !== config.revision) {
        configConflict = true; $('stDraftNotice').hidden = $('stReload').hidden = false;
        $('stDraftNotice').textContent = '另一个面板已更新配置。草稿已保留，请加载最新配置后重新修改。';
      }
      return;
    }
    if (!force && !changed) return;
    kind = config.kind; level = config.thinkingLevel; formRevision = config.revision;
    settingsDirty = configConflict = false; $('stDraftNotice').hidden = $('stReload').hidden = true;
    $('stPreset').innerHTML = models.map(m => `<option value="${esc(m.id)}">${esc(m.name || m.id)}</option>`).join('');
    $('stPreset').value = kind === 'builtin' ? config.model.id : models[0]?.id || '';
    const fields = { stName: kind === 'custom' ? config.label : '', stBase: config.baseUrl, stModelId: kind === 'custom' ? config.model.id : '', stModelName: kind === 'custom' ? config.model.name : '', stCtx: kind === 'custom' ? config.model.contextWindow : 131072, stMax: kind === 'custom' ? config.model.maxTokens : 8192, stApi: config.api, stThinkFmt: config.compat.thinkingFormat, stMaxField: config.compat.maxTokensField };
    Object.entries(fields).forEach(([id, value]) => { $(id).value = value; });
    $('stReasoning').checked = kind === 'custom' && config.model.reasoning; $('stVision').checked = kind === 'custom' && config.model.vision;
    $('stKey').value = ''; $('stKey').placeholder = config.hasKey ? '已保存密钥 · 留空保留' : 'API Key（本地服务可留空）';
    $('stHeaders').value = ''; $('stHeaders').placeholder = config.hasHeaders ? '已有请求头 · 留空保留，{} 清空' : '{"X-Corp-Auth":"…"}';
    clearKey = false;
    $('stResult').className = 'st-result';
    document.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lv === level)));
    showEffective(); modelFields();
  }
  function formConfig() {
    if (configConflict) throw new Error('配置已在另一个面板更新，请先加载最新配置。');
    const model = kind === 'builtin' ? models.find(m => m.id === $('stPreset').value) : { id: $('stModelId').value.trim(), name: $('stModelName').value.trim(), contextWindow: Number($('stCtx').value), maxTokens: Number($('stMax').value), reasoning: $('stReasoning').checked, vision: $('stVision').checked };
    if (!model?.id) throw new Error('请填写或选择模型 ID');
    if (!Number.isInteger(model.contextWindow) || model.contextWindow < 1024 || !Number.isInteger(model.maxTokens) || model.maxTokens < 1 || model.maxTokens > model.contextWindow) throw new Error('请检查上下文长度和最大输出（正整数，最大输出不能超过上下文）');
    let headers;
    if ($('stHeaders').value.trim()) { try { headers = JSON.parse($('stHeaders').value); } catch { throw new Error('额外 Headers 必须是有效 JSON 对象'); } }
    return { expectedRevision: formRevision, kind, label: kind === 'builtin' ? 'DeepSeek 官方' : $('stName').value.trim(), baseUrl: kind === 'builtin' ? '' : $('stBase').value.trim(), api: kind === 'builtin' ? 'openai-completions' : $('stApi').value,
      ...(clearKey ? { apiKey: '' } : $('stKey').value ? { apiKey: $('stKey').value } : {}), model,
      compat: kind === 'builtin' ? { thinkingFormat: '', maxTokensField: '' } : { thinkingFormat: $('stThinkFmt').value, maxTokensField: $('stMaxField').value }, ...(headers === undefined ? {} : { headers }), thinkingLevel: level };
  }
  function settingResult(text, error = false) { $('stResult').className = 'st-result show ' + (error ? 'err' : 'ok'); $('stResult').textContent = text; }
  document.querySelectorAll('[data-kind]').forEach(b => { b.onclick = () => { kind = b.dataset.kind; markDirty(); modelFields(); }; });
  document.querySelectorAll('[data-lv]').forEach(b => { b.onclick = () => { level = b.dataset.lv; markDirty(); document.querySelectorAll('[data-lv]').forEach(n => n.setAttribute('aria-pressed', String(n === b))); }; });
  $('stPreset').onchange = modelFields;
  $('panel-settings').addEventListener('input', markDirty);
  $('panel-settings').addEventListener('change', () => { markDirty(); thinkHint(); });
  $('stReload').onclick = () => loadSettings(true).catch(error => settingResult(error.message, true));
  $('stEye').onclick = () => { $('stKey').type = $('stKey').type === 'password' ? 'text' : 'password'; $('stEye').setAttribute('aria-pressed', String($('stKey').type === 'text')); };
  $('clearKey').onclick = () => { clearKey = true; $('stKey').value = ''; markDirty(); settingResult('保存后将清除已有密钥。'); };
  $('stKey').oninput = () => { clearKey = false; };
  $('stAdvBtn').onclick = () => { const open = $('stFoldAdv').classList.toggle('open'); $('stAdvBtn').setAttribute('aria-expanded', String(open)); };
  for (const [id, endpoint] of [['stSave', '/api/config'], ['stTest', '/api/config/test']]) $(id).onclick = async () => {
    if (settingsBusy) return; settingsBusy = true; $('stSave').disabled = $('stTest').disabled = true;
    try {
      const value = formConfig(); settingResult(id === 'stTest' ? '正在请求所选模型…' : '正在保存…');
      const result = await api(endpoint, value);
      if (id === 'stSave') { await loadSettings(true); settingResult('配置已保存，下一轮会话生效。'); }
      else settingResult(`连接成功 · ${result.model} · ${result.durationMs} ms`);
    } catch (error) { settingResult(error.message, true); }
    finally { settingsBusy = false; $('stSave').disabled = $('stTest').disabled = false; }
  };
  document.querySelectorAll('.st-row').forEach(row => { const label = row.querySelector('label'); const input = row.querySelector('input[id],select[id]'); if (label && input && !label.querySelector('input')) label.htmlFor = input.id; });

  const categories = [['', '全部'], ['doc', '文档'], ['sel', '选区'], ['var', '变量'], ['render', 'Render']];
  const refKinds = Object.fromEntries(categories);
  function catalog() {
    return [...state.documents.filter(d => d.connected).flatMap(d => [{ kind: 'doc', id: d.documentId, label: d.name, sub: d.type }, ...(d.selection ? [{ kind: 'sel', id: d.documentId, label: '当前选区 ' + (d.selection.address || (d.activeSlide ? '第 ' + d.activeSlide + ' 页' : '')), sub: d.name + ' › ' + (d.activeSheet || ''), selection: structuredClone(d.selection), activeSheet: d.activeSheet, activeSlide: d.activeSlide }] : [])]),
      ...state.variables.flatMap(v => [{ kind: 'var', id: v.variableId, label: v.name, sub: typeOf(v) + ' · ' + (v.transform.sourceRef || '') }, ...v.renders.map(r => ({ kind: 'render', id: r.renderId, label: r.renderId + ' · ' + v.name, sub: docName(r.targetDocumentId) + ' › ' + (r.description || '未标注写入位置') }))])];
  }
  let mentionItems = [], popCategory = '', popIndex = 0, mentionRange;
  function beforeCaret() {
    const selection = window.getSelection(); if (!selection?.rangeCount || !$('editor').contains(selection.anchorNode)) return null;
    const range = selection.getRangeAt(0); if (range.startContainer.nodeType !== Node.TEXT_NODE) return null;
    return { node: range.startContainer, offset: range.startOffset, text: range.startContainer.textContent.slice(0, range.startOffset) };
  }
  function renderMention(query = '') {
    const all = online ? catalog() : [], matched = all.filter(r => V.matches(r, query, globalThis.pinyinPro?.pinyin));
    mentionItems = matched.filter(r => !popCategory || r.kind === popCategory); popIndex = Math.max(0, Math.min(popIndex, mentionItems.length - 1));
    $('mentionPop').innerHTML = '<div class="mtabs" role="tablist" aria-label="引用分类">' + categories.map(([id, label]) => '<button type="button" class="mt ' + (popCategory === id ? 'on' : '') + '" data-category="' + id + '" aria-pressed="' + (popCategory === id) + '">' + label + '<span class="k">' + matched.filter(r => !id || r.kind === id).length + '</span></button>').join('') + '</div><div class="mtip">↑↓ 选择 · Tab / ←→ 分类 · Enter 插入</div><div class="mlist" role="listbox">' + (mentionItems.length ? mentionItems.map((r, i) => '<button type="button" class="mi ' + (i === popIndex ? 'act' : '') + '" role="option" aria-selected="' + (i === popIndex) + '" data-ref="' + i + '"><span class="ic">' + esc(refKinds[r.kind]) + '</span><span class="tt"><span class="t1">' + esc(r.label) + '</span><span class="t2">' + esc(r.sub) + '</span></span><span class="enterhint">↵</span></button>').join('') : '<div class="empty">没有匹配的对象</div>') + '</div>';
    $('mentionPop').classList.add('show'); $('mentionPop').dataset.query = query;
    $('mentionPop').querySelector('.mi.act')?.scrollIntoView({ block: 'nearest' });
  }
  function closeMention() { $('mentionPop').classList.remove('show'); mentionRange = undefined; }
  function triggerMention() {
    const info = beforeCaret(), match = info?.text.match(/@([^\s@\u00a0]*)$/);
    if (!match) { closeMention(); return; }
    const range = document.createRange(); range.setStart(info.node, info.offset - match[0].length); range.setEnd(info.node, info.offset);
    mentionRange = range; renderMention(match[1]);
  }
  function chipNode(ref) {
    const key = String(++refSerial); composerRefs.set(key, structuredClone(ref));
    const chip = document.createElement('span'); chip.className = 'ref'; chip.contentEditable = 'false'; chip.dataset.refkey = key; chip.tabIndex = 0; chip.setAttribute('role', 'button'); chip.setAttribute('aria-label', '预览引用 ' + ref.label);
    const label = document.createElement('span'); label.textContent = '@ ' + ref.label;
    const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.removeRef = key; remove.textContent = '×'; remove.setAttribute('aria-label', '移除引用 ' + ref.label);
    chip.append(label, remove); return chip;
  }
  function insertRef(ref) {
    if ($('editor').querySelectorAll('[data-refkey]').length >= 30) { notice('每条消息最多引用 30 个对象。', true); return; }
    const range = mentionRange?.cloneRange(); $('editor').focus(); const at = range || document.createRange();
    if (!range) { at.selectNodeContents($('editor')); at.collapse(false); }
    at.deleteContents(); const space = document.createTextNode('\u00a0'), fragment = document.createDocumentFragment(); fragment.append(chipNode(ref), space); at.insertNode(fragment);
    at.setStart(space, space.length); at.collapse(true); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(at); closeMention();
  }
  function readComposer() {
    const refs = []; let text = '';
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) { text += node.textContent; return; }
      if (node.dataset?.refkey) { const ref = composerRefs.get(node.dataset.refkey); if (ref) { const marker = '引用' + (refs.length + 1); refs.push({ ...ref, marker }); text += '[' + marker + ':' + ref.label.replace(/[\]\r\n]/g, ' ') + ']'; } return; }
      if (node.nodeName === 'BR') { text += '\n'; return; }
      const block = ['DIV', 'P'].includes(node.nodeName); if (block && text && !text.endsWith('\n')) text += '\n'; node.childNodes.forEach(walk);
    }
    $('editor').childNodes.forEach(walk); return { message: text.replace(/\u00a0/g, ' ').trim(), refs };
  }
  function restoreComposer(text, refs) {
    $('editor').replaceChildren(); const pattern = /\[引用\d+:[^\]\n]*\]/g; let end = 0;
    for (const m of text.matchAll(pattern)) {
      $('editor').append(document.createTextNode(text.slice(end, m.index)));
      const ref = refs.find(r => r.marker === m[0].slice(1).split(':')[0]); $('editor').append(ref ? chipNode(ref) : document.createTextNode(m[0])); end = m.index + m[0].length;
    }
    $('editor').append(document.createTextNode(text.slice(end)));
    if (refs.length && refs.every(r => !r.marker)) refs.forEach(ref => { $('editor').append(document.createTextNode(' '), chipNode(ref)); });
  }
  $('atBtn').onclick = () => {
    if ($('mentionPop').classList.contains('show')) { closeMention(); return; }
    $('editor').focus(); const selection = window.getSelection(); let range;
    if (selection.rangeCount && $('editor').contains(selection.anchorNode)) range = selection.getRangeAt(0); else { range = document.createRange(); range.selectNodeContents($('editor')); range.collapse(false); }
    range.deleteContents(); const node = document.createTextNode('@'); range.insertNode(node); range.setStart(node, node.length); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); popCategory = ''; popIndex = 0; triggerMention();
  };
  $('editor').oninput = triggerMention;
  $('editor').addEventListener('paste', e => {
    e.preventDefault(); const text = e.clipboardData.getData('text/plain'), selection = window.getSelection();
    if (!selection.rangeCount || !$('editor').contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0); range.deleteContents(); const node = document.createTextNode(text); range.insertNode(node); range.setStart(node, node.length); range.collapse(true); selection.removeAllRanges(); selection.addRange(range); triggerMention();
  });
  $('editor').addEventListener('compositionend', triggerMention);
  $('mentionPop').addEventListener('mousedown', e => e.preventDefault());
  $('mentionPop').onclick = event => {
    const category = event.target.closest('[data-category]'); if (category) { popCategory = category.dataset.category; popIndex = 0; renderMention($('mentionPop').dataset.query); return; }
    const button = event.target.closest('[data-ref]'); if (button) insertRef(mentionItems[Number(button.dataset.ref)]);
  };
  let pinnedRef, hoverTimer, previewSequence = 0;
  function hideRefPop() { if (pinnedRef) return; clearTimeout(hoverTimer); $('refPop').hidden = true; previewSequence++; }
  function previewHTML(ref) {
    if (ref.kind === 'doc' || ref.kind === 'sel') {
      const d = doc(ref.id || ref.documentId) || ref;
      return '<div class="rkv"><span class="k">文档</span><span class="v">' + esc(d.name || ref.label) + '</span></div><div class="rkv"><span class="k">连接</span><span class="v">' + (connected(d.documentId || ref.id) ? '已连接' : '已断开') + '</span></div><div class="rkv"><span class="k">位置</span><span class="v">' + esc(ref.selection?.sheet || ref.activeSheet || d.activeSheet || '') + ' ' + esc(ref.selection?.address || d.selection?.address || (ref.activeSlide ? '第 ' + ref.activeSlide + ' 页' : '')) + '</span></div>' + (ref.kind === 'sel' ? '<div class="rkv"><span class="k">快照</span><span class="v">' + esc(preview(ref.selection)) + '</span></div><div id="selectionPreview" class="st-hint">正在读取选区预览…</div>' : '');
    }
    const v = state.variables.find(v => ref.kind === 'var' ? v.variableId === (ref.id || ref.variableId) : v.renders.some(r => r.renderId === (ref.id || ref.renderId)));
    if (!v) return '<div class="render-empty">该引用对象已不可用。</div>';
    if (ref.kind === 'var') return '<div class="rkv"><span class="k">变量</span><span class="v">' + esc(v.name) + ' · ' + esc(typeOf(v)) + '</span></div><div class="rkv"><span class="k">来源</span><span class="v">' + esc(docName(v.transform.sourceDocumentId)) + ' › ' + esc(v.transform.sourceRef || '未标注源区域') + '</span></div>' + V.valueHTML(v.value, v.hasValue);
    const r = v.renders.find(r => r.renderId === (ref.id || ref.renderId));
    return '<div class="rkv"><span class="k">目标</span><span class="v">' + esc(docName(r.targetDocumentId)) + ' › ' + esc(r.description || '未标注写入位置') + '</span></div><div class="rkv"><span class="k">变量</span><span class="v">' + esc(v.name) + '</span></div><div class="rkv"><span class="k">上次写入</span><span class="v">' + esc(stampTitle(r.lastRun)) + '</span></div><pre class="code">' + V.highlight(r.code) + '</pre>';
  }
  function showRefPop(anchor, ref, pin = false) {
    if (!ref || (pinnedRef && !pin)) return; if (pin) pinnedRef = ref;
    clearTimeout(hoverTimer); const sequence = ++previewSequence;
    $('refPop').innerHTML = '<div class="rh"><strong>' + esc(refKinds[ref.kind]) + ' · ' + esc(ref.label || ref.name || ref.renderId || ref.variableId || '') + '</strong><button type="button" data-close-preview aria-label="关闭引用预览">×</button></div><div class="rb">' + previewHTML(ref) + '</div><div class="rf">' + (pin ? '预览已固定 · Esc 关闭' : '点击引用可固定预览') + '</div>'; $('refPop').hidden = false;
    const rect = anchor.getBoundingClientRect(), p = $('refPop'); p.style.left = '10px'; p.style.width = Math.min(380, innerWidth - 20) + 'px'; p.style.top = Math.max(10, Math.min(rect.top - p.offsetHeight - 8, innerHeight - p.offsetHeight - 10)) + 'px';
    if (ref.kind === 'sel') api('/api/ref-preview', { ...ref, id: ref.id || ref.documentId }).then(value => {
      if (sequence === previewSequence && $('selectionPreview')) $('selectionPreview').innerHTML = value.hasValue ? V.valueHTML(value.value) : esc(value.message);
    }).catch(error => { if (sequence === previewSequence && $('selectionPreview')) $('selectionPreview').textContent = '预览不可用：' + error.message; });
  }
  function referenceAt(target) {
    const chip = target.closest('[data-refkey], [data-ref-marker]'); if (!chip) return;
    if (chip.dataset.refkey) return { anchor: chip, ref: composerRefs.get(chip.dataset.refkey) };
    const turn = turns.find(t => t.key === chip.closest('[data-turn]')?.dataset.turn);
    return { anchor: chip, ref: chip.dataset.refMarker.startsWith('legacy-') ? turn?.refs[Number(chip.dataset.refMarker.slice(7))] : turn?.refs.find(r => r.marker === chip.dataset.refMarker) };
  }
  document.addEventListener('mouseover', e => { const hit = referenceAt(e.target); if (hit) { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => showRefPop(hit.anchor, hit.ref), 250); } });
  document.addEventListener('mouseout', e => { if (e.target.closest('[data-refkey], [data-ref-marker]') && !e.relatedTarget?.closest?.('#refPop')) { clearTimeout(hoverTimer); hoverTimer = setTimeout(hideRefPop, 200); } });
  $('refPop').onmouseenter = () => clearTimeout(hoverTimer); $('refPop').onmouseleave = hideRefPop;
  document.addEventListener('click', e => {
    const remove = e.target.closest('[data-remove-ref]'); if (remove) { composerRefs.delete(remove.dataset.removeRef); remove.closest('[data-refkey]').remove(); pinnedRef = undefined; hideRefPop(); return; }
    if (e.target.closest('[data-close-preview]')) { pinnedRef = undefined; hideRefPop(); return; }
    const hit = referenceAt(e.target); if (hit) showRefPop(hit.anchor, hit.ref, true); else if (!e.target.closest('#refPop')) { pinnedRef = undefined; hideRefPop(); }
    if (!e.target.closest('#mentionPop, #editor, #atBtn')) closeMention();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMention(); pinnedRef = undefined; hideRefPop(); } });
  function factsHTML(block) {
    if (!['variable.render', 'render.create'].includes(block.toolName)) return '';
    const facts = V.renderFacts(block, state);
    return facts.length ? '<div class="tool-facts">' + facts.map(f => {
      const status = V.factStatus(block, f), error = f.error || (status.includes('失败') ? block.result?.error : undefined);
      return '<div class="write-fact ' + (status.includes('失败') ? 'failed' : '') + '" data-fact-render="' + esc(f.renderId || '') + '"><span>' + status + '</span> ' + esc(f.targetDocumentName) + ' › ' + esc(f.description || '未标注写入位置') + '<span class="fact-meta">' + esc(f.renderId || '新 Render') + (f.lastRun ? ' · ' + duration(f.lastRun.durationMs) : '') + '</span>' + (error ? '<span class="fact-error">' + esc(error.message) + '</span>' : '') + '</div>';
    }).join('') + '</div>' : '<div class="tool-facts">' + (block.status === 'running' ? '正在核对绑定目标…' : '本次调用没有可确认的写入目标。') + '</div>';
  }
  function blockHTML(block, turn, index) {
    const key = turn.key + '-' + (block.id || index);
    if (block.kind === 'text') return '<div class="body-text">' + V.markdown(block.text) + '</div>';
    if (block.kind === 'thinking') return '<details class="thinking-block" data-detail="' + esc(key) + '"><summary>思考过程 · ' + esc(block.text.trim().slice(0, 100) || '正在思考…') + '</summary><div class="thinking-text">' + esc(block.text) + '</div></details>';
    return '<div class="tool ' + (block.status === 'error' ? 'err' : block.status === 'running' ? 'run' : '') + '"><details data-detail="' + esc(key) + '"><summary class="tool-head"><span class="tool-name">' + esc(block.toolName) + '</span><span class="tool-prev">' + ({ running: '执行中…', error: '失败', stopped: '已停止 / 未完成', done: '完成' }[block.status] || '未完成') + '</span><span class="tool-dur">' + esc(duration(block.durationMs)) + '</span></summary><div class="tool-sec"><div class="lbl">参数</div><pre>' + esc(preview(block.args)) + '</pre></div>' + (block.result ? '<div class="tool-sec res"><div class="lbl">' + (block.status === 'error' ? '错误 / 部分结果' : '返回') + '</div><pre>' + esc(preview(block.result)) + '</pre></div>' : '') + '</details>' + factsHTML(block) + '</div>';
  }
  function renderTurns() {
    const open = new Set([...$('chatInner').querySelectorAll('[data-detail][open]')].map(n => n.dataset.detail));
    const scroll = $('chatScroll'), oldTop = scroll.scrollTop;
    $('chatInner').innerHTML = turns.length ? turns.map(t => {
      const lastText = t.blocks.map(b => b.kind).lastIndexOf('text'), processes = t.blocks.filter((_, i) => i !== lastText), tools = t.blocks.filter(b => b.kind === 'tool');
      const group = processes.length ? '<details class="process-group" data-detail="group-' + esc(t.key) + '" ' + (lastText < 0 ? 'open' : '') + '><summary>过程详情 · ' + processes.length + ' 条 · ' + tools.length + ' 次工具调用' + (tools.some(b => b.status === 'error') ? ' · 含失败' : '') + '</summary><div class="blocks">' + t.blocks.map((b, i) => i === lastText ? '' : blockHTML(b, t, i)).join('') + '</div></details>' : '';
      const recap = tools.filter(b => b.toolName === 'variable.render').map(factsHTML).join('');
      const legacyRefs = t.refs.length && !t.refs.some(r => r.marker) ? '<div class="refline">' + t.refs.map((r, n) => '<button class="ref" data-ref-marker="legacy-' + n + '">@ ' + esc(r.label || r.name || r.id || r.variableId || r.renderId) + '</button>').join('') + '</div>' : '';
      return '<section class="turn" data-turn="' + esc(t.key) + '"><div class="msg-user"><div class="bubble">' + V.userHTML(t.user, t.refs) + legacyRefs + '</div><div class="msg-meta"><span>' + clock(t.timestamp) + '</span><button data-copy-turn="' + esc(t.key) + '">复制</button><button data-quote-turn="' + esc(t.key) + '">引用以继续</button></div></div><div class="msg-assistant"><div class="model-line">' + esc(t.model || config?.model.id || 'WPS 助手') + (!t.done ? ' · 正在处理…' : '') + '</div>' +
        (t.done ? group + (recap ? '<div class="turn-writes" aria-label="本轮写入结果">' + recap + '</div>' : '') + (lastText >= 0 ? blockHTML(t.blocks[lastText], t, lastText) : '') : '<div class="blocks">' + t.blocks.map((b, i) => blockHTML(b, t, i)).join('') + '</div>') +
        (t.error ? '<div class="action-error">' + esc(t.error) + '</div>' : '') + (t.stopped ? '<div class="tool-state">已停止，已经完成的写入仍然有效。</div>' : '') + (t.stopReason === 'length' ? '<div class="tool-state">达到模型输出上限，可继续追问。</div>' : '') + '</div></section>';
    }).join('') : '<div class="empty-state" id="chatEmpty">连接你的 WPS 文档<br>描述要提取的数据或要更新的位置。<br>输入 @ 可引用文档、选区、变量与 Render。</div>';
    $('chatInner').querySelectorAll('[data-detail]').forEach(n => { if (open.has(n.dataset.detail)) n.open = true; });
    if (followTail) scroll.scrollTop = scroll.scrollHeight; else scroll.scrollTop = oldTop;
  }
  let renderScheduled = false;
  function scheduleRender() { if (renderScheduled) return; renderScheduled = true; requestAnimationFrame(() => { renderScheduled = false; renderTurns(); }); }
  $('chatScroll').onscroll = () => { followTail = $('chatScroll').scrollHeight - $('chatScroll').scrollTop - $('chatScroll').clientHeight < 55; };
  function showUsage(context, turn) {
    const valid = Number.isFinite(context?.percent), percent = valid ? context.percent : 0;
    $('ctxFill').style.width = Math.min(100, percent) + '%'; $('ctxPercent').textContent = valid ? percent.toFixed(1) + '%' : '—';
    $('contextChip').title = valid ? '估算上下文 ' + Number(context.tokens).toLocaleString() + ' / ' + Number(context.contextWindow).toLocaleString() + ' tokens' : '模型尚未返回用量，不能计算上下文占用';
    $('usageLabel').textContent = turn?.usage?.totalTokens ? '本轮 ' + (turn.calls || 1) + ' 次调用 · ' + turn.usage.totalTokens.toLocaleString() + ' tokens' : '';
  }
  async function history() {
    const value = await api('/api/chat'); if (controller) return;
    const changed = JSON.stringify(value) !== lastHistory; lastHistory = JSON.stringify(value);
    const previousBusy = peerBusy; peerBusy = value.busy; $('sendBtn').disabled = peerBusy;
    if (peerBusy && !previousBusy) notice('另一个面板正在运行会话；过程会自动同步，结束后可继续发送。');
    if (!peerBusy && previousBusy) notice('会话已完成，最新历史已同步。');
    if (changed) { turns = V.historyTurns(value.messages, value.turns, peerBusy); renderTurns(); showUsage(value.contextUsage, turns.at(-1)); }
  }
  $('chatInner').onclick = async event => {
    const copy = event.target.closest('[data-copy-turn]'), quote = event.target.closest('[data-quote-turn]');
    const turn = turns.find(t => t.key === (copy?.dataset.copyTurn || quote?.dataset.quoteTurn)); if (!turn) return;
    if (copy) {
      try { await navigator.clipboard.writeText(turn.user.replace(/\[引用\d+:([^\]]*)\]/g, '@ $1')); notice('已复制消息。'); }
      catch { notice('无法访问剪贴板，请选中文字复制。', true); }
    }
    if (quote) {
      const current = readComposer();
      if (current.message) restoreComposer(current.message + '\n\n引用上一条消息：\n' + turn.user.replace(/\[引用\d+:([^\]]*)\]/g, '@ $1'), current.refs);
      else restoreComposer(turn.user, turn.refs);
      $('editor').focus();
    }
  };
  async function send() {
    const input = readComposer(); if (!input.message || controller || peerBusy) return;
    const turn = V.newTurn(input.message, input.refs); turns.push(turn); controller = new AbortController(); followTail = true;
    turn.model = config?.model.id; showUsage(undefined, turn);
    $('sendBtn').disabled = true; $('stopBtn').hidden = false; $('editor').replaceChildren(); closeMention(); pinnedRef = undefined; hideRefPop(); notice(''); renderTurns();
    let ended = false, hadError = false;
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal });
      if (!response.ok) { const value = await response.json(); throw new Error(value.error || '发送失败'); }
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
      const drain = () => {
        let split;
        while ((split = buffer.indexOf('\n\n')) >= 0) {
          const part = buffer.slice(0, split); buffer = buffer.slice(split + 2);
          const name = part.match(/^event: (.+)$/m)?.[1], raw = part.match(/^data: (.+)$/m)?.[1]; if (!name || !raw) continue;
          const data = JSON.parse(raw); V.reduceEvent(turn, name, data);
          if (name === 'error') { hadError = true; notice(data.message, true); }
          if (name === 'turn.end') { ended = true; showUsage(data.contextUsage, turn); }
          scheduleRender();
        }
      };
      while (true) { const { value, done } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); drain(); }
      buffer += decoder.decode(); drain(); if (!ended) throw new Error('连接意外中断，请核对已执行的操作后再继续。');
    } catch (error) {
      hadError = true; const stopped = error.name === 'AbortError'; V.reduceEvent(turn, 'turn.end', { stopped, failed: !stopped });
      showUsage(turn.contextUsage, turn);
      if (!stopped) turn.error = error.message;
      notice(stopped ? '已停止生成。已经完成的写入仍然有效。' : error.message, !stopped);
    } finally {
      controller = undefined; $('sendBtn').disabled = peerBusy; $('stopBtn').hidden = true; renderTurns();
      if (hadError && !readComposer().message) restoreComposer(input.message, input.refs);
      await refresh(); if (ended && !hadError) await history().catch(() => {});
    }
  }
  $('sendBtn').onclick = send; $('stopBtn').onclick = () => controller?.abort();
  $('editor').onkeydown = event => {
    if (event.isComposing || event.keyCode === 229) return;
    if ($('mentionPop').classList.contains('show')) {
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); popIndex = Math.max(0, Math.min(mentionItems.length - 1, popIndex + (event.key === 'ArrowDown' ? 1 : -1))); renderMention($('mentionPop').dataset.query); return; }
      if (['Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); const step = event.key === 'ArrowLeft' || event.shiftKey ? -1 : 1; popCategory = categories[(categories.findIndex(c => c[0] === popCategory) + step + categories.length) % categories.length][0]; popIndex = 0; renderMention($('mentionPop').dataset.query); return; }
      if (event.key === 'Enter') { event.preventDefault(); if (mentionItems[popIndex]) insertRef(mentionItems[popIndex]); return; }
      if (event.key === 'Escape') { event.preventDefault(); closeMention(); return; }
    }
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); }
  };
  $('closePane').onclick = () => {
    if (V.hideHostPane(window, new URLSearchParams(location.search).get('page') === 'vars' ? 'vars' : 'chat')) return;
    notice('可通过 WPS 任务窗格右上角的关闭按钮收起面板。');
  };
  async function syncShared() {
    if (syncing) return syncing;
    syncing = Promise.allSettled([refresh(), history(), settingsBusy ? Promise.resolve() : loadSettings()]).then(results => {
      const failure = results.find(r => r.status === 'rejected'); if (failure && online) notice('同步失败：' + failure.reason.message, true);
    }).finally(() => { syncing = undefined; }); return syncing;
  }
  window.addEventListener('focus', () => { void syncShared(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void syncShared(); });
  void syncShared();
  async function poll() { if (!document.hidden) await syncShared(); setTimeout(poll, 2500); } setTimeout(poll, 2500);
})();
