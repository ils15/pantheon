# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [3.19.0] - 2026-07-21

### Added
- Memory Persistence Protocol (ADR-006) — agents now have mandatory `memory_recall()` pre-work (top_k=3, skip if score<0.3) and `memory_store()` post-work (2 lines max, importance 0.4-0.9)
- Session-end auto-save script (`.pantheon/code-mode/session-end-save.py`) — exports Vector DB entries with importance ≥0.4 at session close (ChromaDB direct read + client-side filtering)
- `session_end_save` handoff in routing.yml for Mnemosyne session close trigger
- `tools.agent: true` for Apollo, Talos, and Gaia canonical agent files
- Recall Conflict Protocol (ADR-006 v1.1) — 5 rules for when recalled memory conflicts with current action (log, prefer freshness, escalate ADRs, score threshold, audit trail)
- New skills synced: `file-prompts`, `plan-architecture`, `streaming-patterns`, `token-audit`, `wisdom-accumulation`

### Changed
- All 14 agent files updated with `## 🧠 Memory Protocol` section (both canonical `/agents/` and OpenCode `.config/opencode/agents/`)
- Zeus now auto-stores `memory_store()` directly on agent return — no Mnemosyne middleman
- Steps optimization in opencode.json: zeus(25→35), aphrodite(25→30), hermes(20→25), themis(20→25), demeter(20→25), mnemosyne(10→8), iris(15→10), nyx(15→12), athena(15→12)
- README.md badges updated to v3.19.0, skills count 43→40
- 9 duplicate instructions deleted — now only skills on-demand (tdd-standards, code-quality-checks, code-review-standards, database-standards, artifact-protocol, mcp-security, memory-bank-standards, infra-standards, auto-continue-safety-gates)
- Always-loaded instructions: 19→10 files (~5.7K→~3K tokens/session, -47%)
- Agent platform copies updated across 6 platforms (Claude, Cursor, Windsurf, Continue, Cline — .clinerules)
- `routing.yml` artifact paths: `docs/memory-bank/`→`.pantheon/memory-bank/`
- 5 orphan skills linked to agents: wisdom-accumulation→zeus, plan-architecture→athena, file-prompts+streaming-patterns→hermes, token-audit→nyx
- `prompts/orchestrate-with-zeus`: fixed 3 instances of ATHENA→APHRODITE for frontend delegation
- `prompts/focus.prompt.md`: stale `/memories/session/` path → `.pantheon/memory-bank/.tmp/`
- `prompts/mirrords.prompt.md`: tool names updated to current API
- `commands/pantheon-install.md`: stale doc ref and platform count fixed
- `commands/pantheon-update.md`: example version bumped to 3.19.0
- `pyproject.toml`: removed all backend/fastapi/alembic dependencies (no longer maintained)
- `platform/forge.json`: version bumped to 3.19.0

### Fixed
- 33 dangling `docs/memory-bank/` references fixed across platform configs (`.claude/`, `.cursor/`, `.windsurf/`, `.continue/`, `.clinerules/`, `.github/`, `memories/`, `platform/`, `template/`, `.opencode/skills/`, `.tests/`)
- `.pantheon/memory-bank/.tmp/` added to `.gitignore`
- `docs/RELEASING.md` version reference — v3.8.4 → v3.19.0
- `docs/UPGRADING.md` — removed obsolete Agora migration guide, added v3.19 Memory Protocol section
- `docs/mcp-recommendations.md` — removed Exa MCP references (removed in v3.15.0)
- `docs/platforms/opencode.md` — removed stale "agora" references
- `docs/AGENT-MCP.md` — removed Exa reference
- CHANGELOG duplicate v3.9.0 entries removed
- `template/CLAUDE.md` — `agora`→`zeus` for council dispatch
- `.github/instructions/auto-continue-safety-gates`: "Agora Council"→"Council"
- `.tests/test-all.sh`: removed stale chiron.agent.md test
- Skills count reconciled across all docs: 40
- `docs/INDEX.md` skills count: 45→40

### Removed
- `alembic/` — stale DB scaffolding (never completed)
- `backend/` — stale FastAPI database engine (half-finished)
- `docs/memory-bank/` — stale duplicate (should have been purged in v3.17.0)
- `docs/TUTORIAL-PLUGIN-PT.md` — Portuguese tutorial for disabled plugin
- `plugins-disabled/` — stale pantheon-tui-plugin
- `release_notes.md` — lowercase, redundant with CHANGELOG
- 4 obsolete skills: `conversational-ai-design`, `multi-model-routing`, `prompt-improver`, `prompt-injection-security`
- `__pycache__` and `.mypy_cache` build artifacts

### Documentation
- Full documentation audit: 10+ doc files cleaned, versions reconciled, stale content purged
- Memory Persistence Protocol documented as ADR-006
- `.config/opencode/` fully synced from canonical Pantheon (14 agents + 10 instructions)

## [v3.18.0] - 2026-07-15

### Added

- No unreleased changes recorded.

## [v3.17.1] - 2026-07-14

### Added
- Inline compression triggers (C8/C9/C11): implementation agents (Hermes, Aphrodite, Demeter, Hephaestus, Prometheus) now declare `context-compression` skill and have a concise `## Inline Compression` section covering CRITICAL/HIGH subtask summaries, pre-delegation large blocks, and phase boundaries/handoffs
- `tests/test_code_mode_args.py`: TDD coverage for the new `args` parameter forwarding

### Changed
- `context-compression` SKILL.md: real C8–C11 trigger definitions added; redundant C10 noted as OpenCode-native cross-reference; L1/L3 contradiction resolved (L1 = inline compress via MCP, L2 = batch promotion at gates)
- Agent `.md` files: `context-compression` added to `skills:` frontmatter for all 5 implementation agents
- `instructions/artifact-protocol.instructions.md`: scrub documented as automatic via MCP layer

### Fixed
- `execute_code_script` now forwards CLI arguments to subprocess — `compress-inline.py` is reachable via MCP (fixes argparse code 2 error)
- Unified scrubber: 3 divergent implementations consolidated into single canonical `scripts/scrub-secrets.py`, imported by both `memory_mcp_server.py` and `compress-inline.py` via `importlib` (hyphenated filename cannot be statically imported)
- OpenAI key regex standardized across all consumers to `sk-[A-Za-z0-9\-_]{10,}`

## [v3.17.0] - 2026-07-11

### Added
- Pantheon TUI Plugin overhaul: sidebar modernization, clickable commands, dynamic Python version
- MCP Config section in TUI: list active plugins, MCP status, auto-compaction toggle
- Memory section in TUI: show memory entries count
- MCP templates for 6 platforms (Claude, Cline, Cursor, Windsurf, Continue, Copilot)
- `scripts/init-pantheon-mcp.sh` — automated MCP setup
- `docs/INSTALLATION.md` — MCP installation guide
- `docs/MIGRATION-MEMORY-BANK.md` — migration guide for memory bank to .pantheon/

### Changed
- Memory bank moved from `docs/memory-bank/` → `.pantheon/memory-bank/` (fully local, gitignored)
- `.pantheon/` is now the standard for all local/generated artifacts
- OpenCode MCP format fixed: command as array + cwd
- All platform templates updated with pantheon-code-mode MCP
- `.mcp.json` moved from root to `platform/mcp/mcp-template.json`
- Version synchronization: `versioning.mjs` now handles all manifests (package.json, plugin.json, pyproject.toml, forge.json)
- Updated 65+ source files with new .pantheon/ paths

### Fixed
- TUI plugin path in tui.json (was pointing to non-existent file)
- OpenCode MCP config format (command must be array + cwd)
- Release pipeline: version mismatch between package.json and plugin.json
- `mcp_resources_server.py` memory-bank path resolution

### Removed
- `docs/memory-bank/` from git history (fully purged via filter-repo)

## [v3.16.0] - 2026-07-10

### Added
- MCP Resources Support: pantheon://agents, skills, routing, deepwork, memory-bank
- Code Mode MCP Adapter: confined script execution from .pantheon/code-mode/
- YOLO Mode / Auto-Approve: permission tiers for trusted MCP servers
- Reasoning Effort per Agent: high / medium / low in routing.yml + 14 agent frontmatter
- Unified Memory MCP Server: 14 tools, ChromaDB + sentence-transformers, 79 tests
- Knowledge graph: memory_link + memory_traverse (BFS traversal)
- RTK-style output filters: dedup, group, truncate on memory_store
- Freshness decay (30-day half-life) + importance boost + claim verification
- Agent MCP Integration: all 14 agents with MCP Capabilities + routing.yml capabilities
- Documentation: MCP.md (238l), MEMORY.md (471l), AGENT-MCP.md (197l)

### Changed
- Skills audit: 5 orphan skills deleted, quality-gate skill created
- Platform sync: pantheon-memory added as Tier 1 MCP in install-mcp.mjs
- docs/mcp-recommendations.md expanded to 422 lines (browser MCPs, infra MCPs, 3-7 rule)

### Security
- memory_cleanup: 3-char minimum prefix guard
- memory_export: restricted to ~/.pantheon/exports/ with path traversal check
- Content size limit: 100KB max, 500 char category

### Fixed
- memory_sessions dead code (always returned empty results)
- install-mcp.mjs filename: dash → underscore
- .github/plugin/plugin.json: removed deleted streaming-patterns reference
- memory_mcp_server.py: F821 undefined name, missing except block


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v3.15.0] - 2026-06-26

### 🚀 Enhancements

- **Level 3 Vector Memory:** 5 scripts (`schema.py`, `index.py`, `query.py`, `rebuild.py`, `cli.py`) with dual indexing (FTS5 + optional sqlite-vec embeddings), 8/8 tests passing, 120 entries indexed from memory bank
- **Two-Tier Persistence Model:** Tier 1 auto-index (`quick_index()`) saves background agent results instantly into Vector Memory; Tier 2 full compression (ZZ artifact + memory bank update) only on Themis APPROVED
- **Inline quick_index():** New function in `index.py` indexes subtask_summary dicts directly (no file scanning), idempotent via content_hash, auto-tags from keywords
- **Context Compression Trigger:** Section in `zeus.agent.md` with test script `scripts/test-context-compression.sh` — validates all 5 checks (prerequisites, mocks, structure, secrets, output)
- **Background Agent Dispatch:** Pattern documented in `zeus.agent.md` and `orchestration-workflow/SKILL.md` — OpenCode v1.16.2+ background agents with auto-persist

### 🔧 Changed

- **Auto-Continue Canonical Name:** "relentless" → "auto-continue" across 43 files (skills, commands, agent files, platform copies)
- **Tools Format:** 14 agents converted from YAML array (`- tool`) to object format (`tool: true`)
- **quick_index path fix:** Scripts now add `scripts/` (parent of vector_memory package) to sys.path instead of their own directory

### 🗑️ Removed

- **Platform Skill Directories:** 211 stale skill files removed from 6 platform dirs (`.clinerules/skills/`, `.claude/skills/`, `.cursor/skills/`, `.windsurf/skills/`, `.continue/skills/`, `platform/*/`) — OpenCode v1.16.0+ discovers skills natively from `~/.config/opencode/skills/`
- **Exa MCP Server:** `exa-mcp-server` removed from `opencode.json` (redundant with OpenCode native websearch)
- **`vector_memory` config key:** Removed from both project and global `opencode.json` (not recognized by OpenCode v1.17.x)

### 🐛 Fixed

- **Import Path in Vector Memory Scripts:** `sys.path` now correctly points to parent of `vector_memory/` package, enabling both direct execution and `python -m` usage

### 📚 Documentation

- **NOTE0010:** Pantheon v3 Roadmap — 5-phase vision from FTS5 to Plugin Architecture
- **TASK-016:** Level 3 Implementation Plan — 24 tasks across 5 phases
- **01-active-context.md:** Updated with deepwork v3.15 changes and Two-Tier model
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

## [v3.14.1] - 2026-06-21

### 🗑️ Removed

- **Pantheon-Context MCP Experiment:** Removed entire `scripts/pantheon-context-mcp/` directory (server.py, scoring.py, summarizer.py, tests — 12 files, ~1,200 lines)
- **Stale Agent References:** Stripped `pantheon-context` tool references from all 14 agent files, `.mcp.json`, `opencode.json`, `ROADMAP.md`
- **Auto-Release CI:** Removed `.github/workflows/auto-release.yml` (triggered broken v3.14.0 release on every push to main)

### ✨ Enhanced

- **TUI Sidebar Plugin:** Rewrote from flat file to npm-style directory (`plugins/pantheon-tui/` with `index.tsx`, `package.json`, `dist/tui.tsx`). New features: real context usage bar (color thresholds 70%/90%), collapsible command guide (16 `/pantheon` commands), manual compress button, Python version display, collapsible agent registry

### 🔧 Fixed

- **Install Script:** `scripts/install/opencode.mjs` now correctly copies npm-style plugin directory and registers in `tui.json` (not `opencode.json` — TUI plugins use separate registration)
- **CI Release Pipeline:** Added `dry_run` input to manual release workflow, removed auto-merge from release PRs, fixed duplicate steps

## [v3.13.0] - 2026-06-20

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

[3.19.0]: https://github.com/ils15/pantheon/compare/v3.18.0...v3.19.0

