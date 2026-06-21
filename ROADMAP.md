# 🗺️ Pantheon Roadmap

> **Last updated:** v3.14.0 (2026-06-20)
>
> This document tracks what was delivered, what's coming next, and how you
> can influence priorities. The roadmap is a living document — PRs and issues
> can change it.

---

## v3.14.0 — Codebase Audit, Documentation & Optimization (June 2026)

**Theme:** Comprehensive codebase health improvement, dead code removal, documentation overhaul.

### Delivered

| Area | What changed | Impact |
|------|-------------|--------|
| **Dead Agent Purge** | Removed ~150+ references to Echo, Chiron, Argus, Agora across 67+ files | Clean codebase — no more confusion from merged/removed agents |
| **Python Infrastructure** | Added `[build-system]`, project dependencies (FastAPI, SQLAlchemy, Alembic, Pydantic), ruff expanded 5→11 rule groups, coverage (`fail_under=80`), mypy strict mode | Project can now be `pip install`ed; linting matches Themis enforcement |
| **Alembic Scaffolding** | `alembic.ini`, `async env.py`, models base with `AsyncAttrs` + `TimestampMixin`, async engine factory with `DatabaseSettings` | Ready for database migrations out of the box |
| **SQLAlchemy 2.0 Mixins** | `UUIDPrimaryKeyMixin`, `IntegerPrimaryKeyMixin`, `SoftDeleteMixin`, `ActivatableMixin` | Reusable model patterns for downstream projects |
| **Frontend Scaffolding** | `biome.json`, `tsconfig.json` (strict mode), npm scripts (test, lint, typecheck, build, dev) | Downstream frontend projects have reference configs |
| **Docker Infrastructure** | Multi-stage Dockerfile, docker-compose.yml (PostgreSQL 16 + API), `.env.example` | One-command dev environment |
| **Token Waste Elimination** | Removed `.github/instructions/` (~1.6K lines) and `.github/skills/` (~10K lines) — pure duplication | **~11.7K lines saved** (~23K tokens) |
| **Mermaid Diagrams** | 5 new diagrams: TDD cycle, Artifact Lifecycle, Council Synthesis, Architecture, Delegation Flow | Visual clarity for core workflows |
| **Documentation Quality** | All Portuguese→English, "When NOT to Use" on 7 agents, duplicate Nyx removed, ADR consistency | Documentation now consistent and bilingualism-free |
| **Database Standards** | Async SQLAlchemy 2.0 patterns, connection pooling, migration testing, disaster recovery + Mermaid diagrams | Complete database development guide |
| **OpenCode Tool Alignment** | All agent tool names converted from VS Code to OpenCode conventions | Agents work correctly on OpenCode platform |

### Stats

- **81 files changed** — 442 insertions, 1,795 deletions
- **14 agents** — all with "When NOT to Use" sections
- **~11.7K lines** of pure duplication removed
- **5 new Mermaid diagrams** across key documentation
- **150+ dead references** to Echo, Chiron, Argus, Agora eliminated

---

## v3.13.0 — Context Compression & Agent Cleanup (June 2026)

**Theme:** Token optimization, agent frontmatter standardization, memory infrastructure.

### Delivered

| Area | What changed | Impact |
|------|-------------|--------|
| **Level 2 Context Compression** | Priority scoring engine, semantic summarization, budget allocation, cross-reference mechanism | ~50% context savings between phases |
| **Agent Frontmatter Cleanup** | Stripped non-OpenCode fields from all 14 agents | All agents parse cleanly with OpenCode YAML |
| **Agent Count Unified** | 14 everywhere (was inconsistent: some files said 18) | No more confusion about agent count |
| **Stale Agent References** | Chiron, Echo, Argus, Agora cleaned from 40+ files | Cleaner codebase |
| **TUI Plugin Deactivation** | Moved to plugins-disabled/ | Simplified active tree |
| **CI Platform Conformance** | 6/6 platforms passing with 0 failures | Reliable cross-platform sync |

---

## v3.4.0 → v3.7.2 — Platform Infrastructure & Skills (May 2026)

[Previous entries preserved below]

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
| **Platform Select** | ~~`platform/select-plan.sh`~~ (removed in v3.6.0 — model tiers now resolved via platform settings) | — |
| **Security Fix** | `search/changes` removed from toolMap (was mapped to unrestricted bash on 3 platforms) | Eliminated shell injection vector |

### Stats

- **416 files changed** — 119 modified + 297 new
- **14 agents** (2 primary + 12 subagents)
- **37 skills** across 9 domains
- **16+ plan configurations** for different subscriptions
- **7 platforms** supported

---

## v3.5.0 — Documentation & Skills

**Focus areas:** Documentation consolidation, skill gap closure, developer experience.

### Delivered

| Area | What | Status |
|------|------|--------|
| **docs/ARCHITECTURE.md** | Architecture rationale doc (Conductor-Delegate, Canonical→Adapter→Sync, DAG Waves, Memory, Platform Adapters) | ✅ Delivered |
| **ROADMAP.md** | This file — version history, upcoming themes, contribution guide | ✅ Delivered |
| **`plan-architecture` skill** | Feature architecture planning with component breakdown and data flow mapping | ✅ Delivered |

### Future / Not Yet Delivered

| Area | What | Status |
|------|------|--------|
| **Documentation consolidation** | Merge SETUP into INSTALLATION, split README/AGENTS, add tutorial and troubleshooting | 🔜 Planned |
| **docs/UPGRADING.md** | Migration guide between major versions (v3.3.x → v3.4.0) | 🔜 Planned |
| **Platform setup polish** | Verify all 7 platform guides are current and consistent | 🔜 Planned |
| **Tutorial** | "Build your first feature with Pantheon" walkthrough | 🔜 Proposed |

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

- **No hardcoded models** — removed from `opencode.json` root
- **Cline `skipFrontmatter` fix** — resolved frontmatter wrapper bug

> Full changelog: [CHANGELOG.md](CHANGELOG.md)
