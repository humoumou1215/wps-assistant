#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAIN="$ROOT/addon/main.js"
BACKUP="$MAIN.wps-mcp-live-test-backup"
PORT="${WPS_LIVE_PORT:-18767}"
ACTION="${1:-enable}"

if [[ "$PORT" == "18766" || ! "$PORT" =~ ^[0-9]+$ ]]; then
  echo "WPS_LIVE_PORT must be a numeric port other than production port 18766" >&2
  exit 2
fi

case "$ACTION" in
  enable)
    if [[ -e "$BACKUP" ]]; then
      echo "Live-test Add-in source backup already exists: $BACKUP" >&2
      exit 1
    fi
    cp -p "$MAIN" "$BACKUP"
    if python3 - "$MAIN" "$PORT" "${WPS_LIVE_DOCUMENT_PATH:-}" <<'PY'
import json, pathlib, sys
path = pathlib.Path(sys.argv[1])
port, document_path = sys.argv[2:4]
text = path.read_text(encoding="utf-8")
port_needle = 'const portOverride = pageUrl.searchParams.get("bridgePort");'
document_needle = 'const onlyDocumentPath = pageUrl.searchParams.get("onlyDocument");'
if text.count(port_needle) != 1 or text.count(document_needle) != 1:
    raise SystemExit("Could not uniquely locate Add-in bridge/document filters")
text = text.replace(port_needle, f'const portOverride = pageUrl.searchParams.get("bridgePort") || "{port}";')
if document_path:
    text = text.replace(document_needle, f'const onlyDocumentPath = pageUrl.searchParams.get("onlyDocument") || {json.dumps(document_path)};')
path.write_text(text, encoding="utf-8")
print(f"Temporarily routed WPS Add-ins to 127.0.0.1:{port}")
if document_path:
    print("Restricted live-test Add-ins to the disposable Writer document.")
PY
    then
      :
    else
      cp -p "$BACKUP" "$MAIN"
      rm "$BACKUP"
      exit 1
    fi
    ;;
  restore)
    if [[ ! -f "$BACKUP" ]]; then
      echo "Live-test Add-in source backup not found: $BACKUP" >&2
      exit 1
    fi
    cp -p "$BACKUP" "$MAIN"
    rm "$BACKUP"
    echo "Restored addon/main.js"
    ;;
  *)
    echo "Usage: $0 [enable|restore]" >&2
    exit 2
    ;;
esac
