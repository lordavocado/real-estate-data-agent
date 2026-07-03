#!/usr/bin/env bash
# Prepare filesystem paths eve dev expects before Next.js has compiled.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NEXT_DIR="$ROOT/web/.next"

# A partial/corrupt .next (e.g. after a killed build) breaks SSR with ENOENT on
# routes-manifest.json and surfaces as a client-side Runtime TypeError in the browser.
if [[ -d "$NEXT_DIR" ]]; then
  if [[ ! -f "$NEXT_DIR/routes-manifest.json" ]] && [[ -d "$NEXT_DIR/server" || -f "$NEXT_DIR/BUILD_ID" ]]; then
    echo "Removing corrupted web/.next cache (missing routes-manifest.json)…"
    rm -rf "$NEXT_DIR"
  fi
fi

mkdir -p "$NEXT_DIR/diagnostics"

# Eve dev snapshots the repo; stale snapshots that reference deleted .next chunks crash startup.
if [[ -d "$ROOT/.eve/dev-runtime/snapshots" ]]; then
  echo "Clearing stale eve dev-runtime snapshots…"
  rm -rf "$ROOT/.eve/dev-runtime/snapshots"
fi
