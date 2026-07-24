#!/usr/bin/env bash
# on-subagent-delegation-start.sh — Pantheon SubagentStart Audit Hook
# Logs when Zeus delegates to a subagent.
set -euo pipefail

# Project-local by default; set XDG_STATE_HOME for system-wide logging
if [ -n "${LOG_DIR:-}" ]; then
    LOG_DIR="$LOG_DIR"
elif [ -n "${XDG_STATE_HOME:-}" ]; then
    LOG_DIR="$XDG_STATE_HOME/pantheon/hooks"
else
    LOG_DIR="logs/agent-sessions"
fi
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

# --- Cost estimation for delegation ---
declare -A TIER_MAP
TIER_MAP[athena]="premium"
TIER_MAP[themis]="premium"
TIER_MAP[hermes]="default"
TIER_MAP[aphrodite]="default"
TIER_MAP[demeter]="default"
TIER_MAP[prometheus]="default"
TIER_MAP[hephaestus]="default"
TIER_MAP[gaia]="default"
TIER_MAP[zeus]="default"
TIER_MAP[apollo]="fast"
TIER_MAP[nyx]="fast"
TIER_MAP[iris]="fast"
TIER_MAP[mnemosyne]="fast"
TIER_MAP[talos]="fast"

TIER="${TIER_MAP[$AGENT_NAME]:-default}"

case "$TIER" in
    premium)
        COST_MIN=0.50
        COST_MAX=2.00
        COST_EST=1.25
        ;;
    fast)
        COST_MIN=0.02
        COST_MAX=0.10
        COST_EST=0.06
        ;;
    *)
        COST_MIN=0.10
        COST_MAX=0.50
        COST_EST=0.30
        ;;
esac

# Format cost with 2 decimal places
COST_EST_FMT=$(printf "%.2f" "$COST_EST")

if [ "$TIER" = "premium" ]; then
    echo "[COST_WARN] High-cost delegation to $AGENT_NAME — estimated \$$COST_EST_FMT" >&2
fi

if (( $(echo "$COST_EST > 5.00" | bc -l 2>/dev/null) )); then
    echo "[COST_ALERT] Expensive delegation to $AGENT_NAME — consider if subtask is possible" >&2
fi

echo "[COST] Delegation to $AGENT_NAME — tier: $TIER — estimated: \$$COST_EST_FMT" >&2

exit 0
