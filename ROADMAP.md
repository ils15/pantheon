# 🗺️ Pantheon Roadmap

> **Last updated:** v3.4.0 (2026-05-18)
>
> This document tracks what was delivered, what's coming next, and how you
> can influence priorities. The roadmap is a living document — PRs and issues
> can change it.

---

## v3.4.0 — Platform Infrastructure (May 2026)

**Theme:** Agents that work the same way on every platform.

### Delivered

| Area | What changed | Impact |
|------|-------------|--------|
| **Canonical Agent Redesign** | 7 new frontmatter fields: `permission`, `hooks`, `mcpServers`, `temperature`, `steps`, `globs`, `skills` | Per-agent tool permissions, lifecycle hooks, MCP bindings, skill-based capability loading |
| **Canonical → Adapter → Sync** | 3-layer architecture replacing 6 parallel agent files | Change once in canonical agent, sync to all 6 platforms |
| **Sync Engine** | `scripts/sync-platforms.mjs` with body validation, tool reference transformation, dedup | Catching stale references at sync time, not runtime |
| **Skill Deployments** | 174 skills deployed (29 skills × 6 platforms) | Consistent domain expertise across all platforms |
| **Agora Subagent** | Hidden multi-perspective synthesis agent (`/pantheon` or `@agora`) | Trade-off analysis without cluttering the agent list |
| **Platform Select** | `platform/select-plan.sh` with `list`, `models`, `status` commands | Easy plan switching for model configuration |
| **Security Fix** | `search/changes` removed from toolMap (was mapped to unrestricted bash on 3 platforms) | Eliminated shell injection vector |

### Stats

- **416 files changed** — 119 modified + 297 new
- **18 agents** (17 visible + 1 hidden subagent)
- **33 skills** across 9 domains
- **16+ plan configurations** for different subscriptions
- **7 platforms** supported

---

## v3.5.0 — Documentation & Skills (Next)

**Focus areas:** Documentation consolidation, skill gap closure, developer experience.

### Planned

| Area | What | Status |
|------|------|--------|
| **Documentation consolidation** | Merge SETUP into INSTALLATION, split README/AGENTS, add tutorial and troubleshooting | 🔜 Planned |
| **docs/ARCHITECTURE.md** | Architecture rationale doc (Conductor-Delegate, Canonical→Adapter→Sync, DAG Waves, Memory, Platform Adapters) | ✅ Delivered |
| **ROADMAP.md** | This file — version history, upcoming themes, contribution guide | ✅ Delivered |
| **docs/UPGRADING.md** | Migration guide between major versions (v3.3.x → v3.4.0) | 🔜 Planned |
| **`plan-architecture` skill** | Referenced by Athena canonical agent but no `skills/plan-architecture/SKILL.md` exists | 🔴 Missing |
| **Platform setup polish** | Verify all 7 platform guides are current and consistent | 🔜 Planned |
| **Tutorial** | "Build your first feature with Pantheon" walkthrough | 🔜 Proposed |

### How to prioritize

Open an issue or PR tagged `roadmap-v3.5.0` if you need something here that isn't listed.

---

## v3.6.0+ — Themes (Future)

These are directional. Specific items will be scoped as we approach each release.

### Theme: Observability & Telemetry

- Complete Nyx instrumentation across all agents
- Pre-built Grafana dashboards for agent performance
- Token/cost tracking per feature lifecycle
- LangSmith integration examples and documentation

### Theme: Testing & Quality Automation

- Automated regression test suite for the framework itself
- Agent output quality scoring (hallucination detection, faithfulness)
- End-to-end orchestration tests that simulate real feature implementations
- Sync engine validation in CI (auto-check that canonical sources are synced)

### Theme: Community & Ecosystem

- Plugin marketplace packaging for OpenCode and VS Code
- Published agent packs for non-Googlers (Cursor, Windsurf, Cline)
- Template repository for quick-start adoption
- Community skill contributions (database-specific, cloud-provider-specific)
- Pantheon user group / discussion forum

### Theme: Performance & Cost

- Context window optimization (progressive loading strategies)
- Model routing cost analysis tooling
- Caching layer for repeated agent invocations
- Parallel execution timeout and recovery improvements

### Theme: Model Provider Expansion

- Additional plan configurations for new model providers
- Provider benchmarking suite (cost vs. quality per agent role)
- Local-first model support (Ollama, vLLM, LocalAI)

---

## How to Contribute

### Influence priorities

1. **Open an issue** with the `roadmap` label describing what you need
2. **Vote on existing issues** — we prioritize by community demand
3. **Submit a PR** with the change you want to see

### Framework contributions

| Contribution | Where to start |
|---|---|
| New agent | Create `agents/<name>.agent.md`, add to Zeus's delegation list |
| New skill | Create `skills/<name>/SKILL.md` with YAML frontmatter |
| New platform | Create `platform/<name>/adapter.json`, add setup guide to `docs/platforms/` |
| New plan | Add `<name>.json` to `platform/plans/` following `schema.json` |
| Bug fix | Open a PR with the fix — see `CONTRIBUTING.md` for standards |

### Release cadence

| Type | Frequency | Example |
|------|-----------|---------|
| Major | Every 3–6 months | v3.4.0, v4.0.0 |
| Minor | As needed (1–2 months) | v3.5.0, v3.6.0 |
| Patch | Immediate for critical fixes | v3.4.1 (security), v3.4.2 (bug) |

Versions follow [Semantic Versioning 2.0.0](https://semver.org/):
- **BREAKING** change → MAJOR version bump
- **feat:** (backward compatible) → MINOR version bump
- **fix:** or other → PATCH version bump

---

## Previously: v3.3.0 (May 16, 2026)

**Theme:** Agent count expansion and model configuration flexibility.

- **Argus agent** — visual analysis specialist for screenshots, PDFs, diagrams
- **`/forge` command** — edits `opencode.json` directly for model selection
- **No hardcoded models** — removed from `opencode.json` root
- **Cline `skipFrontmatter` fix** — resolved frontmatter wrapper bug
- **17 agents** (pre-Argus was 16)

> Full changelog: [CHANGELOG.md](CHANGELOG.md)
