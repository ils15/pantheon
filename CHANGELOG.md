# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v3.4.0] - 2026-05-18

Pantheon v3.4.0 is a **platform infrastructure release** — the kind of release you don't see on the surface but feel in every interaction. Three months of architectural work compressed into one theme: **agents that actually work the same way on every platform**.

### Why v3.4.0 exists

The original Pantheon design had a fundamental flaw: each platform (OpenCode, Claude Code, Cursor, Windsurf, Cline, Continue) had its own agent format with different field capabilities, different tool naming conventions, and different configuration patterns. Changes had to be made 6 times — and they were never quite identical. Bugs like `temis_delegate` (missing the "h") propagated across platforms because there was no single source of truth.

v3.4.0 fixes this at the architecture level with the **canonical → adapter → sync** pattern:

1. **Canonical agents** (`agents/*.agent.md`) are the single source of truth — rich YAML frontmatter with 7 new fields (`permission`, `hooks`, `mcpServers`, `temperature`, `steps`, `globs`, `skills`) plus full body text with handoff documentation
2. **Platform adapters** (`platform/*/adapter.json`) define translation rules — what to include, exclude, rename, and how to format frontmatter for each runtime
3. **Sync engine** (`scripts/sync-platforms.mjs`) generates platform-specific files from the canonical source, with dedup, validation, and skill deployment built in

Change once in the canonical agent. Sync to all 6 platforms. Done.

### What this means for users

- **18 agents**, not 17 — Agora now exists as a hidden subagent for multi-perspective synthesis, invoked via `/pantheon` or `@agora`
- **45 skill assignments** — each agent now declares its domain expertise explicitly (Hermes has `fastapi-async-patterns`, Hephaestus has `rag-pipelines`, Gaia has `remote-sensing-analysis`)
- **174 skills deployed** — 29 skills × 6 platforms, each in the format their runtime expects
- **Zero `temis_delegate`** — 11 occurrences of the typo fixed across canonical source, generated files, and stale deployment copies
- **Security fix** — `search/changes` (read-only git diff) was mapped to unrestricted `bash` on 3 platforms; removed and blocked
- **416 files changed** — 119 modified + 297 new skill deployment files across all platforms

### What's next

v3.5.0 will focus on documentation consolidation (Fase 2 from our audit — merge SETUP into INSTALLATION, split README/AGENTS, add tutorial and troubleshooting), plus the missing `plan-architecture` skill that Athena references but doesn't have yet.

### Added

- **Canonical Agent Redesign** — Added 7 new frontmatter fields (`permission`, `hooks`, `mcpServers`, `temperature`, `steps`, `globs`, `skills`) to all 18 canonical `.agent.md` files, enabling per-agent tool permission models, lifecycle hooks, MCP server bindings, temperature control, multi-step workflows, file glob scoping, and skill-based capability loading
- **Skill assignments** — 45 targeted skill assignments across all agents (e.g., `fastapi-async-patterns` → Hermes, `rag-pipelines` → Hephaestus, `internet-search` → Apollo), making each agent's domain expertise explicit and verifiable
- **Handoff Routes section** — Added to all 18 agent body texts, documenting exactly which agents each agent hands off to and for what purpose, ensuring cross-platform visibility since YAML `handoffs:` is stripped by all 6 platform runtimes
- **Agora subagent** — Created as `mode: subagent`, `hidden: true`, `user-invocable: false` (not a primary agent); `/pantheon` command routes to Agora via `opencode.json` config; Zeus delegates explicitly via `task("agora", ...)`
- **Platform adapter fields** — Added `skillsOutputDir`, `deploySkills`, `handoffStrategy`, `ensureAgentTool` to all 6 platform adapter.json configs (`_template`, `claude`, `cline`, `continue`, `cursor`, `opencode`, `windsurf`), plus 9 new frontmatter fields in OpenCode and Claude adapters
- **Multi-platform skill deployment** — 174 skills deployed (29 skills × 6 platforms) with per-platform deployment paths, enabling agents to reference skill files regardless of target runtime
- **Body tool reference transformer** — `transformBodyToolReferences()` in sync engine automatically replaces tool references in agent body text with platform-correct equivalents (e.g., `execute/runInTerminal` → `bash`)
- **Body validation** — `validateBodyToolReferences()` checks that every tool mentioned in agent body text actually exists in that agent's tool list, catching stale references at sync time
- **Platform select script** — `platform/select-plan.sh` with `list`, `models`, `status`, and plan activation commands

### Changed

- **Architecture: canonical → adapter → sync** — Platform adapter architecture redesigned: canonical agents are the single source of truth, `adapter.json` configs define platform-specific translation rules, `sync-platforms.mjs` generates platform output files. All changes go into canonical agents first, then sync propagates.
- **Agora routing** — Agora removed as primary agent in favor of hidden subagent pattern; `/pantheon` command now routes via `opencode.json` `commands` section instead of `agents:`; Zeus's section now delegates to `@agora` explicitly
- **Athena cleanup** — "Agora Mode" section removed from Athena; the `/plan-architecture` skill remains Athena's domain, trade-off questions route to Agora directly
- **AGENTS.md** — Zeus's "Implicit Agora Mode" replaced with clear delegate-to-@agora pattern; routing matrix updated; agent descriptions refined across all 18 entries
- **Sync engine** — `mapTools()` uses composite dedup key (`${tool}:${mapped}`) to handle platforms where the same canonical tool maps to different platform tools; skill deployment paths fixed (`join(outDir, skillsDir)` → `join(PLATFORM_DIR, platformName, skillsDir)`)
- **Docs cleanup** — `docs/QUICKSTART.md` URL fixed (`anomalyco` → `ils15`); `docs/RELEASING.md` version aligned with manifest

### Removed

- **`search/changes` from toolMap** — Removed from OpenCode, Claude, and Cline tool maps and moved to `excludeTools`. `search/changes` (read-only git diff) mapped to unrestricted `bash` was a security violation; agents now delegate via `task()` for code review
- **`plan-architecture` skill reference** — Referenced by Athena canonical agent but no `skills/plan-architecture/SKILL.md` exists; generates warnings across all platform syncs

### Fixed

- **Hermes handoff name** — Empty `**** (via handoff button)` → `@themis (via handoff button)` in canonical `hermes.agent.md` + 6 platform-generated copies (7 files total)
- **`temis_delegate` typo** — `workflow.add_node("review", temis_delegate)` → `themis_delegate` in `skills/agent-coordination/SKILL.md` + 10 platform copies (11 files total)
- **AGENTS.md quality gate** — Restored missing "Themis" references on 3 lines of the MANDATORY QUALITY GATE WORKFLOW section (lines 604, 607, 620) — critical rules were ungrammatical without the agent name
- **AGENTS.md invocation** — Restored missing `@prometheus` and `@themis` prefixes on 2 lines of the Direct Invocation section (lines 1005, 1007)
- **Claude user-invocable** — Fixed contradiction where `user-invocable` was both in `include` and `exclude` lists in Claude adapter
- **skillsOutputDir path** — Fixed path computation from `join(outDir, skillsDir)` to `join(PLATFORM_DIR, platformName, skillsDir)` — was deploying skills to wrong directory level
- **README.md** — `anomalyco/pantheon` → `ils15/pantheon` in git clone URL
- **Version alignment** — `docs/RELEASING.md` matched to manifest v3.3.2

### Platforms

- ✅ OpenCode — full multi-agent orchestration with skills deployment
- ✅ VS Code Copilot — canonical agents with all 7 new fields
- ✅ Claude Code — handoffStrategy + expanded frontmatter
- ✅ Cursor — .mdc rules with tool maps
- ✅ Windsurf — Cascade rules with skills
- ✅ Cline — .clinerules with skipFrontmatter
- ✅ Continue.dev — system prompt rules with skills

## [v3.3.0] - 2026-05-16

### Added
- Argus agent (`agents/argus.agent.md`) — visual analysis specialist for screenshots, PDFs, diagrams, and UI mockups
- Argus documentation in Discovery Tier, Agent Selection Guide, and Health Check sections of `AGENTS.md`
- Background orchestration documentation for the opencode-pty plugin (async execution)
- Dynamic prompts documentation

### Changed
- `/forge` command rewritten to edit `opencode.json` directly instead of reading `plan-active.json`
- Model configuration flow: installation → no hardcoded models → user runs `/forge` → agent edits `opencode.json`
- `plan-active.json` now defaults to `"auto"` (no plan selected)
- OpenCode sync now preserves full agent orchestration graph (agents, handoffs, user-invocable)
- Cline adapter notes updated to reflect skipFrontmatter fix
- All 17 agents now present across all 7 platforms

### Removed
- Hardcoded `model` and `small_model` fields from `opencode.json` root
- Hardcoded model references from `/forge` command template
- All per-agent model overrides from default `opencode.json`
- Legacy `platform/windsurf/agents/` directory (conflicted with modern `rules/`)

### Fixed
- **OpenCode adapter**: Include `agents:`, `user-invocable`, and `handoffs` in frontmatter (were incorrectly excluded, breaking /pantheon and agent dispatch)
- **Claude Code adapter**: Include `agents:` in frontmatter for subagent whitelist
- **Windsurf adapter**: Remove `agents:` from exclude list
- **Cline**: Fix `--- {} ---` frontmatter wrapper bug — added `skipFrontmatter: true` to sync engine
- **install.mjs**: Add missing `argus` agent to AGENT_NAMES (was 16, now 17)
- **Windsurf**: Delete legacy `platform/windsurf/agents/` directory (conflicted with modern `rules/`)
- **Continue.dev**: Add missing `argus` rule to config.yaml
- **sync-platforms.mjs**: Fix `omitSection()` to be code-block aware (no longer strips content inside fenced code blocks)
- **Versioning**: Clean up 9 fragmented tags (v3.2 → v3.5.6), create single v3.3.0 tag
- **Manifests**: Bump version from 3.4.0 → 3.3.0 across package.json, plugin.json, README badge
- CI/CD failure caused by Argus missing from `AGENTS.md` references
- `/forge` command not working (was reading `plan-active.json` which OpenCode ignores)
- Expensive model usage caused by hardcoded defaults in `opencode.json`

### Platforms
- ✅ OpenCode — full multi-agent orchestration
- ✅ VS Code Copilot — canonical agents
- ✅ Claude Code — comma-separated tools
- ✅ Cursor — .mdc rules
- ✅ Windsurf — Cascade rules
- ✅ Cline — .clinerules (skipFrontmatter fixed)
- ✅ Continue.dev — system prompt rules
