#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADDINS="$HOME/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons"
PUBLISH="$ADDINS/publish.xml"
BACKUP="$PUBLISH.wps-mcp-live-test-backup"
PORT="${WPS_LIVE_PORT:-18767}"
ACTION="${1:-install}"

if [[ "$PORT" == "18766" || ! "$PORT" =~ ^[0-9]+$ ]]; then
  echo "WPS_LIVE_PORT must be a numeric port other than the production port 18766" >&2
  exit 2
fi

case "$ACTION" in
  install)
    if [[ ! -f "$PUBLISH" ]]; then
      echo "WPS Add-in registry not found: $PUBLISH" >&2
      exit 1
    fi
    if [[ -e "$BACKUP" ]]; then
      echo "Live-test registry backup already exists: $BACKUP" >&2
      echo "Run '$0 remove' before installing again." >&2
      exit 1
    fi
    cp -p "$PUBLISH" "$BACKUP"
    python3 - "$PUBLISH" "$PORT" <<'PY'
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
port = sys.argv[2]
text = path.read_text(encoding="utf-8")
if "</jsplugins>" not in text:
    raise SystemExit("publish.xml is missing </jsplugins>; left unchanged")
entries = {
    "WpsMcpLiveET": f'  <jspluginonline enable="enable_dev" name="WpsMcpLiveET" url="http://127.0.0.1:{port}/addins/et/" type="et" debug="" install="null"/>',
    "WpsMcpLiveWPP": f'  <jspluginonline enable="enable_dev" name="WpsMcpLiveWPP" url="http://127.0.0.1:{port}/addins/wpp/" type="wpp" debug="" install="null"/>',
}
for name, line in entries.items():
    if re.search(rf'<jspluginonline\b[^>]*\bname="{re.escape(name)}"', text):
        raise SystemExit(f"{name} already exists; refusing to overwrite it")
text = text.replace("</jsplugins>", "\n".join(entries.values()) + "\n</jsplugins>")
path.write_text(text, encoding="utf-8")
print(f"Installed temporary ET/WPP Add-ins for port {port}")
PY
    ;;
  remove)
    if [[ ! -f "$BACKUP" ]]; then
      echo "No live-test registry backup found: $BACKUP" >&2
      exit 1
    fi
    cp -p "$BACKUP" "$PUBLISH"
    rm "$BACKUP"
    echo "Restored WPS Add-in registry from the pre-test backup"
    ;;
  *)
    echo "Usage: $0 [install|remove]" >&2
    exit 2
    ;;
esac
