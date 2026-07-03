#!/usr/bin/env bash
# Start eve only after the Next.js dev server has compiled (avoids snapshot races on web/.next).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="${WEB_URL:-http://localhost:3001}"

DEV_MANIFEST="$(node -p "require('path').join(require('os').tmpdir(), 'rea-web-next', 'routes-manifest.json')")"
LEGACY_MANIFEST="$ROOT/web/.next/routes-manifest.json"

echo "Waiting for web at $URL …"
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null -m 2 "$URL" 2>/dev/null; then
    if [[ -f "$DEV_MANIFEST" || -f "$LEGACY_MANIFEST" ]]; then
      echo "Web is up and compiled — starting eve."
      cd "$ROOT"
      exec bash "$ROOT/scripts/with-node24.sh" pnpm dev
    fi
  fi
  sleep 2
done

echo "Timed out waiting for $URL — start web first with: pnpm dev:web" >&2
exit 1
