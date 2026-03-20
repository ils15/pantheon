#!/bin/bash

# SubagentStart Hook - logs when an agent delegates to another
# Called when: One agent calls runSubagent() to delegate work

set -e

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON for delegation details
SOURCE_AGENT=$(echo "$INPUT" | grep -o '"source_agent":"[^"]*"' | cut -d'"' -f4 | head -1)
TARGET_AGENT=$(echo "$INPUT" | grep -o '"target_agent":"[^"]*"' | cut -d'"' -f4 | head -1)
TASK_DESCRIPTION=$(echo "$INPUT" | grep -o '"task":"[^"]*"' | cut -d'"' -f4 | head -1)

# Ensure log dir exists
LOG_DIR="${LOG_DIR:-logs/agent-sessions}"
mkdir -p "$LOG_DIR"

# Create delegation log
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_ID=$(uuidgen 2>/dev/null || echo "session-$(date +%s)")

cat >> "$LOG_DIR/delegations.log" << EOF
[${TIMESTAMP}] SUBAGENT_START
  Session: ${SESSION_ID}
  From: ${SOURCE_AGENT:-unknown}
  To: ${TARGET_AGENT:-unknown}
  Task: ${TASK_DESCRIPTION:-unspecified}

EOF

# Output hook response (allow by default)
echo '{"continue": true, "metadata": {"delegation_id": "'${SESSION_ID}'"}}'
exit 0
