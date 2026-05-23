#!/usr/bin/env bash
# on-subagent-delegation-start.sh — Pantheon SubagentStart Audit Hook
# Logs when Zeus delegates to a subagent.
set -euo pipefail

# Project-local by default; set XDG_STATE_HOME for system-wide logging
LOG_DIR="${LOG_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/pantheon/hooks}"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AGENT_NAME="${AGENT_NAME:-unknown}"
TASK_DESC="${TASK_DESC:-${1:-}}"

cat >> "$LOG_DIR/delegations.log" << JSON
{"event":"SubagentStart","timestamp":"$TIMESTAMP","agent":"$AGENT_NAME","task":"$TASK_DESC"}
JSON

echo "[DELEGATION] $AGENT_NAME started → $LOG_DIR/delegations.log" >&2

# --- Dispatch-time validation: check target against routing.yml ---
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ROUTING_FILE="$REPO_ROOT/routing.yml"
if [ -f "$ROUTING_FILE" ] && [ -n "$AGENT_NAME" ]; then
    ESCAPED_AGENT_NAME=$(printf '%s\n' "$AGENT_NAME" | sed 's/[][(){}.^$*+?|\/\\-]/\\&/g')
    if grep -qE "^[[:space:]]*-[[:space:]]+target:[[:space:]]+$ESCAPED_AGENT_NAME[[:space:]]*$" "$ROUTING_FILE" 2>/dev/null; then
        echo "[VALIDATION] ✅ Target '$AGENT_NAME' found in routing.yml" >&2
    else
        echo "[VALIDATION] ⚠️ Target '$AGENT_NAME' NOT in routing.yml delegation rules" >&2
    fi
elif [ ! -f "$ROUTING_FILE" ]; then
    echo "[VALIDATION] ⚠️ Could not read routing.yml for validation" >&2
fi

exit 0
