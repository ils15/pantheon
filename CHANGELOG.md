# Changelog

All notable changes to **mythic-agents** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

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
- **`AGENTS.md`** — Zeus `Delegates to:` chain was missing `hephaestus`; updated to reflect the full 9-agent delegation list

---

## [v2.3] and earlier

See the `## Changelog` section in [README.md](README.md) for earlier release notes embedded prior to the introduction of this standalone file.
