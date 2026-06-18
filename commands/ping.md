---
description: "Ping all Pantheon agents to verify availability — includes version badge"
agent: "zeus"
---
# /ping — Agent Health Check

**What:** Pings all Pantheon agents and returns a status table with version badge.
**Usage:** `/ping`
**Returns:** Version badge + table of all agents with status: ✅ available / ❌ unavailable / ⚠️ degraded
**Use when:** An agent seems unresponsive or you want to verify the system is healthy

## Output Format

Start with the version badge, then the agent table:

```
## 🏛️ Pantheon vX.Y.Z — Agent Health Check

**Platform:** <opencode | claude | cursor | windsurf | vscode>
**Agents:** N of 17 responding

| Agent | Role | Tier | Status |
|-------|------|------|--------|
| @zeus | Central orchestrator | default | ✅ |
| ... | ... | ... | ... |

### Summary
- ✅ N available
- ⚠️ N degraded
- ❌ N unavailable
```

## How to Detect Version

Read `package.json` → `"version"` field. If unavailable, read `plugin.json` → `"version"`.
