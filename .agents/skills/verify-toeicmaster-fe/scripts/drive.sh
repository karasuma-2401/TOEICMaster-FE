#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_ID="${1:-}"
FEATURE="${2:-flashcards}"
if [ -z "$RUN_ID" ]; then
  echo "Usage: drive.sh <run_id> [feature]"
  exit 1
fi
node "$SCRIPT_DIR/verify-fe.mjs" drive "$RUN_ID" "$FEATURE"
