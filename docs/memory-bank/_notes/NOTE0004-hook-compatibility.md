# NOTE-004: Hook & Fallback Compatibility

**Status:** Active  
**Date:** 2026-05-22

## Per-Platform Hook Support
| Platform | PreToolUse | PostToolUse | Stop Hook | Native Delegation | Fallback Strategy |
|----------|-----------|------------|-----------|-------------------|-------------------|
| OpenCode | ✅ (plugin) | ✅ (plugin) | ✅ (plugin) | ✅ task | N/A — full support |
| Claude | ✅ native | ✅ native | ✅ native | ✅ Agent | N/A — full support |
| Cursor | ❌ | ❌ | ❌ | ✅ @agent | Themis gate only |
| Cline | ❌ | ❌ | ❌ | ✅ Task | Themis gate only |
| Continue | ❌ | ❌ | ❌ | ✅ @agent | Themis gate only |
| Windsurf | ❌ | ❌ | ❌ | ✅ @agent | Themis gate only |
| VS Code Copilot | ✅ native | ✅ native | ✅ native | ✅ agent/task | N/A — full support |

## Fallback Pathways

### Pathway 1: No PreToolUse Hook
- **Trigger**: Platform capability `hooks: false`
- **Effect**: Pre-execution validation not enforced
- **Mitigation**: Validation logic moved to agent instructions / system prompt
- **Severity**: MEDIUM

### Pathway 2: No PostToolUse Hook
- **Trigger**: Platform capability `hooks: false`
- **Effect**: Post-condition checks not auto-executed
- **Mitigation**: Themis review becomes the single quality gate
- **Severity**: MEDIUM

### Pathway 3: No Stop Hook
- **Trigger**: Platform capability `hooks: false`
- **Effect**: Cannot interrupt runaway agent execution
- **Mitigation**: Resource limits set in agent config, timeouts in instructions
- **Severity**: LOW

### Pathway 4: No Native Delegation
- **Trigger**: Platform missing `agent` or `task` delegation tool
- **Effect**: Cannot delegate to sub-agents
- **Mitigation**: Agent instructions include manual invocation steps
- **Severity**: HIGH

### Pathway 5: Sync Drift
- **Trigger**: `npm run sync:check` fails
- **Effect**: Generated outputs don't match canonical sources
- **Mitigation**: Re-run `npm run sync`, verify conformance, commit
- **Severity**: HIGH
