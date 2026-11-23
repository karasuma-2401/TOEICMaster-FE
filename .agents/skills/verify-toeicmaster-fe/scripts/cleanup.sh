#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_ID="${1:-}"
if [ -z "$RUN_ID" ]; then
  echo "Usage: cleanup.sh <run_id>"
  exit 1
fi
node "$SCRIPT_DIR/verify-fe.mjs" cleanup "$RUN_ID"
