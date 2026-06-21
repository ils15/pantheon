# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v3.14.0] - 2026-06-20

### 🚀 Enhancements

- **Codebase Audit:** Comprehensive 5-agent scan — 48 issues found, all resolved
- **Mermaid Diagrams:** 5 new diagrams — TDD Cycle (stateDiagram-v2), Artifact Lifecycle (flowchart), Council Synthesis (sequenceDiagram), Architecture (flowchart), Delegation Flow (flowchart)
- **Python Infrastructure:** Added `[build-system]`, project deps (FastAPI 0.110+, SQLAlchemy 2.0+, Alembic 1.13+, Pydantic 2.7+), ruff expanded to 11 rule groups, coverage (`fail_under=80`), mypy strict
- **Alembic Scaffolding:** `alembic.ini` with env var interpolation, async `env.py`, Mako template, models base with `AsyncAttrs` + `TimestampMixin`
- **SQLAlchemy 2.0 Mixins:** `UUIDPrimaryKeyMixin`, `IntegerPrimaryKeyMixin`, `SoftDeleteMixin`, `ActivatableMixin`
- **Frontend Scaffolding:** `biome.json` (1.9.4), `tsconfig.json` (strict mode, ES2022), npm scripts (test, lint, typecheck, build, dev)
- **Docker Infrastructure:** Multi-stage Dockerfile (build + runtime, non-root), docker-compose.yml (PostgreSQL 16 + API), `.env.example`
- **Database Standards:** Async SQLAlchemy 2.0 patterns, connection pooling, migration testing, disaster recovery + 2 Mermaid diagrams
- **Documentation Quality:** "When NOT to Use" sections on all 7 main agents, English-only throughout, ROADMAP.md updated

### 🩹 Fixes

- **Dead Agent Purge:** Removed ~150+ references to Echo, Chiron, Argus, Agora across 67+ files (agents, platforms, instructions, skills)
- **Portuguese→English:** `docs/platforms/README.md` fully translated, `agents/prometheus.agent.md` mixed-language fixed
- **QUICKSTART.md:** Removed duplicate Nyx entry in agent table
- **`00-project.md`:** Fixed Argus in architecture diagram, corrected skill path, fixed Portuguese text
- **Prometheus Self-Contradiction:** Fixed "MUST NOT deploy (that's @prometheus)" — copy-paste bug from Chiron merge
- **Hephaestus Echo Dead Code:** Removed 25-line Echo section that was copy-pasted verbatim
- **`seo-config.ts`:** Renamed to `.md` (was Markdown disguised as TypeScript)
- **`agent-return-format.instructions.md`:** Fixed Agora reference in artifact table
- **`skills/README.md`:** Count corrected from 37→42, stale Chiron/Echo refs updated

### 🏡 Chore

```## [v3.13.0] - 2026-06-20

### Added
- **Level 2 Context Compression** — priority scoring engine (5 deterministic dimensions: Impact, Risk, Novelty, Blockers, Downstream relevance), semantic summarization templates per agent-pair, budget allocation (100-line cap, priority-greedy), cross-reference mechanism (D/E/M/C IDs with auto-generated `_xref/index.md`), ZZ artifact format for phase-to-phase context injection, `context-compression` skill (Level 2)
- **New prompts**: `prompts/semantic-summarize.md` for agent-pair aware semantic summarization
- **New scripts**: `scripts/scrub-secrets.py` for security scrubbing of compressed content
- **Missing infra**: `docs/memory-bank/_xref/_next_id.json` with full key names (decisions/entities/milestones/tasks)
- **Safety preflight**: `can_compress()` guard prevents compression of in-progress/escalated/blocked/NEEDS_REVISION artifacts
- **Atomic write protocol**: .tmp + fsync + rename with validation for corruption prevention

### Changed
- **14 agent `.agent.md` files** — stripped non-OpenCode frontmatter (`tools:`, `handoffs:`, `agents:`, `color:`, `hidden:`, `mcpServers:`). All agents now use only OpenCode-recognized fields
- **Agent count unified** — all files consistently say "14 agents" (removed chiron, echo, argus from counts)
- **`instructions/artifact-protocol.instructions.md`** — updated with ZZ artifact format, compression lifecycle, atomic write protocol, budget guardrails
- **`instructions/memory-bank-standards.instructions.md`** — updated with compression and recovery section, cross-reference docs
- **Context compression** — Level 1 replaced entirely by Level 2 (priority-scored summaries with downstream-aware field masks)
- **All 7 platforms regenerated** — commands (pantheon-status, ping) and agents synced across OpenCode, Claude Code, Cursor, Windsurf, Cline, Continue, Copilot

### Removed
- **TUI Plugin** — moved to `plugins-disabled/`, removed from OpenCode config (temporary removal)
- **`packages/tui-plugin/`** — source files removed from active tree
- **`plugins/pantheon-tui-plugin/`** — secondary plugin source removed
- **`platform/opencode/.opencode/package.json`** — stale TUI config removed
- **Stale agent references** — chiron, echo, argus, agora references cleaned from 40+ files across platforms, docs, tests, commands
- **Missing skill references** — `code-discipline`, `architecture-diagrams` removed from agent references (never existed as skills)

### Fixed
- **CHANGELOG.md** — removed 4 duplicate v3.12.1 entries and empty v3.12.2 section
- **Frontmatter consistency** — all 14 agents now parse cleanly with OpenCode YAML frontmatter
- **Cross-platform agent count** — 14 everywhere (was inconsistent: some files said 18, some said 14)
- **`.opencode/plugins/pantheon-hooks.ts`** — local OpenCode plugin que executa os 10 hooks de validação via tool.execute.before/after/event
- **`sync-platform.sh`** — step 3.6 não synca mais TUI plugin; step 3.7 synca o pantheon-hooks.ts globalmente
- **`.gitignore`** — `.opencode/plugins/` agora versionado; `platform/opencode/.opencode/{commands,skills}` ignorados
- **`opencode-hooks-plugin` npm** — removido do config (nunca foi publicado como pacote npm)
- **`@agora` redirects** — substituídos por `@zeus` em 5 platform files
- **Stale docs references** — Chiron, Echo removidos de README.md, QUICKSTART.md, platforms docs; TUI marcado como desativado; hooks docs atualizados de `.github/hooks/` para `scripts/hooks/`; skill count corrigido para 42
- **Canonical skills** — referências a Chiron em agent-coordination e database-optimization atualizadas para "Model Selection" e "model tier"
- **`tools:` field restored to all 14 canonical agents** — re-adicionado de v3.12.2 para o sync engine + conformance tests validarem toolMap keys
- **Stale skills removed** — `relentless-mode`, `review-work` (sem fonte canônica) removidos de .clinerules/skills, platform/claude, platform/cline, platform/continue, platform/cursor
- **Stale commands removed** — `cancel-relentless`, `token-audit` (sem fonte canônica em commands/) removidos de .clinerules/commands, .continue/commands, .cursor/commands e platform sources
- **wisdom-accumulation cleaned from platforms** — nenhum agente referenciava o skill; removido de platform dirs via sync --clean
- **All platforms sync:check** — 0 stale files across 7 platforms

### CI
- **Platform Conformance Matrix** — 6/6 plataformas passando com 0 falhas
- **CI validate** — passing
- **Sync Check** — passing
- **Auto Release** — published at v3.13.0




## v3.12.0

[compare changes](https://github.com/ils15/pantheon/compare/v3.11.0...v3.12.0)

### 🚀 Enhancements

- **agents:** Add anti-stall resilience and orchestration improvements ([7a61b69](https://github.com/ils15/pantheon/commit/7a61b69))
- **agents:** Add /pantheon-status command with version badge + agent registry ([984ec65](https://github.com/ils15/pantheon/commit/984ec65))
- **platform:** Add Pantheon TUI sidebar plugin for OpenCode ([09253c1](https://github.com/ils15/pantheon/commit/09253c1))

### 🩹 Fixes

- **ci:** Sync platform files and add mcp-security skill to pass CI ([a27a245](https://github.com/ils15/pantheon/commit/a27a245))

### 🏡 Chore

- **release:** Sync version to v3.11.0 ([1a9fb64](https://github.com/ils15/pantheon/commit/1a9fb64))

## [v3.9.0] - 2026-05-28

[compare changes](https://github.com/ils15/pantheon/compare/v3.8.4...v3.9.0)

### 🚀 Enhancements

- Setup changelogen + git-cliff for auto-releases ([ce4ee22](https://github.com/ils15/pantheon/commit/ce4ee22))

### 🩹 Fixes

- Add missing closing brace for github configuration in opencode.json ([a63c522](https://github.com/ils15/pantheon/commit/a63c522))
- Address PR review sync and mapping feedback ([c550049](https://github.com/ils15/pantheon/commit/c550049))
- Sync version to 3.8.4, fix versioning.mjs apply bug, add version check script ([141a6b1](https://github.com/ils15/pantheon/commit/141a6b1))
- Add CHANGELOG entry for v3.8.4 to fix CI validate failure ([58cc0f5](https://github.com/ils15/pantheon/commit/58cc0f5))
- **ci:** Auto-release cria PR com auto-merge ao invés de push direto pra main ([e4f78c9](https://github.com/ils15/pantheon/commit/e4f78c9))

### 🏡 Chore

- Cleanup commands, fix subtask agent, add Context7 tools, improve sync script ([da6ed7c](https://github.com/ils15/pantheon/commit/da6ed7c))



## [v3.9.0] - 2026-05-28

[compare changes](https://github.com/ils15/pantheon/compare/v3.8.4...v3.9.0)

### 🚀 Enhancements

- Setup changelogen + git-cliff for auto-releases ([ce4ee22](https://github.com/ils15/pantheon/commit/ce4ee22))

### 🩹 Fixes

- Add missing closing brace for github configuration in opencode.json ([a63c522](https://github.com/ils15/pantheon/commit/a63c522))
- Address PR review sync and mapping feedback ([c550049](https://github.com/ils15/pantheon/commit/c550049))
- Sync version to 3.8.4, fix versioning.mjs apply bug, add version check script ([141a6b1](https://github.com/ils15/pantheon/commit/141a6b1))
- Add CHANGELOG entry for v3.8.4 to fix CI validate failure ([58cc0f5](https://github.com/ils15/pantheon/commit/58cc0f5))
- **ci:** Auto-release cria PR com auto-merge ao invés de push direto pra main ([e4f78c9](https://github.com/ils15/pantheon/commit/e4f78c9))

### 🏡 Chore

- Cleanup commands, fix subtask agent, add Context7 tools, improve sync script ([da6ed7c](https://github.com/ils15/pantheon/commit/da6ed7c))


