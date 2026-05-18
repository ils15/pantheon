# ⬆️ Upgrading Pantheon

> **From:** v3.3.x / v3.2.x
> **To:** v3.4.0

---

## Quick Summary

v3.4.0 redesigned the architecture from 6 parallel agent files to a
**canonical → adapter → sync** pattern. If you were editing platform-specific
agent files directly, you must switch to editing canonical agents and running
the sync engine.

**Estimated migration time:** 30–60 minutes

---

## Breaking Changes

### 1. `search/changes` removed from toolMap (SECURITY)

**What changed:** The `search/changes` tool (read-only git diff) was mapped to
unrestricted `bash` on OpenCode, Claude Code, and Cline platforms. This was a
security violation — it allowed shell injection through a tool that should only
read diffs.

**Action required:** If any of your custom agents reference `search/changes` or
a platform-mapped equivalent, remove the reference. Agents that need to review
code should now delegate to `@themis` or use the `task()` subagent mechanism.

**Impact:** Low — `search/changes` was primarily used by Themis and Zeus for
code review. Both now use `task()` delegation instead.

### 2. Agora is now a hidden subagent

**What changed:** Agora was a primary agent in v3.3.x (`agents/agora.agent.md`
with `user-invocable: true`). It is now:
- `mode: subagent`
- `hidden: true`
- `user-invocable: false`

**Action required:**
- If you were invoking Agora directly via `@agora`, this still works — but
  through a different routing path.
- If you had Agora in your `opencode.json` or platform config, verify it's
  still reachable via `/pantheon` command or Zeus delegation.
- Remove any custom `agents:` entries for Agora from your platform configs
  (it's now routed through `opencode.json` `commands` section).

**Impact:** Medium — Agora still works the same way, but configuration paths
changed.

### 3. Athena "Agora Mode" section removed

**What changed:** Athena's canonical agent previously had an "Agora Mode"
section describing when to route to Agora. This was removed — trade-off
questions now route to Agora directly.

**Action required:** None — this was internal cleanup. If you had custom
Athena instructions referencing "Agora Mode," update them to reference
`@agora` or `/pantheon` directly.

**Impact:** Low — affects only users who extended Athena's agent definition.

### 4. 7 new frontmatter fields required on canonical agents

**What changed:** All 18 canonical agents now have 7 new frontmatter fields:
`permission`, `hooks`, `mcpServers`, `temperature`, `steps`, `globs`, `skills`.

**Action required:** If you maintain custom canonical agents, add these fields.
At minimum:
- `skills: []` (empty array is acceptable)
- `permission: {}` (empty object is acceptable)
- The sync engine will warn but not fail on missing fields.

**Impact:** Low — the sync engine is permissive about missing optional fields.

### 5. Hermes handoff name fixed

**What changed:** `**** (via handoff button)` → `@themis (via handoff button)`
in `agents/hermes.agent.md` and 6 platform copies.

**Action required:** If you copied Hermes's agent file before the fix, update
the handoff section from `****` to `@themis`.

**Impact:** Low — visual fix, no functional change.

### 6. `temis_delegate` typo fixed

**What changed:** `temis_delegate` → `themis_delegate` in 11 files across
canonical source, generated files, and stale deployment copies.

**Action required:** If you have local copies of these files, replace
`temis_delegate` with `themis_delegate`.

**Impact:** Low — the typo was in the agent-coordination skill, which is
loaded on demand.

---

## What Files Changed

### New or replaced

| Path | What |
|------|------|
| `agents/*.agent.md` | All 18 canonical agents — 7 new frontmatter fields, handoff routes section, skill assignments |
| `platform/*/adapter.json` | All 6 platform adapters — new fields: `skillsOutputDir`, `deploySkills`, `handoffStrategy`, `ensureAgentTool` |
| `platform/plans/*` | 16+ plan configurations added |
| `platform/select-plan.sh` | New — plan selection script |
| `scripts/sync-platforms.mjs` | Rewritten — body validation, tool reference transformation, dedup composite keys |
| `scripts/validate-sync.mjs` | New — sync integrity checksum |
| `skills/` | 29 skills × 6 platforms = 174 deployment copies |

### Removed

| Path | Why |
|------|-----|
| `search/changes` from toolMap | Security violation — mapped to unrestricted bash |
| `skills/plan-architecture/` | Referenced but never created (warning only) |
| Hardcoded models in `opencode.json` | Moved to plan-based configuration |

### Modified

| Path | Change |
|------|--------|
| `AGENTS.md` | Agora routing matrix updated, Hermes handoff fix, quality gate section restored |
| `README.md` | Architecture diagram updated, platform comparison table, memory system docs |
| `CHANGELOG.md` | v3.4.0 release notes added |
| `opencode.json` | Agora routing via `commands` section instead of `agents:` |

---

## How to Upgrade

### Step 1: Pull the latest

```bash
git pull origin main
npm install                          # update dependencies
```

### Step 2: Regenerate platform files

```bash
node scripts/sync-platforms.mjs      # sync all platforms
# or for a single platform:
node scripts/sync-platforms.mjs opencode
```

Use `--dry-run` to preview changes without writing:
```bash
node scripts/sync-platforms.mjs --dry-run
```

### Step 3: Select a model plan

```bash
./platform/select-plan.sh list       # see available plans
./platform/select-plan.sh copilot-pro  # choose your plan
./platform/select-plan.sh models     # verify agent-to-model mapping
```

### Step 4: Update platform configs

If you maintain custom platform configurations:

1. Open each `platform/<name>/adapter.json`
2. Add the 4 new fields:
   ```json
   {
     "skillsOutputDir": "skills",
     "deploySkills": true,
     "handoffStrategy": "exclude",
     "ensureAgentTool": false
   }
   ```
3. Verify `toolMap` no longer contains `search/changes`
4. Verify `excludeTools` includes `search/changes` if present

### Step 5: Verify the upgrade

```bash
node scripts/validate-sync.mjs       # check sync integrity
```

Expected output:
```
✅ All 18 canonical agents parsed
✅ All 6 platform adapters loaded
✅ 174 skills deployed (29 skills × 6 platforms)
✅ No stale tool references detected
✅ No security violations in tool maps
```

### Step 6: Test a workflow

```
@zeus: Implement a simple "hello world" endpoint
```

Verify:
1. Athena plans and presents to you (Gate 1)
2. Hermes implements with TDD (RED → GREEN → REFACTOR)
3. Themis reviews before merging (Gate 2)
4. You commit (Gate 3)

---

## Rollback

If something breaks, the previous version is tagged:

```bash
git checkout v3.3.0
```

The old platform files are also preserved in git history — you can restore
individual files:

```bash
git checkout v3.3.0 -- platform/opencode/adapter.json
```

---

## Need Help?

- **Open an issue** on GitHub with the `upgrade` label
- **Check the changelog** at [CHANGELOG.md](../CHANGELOG.md) for full details
- **Review the architecture** at [docs/ARCHITECTURE.md](ARCHITECTURE.md) for
  understanding the new design
