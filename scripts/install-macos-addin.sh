#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADDINS="$HOME/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons"
PUBLISH="$ADDINS/publish.xml"
mkdir -p "$ADDINS"

if [[ -f "$PUBLISH" ]] && ! grep -q 'name="WpsMcpET"' "$PUBLISH"; then
  cp -p "$PUBLISH" "$PUBLISH.backup-before-wps-mcp"
fi
if [[ ! -f "$PUBLISH" ]]; then
  printf '%s\n' '<?xml version="1.0" encoding="UTF-8"?>' '<jsplugins>' '</jsplugins>' > "$PUBLISH"
fi
python3 - "$PUBLISH" <<'PY'
import pathlib, re, sys
p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding="utf-8")
if "</jsplugins>" not in s:
    raise SystemExit("publish.xml is missing </jsplugins>; left unchanged")
entries = {
    "WpsMcpET": '  <jspluginonline name="WpsMcpET" url="http://127.0.0.1:18766/addins/et/" type="et" enable="enable_dev" debug="" install="null"/>',
    "WpsMcpWPP": '  <jspluginonline name="WpsMcpWPP" url="http://127.0.0.1:18766/addins/wpp/" type="wpp" enable="enable_dev" debug="" install="null"/>',
    "WpsMcpWPS": '  <jspluginonline name="WpsMcpWPS" url="http://127.0.0.1:18766/addins/wps/" type="wps" enable="enable_dev" debug="" install="null"/>',
}
missing = [line for name, line in entries.items() if f'name="{name}"' not in s]
if missing:
    s = s.replace("</jsplugins>", "\n".join(missing) + "\n</jsplugins>")
# Keep the localhost development Add-ins enabled consistently across WPS hosts.
def normalize(tag):
    if not any(f'name="{name}"' in tag for name in entries):
        return tag
    for key, value in (("enable", "enable_dev"), ("debug", ""), ("install", "null")):
        pattern = rf'\b{key}="[^"]*"'
        if re.search(pattern, tag):
            tag = re.sub(pattern, f'{key}="{value}"', tag)
        else:
            tag = tag[:-2] + f' {key}="{value}"/>'
    return tag
s = re.sub(r'<jspluginonline\b[^>]*>', lambda match: normalize(match.group(0)), s)
p.write_text(s, encoding="utf-8")
print("WPS Add-in registry updated:", ", ".join(entries))
PY

for host in et wpp wps; do
  curl -fsS "http://127.0.0.1:18766/addins/$host/" >/dev/null 2>&1 || true
done
printf 'Installed WPS MCP add-in registry at: %s\n' "$PUBLISH"
printf 'Restart WPS Office to load the new add-ins. Existing publish.xml entries were preserved.\n'
