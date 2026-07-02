#!/usr/bin/env bash
# Start eve only after the Next.js dev server is accepting connections.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${WEB_URL:-http://localhost:3001}"

echo "Waiting for web at $URL …"
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null -m 2 "$URL" 2>/dev/null; then
    echo "Web is up — starting eve."
  exec bash "$ROOT/scripts/with-node24.sh" eve dev
  fi
  sleep 2
done

echo "Timed out waiting for $URL — start web first with: pnpm dev:web" >&2
exit 1
