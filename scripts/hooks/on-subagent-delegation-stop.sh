#!/bin/bash

# SubagentStop Hook - logs when a delegation completes
# Called when: A delegated subagent finishes (success or failure)

set -e

# Read hook input from stdin
INPUT=$(cat)

# Parse JSON for delegation completion details
SESSION_ID=$(echo "$INPUT" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4 | head -1)
SOURCE_AGENT=$(echo "$INPUT" | grep -o '"source_agent":"[^"]*"' | cut -d'"' -f4 | head -1)
TARGET_AGENT=$(echo "$INPUT" | grep -o '"target_agent":"[^"]*"' | cut -d'"' -f4 | head -1)
STATUS=$(echo "$INPUT" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 | head -1)
RESULT_SUMMARY=$(echo "$INPUT" | grep -o '"result":"[^"]*"' | cut -d'"' -f4 | head -1)

# Ensure log dir exists
LOG_DIR="${LOG_DIR:-logs/agent-sessions}"
mkdir -p "$LOG_DIR"

# Append to delegation log
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat >> "$LOG_DIR/delegations.log" << EOF
[${TIMESTAMP}] SUBAGENT_STOP
  Session: ${SESSION_ID:-unknown}
  From: ${SOURCE_AGENT:-unknown}
  To: ${TARGET_AGENT:-unknown}
  Status: ${STATUS:-completed}
  Result: ${RESULT_SUMMARY:-no summary provided}

EOF

# Also log to dedicated file if failed
if [[ "$STATUS" == "failed" || "$STATUS" == "error" ]]; then
  cat >> "$LOG_DIR/delegation-failures.log" << EOF
[${TIMESTAMP}] DELEGATION_FAILED
  Session: ${SESSION_ID:-unknown}
  From: ${SOURCE_AGENT} → To: ${TARGET_AGENT}
  Error: ${RESULT_SUMMARY}

EOF
fi

# Output hook response
echo '{"continue": true, "status": "'${STATUS}'"}'
exit 0
