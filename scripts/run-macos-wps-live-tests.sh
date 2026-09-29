#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${WPS_LIVE_PORT:-18767}"
RUN_DIR=""
INSTALLED=0

if [[ "$PORT" == "18766" || ! "$PORT" =~ ^[0-9]+$ ]]; then
  echo "WPS_LIVE_PORT must be a numeric port other than 18766" >&2
  exit 2
fi
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Real WPS live tests require macOS and an installed WPS Office application." >&2
  exit 2
fi
if pgrep -x wpsoffice >/dev/null 2>&1; then
  echo "WPS is already running. Close it first so the temporary ET/WPP Add-ins load at startup." >&2
  exit 2
fi
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | grep -q LISTEN; then
  echo "Port $PORT is already occupied; refusing to use or terminate that service." >&2
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
  if [[ "$INSTALLED" == "1" ]]; then
    "$ROOT/scripts/install-macos-live-test-addins.sh" remove || true
  fi
  if [[ -n "$RUN_DIR" ]]; then
    if pgrep -x wpsoffice >/dev/null 2>&1; then
      echo "WPS did not quit; preserving disposable test files at $RUN_DIR" >&2
    else
      rm -rf "$RUN_DIR"
    fi
  fi
  exit "$test_status"
}
trap cleanup EXIT INT TERM

npm --prefix "$ROOT" run build
RUN_DIR="$(mktemp -d "${TMPDIR:-/tmp}/wps-mcp-live.XXXXXX")"
"$ROOT/scripts/install-macos-live-test-addins.sh" install
INSTALLED=1

echo "Starting serial real-WPS ET/WPP smoke suite on 127.0.0.1:$PORT"
echo "Temporary registry entries will be removed and publish.xml restored on exit."
cd "$ROOT"
WPS_LIVE=1 WPS_LIVE_PORT="$PORT" WPS_LIVE_RUN_DIR="$RUN_DIR" \
  node --test --test-concurrency=1 test/wps-live/*.test.mjs
