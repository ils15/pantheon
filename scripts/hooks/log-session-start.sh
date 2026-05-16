#!/usr/bin/env bash
# log-session-start.sh — Pantheon SessionStart Logging Hook
# Logs session start with structured JSON.
set -euo pipefail

LOG_DIR="${LOG_DIR:-logs/agent-sessions}"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_ID="${SESSION_ID:-$(date +%s)}"

cat >> "$LOG_DIR/sessions.log" << JSON
{"event":"SessionStart","timestamp":"$TIMESTAMP","session_id":"$SESSION_ID","platform":"${PLATFORM:-unknown}"}
JSON

echo "[LOG] Session start logged → $LOG_DIR/sessions.log" >&2
exit 0
