/* Pure rendering/data adapters shared by the live pane, history and regression tests. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const legacyToolNames = Object.fromEntries([
    ['workspace.list_documents', 'wps_list_documents'], ['document.get', 'wps_get_document'],
    ['wps.exec', 'wps_run_readonly_code'], ['transform.create', 'wps_create_variable'],
    ['transform.update', 'wps_update_variable'], ['render.create', 'wps_create_render'],
    ['wps_update_transform', 'wps_update_variable'],
    ['render.update', 'wps_update_render'], ['variable.get', 'wps_get_variable'],
    ['variable.transform', 'wps_run_transform'], ['variable.render', 'wps_run_render'],
  ].flatMap(([old, name]) => [[old, name], [old.replaceAll('.', '_'), name]]));
  const toolName = name => Object.prototype.hasOwnProperty.call(legacyToolNames, name) ? legacyToolNames[name] : name;
  const jsonPreview = value => { const text = JSON.stringify(value, null, 2) ?? '尚未取值'; return text.length > 12000 ? text.slice(0, 12000) + '\n…预览已截断' : text; };
  function highlight(code) {
    const pattern = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|return|if|else|for|while|function|throw|new|try|catch|true|false|null|undefined|await)\b/g;
    let html = '', end = 0;
    for (const m of String(code).matchAll(pattern)) {
      html += esc(String(code).slice(end, m.index));
      html += `<span class="${m[0].startsWith('/') ? 'cm' : /^["'`]/.test(m[0]) ? 'str' : 'kw'}">${esc(m[0])}</span>`;
      end = m.index + m[0].length;
    }
    return html + esc(String(code).slice(end));
  }
  function inline(text) {
    let html = '', end = 0;
    const pattern = /`([^`]+)`|\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
    for (const m of String(text).matchAll(pattern)) {
      html += esc(String(text).slice(end, m.index));
      if (m[1]) html += `<code>${esc(m[1])}</code>`;
      else if (m[2]) {
        const safe = /^https?:\/\//i.test(m[3]);
        html += safe ? `<a href="${esc(m[3])}" target="_blank" rel="noopener noreferrer">${esc(m[2])}</a>` : esc(m[0]);
      } else html += m[4] ? `<strong>${esc(m[4])}</strong>` : `<em>${esc(m[5])}</em>`;
      end = m.index + m[0].length;
    }
    return html + esc(String(text).slice(end));
  }
  const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
  function markdown(text) {
    const lines = String(text).replace(/\r/g, '').split('\n'); let html = '', i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        const code = []; i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
        if (i < lines.length) i++;
        html += `<pre class="code">${highlight(code.join('\n'))}</pre>`; continue;
      }
      if (line.includes('|') && lines[i + 1] && cells(lines[i + 1]).every(c => /^:?-{3,}:?$/.test(c))) {
        const head = cells(line); i += 2; let body = '';
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { const row = cells(lines[i++]); body += '<tr>' + head.map((_, n) => `<td>${inline(row[n] || '')}</td>`).join('') + '</tr>'; }
        html += `<div class="table-scroll"><table class="mdtable"><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`; continue;
      }
      const list = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
      if (list) {
        const ordered = /^\s*\d/.test(line), tag = ordered ? 'ol' : 'ul'; const items = [];
        const re = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/;
        while (i < lines.length && re.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(re, ''))}</li>`);
        html += `<${tag}>${items.join('')}</${tag}>`; continue;
      }
      if (/^#{1,6}\s/.test(line)) { const n = line.match(/^#+/)[0].length; html += `<h${n}>${inline(line.replace(/^#+\s+/, ''))}</h${n}>`; }
      else if (/^>\s?/.test(line)) html += `<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`;
      else if (line.trim()) html += `<p>${inline(line)}</p>`;
      i++;
    }
    return html;
  }
  function agentInfoHTML(stats, context, modelName) {
    const number = value => Number.isFinite(value) ? value.toLocaleString('zh-CN') : '—';
    const rows = values => '<dl>' + values.map(([label, value, title]) => '<dt' + (title ? ' title="' + esc(title) + '"' : '') + '>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>').join('') + '</dl>';
    const time = ms => {
      if (!Number.isFinite(ms)) return '—';
      const seconds = Math.floor(ms / 1000), hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60);
      return (hours ? hours + 'h ' : '') + minutes + 'm ' + seconds % 60 + 's';
    };
    const tokens = stats?.tokens;
    const cost = Number.isFinite(stats?.cost) ? stats.costComplete === false && stats.cost === 0 ? '未配置单价' : '$' + stats.cost.toFixed(4) + (stats.costComplete === false ? '（已计价部分）' : '') : '—';
    const usage = context || stats?.contextUsage;
    return '<div class="agent-info"><section class="agent-session"><h3>会话信息</h3>' + rows([['会话文件', stats?.sessionFile || '—'], ['ID', stats?.sessionId || '—'], ['活跃时长', time(stats?.activeDurationMs), '已记录轮次的执行耗时之和，不含轮次之间的等待时间'], ['模型', modelName || '尚未配置']]) + '<h3 class="agent-project-title">项目信息</h3>' + rows([['项目目录', stats?.projectDirectory || '—']]) + '</section><section><h3>消息</h3>' + rows([['用户', number(stats?.userMessages)], ['助手', number(stats?.assistantMessages)], ['工具调用', number(stats?.toolCalls)], ['工具结果', number(stats?.toolResults)], ['其他消息', number(stats?.otherMessages), '系统提示词等会话日志中的其他消息'], ['总计', number(stats?.totalMessages)], ['轮次', number(stats?.rounds)], ['模型调用', number(stats?.modelCalls)]]) + '</section><section><h3>Token</h3>' + rows([['输入', number(tokens?.input)], ['输出', number(tokens?.output)], ['缓存读取', number(tokens?.cacheRead)], ['缓存写入', number(tokens?.cacheWrite)], ['总计', number(tokens?.total)], ['费用', cost], ['上下文', number(usage?.tokens) + ' / ' + number(usage?.contextWindow)], ['上下文占用', Number.isFinite(usage?.percent) ? usage.percent.toFixed(1) + '%' : '—'], ['平均缓存命中率', Number.isFinite(stats?.cacheHitRate) ? stats.cacheHitRate.toFixed(1) + '%' : '—', '累计缓存读取 ÷（累计输入 + 缓存读取 + 缓存写入），按 Token 加权']]) + '</section></div>';
  }
  function schemaType(schema = {}) {
    if (schema.const !== undefined) return JSON.stringify(schema.const);
    if (schema.enum) return schema.enum.map(value => JSON.stringify(value)).join(' | ');
    const alternatives = schema.anyOf || schema.oneOf;
    if (alternatives) return alternatives.map(schemaType).join(' | ');
    if (schema.type === 'array') return 'array<' + schemaType(schema.items) + '>';
    return Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type || schema.$ref || '任意类型';
  }
  function agentToolHTML(tool) {
    const schema = tool.parameters || {}, properties = Object.entries(schema.properties || {}), required = new Set(schema.required || []);
    const rows = properties.map(([name, property]) => {
      const constraints = ['default', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'minItems', 'maxItems'].filter(key => property[key] !== undefined).map(key => key + ': ' + JSON.stringify(property[key]));
      return '<tr><td><code>' + esc(name) + '</code><span class="agent-' + (required.has(name) ? 'required">必填' : 'optional">可选') + '</span></td><td><code>' + esc(schemaType(property)) + '</code><p class="agent-description">' + esc(property.description) + '</p>' + (constraints.length ? '<div class="agent-constraints">' + esc(constraints.join(' · ')) + '</div>' : '') + '</td></tr>';
    }).join('');
    const nested = properties.some(([, property]) => property.properties || property.items?.properties || property.anyOf || property.oneOf || property.$ref);
    return '<section><h3>描述</h3><p class="agent-description">' + esc(tool.description) + '</p></section><section><div class="agent-section-head"><h3>参数</h3><span>' + properties.length + ' 个参数</span></div>' + (rows ? '<table class="agent-parameters" aria-label="工具参数"><tbody>' + rows + '</tbody></table>' : '<p class="agent-description">无需参数。</p>') + (nested || !schema.properties && Object.keys(schema).length ? '<details><summary>完整参数定义</summary><pre>' + esc(JSON.stringify(schema, null, 2)) + '</pre></details>' : '') + '</section>';
  }
  function agentSkillHTML(skill, directory, diagnostics = []) {
    const content = String(skill.content || '').replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
    return '<section><h3>描述</h3><p class="agent-description">' + esc(skill.description) + '</p></section><section><h3>调用方式</h3><p class="agent-description">' + (skill.disableModelInvocation ? '仅手动调用' : '助手按任务需要读取') + '</p></section><section><h3>技能来源</h3><div class="agent-path">' + esc(skill.filePath) + '</div><div class="agent-path">技能目录：' + esc(directory) + '</div></section><section><h3>技能正文</h3><div class="body-text">' + markdown(content) + '</div></section>' + (diagnostics.length ? '<section><details><summary>技能加载提示</summary><pre>' + esc(JSON.stringify(diagnostics, null, 2)) + '</pre></details></section>' : '');
  }
  function tableOf(value) {
    if (!Array.isArray(value) || !value.length) return null;
    if (Array.isArray(value[0])) return { cols: Array.from({ length: Math.max(...value.slice(0, 20).map(r => Array.isArray(r) ? r.length : 0)) }, (_, i) => '列 ' + (i + 1)), rows: value };
    if (value[0] && typeof value[0] === 'object') {
      const cols = [...new Set(value.slice(0, 20).flatMap(v => v && typeof v === 'object' ? Object.keys(v) : []))];
      return { cols, rows: value.map(row => cols.map(key => row?.[key])) };
    }
    return null;
  }
  const formatValue = value => typeof value === 'number' ? value.toLocaleString('zh-CN', { maximumFractionDigits: 8 }) : value && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—');
  function typeOf(variable) {
    if (!variable.hasValue) return '尚未取值';
    const v = variable.value, table = tableOf(v);
    if (table) return `表格 ${table.rows.length}×${table.cols.length}`;
    if (Array.isArray(v)) return `数组 ${v.length} 项`;
    if (typeof v === 'number') return '数值 ' + formatValue(v);
    return v === null ? '空值' : ({ string: '文本', boolean: '布尔值', object: '对象' }[typeof v] || '值');
  }
  function valueHTML(value, hasValue = true) {
    if (!hasValue) return '<div class="render-empty">尚未取值，请先重算。</div>';
    const table = tableOf(value);
    if (table) return `<div class="minitbl table-scroll"><table><thead><tr>${table.cols.slice(0, 6).map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${table.rows.slice(0, 5).map(r => '<tr>' + table.cols.slice(0, 6).map((_, n) => `<td>${esc(formatValue(r?.[n]))}</td>`).join('') + '</tr>').join('')}<tr><td class="more" colspan="${Math.max(1, Math.min(6, table.cols.length))}">共 ${table.rows.length} 行 · ${table.cols.length} 列${table.rows.length > 5 || table.cols.length > 6 ? '（预览前 5 行 / 6 列）' : ''}</td></tr></tbody></table></div>`;
    return value && typeof value === 'object' ? `<pre class="value">${esc(jsonPreview(value))}</pre>` : `<div class="minitbl"><table><tbody><tr><td>值</td><td>${esc(formatValue(value))}</td></tr></tbody></table></div>`;
  }
  function resultValue(result) {
    if (result?.details) return result.details;
    if (!result?.content) return result;
    const text = typeof result.content === 'string' ? result.content : result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
    try { return JSON.parse(text.replace(/^Error:\s*/, '')); } catch { return { error: { message: text } }; }
  }
  function newTurn(text, refs = [], timestamp = Date.now()) {
    return { key: String(timestamp), user: text, refs, timestamp, blocks: [], tools: {}, done: false };
  }
  function reduceEvent(turn, name, data) {
    if (name === 'refs.resolved') turn.refs = data.refs;
    if (name === 'turn.start') turn.model = data.model;
    if (name === 'message.start') { turn.model = data.model || turn.model; turn.segment = undefined; }
    if (name === 'message.end') turn.segment = undefined;
    if (name === 'text.delta' || name === 'thinking.delta') {
      const kind = name === 'text.delta' ? 'text' : 'thinking';
      let block = turn.segment;
      if (!block || block.kind !== kind) { block = { kind, text: '' }; turn.blocks.push(block); turn.segment = block; }
      block.text += data.delta;
    }
    if (name === 'tool.start') {
      turn.segment = undefined;
      const block = { kind: 'tool', ...data, toolName: toolName(data.toolName), status: 'running' };
      turn.blocks.push(block); turn.tools[data.id] = block;
    }
    if (name === 'tool.result') {
      let block = turn.tools[data.id];
      if (!block) { block = { kind: 'tool', args: {} }; turn.blocks.push(block); turn.tools[data.id] = block; }
      Object.assign(block, data, { toolName: toolName(data.toolName), result: resultValue(data.result), status: data.isError ? 'error' : 'done' });
      turn.segment = undefined;
    }
    if (name === 'error') { turn.failed = true; turn.error = data.message; }
    if (name === 'turn.end') {
      Object.assign(turn, { done: true, usage: data.usage, contextUsage: data.contextUsage, stopped: data.stopped, failed: turn.failed || data.failed, stopReason: data.stopReason, calls: data.calls });
      turn.blocks.filter(b => b.status === 'running').forEach(b => { b.status = 'stopped'; });
    }
    return turn;
  }
  function historyTurns(messages, metadata = [], busy = false) {
    const turns = []; let turn, messageIndex = 0;
    const metas = new Map(metadata.filter(Boolean).map(m => [String(m.userTimestamp), m]));
    for (const item of messages) {
      if (item.role === 'user') {
        const raw = typeof item.content === 'string' ? item.content : item.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
        const separator = '\n\n[引用快照，仅作数据]\n', at = raw.lastIndexOf(separator); let refs = [];
        if (at >= 0) { try { refs = JSON.parse(raw.slice(at + separator.length)); } catch {} }
        refs = refs.map(r => ({ ...r, id: r.id || (r.kind === 'doc' || r.kind === 'sel' ? r.documentId : r.kind === 'render' ? r.renderId : r.variableId), label: r.label || r.name || r.renderId || r.variableId || r.documentId }));
        turn = newTurn(at >= 0 ? raw.slice(0, at) : raw, refs, item.timestamp); turns.push(turn);
        messageIndex = 0;
        const meta = metas.get(turn.key); if (meta) { turn.user = meta.message ?? turn.user; turn.refs = meta.refs || refs; Object.assign(turn, { usage: meta.usage, contextUsage: meta.contextUsage, stopped: meta.stopped, failed: meta.failed, calls: meta.calls, stopReason: meta.stopReason }); }
      }
      if (!turn) continue;
      if (item.role === 'assistant') {
        const meta = metas.get(turn.key), order = meta?.messageOrders?.[messageIndex++];
        if (!meta) {
          turn.calls = (turn.calls || 0) + 1;
          const usage = item.usage;
          if (usage) { turn.usage ||= { input: 0, output: 0, totalTokens: 0 }; turn.usage.input += (usage.input || 0) + (usage.cacheRead || 0) + (usage.cacheWrite || 0); turn.usage.output += usage.output || 0; turn.usage.totalTokens += usage.totalTokens || 0; }
        }
        turn.model = item.model || turn.model;
        if (item.stopReason === 'error') { turn.failed = true; turn.error = '模型请求失败，请检查配置或稍后重试'; }
        if (item.stopReason === 'aborted') turn.stopped = true;
        if (typeof item.content === 'string') turn.blocks.push({ kind: 'text', text: item.content });
        else for (const block of order ? [...order.map(i => item.content[i]).filter(Boolean), ...item.content.filter((b, i) => !order.includes(i))] : item.content) {
          if (block.type === 'text') turn.blocks.push({ kind: 'text', text: block.text });
          if (block.type === 'thinking') turn.blocks.push({ kind: 'thinking', text: block.thinking });
          if (block.type === 'toolCall') {
            const saved = metas.get(turn.key)?.tools?.[block.id] || {};
            const tool = { kind: 'tool', id: block.id, args: block.arguments, status: 'stopped', ...saved, toolName: toolName(saved.toolName || block.name) };
            turn.blocks.push(tool); turn.tools[block.id] = tool;
          }
        }
      }
      if (item.role === 'toolResult') reduceEvent(turn, 'tool.result', { ...metas.get(turn.key)?.tools?.[item.toolCallId], id: item.toolCallId, toolName: item.toolName, isError: item.isError, result: resultValue(item) });
    }
    turns.forEach(t => { t.done = true; });
    if (busy && turns.length) { const active = turns.at(-1); active.done = false; active.blocks.filter(b => b.status === 'stopped').forEach(b => { b.status = 'running'; }); }
    return turns;
  }
  function renderFacts(block, state) {
    const value = resultValue(block.result), variable = state.variables.find(v => v.variableId === block.args?.variableId);
    // Historical success facts come from the result/saved call, never latest execution metadata.
    const saved = block.facts ?? (block.status === 'running' ? variable?.renders.filter(r => !block.args.renderId || r.renderId === block.args.renderId) : []) ?? [];
    const results = value?.renders || (block.toolName === 'wps_create_render' && value?.renderId ? [{ renderId: value.renderId, ...block.args }] : block.toolName === 'wps_update_render' && value?.renderId ? [{ ...value, description: value.description ?? undefined }] : []);
    const facts = results.length ? results.map(r => ({ ...saved.find(s => s.renderId === r.renderId), ...r })) : saved;
    return facts.map(f => ({ ...f, targetDocumentName: f.targetDocumentName || state.documents.find(d => d.documentId === f.targetDocumentId)?.name || f.targetDocumentId || '目标未标注' }));
  }
  function factStatus(block, fact) {
    if (block.toolName === 'wps_update_render') {
      if (block.status === 'running') return '待更新规则';
      if (block.status === 'error') return '规则更新失败';
      return block.status === 'done' && resultValue(block.result)?.success === true ? '规则已更新' : '未确认更新';
    }
    if (block.toolName === 'wps_create_render') {
      if (block.status === 'running') return '待绑定';
      if (block.status === 'error') return '绑定失败';
      return block.status === 'done' && resultValue(block.result)?.renderId ? '已绑定' : '未确认绑定';
    }
    if (fact.success === true) return '已写入';
    if (fact.success === false || block.status === 'error') return '写入失败';
    return block.status === 'running' ? '待写入' : '未确认完成';
  }
  function matches(ref, query, pinyin) {
    const q = query.toLowerCase().replace(/\s/g, '');
    const label = (ref.label + ' ' + (ref.sub || '')).toLowerCase();
    if (!q || label.replace(/\s/g, '').includes(q)) return true;
    if (!pinyin) return false;
    const words = pinyin(label, { toneType: 'none', type: 'array', nonZh: 'consecutive' });
    return words.join('').toLowerCase().replace(/\s/g, '').includes(q) || words.map(w => /^[a-z]/i.test(w) ? w[0] : w).join('').toLowerCase().includes(q);
  }
  function userHTML(text, refs) {
    const pattern = /\[引用\d+:[^\]\n]*\]/g; let html = '', end = 0;
    for (const m of text.matchAll(pattern)) {
      html += esc(text.slice(end, m.index));
      const marker = m[0].slice(1).split(':')[0], ref = refs.find(r => r.marker === marker);
      html += ref ? `<button type="button" class="ref" data-ref-marker="${esc(marker)}" title="${esc(ref.label || referenceChipLabel(ref))}" aria-label="${esc(ref.label || referenceChipLabel(ref))}">${referenceContentHTML(ref)}</button>` : esc(m[0]);
      end = m.index + m[0].length;
    }
    return html + esc(text.slice(end));
  }
  function hideHostPane(win, page) {
    const hosts = [win.Application, win.wps?.Application, win.wps];
    for (const name of ['EtApplication', 'WpsApplication', 'WppApplication']) {
      try { if (win.wps?.[name]) hosts.unshift(win.wps[name]()); } catch {}
    }
    for (const host of hosts.filter(Boolean)) {
      try {
        const id = (host.PluginStorage || win.wps?.PluginStorage)?.getItem('wps-mcp-pane-' + page);
        if (id === undefined || id === null) continue;
        const pane = host.GetTaskPane ? host.GetTaskPane(id) : host.GetTaskpane?.(id);
        if (pane) { pane.Visible = false; return true; }
      } catch {}
    }
    return false;
  }
  function selectionPosition(ref, compact = false) {
    const s = ref.selection || {};
    if (s.address) return (s.sheet || ref.activeSheet || '') + '!' + s.address;
    return [ref.activeSlide ? (compact ? '第' + ref.activeSlide + '页' : '第 ' + ref.activeSlide + ' 页') : '', s.shapeNames?.join('、'),
      s.type === 'text' && typeof s.text === 'string' ? '「' + s.text.slice(0, 40) + (s.text.length > 40 ? '…' : '') + '」' : '',
      s.start !== undefined ? (compact ? s.start + '起' + (s.end !== undefined ? s.end - s.start : s.length ?? 0) + '字' :
        s.end !== undefined ? '字符 ' + s.start + '–' + s.end : '起点 ' + s.start + ' · ' + (s.length ?? 0) + ' 字符') : '',
    ].filter(Boolean).join(compact ? '›' : ' › ') || '无选区';
  }
  function selectionLabel(ref) {
    const label = (ref.selectionMode === 'current' ? '当前选区' : '固定选区') + ' · ' + (ref.name || ref.id) + ' › ' + selectionPosition(ref);
    return label.length > 900 ? label.slice(0, 900) + '…' : label;
  }
  // Compact display only: the full label and captured selection remain in message metadata.
  function referenceChipLabel(ref) {
    const fallback = ref.label || ref.name || ref.id || ref.variableId || ref.renderId || '';
    if (ref.kind !== 'sel') return fallback + (['var', 'render'].includes(ref.kind) && ref.unavailable ? '（已删除）' : '');
    if (!ref.selection) return fallback.replace(/^(?:当前选区|固定选区)\s*[·›]?\s*/, '').replace(/\s*›\s*/g, '›');
    return (ref.name || ref.id) + '›' + selectionPosition(ref, true) + (ref.unavailable ? '（不可用）' : '');
  }
  function selectionPinHTML(ref) {
    return '<span class="selection-pin' + (ref.selectionMode === 'current' ? '' : ' is-fixed') + '" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" focusable="false"><path class="pin-head" d="M8 3h8v6l3 3v2H5v-2l3-3Z"/><path class="pin-stem" d="M12 14v7"/></svg></span>';
  }
  function variableReference(ref, state) {
    if (!['var', 'render'].includes(ref.kind)) return ref;
    const id = ref.id || (ref.kind === 'var' ? ref.variableId : ref.renderId);
    const exists = state.variables.some(variable => ref.kind === 'var' ? variable.variableId === id : variable.renders.some(render => render.renderId === id));
    return { ...ref, unavailable: !exists };
  }
  function referenceContentHTML(ref) {
    return (ref.kind === 'sel' ? selectionPinHTML(ref) : '') + '<span data-ref-label>' + esc(referenceChipLabel(ref)) + '</span>';
  }
  function selectionReference(ref, state, online = true) {
    if (ref.kind !== 'sel') return ref;
    const next = structuredClone(ref);
    if (ref.selectionMode === 'current' && !ref.selectionResolved) {
      const doc = state.documents.find(doc => doc.documentId === ref.id && doc.connected);
      next.selection = doc?.selection ? boundedSelection(doc.selection) : undefined;
      next.activeSheet = doc?.activeSheet; next.activeSlide = doc?.activeSlide;
      next.name = doc?.name || ref.name;
      next.unavailable = !online || !doc || !doc.selection || doc.selection.type === 'none';
    }
    next.label = selectionLabel(next) + (next.unavailable ? '（不可用）' : '');
    return next;
  }
  function boundedSelection(selection) {
    const next = structuredClone(selection);
    // Match MAX_SELECTION_TEXT in src/selection.ts and the native collector.
    if (typeof next?.text === 'string' && next.text.length > 2000) {
      next.textLength = Math.max(next.text.length, typeof next.textLength === 'number' ? next.textLength : 0);
      next.text = next.text.slice(0, 2000); next.textTruncated = true;
    }
    return next;
  }
  function selectionRequest(ref) {
    if (ref.kind !== 'sel') return ref;
    const request = { kind: ref.kind, id: ref.id || ref.documentId, selectionMode: ref.selectionMode || 'fixed', label: ref.label, marker: ref.marker };
    // The server obtains current selections from the routed Add-in. Uploading
    // a stale preview serves no purpose and can exceed the request budget.
    return request.selectionMode === 'current' ? request : {
      ...request, activeSheet: ref.activeSheet, activeSlide: ref.activeSlide,
      selection: boundedSelection(ref.selection),
    };
  }
  function selectionDetailsHTML(ref) {
    const s = ref.selection || {};
    const row = (key, value) => '<div class="rkv"><span class="k">' + key + '</span><span class="v">' + esc(value) + '</span></div>';
    return row('类型', ref.selectionMode === 'current' ? (ref.selectionResolved ? '当前选区 · 本次发送时的位置' : '当前选区 · 跟随文档中的选择') : '固定选区 · 保留引用时的位置') +
      row('位置', selectionPosition(ref)) +
      (typeof s.text === 'string' ? row(s.type === 'caret' ? '插入点' : s.textTruncated ? '选中文字预览' : '选中文字', s.text || '（空）') : '') +
      (s.textTruncated && typeof s.text === 'string' ? row('预览范围', '仅显示前 ' + s.text.length + ' 字符；完整位置已保留') : '');
  }
  function variablesInMode(state, mode, online = true) {
    const connected = new Set(online ? state.documents.filter(doc => doc.connected).map(doc => doc.documentId) : []);
    return mode === 'all' ? state.variables : state.variables.filter(variable => connected.has(variable.transform.sourceDocumentId) || variable.renders.some(render => connected.has(render.targetDocumentId)));
  }
  function variableActions(state, mode, op, online = true) {
    const connected = new Set(online ? state.documents.filter(doc => doc.connected).map(doc => doc.documentId) : []);
    return variablesInMode(state, mode, online).flatMap(variable => {
      if (op === 'transform') return connected.has(variable.transform.sourceDocumentId) ? [{ op, variableId: variable.variableId }] : [];
      if (!variable.hasValue) return [];
      return variable.renders.filter(render => connected.has(render.targetDocumentId)).map(render => ({ op, variableId: variable.variableId, renderId: render.renderId }));
    });
  }
  function referenceCatalog(state, mode = 'current', online = true) {
    if (!online) return [];
    const docName = id => state.documents.find(doc => doc.documentId === id)?.name || id + '（未注册）';
    return [
      ...state.documents.filter(doc => doc.connected).flatMap(doc => [
        { kind: 'doc', id: doc.documentId, label: doc.name, sub: doc.type },
        ...(doc.selection && doc.selection.type !== 'none' ? ['current', 'fixed'].map(selectionMode => {
          const ref = { kind: 'sel', id: doc.documentId, name: doc.name, selectionMode, selection: boundedSelection(doc.selection), activeSheet: doc.activeSheet, activeSlide: doc.activeSlide };
          return { ...ref, label: selectionLabel(ref), sub: selectionMode === 'current' ? '跟随文档中的选择 · 发送时读取最新位置' : '保留引用时的位置 · 后续移动选区不影响' };
        }) : []),
      ]),
      ...variablesInMode(state, mode, online).flatMap(variable => [
        { kind: 'var', id: variable.variableId, label: variable.name, sub: typeOf(variable) + ' · ' + (variable.transform.sourceRef || '') },
        ...variable.renders.map(render => ({ kind: 'render', id: render.renderId, label: render.renderId + ' · ' + variable.name, sub: docName(render.targetDocumentId) + ' › ' + ([render.targetRef, render.description].filter(Boolean).join(' · ') || '未标注写入位置') })),
      ]),
    ];
  }
  globalThis.WpsPaneView = { agentInfoHTML, agentToolHTML, agentSkillHTML, esc, highlight, markdown, valueHTML, typeOf, formatValue, jsonPreview, toolName, resultValue, newTurn, reduceEvent, historyTurns, renderFacts, factStatus, matches, userHTML, hideHostPane, variablesInMode, variableActions, referenceCatalog, variableReference, selectionReference, selectionLabel, selectionPosition, selectionDetailsHTML, referenceChipLabel, selectionPinHTML, referenceContentHTML, selectionRequest };
})();
