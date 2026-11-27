#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_ID="${1:-run-$RANDOM}"
PORT="${2:-3100}"
node "$SCRIPT_DIR/verify-fe.mjs" launch "$RUN_ID" "$PORT"
