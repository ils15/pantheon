# Changelog

All notable changes to **mythic-agents** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- _No entries yet._

### Changed

- _No entries yet._

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
