# Agent Hooks Implementation

**Status**: All Phases Complete (8 hooks across 5 lifecycle events)  
**Date**: May 2026  
**Framework**: Pantheon Multi-Agent System

---

## Overview

Agent hooks provide lifecycle automation for the Pantheon framework. Eight critical hooks have been implemented across 5 lifecycle events:

| Event | Hook | Script | Purpose |
|---|---|---|---|
| **PreToolUse** | Security Gate | `validate-tool-safety.sh` | Blocks dangerous operations |
| **PreToolUse** | Secret Scan | `scan-secrets.sh` | Detects hardcoded credentials |
| **PostToolUse** | Format | `format-multi-language.sh` | Auto-formats modified files |
| **PostToolUse** | Import Audit | `audit-imports.sh` | Blocks wildcard imports |
| **PostToolUse** | Type Check | `run-type-check.sh` | Runs mypy/tsc validation |
| **SessionStart** | Session Log | `log-session-start.sh` | Logs session metadata |
| **SubagentStart** | Delegation Start | `on-subagent-delegation-start.sh` | Tracks subagent dispatch |
| **SubagentStop** | Delegation Stop | `on-subagent-delegation-stop.sh` | Tracks subagent completion |

---

## Directory Structure

```
Pantheon/
├── .github/
│   └── hooks/
│       ├── security.json          # PreToolUse: security gate
│       ├── secret-scan.json       # PreToolUse: secret scanning
│       ├── format.json            # PostToolUse: formatting
│       ├── import-audit.json      # PostToolUse: import validation
│       ├── type-check.json        # PostToolUse: type checking
│       ├── logging.json           # SessionStart: session logging
│       ├── delegation-start.json  # SubagentStart: delegation tracking
│       └── delegation-stop.json   # SubagentStop: completion tracking
│
└── scripts/
    └── hooks/
        ├── validate-tool-safety.sh           # Blocks rm -rf, DROP TABLE, etc.
        ├── scan-secrets.sh                   # Detects API keys, tokens, passwords
        ├── format-multi-language.sh          # Formats Python/JS/TS/JSON/YAML/Shell
        ├── audit-imports.sh                  # Blocks wildcard imports
        ├── run-type-check.sh                 # Runs mypy/tsc
        ├── log-session-start.sh              # Logs session start
        ├── on-subagent-delegation-start.sh   # Logs delegation start
        └── on-subagent-delegation-stop.sh    # Logs delegation stop/failure
```

---

## Hook Specifications

### 1. Security Gate (PreToolUse)

**Config**: `.github/hooks/security.json`  
**Script**: `scripts/hooks/validate-tool-safety.sh`

Blocks destructive operations before execution:
- `rm -rf /path`
- `DROP TABLE`
- `TRUNCATE TABLE`
- `DELETE FROM` without WHERE
- `:(){ :|:& };:` (fork bomb)
- `dd if=/dev/zero of=/dev/sda`

**Example**:
```bash
echo "rm -rf /important/data" | bash scripts/hooks/validate-tool-safety.sh
# Exit: 1 (BLOCKED)
```

---

### 2. Secret Scan (PreToolUse)

**Config**: `.github/hooks/secret-scan.json`  
**Script**: `scripts/hooks/scan-secrets.sh`

Detects hardcoded secrets in tool input:
- AWS Access Keys (`AKIA...`)
- GitHub Tokens (`ghp_...`, `gho_...`)
- OpenAI Keys (`sk-...`)
- JWT Tokens (`eyJ...`)
- Generic API keys and passwords

**Example**:
```bash
echo "sk-live-1234567890abcdef" | bash scripts/hooks/scan-secrets.sh
# Exit: 1 (SECRET DETECTED)
```

---

### 3. Format (PostToolUse)

**Config**: `.github/hooks/format.json`  
**Script**: `scripts/hooks/format-multi-language.sh`

Auto-formats modified files:
- **Python**: `ruff format` or `black`
- **JS/TS/JSON/YAML/CSS/HTML**: `prettier`
- **Shell**: `shfmt`

Non-blocking — failures are suppressed.

---

### 4. Import Audit (PostToolUse)

**Config**: `.github/hooks/import-audit.json`  
**Script**: `scripts/hooks/audit-imports.sh`

Validates imports in modified files:
- Blocks Python wildcard imports (`from X import *`)
- Flags CommonJS `require()` in JS/TS files

**Example**:
```bash
./scripts/hooks/audit-imports.sh src/app.py
# Exit: 1 if wildcard import found
```

---

### 5. Type Check (PostToolUse)

**Config**: `.github/hooks/type-check.json`  
**Script**: `scripts/hooks/run-type-check.sh`

Runs type checkers on the project:
- `mypy` (if `pyproject.toml` or `.mypy.ini` exists)
- `tsc --noEmit` (if `tsconfig.json` exists)

Non-blocking — runs opportunistically.

---

### 6. Session Logging (SessionStart)

**Config**: `.github/hooks/logging.json`  
**Script**: `scripts/hooks/log-session-start.sh`

Logs structured JSON to `logs/agent-sessions/sessions.log`:
```json
{"event":"SessionStart","timestamp":"2026-05-16T10:00:00Z","session_id":"1715853600","platform":"opencode"}
```

---

### 7. Delegation Start (SubagentStart)

**Config**: `.github/hooks/delegation-start.json`  
**Script**: `scripts/hooks/on-subagent-delegation-start.sh`

Logs when Zeus delegates to a subagent:
```json
{"event":"SubagentStart","timestamp":"2026-05-16T10:05:00Z","agent":"hermes","task":"Implement POST /users endpoint"}
```

---

### 8. Delegation Stop (SubagentStop)

**Config**: `.github/hooks/delegation-stop.json`  
**Script**: `scripts/hooks/on-subagent-delegation-stop.sh`

Logs when subagent completes or fails:
- Success → `logs/agent-sessions/delegations.log`
- Failure → `logs/agent-sessions/delegation-failures.log`

```json
{"event":"SubagentStop","timestamp":"2026-05-16T10:15:00Z","agent":"hermes","status":"success","reason":"5 tests passing"}
```

---

## Verification

```bash
# Check all hook files exist and are executable
ls -la .github/hooks/
ls -la scripts/hooks/

# Validate JSON syntax
for f in .github/hooks/*.json; do jq empty "$f" && echo "✅ $f"; done

# Test security hook
echo "rm -rf /" | bash scripts/hooks/validate-tool-safety.sh
# Expected: exit 1

echo "echo hello" | bash scripts/hooks/validate-tool-safety.sh
# Expected: exit 0

# Test secret scan
echo "AKIAIOSFODNN7EXAMPLE" | bash scripts/hooks/scan-secrets.sh
# Expected: exit 1
```

---

## Future Enhancements

- **Agent-Scoped Hook Overrides** — Per-agent policies
- **Performance Monitoring** — Hook execution timing
- **Interactive Handoff Buttons** — UI integration for VS Code

---

## References

- **Agent Definitions**: See `agents/` directory
- **Framework Docs**: See `AGENTS.md`
- **Security Policies**: See `.github/copilot-instructions.md`
