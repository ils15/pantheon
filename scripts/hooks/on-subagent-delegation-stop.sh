#!/usr/bin/env bash
# on-subagent-delegation-stop.sh — Pantheon SubagentStop Audit Hook
# Logs completion or failure of subagent tasks.
set -euo pipefail

LOG_DIR="${LOG_DIR:-logs/agent-sessions}"
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
exit 0
