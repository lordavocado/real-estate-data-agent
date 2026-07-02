#!/usr/bin/env bash
# eve v0.12+ requires Node >=24. Prefer Homebrew node@24 when the default
# shell node is older (e.g. ~/.local/bin/node v22).
set -euo pipefail

NODE24_BIN=""
if command -v brew >/dev/null 2>&1; then
  PREFIX="$(brew --prefix node@24 2>/dev/null || true)"
  if [[ -n "$PREFIX" && -x "$PREFIX/bin/node" ]]; then
    NODE24_BIN="$PREFIX/bin"
  fi
fi
if [[ -z "$NODE24_BIN" && -x /opt/homebrew/opt/node@24/bin/node ]]; then
  NODE24_BIN="/opt/homebrew/opt/node@24/bin"
fi
if [[ -z "$NODE24_BIN" && -x /usr/local/opt/node@24/bin/node ]]; then
  NODE24_BIN="/usr/local/opt/node@24/bin"
fi

if [[ -z "$NODE24_BIN" ]]; then
  echo "eve requires Node.js >=24. Install with: brew install node@24" >&2
  exit 1
fi

MAJOR="$("$NODE24_BIN/node" -p "process.versions.node.split('.')[0]")"
if [[ "$MAJOR" -lt 24 ]]; then
  echo "eve requires Node.js >=24 (found v$("$NODE24_BIN/node" -v) at $NODE24_BIN/node)." >&2
  exit 1
fi

export PATH="$NODE24_BIN:$PATH"
exec "$@"
