# Agent Hooks Implementation

**Status**: Phase 1 Implementation Complete  
**Date**: March 20, 2026  
**Framework**: VS Code Copilot Agents (March 2026 API)

---

## Overview

Agent hooks provide lifecycle automation for the mythic-agents framework. Three critical hooks have been implemented:

1. **Security Gate (PreToolUse)** - Blocks dangerous operations before execution
2. **Auto-Format (PostToolUse)** - Runs Biome formatter on all file modifications
3. **Session Logging (SessionStart)** - Logs session metadata for audit trails

---

## Directory Structure

```
mythic-agents/
├── .github/
│   └── hooks/
│       ├── security.json          # PreToolUse hook configuration
│       ├── format.json            # PostToolUse hook configuration
│       └── logging.json           # SessionStart hook configuration
│
└── scripts/
    └── hooks/
        ├── validate-tool-safety.sh  # Security validation script (executable)
        └── log-session-start.sh     # Session logging script (executable)
```

---

## Hook Specifications

### 1. Security Gate Hook (PreToolUse)

**File**: `.github/hooks/security.json`  
**Script**: `scripts/hooks/validate-tool-safety.sh`

**Purpose**: Block destructive operations (rm -rf, DROP TABLE, TRUNCATE) before execution.

**Input**: JSON via stdin containing:
- `tool_name`: Name of the tool being executed
- `tool_input`: Parameters passed to the tool

**Output**: JSON response with:
- `continue: true` → Allow execution
- `continue: false` → Block with stopReason
- `hookSpecificOutput` → Ask for user approval

**Example Blocks**:
```bash
# Blocks:
rm -rf /path/to/data
DROP TABLE public.users
TRUNCATE sensitive_data

# Requires approval:
DELETE FROM users WHERE id > 1000
```

---

### 2. Auto-Format Hook (PostToolUse)

**File**: `.github/hooks/format.json`

**Purpose**: Automatically format TypeScript/JavaScript/Python files after modification.

**Behavior**:
- Runs `npx biome format --write` on modified files
- Non-blocking (failures are suppressed with `|| true`)
- 30-second timeout

**Benefits**:
- Enforces consistent code style across all agent modifications
- Eliminates formatting drift
- Reduces code review friction

---

### 3. Session Logging Hook (SessionStart)

**File**: `.github/hooks/logging.json`  
**Script**: `scripts/hooks/log-session-start.sh`

**Purpose**: Audit trail of agent activities by session.

**Output**: Logs stored in `logs/agent-sessions/`

**Format**:
```
SESSION_START: 2026-03-20T07:26:00Z
AGENT: hermes
USER: ils15
WORKSPACE: mythic-agents
```

---

## Phase 2: Next Steps

### To Enable Hooks in VS Code

1. Update `copilot-instructions.md` with hook activation:
```yaml
hooks:
  enabled: true
  policy: "MANDATORY"
  hooks_directory: ".github/hooks"
```

2. Commit hooks configuration to git:
```bash
cd /home/ils15/mythic-agents
git add .github/hooks/ scripts/hooks/
git commit -m "feat: implement agent lifecycle hooks (security, format, logging)"
```

3. Push to repository:
```bash
git push origin main
```

### Verify Implementation

```bash
# Check hook files exist and are executable
ls -la .github/hooks/
ls -la scripts/hooks/

# Validate JSON syntax
jq empty .github/hooks/security.json
jq empty .github/hooks/format.json
jq empty .github/hooks/logging.json

# Test security script directly
echo '{"tool_name":"run_in_terminal","tool_input":{"command":"rm -rf /"}}' | \
  bash scripts/hooks/validate-tool-safety.sh
# Expected: {"continue": false, "stopReason": "Destructive rm -rf command blocked by security policy"}
```

---

## Future Enhancements (Phase 2)

- **Interactive Handoff Buttons** (SubagentStart/Stop hooks)
- **Code Quality Gates** (Linting before commit)
- **Performance Monitoring** (Hook execution timing)
- **Agent-Scoped Hook Overrides** (Per-agent policies)

---

## References

- **Implementation Guide**: [VSCODE-AGENTS-IMPLEMENTATION-GUIDE.md](VSCODE-AGENTS-IMPLEMENTATION-GUIDE.md)
- **Optimization Analysis**: [VSCODE-AGENTS-OPTIMIZATION.md](VSCODE-AGENTS-OPTIMIZATION.md)
- **Executive Summary**: [VSCODE-AGENTS-EXECUTIVE-SUMMARY.md](VSCODE-AGENTS-EXECUTIVE-SUMMARY.md)
- **Quick Reference**: [VSCODE-AGENTS-QUICK-REFERENCE.md](VSCODE-AGENTS-QUICK-REFERENCE.md)
