#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${WPS_LIVE_PORT:-18767}"
RUN_DIR=""
PATCHED=0

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Real WPS Writer tests require macOS." >&2
  exit 2
fi
if pgrep -x wpsoffice >/dev/null 2>&1; then
  echo "WPS is already running. Close it first; this runner will open and close an isolated WPS session." >&2
  exit 2
fi
if [[ "$PORT" == "18766" || ! "$PORT" =~ ^[0-9]+$ ]]; then
  echo "WPS_LIVE_PORT must be a numeric port other than production port 18766" >&2
  exit 2
fi
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
  echo "Port $PORT is already occupied; refusing to use or terminate that service." >&2
  exit 2
fi
if ! curl -fsS http://127.0.0.1:18766/health >/dev/null; then
  echo "The registered WPS Add-in asset server on port 18766 is unavailable." >&2
  exit 2
fi

cleanup() {
  local test_status=$?
  if pgrep -x wpsoffice >/dev/null 2>&1; then
    osascript -e 'tell application id "com.kingsoft.wpsoffice.mac" to quit' >/dev/null 2>&1 || true
    for _ in {1..15}; do
      pgrep -x wpsoffice >/dev/null 2>&1 || break
      sleep 1
    done
  fi
  if [[ "$PATCHED" == "1" ]]; then
    "$ROOT/scripts/enable-macos-wps-live-port.sh" restore || true
  fi
  if [[ -n "$RUN_DIR" ]]; then
    if pgrep -x wpsoffice >/dev/null 2>&1; then
      echo "WPS did not quit; preserving disposable Writer test files at $RUN_DIR" >&2
    else
      rm -rf "$RUN_DIR"
    fi
  fi
  exit "$test_status"
}
trap cleanup EXIT INT TERM

npm --prefix "$ROOT" run build
RUN_DIR="$(mktemp -d "${TMPDIR:-/tmp}/wps-mcp-writer-live.XXXXXX")"
python3 "$ROOT/test/wps-live/create-fixtures.py" "$RUN_DIR/fixtures" >/dev/null
WRITER_FILE="$RUN_DIR/wps-mcp-live-$$-writer.docx"
mv "$RUN_DIR/fixtures/writer-live-probe.docx" "$WRITER_FILE"
WPS_LIVE_PORT="$PORT" WPS_LIVE_DOCUMENT_PATH="$WRITER_FILE" \
  "$ROOT/scripts/enable-macos-wps-live-port.sh" enable
PATCHED=1

echo "Starting isolated real-WPS Writer test on 127.0.0.1:$PORT"
echo "Only the disposable DOCX is registered with the test bridge; WPS will be closed after the run."
cd "$ROOT"
WPS_LIVE=1 WPS_LIVE_PORT="$PORT" WPS_LIVE_RUN_DIR="$RUN_DIR" WPS_LIVE_WRITER_FILE="$WRITER_FILE" \
  node --test --test-concurrency=1 test/wps-live/writer.live.test.mjs
