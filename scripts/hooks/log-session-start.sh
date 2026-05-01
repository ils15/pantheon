#!/bin/bash

# Log session start for agent activities
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs/agent-sessions"

# Create logs directory if not exists
mkdir -p "${LOG_DIR}"

# Log the session start
cat > "${LOG_DIR}/session-${TIMESTAMP}.log" << EOF
SESSION_START: ${TIMESTAMP}
AGENT: ${AGENT_NAME:-unknown}
USER: ${USER}
WORKSPACE: ${WORKSPACE_NAME:-pantheon}
EOF

echo '{"continue": true}'
exit 0
