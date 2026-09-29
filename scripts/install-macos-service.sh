#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node)"
LABEL="com.local.wps-mcp"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$HOME/Library/Logs"
DATA_DIR="$HOME/Library/Application Support/wps-mcp"
mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR" "$DATA_DIR"

python3 - "$PLIST" "$ROOT" "$NODE" "$DATA_DIR" <<'PY'
import plistlib, pathlib, sys
path, root, node, data = sys.argv[1:]
obj = {
  "Label": "com.local.wps-mcp",
  "ProgramArguments": [node, str(pathlib.Path(root) / "dist/src/server.js")],
  "WorkingDirectory": root,
  "RunAtLoad": True,
  "KeepAlive": True,
  "EnvironmentVariables": {
    "WPS_MCP_TRANSPORT": "http",
    "WPS_MCP_PORT": "18766",
    "WPS_MCP_DATA_DIR": data,
  },
  "StandardOutPath": str(pathlib.Path.home() / "Library/Logs/wps-mcp.log"),
  "StandardErrorPath": str(pathlib.Path.home() / "Library/Logs/wps-mcp.log"),
}
with open(path, "wb") as f: plistlib.dump(obj, f)
PY
launchctl bootout "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -k "gui/$(id -u)/$LABEL"
for i in {1..30}; do
  if curl -fsS http://127.0.0.1:18766/health >/dev/null; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:18766/health
printf '\nLaunchAgent installed: %s\n' "$PLIST"
