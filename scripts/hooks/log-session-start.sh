#!/bin/bash

# Log session start for agent activities
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create logs directory if not exists
mkdir -p /home/ils15/mythic-agents/logs/agent-sessions

# Log the session start
cat > "/home/ils15/mythic-agents/logs/agent-sessions/session-${TIMESTAMP}.log" << EOF
SESSION_START: ${TIMESTAMP}
AGENT: ${AGENT_NAME:-unknown}
USER: ${USER}
WORKSPACE: ${WORKSPACE_NAME:-mythic-agents}
EOF

echo '{"continue": true}'
exit 0
