#!/usr/bin/env bash
# on-subagent-delegation-stop.sh — Pantheon SubagentStop Audit Hook
# Logs completion or failure of subagent tasks.
set -euo pipefail

# Project-local by default; set XDG_STATE_HOME for system-wide logging
LOG_DIR="${LOG_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/pantheon/hooks}"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AGENT_NAME="${AGENT_NAME:-unknown}"
STATUS="${STATUS:-success}"
REASON="${REASON:-${1:-}}"

LOG_FILE="$LOG_DIR/delegations.log"
if [[ "$STATUS" == "failure" ]]; then
    LOG_FILE="$LOG_DIR/delegation-failures.log"
fi

cat >> "$LOG_FILE" << JSON
{"event":"SubagentStop","timestamp":"$TIMESTAMP","agent":"$AGENT_NAME","status":"$STATUS","reason":"$REASON"}
JSON

echo "[DELEGATION] $AGENT_NAME stopped ($STATUS) → $LOG_FILE" >&2

# --- Post-condition validation: remind about Themis review ---
if echo "hermes aphrodite demeter prometheus" | grep -wq "$AGENT_NAME" 2>/dev/null; then
    echo "[POST-CONDITION] 🔔 Reminder: '$AGENT_NAME' should call Themis for review after implementation" >&2
fi

exit 0
