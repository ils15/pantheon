#!/usr/bin/env bash
# on-subagent-delegation-start.sh — Pantheon SubagentStart Audit Hook
# Logs when Zeus delegates to a subagent.
set -euo pipefail

LOG_DIR="${LOG_DIR:-logs/agent-sessions}"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AGENT_NAME="${AGENT_NAME:-unknown}"
TASK_DESC="${TASK_DESC:-${1:-}}"

cat >> "$LOG_DIR/delegations.log" << JSON
{"event":"SubagentStart","timestamp":"$TIMESTAMP","agent":"$AGENT_NAME","task":"$TASK_DESC"}
JSON

echo "[DELEGATION] $AGENT_NAME started → $LOG_DIR/delegations.log" >&2
exit 0
