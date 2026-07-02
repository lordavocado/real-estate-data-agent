#!/usr/bin/env bash
# Free dev ports before starting (listeners only — not browser tabs).
set -euo pipefail
for port in 3001 2000; do
  if pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null); then
    echo "Freeing port $port (pids: $pids)"
    kill -9 $pids 2>/dev/null || true
  fi
done
