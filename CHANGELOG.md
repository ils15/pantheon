# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] - Upcoming

### Added
### Changed
### Fixed

## [v3.5.0] - 2026-05-19

Pantheon v3.5.0 is a **commands and skills expansion release** — the result of extracting, documenting, and testing the full feature set from oh-my-openagent, agentic, OpenAgentsControl, and oh-my-opencode-slim into Pantheon's existing 18-agent architecture. Zero new agents. Everything as skills, hooks, and commands on the existing roster.

### Why v3.5.0 exists

The previous v3.4.0 focused on platform infrastructure (canonical → adapter → sync). v3.5.0 completes the feature expansion: 16 new skills (1 rename), 4 new slash commands, deduplication, documentation consolidation, and a complete test suite validation — 10/10 skills and commands passing.

### Added

- **16 new skills** — auto-continue (renamed from todo-continuation), relentless-mode, wisdom-accumulation, ai-slop-remover, metis-gap-analysis, task-system, review-work, handoff, init-deep, security-audit-pro, test-architecture, cache-strategy, session-recovery, hashline-edits, category-routing, file-prompts
- **4 new slash commands** — `/praxis` (execute plan via task system), `/metamorphosis` (intelligent refactoring with TDD), `/cancel-relentless` (cancel relentless mode), `/stop-continuation` (stop all continuation mechanisms)
- **Commands documentation** — New Commands section in README.md (12 commands + multi-platform note)
- **Agent Selection Guide** — 6 new entries in AGENTS.md (`/forge`, `/ping`, `/cancel-relentless`, `/metamorphosis`, `/praxis`, `/stop-continuation`)
- **Sync scripts updated** — `sync-opencode.sh` + `sync-platforms.mjs` now deploy commands alongside agents and skills

### Changed

- **Commands shortened** — All 4 command `.md` files reduced from 30-65 lines to 5-6 lines each (avg 86% reduction in injected context)
- **auto-continue removed from Zeus default skills** — auto-continue and relentless-mode are now opt-in (loaded on-demand via command or task), not loaded by default. Fixes gate-bypass issue where agents were auto-continuing through mandatory stops.
- **todo-continuation → auto-continue** — Skill renamed across all 6 platforms; 11 stale platform directories deleted
- **TDD skill updated** — `tdd-with-agents/SKILL.md` enhanced across all 6 platform copies
- **124 lines of deduplication** — Empty hook sections, anti-rationalization table, stale security-audit references removed from agents

### Removed

- **todo-continuation skill** — Renamed to auto-continue; stale directories cleaned from 6 platforms
- **auto-continue and relentless-mode from Zeus default skills** — Now only activated when explicitly loaded by the user

### Fixed

- **auto-continue gate conflict** — Skills were loaded by default and overriding mandatory safety gates. Now opt-in only. Gates (plan approval, phase review, git commit) always take precedence.
- **Command documentation gap** — 4 commands existed as orphan `.md` files without README, AGENTS.md, or opencode.json registration. Now fully documented.
- **Sync script gap** — Only agents and skills were synced; commands were copied manually across 3 locations. Now all three are covered.

### Tested

- **10/10 skills and commands validated** via `.test-runner/TEST-GUIDE.md`:
  - `/praxis` ✅ — task execution with dependency waves, gates respected
  - `/cancel-relentless` ✅ — graceful handling with no active mode
  - `/stop-continuation` ✅ — graceful handling with no active mechanisms
  - `/metamorphosis` ✅ — 4-phase refactoring (engine extraction, N+1 fix, password security, type hints)
  - `auto-continue` ✅ — 4-phase sequential execution without "should I continue?"
  - `/relentless-mode` ✅ — 3 tasks, 47 tests passing, `<promise>DONE</promise>` signal
  - `wisdom-accumulation` ✅ — Wave 1 + Wave 2 cross-wave learning with 5 categories
  - `ai-slop-remover` ✅ — 34→18 lines (44% AI slop removed)
  - `metis-gap-analysis` ✅ — 10 gaps found, plan revised from 5 to 4 phases
  - `review-work` ✅ — 5 parallel checks with file:line references and severity

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

## [v3.3.2] - 2026-05-17

Pantheon v3.3.2 focused on **developer experience and naming consolidation**. The `/conclave` command was renamed to `/pantheon` for consistency, and the agent count was finally corrected to 17 after Argus was added. A new changelog skill was introduced to automate CHANGELOG.md generation from conventional commits, making release notes a single command instead of a manual chore.

### Added

- **Changelog skill** — `node scripts/versioning.mjs changelog` auto-generates CHANGELOG.md entries from conventional commits, making release note generation a single command
- **Step limit adjustments** — Mnemosyne (5→20), Themis (10→20), and other agents received higher step limits for complex multi-file tasks

### Changed

- **/conclave renamed to /pantheon** — Council Mode renamed to Agora Mode (3-5 agents); the `/pantheon` command now triggers multi-perspective synthesis
- **Agent count 16→17** — All manifests, install scripts, and platform configs updated to reflect the correct 17-agent roster (including Argus)

### Fixed

- **Empty bold placeholders** — Filled missing `****` delegate names in Aphrodite and Demeter "When to Delegate" sections
- **Missing agent names** — @ops reference removed, .windsurfrules legacy path cleaned up

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

## [v3.1.1] - 2026-05-01

Pantheon v3.1.1 made the **model configuration system fully optional**. Users no longer needed to select a plan — if no plan was active, agents would simply inherit the conversation model by default. This removed a friction point for new users who found the plan system confusing on first setup.

### Added

- **Zero-config fallback** — When no plan is selected, agents use the main conversation model, making the system work out of the box
- **Windsurf platform regeneration** — All Windsurf agents rebuilt with the new optional config pattern
- **Plan auto-detection** — If a plan file exists, it's used; if not, the system falls back gracefully without errors

## [v3.1.0] - 2026-05-01

Pantheon v3.1.0 introduced a **plan-based model configuration system** — one of the most requested features. Instead of hardcoding model names in every agent configuration, an abstract tier system (`fast`, `default`, `premium`) was created. Platform-specific plan files resolve these tiers to the actual model names for each runtime (OpenCode, Copilot, Cursor, Claude Code, etc.).

This meant users could switch between "cheap" and "best" model configurations with a single command, without editing agent files. The system was designed to work across all 7 platforms with zero duplication.

### Added

- **Abstract tier system** — `fast`, `default`, and `premium` tiers replace hardcoded model names in all agents
- **`platform/plans/` directory** — JSON Schema validation (`schema.json`) plus 7 platform plan files for OpenCode, Copilot (Free/Pro/Pro+/Student/Business/Enterprise), Cursor (Hobby/Pro/Ultra), Claude Code (Pro/Max), and BYOK (cheap/balanced/best)
- **`platform/select-plan.sh`** — CLI tool to list available plans, select one, inspect model mappings, and show active status
- **`plan-active.json`** — Symlink-based active plan pointer, auto-detected at runtime
- **40 files changed** — +920 lines of new configuration infrastructure across platform adapters, plan files, and CLI tools

## [v3.0.0] - 2026-04-30

Pantheon v3.0.0 marks the **rename from mythic-agents to Pantheon** — a complete architectural rewrite targeting multi-platform agent orchestration.

### Added
- **4 new agents** — Hephaestus (AI pipelines), Chiron (model providers), Echo (conversational AI), Nyx (observability)
- **9 new skills** — `rag-pipelines`, `vector-search`, `mcp-server-development`, `multi-model-routing`, `conversational-ai-design`, `agent-observability`, `streaming-patterns`, `internet-search`, `tdd-with-agents`
- **Multi-platform architecture** — Sync engine with 5 platform adapters (Claude Code, Cursor, OpenCode, Cline, Continue.dev) and template for adding new platforms
- **Release system** — `auto-release.yml`, `release.yml`, CHANGELOG.md generation pipeline

### Changed
- **Project renamed** — `mythic-agents` → `Pantheon` across all files, URLs, and configurations
- **Documentation restructured** — Multi-platform docs, per-platform READMEs, architecture diagrams
- **CI/CD overhaul** — 12 workflow issues fixed across 5 pipelines; multi-platform validation infrastructure

### Infrastructure
- 5 platform adapters with tool mapping, frontmatter translation, and per-platform output formats
- Skill deployment engine with per-platform paths and format conversion
- 131 files changed, ~27.8k lines added
