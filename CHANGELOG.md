# Changelog

All notable changes to **mythic-agents** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [v2.8.3] — April 3, 2026

### Changed

#### Chore: Copilot agent docs alignment
- Updated agent frontmatter and orchestration docs to include `GPT-5.4 mini` alongside `Claude Haiku 4.5` for lightweight routing.
- Added workflow guidance for Chat Customizations, `#codebase` semantic-first search, `/troubleshoot #session`, `#debugEventsSnapshot`, and nested subagents.
- Aligned memory-bank notes and repository docs with the VS Code 1.111-1.114 Copilot feature set.

## [v2.8.2] — March 27, 2026

### Added

#### 🏗️ **Nested Subagents Architecture** — Hierarchical Agent Delegation
- **Nested subagent support** enabled via `chat.subagents.allowInvocationsFromSubagents: true` in `.vscode/settings.json`
- **New `agents` property** in agent YAML frontmatter to declare which agents can be invoked as nested subagents
- **5 Implementation Agents now support nested Apollo delegation**:
  - **Athena** → calls `apollo` for complex architectural research (isolation of discovery context)
  - **Hermes** → calls `apollo` to discover existing backend patterns and implementations
  - **Aphrodite** → calls `apollo` to locate existing components and design patterns
  - **Maat** → calls `apollo` to find optimization opportunities and query patterns
  - **Ra** → calls `apollo` to discover infrastructure patterns and deployment strategies

**Benefits:**
- **Context isolation**: Each nested agent works in a clean context window without inheriting parent's state
- **Parallelism**: Agents can spawn isolated research tasks that return only synthesized findings (60-70% token savings)
- **Recursion safety**: Maximum nesting depth of 5 prevents infinite loops
- **Improved discovery**: Smaller, focused searches replace large monolithic exploration phases

**Example workflow**:
```
User: /implement-feature Add Redis caching

Hermes (implementing backend):
  → Detects complexity
  → CALLS Apollo as nested subagent: "Find existing cache patterns"
  → Apollo returns isolated findings
  → Hermes incorporates patterns into implementation
```

### Changed

#### Agent Descriptions Updated for Nested Delegation
- **Athena**: "research-first, plan-only → research-first, plan-only, **Calls apollo as nested subagent for complex discovery**"
- **Hermes**: Added "**Calls apollo as nested subagent to discover patterns**"
- **Aphrodite**: Added "**Calls apollo as nested subagent to discover components**"
- **Maat**: Added "**Calls apollo as nested subagent for optimization patterns**"
- **Ra**: Added "**Calls apollo as nested subagent for pattern discovery**"

#### Settings Configuration
- `.vscode/settings.json` — Added `chat.subagents.allowInvocationsFromSubagents: true` to enable recursive agent delegation

#### Package Metadata
- `package.json` — Updated description to include "nested subagent delegation"

#### Documentation Clarity
- `README.md` and `AGENTS.md` — Clarified that `@agent` invocations must be entered in VS Code Copilot Chat, not in `bash`/terminal shells

### Technical Details

#### Files Modified
- `agents/athena.agent.md` — Frontmatter: `agents: ['apollo']` (removed mnemosyne, temis handoffs)
- `agents/hermes.agent.md` — Frontmatter: `agents: ['apollo']` (removed mnemosyne from nested agents list)
- `agents/aphrodite.agent.md` — Frontmatter: `agents: ['apollo']` (changed from `['apollo', 'mnemosyne']`)
- `agents/maat.agent.md` — Frontmatter: `agents: ['apollo']` (changed from `['apollo', 'mnemosyne']`)
- `agents/ra.agent.md` — Frontmatter: `agents: ['apollo']` (changed from `['mnemosyne']`)
- `.vscode/settings.json` — New setting: `chat.subagents.allowInvocationsFromSubagents: true`
- `package.json` — Version 2.8.1 → 2.8.2, description updated

**Rationale**: Handoffs (temis, mnemosyne) are explicitly called via `handoffs` property and should NOT appear in `agents` list. Only async helper agents (apollo) that agents can autonomously invoke belong in `agents`.

---

## [v2.8.1] — March 25, 2026

### Changed

#### Tool Namespace Standardization & Model Optimization 🔧
- **Agent Tool References** — Updated all agent YAML frontmatter to use correct VS Code Copilot tool names:
  - Replaced deprecated `agent/askQuestions` with `vscode/askQuestions` (19 total occurrences across 7 agents)
  - Refactored browser operations to use `browser/*` namespace (`browser/openBrowserPage`, `browser/navigatePage`, `browser/readPage`, `browser/screenshotPage`)
  - Cleaned up tool declarations in: Zeus, Iris, Athena, Temis, Ra, Aphrodite, Maat, Apollo

- **Model Priority Update** — Optimized Claude Haiku 4.5 as primary model (first fallback):
  - `agents/apollo.agent.md` — `['Claude Haiku 4.5 (copilot)', 'Gemini 3 Flash (Preview) (copilot)']`
  - `agents/mnemosyne.agent.md` — `['Claude Haiku 4.5 (copilot)', 'GPT-5.4 mini (copilot)']`
  - `agents/talos.agent.md` — `['Claude Haiku 4.5 (copilot)', 'GPT-5.4 (copilot)']`
  
  **Rationale:** Fast models (Haiku, Gemini Flash) optimized for shallow discovery and rapid iteration; maintains fallback to GPT-5.4/Sonnet for complex reasoning.

**Files changed:** 9
- agents/aphrodite.agent.md, apollo.agent.md, athena.agent.md, iris.agent.md, ra.agent.md, temis.agent.md, zeus.agent.md
- docs/memory-bank/04-active-context.md
- prompts/quick-plan-large-feature.prompt.md

**Issues closed:** #2, #3  
**Commit:** `7431127` (2026-03-21)

---

## [v2.8.0] — March 10, 2026

### Added

#### Comprehensive Hook System for Automated Quality Gates (Phase 1-3)
- **Phase 1** — Foundation (Security, Formatting, Logging)
  - `security.json` (PreToolUse) — Blocks destructive operations (rm -rf, DROP TABLE, TRUNCATE); prevents hardcoded secrets
  - `format.json` (PostToolUse) — Auto-formats code with multi-language support:
    - Python: Black + isort
    - JavaScript/TypeScript: Biome or Prettier  
    - YAML/JSON: yamlfmt & jq
    - Auto-detects file type and routes to appropriate formatter
  - `logging.json` (SessionStart) — Logs session metadata for audit trail

- **Phase 2** — Delegation Tracking
  - `delegation-start.json` (SubagentStart) — Logs when agents delegate to subagents
  - `delegation-stop.json` (SubagentStop) — Logs delegation completion (success/failure)
  - Audit trail stored in `logs/agent-sessions/delegations.log` and `delegation-failures.log`

- **Phase 3** — Advanced Validation
  - `type-check.json` (PostToolUse) — Validates Python (Pyright) + TypeScript (tsc) types
  - `import-audit.json` (PostToolUse) — Blocks wildcard imports, detects unused imports
  - `secret-scan.json` (PreToolUse) — Prevents hardcoded API keys, tokens, passwords

- **Handler Scripts** (11 total in `scripts/hooks/`)
  - `format-multi-language.sh` — Main router for auto-detection and routing
  - `format-python.sh` — Black + isort formatter
  - `format-typescript.sh` — Biome/Prettier formatter
  - `format-data.sh` — JSON/YAML validation
  - `validate-tool-safety.sh` — Security gate
  - `run-type-check.sh` — Type validation
  - `audit-imports.sh` — Import analysis
  - `scan-secrets.sh` — Secret detection
  - `log-session-start.sh` — Session logging
  - `on-subagent-delegation-start.sh` — Delegation tracking
  - `on-subagent-delegation-stop.sh` — Completion logging

#### Agent-Hook Integration Documentation
- Updated `AGENTS.md` with "Agent Collaboration with Hooks" section:
  - Table showing which hooks each agent inherits
  - Use cases per agent (Hermes, Aphrodite, Maat, Ra, Temis, Iris)
  - Explanation that hook execution is automatic when agent is active
- Updated `.github/copilot-instructions.md` with:
  - Multi-language formatter descriptions
  - "Language-Specific Formatters" section with handler scripts list
  - Hook security gates and quality gates documentation
  - Timeout limits and query limits for agent research phases
  - Agent lifecycle hooks reference

#### README Enhancements
- Added new "Automated Quality Gates via Hooks" section in Advanced Usage
- Detailed explanation of how hooks work (lifecycle, auto-execution, inheritance)
- Hook-Agent integration table showing which hooks each agent inherits
- Real-world example: automatic code validation during Hermes implementation
- Referenced handlers and scripts in `scripts/hooks/`
- Instructions for customizing and adding new hooks
- Updated Table of Contents with new subsections

### Changed
- Version bumped to `2.8.0` across all manifests:
  - `package.json`
  - `plugin.json`
  - `.github/plugin/plugin.json`

### Technical Details
- Hooks are workspace-level middleware configured in `.github/hooks/`
- All scripts are executable (755 permissions) and auto-invoked by configuration
- Execution is automatic based on lifecycle events (PreToolUse, PostToolUse, SessionStart, SubagentStart, SubagentStop)
- <100ms execution time per hook; non-blocking
- Complete audit trail of all operations across agent sessions

---

## [v2.7.1] — 2026-03-10

### Changed

#### Quality Gate Optimization (@temis)
- Redesigned `@temis` (Quality & Security Gate) to run **lightweight quality checks on changed files only**:
  - Trailing whitespace detection (grep-based, BLOCKER)
  - Hard tabs in Python detection (grep-based, BLOCKER)
  - Wild imports detection (`from X import *`, MEDIUM severity)
  - Optional tool-based checks (ruff, black, isort, eslint, prettier) when installed
- Removed dependency on `git diff` — implementation agents now provide changed files list directly
- Maintains OWASP Top 10, >80% coverage, and security validation in manual review
- Updated documentation across `agents/temis.agent.md`, `AGENTS.md`, `README.md`, and `.github/copilot-instructions.md`
- Reduced @temis execution time to ~30 seconds for typical phases

---

## [v2.7.0] — 2026-03-09

### Changed

#### Dynamic Versioning and Release Preparation
- Standardized repository release version to `2.7.0` across all version manifests:
  - `package.json`
  - `plugin.json`
  - `.github/plugin/plugin.json`
- Added `scripts/versioning.mjs` to automate semantic bump recommendation and application.
- Added npm scripts for versioning workflow:
  - `version:recommend` (analyzes commit subjects and recommends bump)
  - `version:auto` (applies recommended bump)
  - `version:patch`, `version:minor`, `version:major` (manual override)
- Introduced Conventional Commit-based bump policy in documentation:
  - `BREAKING CHANGE` or `!` in type scope -> major
  - `feat:` -> minor
  - all other conventional types -> patch
- Added CI workflows to operationalize versioning end-to-end:
  - `.github/workflows/version-recommendation.yml` posts/upserts recommendation comments on PRs
  - `.github/workflows/tag-version-sync.yml` validates manifest-version sync and tag/version match on `v*`
  - `.github/workflows/release-drafter.yml` with `.github/release-drafter.yml` generates optional draft release notes/changelog assistance
  - `.github/workflows/pr-conventional-labels.yml` auto-labels PRs from Conventional Commit titles (feeds Release Drafter categories/version resolver)

---

## [v2.6.2] — 2026-03-09

### Changed

#### Hardening Final (Model + Browser + Consistency)
- Standardized model routing across all core agents to the modern baseline:
  - Zeus, Athena, Hermes, Maat, Temis, Ra, Iris: `GPT-5.4` primary + `Claude Opus 4.6` fallback
  - Aphrodite: `Gemini 3.1 Pro` primary + `GPT-5.4` fallback
  - Talos: `Claude Haiku 4.5` primary + `GPT-5.4` fallback
  - Gaia: `Claude Sonnet 4.6` primary + `GPT-5.4` fallback
  - Apollo and Mnemosyne unchanged by role design (fast discovery/docs focus)
- Added explicit plan-validation lane in orchestration: Athena drafts, Temis validates plan quality/risk/test strategy, Zeus executes only after approval.
- Completed browser modernization to VS Code native integrated browser tools for UI discovery/validation workflows.

#### Agent and Tooling Updates
- **`agents/aphrodite.agent.md`** — Expanded integrated browser toolkit with:
  - `openBrowserPage`, `navigatePage`, `readPage`, `clickElement`, `typeInPage`, `hoverElement`, `dragElement`, `handleDialog`, `screenshotPage`, `runPlaywrightCode`
  - clear enablement steps (`workbench.browser.enableChatTools=true` + Share with Agent)
- **`agents/temis.agent.md`** — Added integrated browser validation flow for critical UI/user-journey review evidence.
- **`agents/apollo.agent.md`** — Added integrated browser reconnaissance support for live-page evidence during discovery.

#### Documentation Synchronization
- **`AGENTS.md`** — Updated model strategy and browser-integration guidance; documented plan-validation lane.
- **`README.md`** — Updated model assignment table and changelog entries to current strategy.
- **`CONTRIBUTING.md`** — Modernized frontmatter example to model array + canonical tool naming.

#### Verification
- Perplexity MCP references checked and confirmed absent (`perplexity`, `mcp_perplexity`, `mcp_perplexity-as_perplexity_ask`).
- Instructions and skills audited for modernization compatibility; no conflicting browser-tool or Perplexity remnants found.

---

## [v2.6.1] — 2026-03-08

### Changed

#### Model Migration: Opus 4.6 → GPT-5.4 🤖
- **`agents/zeus.agent.md`** — Primary model switched from `Claude Opus 4.6` to `GPT-5.4` for complex orchestration workflows
- **`agents/gaia.agent.md`** — Primary model switched from `Claude Opus 4.6` to `GPT-5.4` for scientific methodology synthesis and complex analysis
- **`AGENTS.md`** — Updated model strategy documentation:
  - Zeus: GPT-5.4 for complex orchestration, Sonnet 4.6 fallback
  - Gaia: GPT-5.4 for complex RS analysis, GPT-5.3-Codex fallback
  - Model-role alignment: "Fast models (Haiku, Gemini Flash) for shallow discovery; Sonnet for planning and production code; GPT-5.4 for complex orchestration"
- **`README.md`** — Updated model comparison table to reflect GPT-5.4 usage in Zeus and Gaia

#### Athena Performance Optimization ⚡
- **`agents/athena.agent.md`** — Optimized for 70-85% faster planning workflows (from ~90s to ~13-30s average):
  - **Model**: Switched from `Claude Opus 4.6` primary to `Claude Sonnet 4.6` only (Opus overhead removed)
  - **Tools**: Removed redundant `search/fileSearch` and `search/textSearch` tools (Apollo does this better)
  - **Apollo**: Now optional — Athena uses `search/codebase` directly for simple searches, only delegates to Apollo for complex discovery
  - **Artifact**: No longer creates `PLAN-*.md` automatically — presents plan in chat only (artifact created only if user explicitly requests)
  - **Memory Bank**: Reads `docs/memory-bank/00-overview.md` and `01-architecture.md` only if files exist and have content (conditional)
  - **Instructions**: Simplified from ~250 lines to ~100 lines (removed redundant examples, moved detailed workflows to skills)
  
- **`AGENTS.md`** — Updated Athena section to reflect optimizations:
  - Added performance metric: "~30s average (70% faster than previous version)"
  - Clarified Apollo is now OPTIONAL for complex discovery
  - Updated model strategy section: Sonnet only for Athena
  - Updated artifact protocol: PLAN artifacts are optional, not automatic
  - Updated workflow diagrams: "Plan presented in CHAT (artifact optional)"

- **`docs/ATHENA-OPTIMIZATION-ANALYSIS.md`** — Created detailed performance analysis document identifying 6 bottlenecks and 2-phase optimization plan with before/after metrics

### Performance Impact
- **Athena planning time**: 70% faster (Phase 1: ~90s → ~27s)
- **Full optimization**: 85% faster (Phase 2: ~90s → ~13s)
- **Token efficiency**: 20-30% fewer tokens per planning session
- **User experience**: Immediate plan presentation in chat, no waiting for artifact creation

#### Release Automation Hardening
- **`.github/workflows/release.yml`** — Tag trigger normalized to `v*` to ensure release workflow activation on version tag pushes.
- **`.github/workflows/verify.yml`** — Added push/PR verification workflow for `main` with agent frontmatter validation (`yamllint`) and plugin manifest validation (`npm run plugin:validate`).

---

## [v2.6.0] — 2026-03-04

### Added

#### VS Code Agent Plugin Support 🔌
- **`.github/plugin/plugin.json`** — Declares the repo as an installable VS Code Agent Plugin (Claude Code spec format). Bundles all 12 agents and 19 skills into a single installable package. Users can now install mythic-agents without cloning or copying files:
  ```json
  // settings.json
  { "chat.plugins.marketplaces": ["ils15/mythic-agents"] }
  ```
  Then browse and install from Extensions view (`@agentPlugins` search) or via local path:
  ```json
  { "chat.plugins.paths": { "/path/to/mythic-agents": true } }
  ```

### Changed
- **`README.md`** — Replaced single-method Installation section with two options: **Option A (Plugin, recommended)** covering marketplace install and local path; **Option B (Manual copy)** for the previous git-clone approach.

---

## [v2.5.0] — 2026-03-04

### Added

#### New Agent — Iris 🌈
- **`agents/iris.agent.md`** — GitHub operations specialist. Named after the Greek messenger goddess who bridges worlds. Closes the last manual gap in the development lifecycle by owning all GitHub write operations:
  - **Branch management**: creates branches following Conventional Commits naming (`feat/`, `fix/`, `chore/`, `docs/`, `release/`)
  - **Pull request lifecycle**: draft PR creation using repo template → review → squash merge with confirmation gate
  - **Issue management**: searches for duplicates before creating; adds closing comments; requires explicit approval to close
  - **Releases & tags**: derives semantic version bump from commit history; generates changelog from merged PRs; creates tag + GitHub Release
  - Uses all `mcp_github2_*` tools for GitHub API operations
  - Never merges, tags, or closes without explicit human confirmation via `agent/askQuestions`
  - Never uses `--force` push or bypasses branch protection rules

#### New GitHub Actions
- **`.github/workflows/validate-agents.yml`** — Validates all `.agent.md` frontmatter on every PR. Catches YAML syntax errors before they ship (mitigates recurrence of the v2.4 Gaia frontmatter bug). Also runs a consistency check verifying every agent referenced in `AGENTS.md` has a corresponding `.agent.md` file.
- **`.github/workflows/release.yml`** — Triggered on `v*.*.*` tag push. Automatically creates a GitHub Release, extracting the relevant version body from `CHANGELOG.md`. Enables Iris to trigger versioned releases by pushing a tag.

#### Documentation
- **`CHANGELOG.md`** — This file. Standalone changelog added to repo root. Previously the changelog existed only as a section inside `README.md`; both are now kept in sync.

### Changed
- **`README.md`** — Added Iris to agents table, repository structure listing, mermaid orchestration diagram (new Phase 5 — GitHub Publish node), model assignment table, direct invocation examples, and v2.5 changelog entry.
- **`AGENTS.md`** — Added new `Publishing & GitHub Tier` section with full Iris documentation. Updated Zeus `Delegates to:` chain. Added three rows to Agent Selection Guide (`Open PR / manage GitHub`, `Create release / tag`, `Open or triage issues`). Added Iris entry to Model Strategy.
- **`agents/zeus.agent.md`** — Added `iris` to `agents:` list and `description:` delegates chain.

---

## [v2.4] — 2026-02-27

### Added

#### New Skills
- **`internet-search`** — Web research skill covering `web/fetch` usage patterns, structured academic APIs (Semantic Scholar, CrossRef, arXiv, EarthArXiv, MDPI), GitHub and PyPI search, query construction best practices, parallel search strategy, and result synthesis templates. Wired into `gaia`, `athena`, and `zeus`.

### Changed

#### Expanded Skills
- **`remote-sensing-analysis`** — Completely rewritten from LULC-only scope to full remote sensing pipeline. Now covers: raster processing, radiometric & atmospheric correction, spectral indices (NDVI, EVI, SAVI, NDWI, NBR, NDSI, BSI), SAR processing & speckle filtering, change detection methods, time series analysis, ML/DL classification (U-Net, Random Forest, SVM, XGBoost), LULC product ensembles, inter-product agreement metrics (Kappa, OA, F1, Dice, temporal frequency), accuracy assessment (Olofsson 2014 method), LULC reference tables, quality checklist, and remote sensing data API index.

#### Full English Translation
All framework files are now entirely in English. Previously Portuguese content translated:
- `skills/nextjs-seo-optimization/SKILL.md` and `seo-config.ts`
- `skills/playwright-e2e-testing/SKILL.md`
- `skills/remote-sensing-analysis/SKILL.md` (full rewrite)
- `prompts/optimize-database.prompt.md`
- `agents/zeus.agent.md` — isolated Portuguese word (`"Nenhum"` → `"None"`)

### Fixed
- **`agents/gaia.agent.md`** — YAML syntax error: `model:` second entry was missing quotes, causing invalid frontmatter
- **`AGENTS.md`** — Zeus `Delegates to:` chain was missing `talos`; updated to reflect the full 9-agent delegation list

---

## [v2.3] and earlier

See the `## Changelog` section in [README.md](README.md) for earlier release notes embedded prior to the introduction of this standalone file.
