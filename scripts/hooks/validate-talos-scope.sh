#!/usr/bin/env bash
# validate-talos-scope.sh — PreToolUse hook for Talos
# Receives JSON on stdin, enforces Talos boundaries
set -euo pipefail

# Read JSON input from stdin (Claude Code hook protocol)
INPUT=$(cat)

# Extract tool info from JSON input
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")
TOOL_INPUT=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('tool_input',{})))" 2>/dev/null || echo "")

# Only validate for Talos agent
AGENT_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('agent_id',''))" 2>/dev/null || echo "")
if [ "$AGENT_NAME" != "talos" ]; then
    # Not Talos — allow pass-through
    echo "[TALOS SCOPE] Not Talos agent, skipping" >&2
    exit 0
fi

# Get changed files from the tool input
if echo "$TOOL_INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command','') or d.get('filePath','') or d.get('file_path',''))" 2>/dev/null | grep -qE '(migration|schema\.sql|alembic|models/.*\.py|auth|security|password|token|secret)'; then
    echo "[TALOS SCOPE] ❌ Blocked: Talos cannot modify schema/security files" >&2
    exit 2
fi

# Count files in the edit/write operation
FILE_COUNT=$(echo "$TOOL_INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    # Count unique file paths in the input
    files = set()
    for key in ['filePath', 'file_path', 'command', 'content']:
        if key in d and d[key]:
            files.add(str(d[key]))
    print(len(files))
except:
    print('0')
" 2>/dev/null || echo "0")

echo "[TALOS SCOPE] ✅ Scope check passed" >&2
exit 0
