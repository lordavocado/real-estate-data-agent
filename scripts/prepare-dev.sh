#!/usr/bin/env bash
# Prepare filesystem paths eve dev expects before Next.js has compiled.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/web/.next/diagnostics"
