import { LocalMcpClient, rpcResult, copyText, pretty } from './mcp-client.js';

export function clientProfiles(endpoint) {
  const json = pretty({ mcpServers: { 'wps-mcp': { type: 'http', url: endpoint } } });
  return {
    codex: {
      intro: '使用本机 Codex 的 Streamable HTTP 接入；已有后台服务保持运行。',
      steps: ['在用户目录的 .codex/config.toml 中合并下方配置；如果设置了 CODEX_HOME，使用其目录内的 config.toml。', '保存后重新加载 MCP 或重启客户端。也可使用下方 CLI 命令添加服务器。'],
      label: 'config.toml 配置', config: `[mcp_servers.wps-mcp]\nurl = "${endpoint}"\n`,
      command: `codex mcp add wps-mcp --url ${endpoint}\ncodex mcp list`,
      hint: '添加这一段即可，保留原有设置。已有同名服务器时修改其 url，避免重复的 TOML 表。',
      verify: 'Codex CLI 可用 codex mcp list 查看配置，并在会话中用 /mcp 检查活动服务器；其他界面在 MCP 设置中确认启用状态。',
      source: 'https://developers.openai.com/codex/mcp/',
    },
    'claude-code': {
      intro: '推荐用 Claude Code CLI 添加用户级 HTTP 服务器，供本机各项目复用。',
      steps: ['执行下方 claude mcp add 命令，或把 JSON 合并到项目根目录的 .mcp.json。', '项目级配置需要在 Claude Code 中信任并启用；重新加载 MCP 或开始新会话后检查状态。'],
      label: '项目 .mcp.json 配置', config: json,
      command: `claude mcp add --transport http --scope user wps-mcp ${endpoint}\nclaude mcp get wps-mcp`,
      hint: 'CLI 用户级配置与项目级 JSON 二选一。合并 mcpServers 内的 wps-mcp 条目，保留其他服务器；type 必须明确填写 http。',
      verify: '在 Claude Code 会话中输入 /mcp，确认 wps-mcp 已连接，再发送验证指令。',
      source: 'https://code.claude.com/docs/en/mcp',
    },
    workbuddy: {
      intro: '在本机 WorkBuddy 中添加自定义 MCP；选择 HTTP 地址以复用已有服务。',
      steps: ['打开 WorkBuddy 的 MCP 配置入口：插件 → MCP 服务器 → 配置 MCP；部分版本位于连接器或设置的 MCP 页面。', '在配置编辑器中合并下方 JSON。用户级配置通常位于用户目录的 .workbuddy/mcp.json；也可使用项目内的 .workbuddy/mcp.json。', '保存并启用 wps-mcp，查看连接状态；若未刷新，重新加载 MCP 或重启 WorkBuddy。'],
      label: 'mcp.json 配置', config: json, command: '',
      hint: '合并 mcpServers 内的 wps-mcp 条目，保留现有配置。此处使用本机 loopback HTTP 地址，不需要设置认证头。',
      verify: '在 WorkBuddy 的 MCP 服务器列表确认 wps-mcp 已启用且连接正常，再发送验证指令。',
      source: 'https://www.workbuddy.ai/docs/zh/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/MCP-Guide',
    },
  };
}

export const VERIFICATION_PROMPT = '请使用 wps-mcp 的 wps_list_documents 工具列出当前可用的 WPS 文档，并展示工具调用结果。只查询，不修改文档，也不要创建或更新变量与规则。如果调用失败，请展示实际错误；不要把普通文字回答当作 MCP 调用成功。';

// Keep profile generation importable by tests without a browser DOM.
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const client = new LocalMcpClient(new URL('/mcp', location.href).href);
  const profiles = clientProfiles(client.endpoint);
  let profile;
  $('endpoint').textContent = client.endpoint;
  $('verificationPrompt').textContent = VERIFICATION_PROMPT;

  function updateAgentStatus() {
    const complete = $('agentConnected').checked && $('agentCalled').checked;
    $('agentStatus').className = `status${complete ? ' success' : ''}`;
    $('agentStatus').textContent = complete ? '你已手动确认客户端连接与工具调用成功。' : '尚未确认 Agent 接入。本页的本地检查无法证明客户端已经配置成功。';
  }
  function selectClient() {
    profile = profiles[$('clientSelect').value];
    $('clientIntro').textContent = profile.intro;
    $('clientSteps').replaceChildren(...profile.steps.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
    $('configLabel').textContent = profile.label;
    $('configBody').textContent = profile.config;
    $('commandBody').textContent = profile.command;
    $('commandSection').hidden = !profile.command;
    $('mergeHint').textContent = profile.hint;
    $('clientVerify').textContent = profile.verify;
    $('clientSource').href = profile.source;
    $('copyConfig').textContent = '复制配置';
    $('copyCommand').textContent = '复制命令';
    $('agentConnected').checked = $('agentCalled').checked = false;
    updateAgentStatus();
  }
  $('clientSelect').addEventListener('change', selectClient);
  for (const id of ['agentConnected', 'agentCalled']) $(id).addEventListener('change', updateAgentStatus);
  $('copyEndpoint').addEventListener('click', () => copyText(client.endpoint, $('copyEndpoint')));
  $('copyConfig').addEventListener('click', () => copyText(profile.config, $('copyConfig')));
  $('copyCommand').addEventListener('click', () => copyText(profile.command, $('copyCommand')));
  $('copyPrompt').addEventListener('click', () => copyText(VERIFICATION_PROMPT, $('copyPrompt')));
  $('verifyLocal').addEventListener('click', async () => {
    $('verifyLocal').disabled = true;
    $('localStatus').className = 'status';
    $('localStatus').textContent = '正在检查本地连接…';
    $('localDiagnostics').hidden = true;
    const checks = {};
    try {
      const response = await fetch('/health', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`健康检查失败：HTTP ${response.status}`);
      const health = await response.json();
      if (health.ok !== true) throw new Error('服务健康检查未通过');
      checks.service = { ok: true, connections: health.connections, documents: health.documents };
      checks.initialize = rpcResult(await client.initialize());
      const tools = rpcResult(await client.send(client.request('tools/list'))).tools;
      if (!Array.isArray(tools) || !tools.some(tool => tool.name === 'wps_list_documents')) throw new Error('未发现 wps_list_documents 工具');
      checks.tools = tools.map(tool => tool.name);
      const listed = rpcResult(await client.send(client.request('tools/call', { name: 'wps_list_documents', arguments: {} })));
      const data = JSON.parse(listed.content.find(item => item.type === 'text').text);
      if (!Array.isArray(data.documents)) throw new Error('文档列表格式无效');
      checks.documents = data.documents;
      $('localStatus').className = 'status success';
      $('localStatus').textContent = `本地服务与 MCP 验证通过 · ${tools.length} 个工具 · ${data.documents.length} 个可用文档。${data.documents.length ? '下一步配置 Agent。' : '请打开 WPS 文档并确认加载项连接。'} Agent 接入仍需在客户端确认。`;
    } catch (error) {
      checks.error = error.message;
      $('localStatus').className = 'status error';
      $('localStatus').textContent = `检查失败：${error.message}`;
    } finally {
      $('localDetails').textContent = pretty(checks);
      $('localDiagnostics').hidden = false;
      $('localDiagnostics').open = !!checks.error;
      $('verifyLocal').disabled = false;
    }
  });
  selectClient();
}
