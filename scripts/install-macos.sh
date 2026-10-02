#!/bin/bash
# Development deployment: build the server, register Add-ins, and restart the user LaunchAgent.
set -euo pipefail
[[ "$(uname -s)" == "Darwin" ]] || { echo "This installer requires macOS." >&2; exit 2; }
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
DEPLOY_PORT="${WPS_MCP_PORT:-18766}"
DEPLOY_DATA_DIR="${WPS_MCP_DATA_DIR:-$HOME/Library/Application Support/wps-mcp}"
DEPLOY_ADDINS_DIR="${WPS_MCP_ADDINS_DIR:-$HOME/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons}"
DEPLOY_ENABLE="${WPS_MCP_ADDIN_ENABLE:-enable_dev}"
LABEL="com.local.wps-mcp"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SERVICE="gui/$(id -u)/$LABEL"
for tool in node npm launchctl plutil lsof curl; do command -v "$tool" >/dev/null || { echo "Missing command: $tool" >&2; exit 2; }; done
NODE="$(command -v node)"
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 19)) throw new Error("Node.js 22.19.0 or newer is required");'
[[ "$DEPLOY_PORT" =~ ^[0-9]+$ && "$DEPLOY_PORT" -ge 1025 && "$DEPLOY_PORT" -le 65535 ]] || { echo "Invalid WPS_MCP_PORT." >&2; exit 2; }
for proc in wpsoffice promecefpluginhost; do
  if pgrep -x "$proc" >/dev/null 2>&1; then echo "Fully quit WPS Office before deployment (found $proc)." >&2; exit 2; fi
done
# Only restart this checkout's existing service, never another listener or an active conversation.
if launchctl print "$SERVICE" >/dev/null 2>&1; then
  plutil -convert json -o - "$PLIST" | node -e 'const fs = require("node:fs"); const p = JSON.parse(fs.readFileSync(0, "utf8")); if (p.ProgramArguments?.[1] !== process.argv[1] || p.EnvironmentVariables?.WPS_MCP_DATA_DIR !== process.argv[2]) throw new Error("Existing service uses another checkout or data directory");' "$ROOT/dist/src/server.js" "$DEPLOY_DATA_DIR"
fi
LISTENER="$(lsof -nP -t -iTCP:"$DEPLOY_PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [[ -n "$LISTENER" ]]; then
  SERVICE_PID="$(launchctl print "$SERVICE" 2>/dev/null | awk '/^[[:space:]]*pid = / {print $3}' || true)"
  [[ "$LISTENER" == "$SERVICE_PID" && -f "$PLIST" ]] || { echo "Port $DEPLOY_PORT belongs to another service." >&2; exit 2; }
  curl -fsS --max-time 5 "http://127.0.0.1:$DEPLOY_PORT/api/chat" | node -e 'const fs = require("node:fs"); if (JSON.parse(fs.readFileSync(0, "utf8")).busy !== false) throw new Error("Wait for the active conversation to finish");'
fi
cd "$ROOT"
npm ci
npm run build
node - "$DEPLOY_ADDINS_DIR" "$DEPLOY_PORT" "$DEPLOY_ENABLE" darwin <<'REGISTRY'
const { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, constants } = require('node:fs');
const { join } = require('node:path');
const { randomBytes } = require('node:crypto');
const [directory, port, enable, platform] = process.argv.slice(2);
if (!/^\d+$/.test(port) || Number(port) < 1025 || Number(port) > 65535 || !/^[\w-]+$/.test(enable)) throw new Error('Invalid port or Add-in enable setting');
const hosts = [['et', 'WpsMcpET'], ['wpp', 'WpsMcpWPP'], ['wps', 'WpsMcpWPS']];
const publishPath = join(directory, 'publish.xml');
const original = existsSync(publishPath) ? readFileSync(publishPath, 'utf8') : null;
let publish = original ?? '<?xml version="1.0" encoding="UTF-8"?>\n<jsplugins>\n</jsplugins>\n';
if ((publish.match(/<\/jsplugins>/gi) ?? []).length !== 1) throw new Error('Invalid publish.xml; left unchanged');
const eol = publish.includes('\r\n') ? '\r\n' : '\n';
const entry = ([host, name]) => `<jspluginonline name="${name}" url="http://127.0.0.1:${port}/addins/${host}/" type="${host}" enable="${enable}" debug="" install="null"/>`;
const seen = new Set();
publish = publish.replace(/<jsplugin(?:online)?\b[^>]*\bname\s*=\s*["'](WpsMcpET|WpsMcpWPP|WpsMcpWPS)["'][^>]*\/?>/gi, (tag, name) => {
  if (seen.has(name)) return '';
  seen.add(name);
  return entry(hosts.find(host => host[1] === name));
});
const missing = hosts.filter(host => !seen.has(host[1]));
if (missing.length) publish = publish.replace(/<\/jsplugins>/i, missing.map(host => '  ' + entry(host)).join(eol) + eol + '</jsplugins>');
const changes = [[publishPath, original, publish, '.backup-before-wps-mcp']];
if (platform === 'darwin') {
  const authPath = join(directory, 'authaddin.json');
  const oldAuth = existsSync(authPath) ? readFileSync(authPath, 'utf8') : null;
  const auth = oldAuth === null ? {} : JSON.parse(oldAuth);
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!isObject(auth) || (auth.wps !== undefined && !isObject(auth.wps))) throw new Error('Invalid authaddin.json; registries left unchanged');
  const writer = auth.wps ??= {};
  const id = Object.keys(writer).find(key => key !== 'namelist' && writer[key]?.name === 'WpsMcpWPS') ?? randomBytes(16).toString('hex');
  writer[id] = { ...writer[id], enable: true, isload: true, md5: '', mode: 2, name: 'WpsMcpWPS', path: `http://127.0.0.1:${port}/addins/wps` };
  writer.namelist = [...new Set([...String(writer.namelist ?? '').split(';').filter(Boolean), id])].join(';');
  changes.push([authPath, oldAuth, JSON.stringify(auth, null, 2) + '\n', '.backup-before-wps-mcp-writer']);
}
// Validate both files before writing either; keep the first backups and all unrelated Add-ins.
mkdirSync(directory, { recursive: true });
for (const [path, before, after, suffix] of changes) {
  if (before === after) continue;
  if (before !== null && !existsSync(path + suffix)) copyFileSync(path, path + suffix, constants.COPYFILE_EXCL);
  writeFileSync(path, after, 'utf8');
}
console.log('Registered ET/WPP/Writer Add-ins:', directory);
REGISTRY
node - "$PLIST" "$ROOT" "$NODE" "$DEPLOY_DATA_DIR" "$DEPLOY_PORT" <<'SERVICE_CONFIG'
const fs = require('node:fs'), path = require('node:path');
const [plist, root, node, data, port] = process.argv.slice(2);
const xml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const string = value => `<string>${xml(value)}</string>`;
const logs = path.join(data, 'logs');
fs.mkdirSync(logs, { recursive: true });
fs.mkdirSync(path.dirname(plist), { recursive: true });
fs.writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key>${string('com.local.wps-mcp')}
<key>ProgramArguments</key><array>${string(node)}${string(path.join(root, 'dist/src/server.js'))}</array>
<key>WorkingDirectory</key>${string(root)}
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>EnvironmentVariables</key><dict>
<key>WPS_MCP_TRANSPORT</key>${string('http')}<key>WPS_MCP_PORT</key>${string(port)}<key>WPS_MCP_DATA_DIR</key>${string(data)}
</dict>
<key>StandardOutPath</key>${string(path.join(logs, 'server.stdout.log'))}
<key>StandardErrorPath</key>${string(path.join(logs, 'server.stderr.log'))}
</dict></plist>\n`);
SERVICE_CONFIG
# Reload the service. bootout returns before launchd has finished removing it.
# Keep waits bounded; --wait can block indefinitely on some macOS versions.
if launchctl print "$SERVICE" >/dev/null 2>&1; then
  launchctl bootout "$SERVICE" || { echo "Failed to unload $SERVICE; deployment stopped." >&2; exit 1; }
fi
for _ in {1..30}; do
  if ! launchctl print "$SERVICE" >/dev/null 2>&1; then break; fi
  sleep 1
done
if launchctl print "$SERVICE" >/dev/null 2>&1; then
  echo "Service did not unload within 30 seconds: $SERVICE" >&2; exit 1
fi
BOOTSTRAPPED=0
for attempt in {1..5}; do
  if launchctl bootstrap "gui/$(id -u)" "$PLIST"; then BOOTSTRAPPED=1; break; fi
  if [[ "$attempt" -lt 5 ]]; then sleep 1; fi
done
[[ "$BOOTSTRAPPED" == "1" ]] || { echo "Could not load $PLIST after 5 attempts; check launchd diagnostics." >&2; exit 1; }
launchctl kickstart -k "$SERVICE"
READY=0
for _ in {1..30}; do
  if curl -fsS --max-time 2 "http://127.0.0.1:$DEPLOY_PORT/health" | node -e 'const fs = require("node:fs"); if (JSON.parse(fs.readFileSync(0, "utf8")).ok !== true) process.exit(1);' 2>/dev/null; then READY=1; break; fi
  sleep 1
done
[[ "$READY" == "1" ]] || { echo "Server did not become ready; see $DEPLOY_DATA_DIR/logs/server.stderr.log" >&2; exit 1; }
for asset in addins/et/ addins/wpp/ addins/wps/ addon/taskpane.html addon/taskpane.js; do curl -fsS --max-time 5 "http://127.0.0.1:$DEPLOY_PORT/$asset" >/dev/null; done
printf 'Deployed. Open WPS to verify the assistant.\nServer: http://127.0.0.1:%s\nData: %s\n' "$DEPLOY_PORT" "$DEPLOY_DATA_DIR"
