# Progress Log

> Append-only. Never edit previous entries.

## [2026-06-02] — VS Code + GitHub Extension + Commands Sync

**Status:** ✅ Delivered (continuation)
- **Commands sync**: All 14 commands deployed to `VSCODE_USER_PROMPTS_FOLDER` as `pantheon-*.prompt.md`
- **11 workflow prompts** also synced (`debug-issue`, `focus`, `implement-feature`, etc.)
- **`docs/platforms/vscode.md`** — Added complete "Pantheon Commands Reference" section
- **Sync fix**: Created missing `pantheon-subtask` and `pantheon-token-audit` prompts manually

## [2026-06-02] — Global Installation: Skills + Project Cleanup

**Status:** ✅ Delivered
- **40 skills installed globally** — `~/.copilot/skills/` via `sync-platform.sh copilot --global`
- **`sync-platform.sh` updated** — Step 1.5 syncs `skills/*/SKILL.md` → `~/.copilot/skills/` when `--global`
- **Project-level agents removed** — `.github/agents/` deleted; global-only now
- **`platform/copilot/adapter.json`** — `deploySkills: true` added
- **`01-active-context.md`** — Updated with all changes

## [2026-06-02] — Universal Command Installation (All 7 Platforms)

**Status:** ✅ Delivered — Commit `87e845e`
- **`sync-platform.sh` versioned** — Removed from `.gitignore`, now in git
- **`deployCommands: true`** — All 7 platforms (copilot, cursor, continue, cline, claude, opencode, windsurf)
- **Copilot adapter** — Fixed inconsistency (`false` → `true`)
- **Cursor** — Commands sync to `.cursor/commands/*.md`
- **Continue** — Commands sync to `.continue/commands/*.md`
- **Cline** — Commands sync to `.clinerules/commands/*.md`
- **Iris agent** — Enhanced with GitHub Pull Requests Extension tools
- **`.vscode/`** — MCP servers, extensions, GitHub PR settings
- **`.gitignore`** — Added `sync-platform.sh`, `*.agent.md`, platform artifacts
- **`docs/platforms/vscode.md`** — GitHub Extension + Commands Reference

## [2026-06-02] — VS Code + GitHub Extension Integration

**Status:** ✅ Delivered
- **`.github/agents/` populated** — All 18 agent `.agent.md` files synced for VS Code auto-discovery
- **`.vscode/extensions.json` created** — Recommends GitHub Pull Requests, GitHub Actions, Copilot extensions
- **`.vscode/settings.json` enhanced** — Added `chat.agentFilesLocations`, `codeGeneration.instructions`, `githubPullRequests.*` config
- **`.vscode/mcp.json` enhanced** — Added GitHub MCP server + internet-search MCP
- **Iris agent enhanced** — Both canonical and `.github/agents/` versions updated with GitHub Extension tools, skills, and VS Code commands integration
- **`sync-platform.sh` updated** — Copilot sync now deploys agents to `.github/agents/`
- **`platform/copilot/adapter.json`** — Added `deployAgents` and `agentsOutputDir` fields
- **`docs/platforms/vscode.md`** — New GitHub Extension Integration section with full configuration guide

## [2026-05-22] — Multi-Platform Coverage: Instructions + Claude Commands + Copilot Prompts

**Status:** ✅ Delivered
- **Phase 1 — Docs**: Fixed copilot-instructions.md hooks section (removed "auto-loaded" fiction); `.github/hooks/README.md` platform support matrix added; `hephaestus.agent.md` steps 25→20
- **Phase 2 — Instructions auto-discovery**: `deployInstructions()` added to sync-platforms.mjs; `platform/copilot/adapter.json` created with `skipAgentSync: true`; 9 `*.instructions.md` files now deployed to `.github/instructions/` (VS Code Copilot ≥1.99 auto-discovers)
- **Phase 3 — Claude Code commands**: `platform/claude/adapter.json` updated with `deployCommands: true`; `sync-claude.sh` extended with Step 2.5; 15 commands now in `.claude/commands/`
- **Phase 4 — Copilot prompts**: `sync-copilot.sh` created — deploys instructions + converts commands to `pantheon-*.prompt.md` for `VSCODE_USER_PROMPTS_FOLDER`
- **Phase 5 — Package**: `npm run sync:copilot` added; `sync:all` updated; `docs/INSTALLATION.md` sync scripts table added
- `scripts/validate-routing.mjs`: 136 checks PASSED
- `codeGeneration.instructions` (deprecated) NOT added to settings.json — `.github/instructions/` auto-discovery is the correct path

## [2026-05-20] — v3.6.0 Token Optimization

**Status:** ✅ Delivered
- AGENTS.md: 1455 → 59 lines (-96%)
- Memory bank: `decisions/` merged into `_notes/`, 4 ADRs numbered
- `_tasks/pantheon-v4-expansion/` deleted (1919 lines obsolete)
- `.tmp/` cleaned (8 old artifacts)
- Skills: 48 → 42 (5 merges, 4 deletes, 1 new: memory-bank-rules)
- Agent descriptions: ~47 chars each (-41%)
- Commands: templates shortened 60-77%
- `/pantheon`: max 3 agents (was 3-5)
- `/token-audit` command added
- `optimize-context.sh` script added
- copilot-instructions.md: 189 → 128 lines
- 211 cross-platform references updated
- **Auto-loaded baseline: ~27K → ~748 tokens (-97%)**

## [2026-05-19] — v3.5.0 Commands & Skills

**Status:** ✅ Delivered
- 16 new skills, 4 new commands
- Commands shortened 86% (30-65 → 5-6 lines)
- auto-continue/relentless-mode → opt-in
- 85 files changed, 224 insertions, 1991 deletions

## [2026-05-02] — Cross-Platform Adaptation Cycle

**Status:** ✅ Delivered
- Per-agent permissions, DAG waves, learning routing triple
- Self-reflection bounded research, PR-native workflow
- 14 platform adaptations completed

## [2026-04-03] — Copilot Agent Docs Alignment

**Status:** ✅ Delivered
- GPT-5.4 mini as lightweight option
- VS Code 1.111-1.114 agent workflow docs

## [2026-03-20] — Bounded Research Framework

**Status:** ✅ Delivered
- Hard time limits (5-8 min), query limits (3-10), convergence rule (80%)
- Athena: 30+min → 5min, Apollo: 20+min → 8min

## [2026-03-15] — Agent Lifecycle Hooks Phase 1-2

**Status:** ✅ Delivered
- PreToolUse security, PostToolUse formatting, SessionStart logging
- SubagentStart/Stop hooks, delegation tracking

## [2026-05-21] — v3.7.0 Cleanup & Padronização

**Status:** ✅ Delivered
- Canonical sources enforced: `skills/` (skills), `commands/*.md` (commands), `opencode.json` (minimal config)
- Deleted: 8 orphan skills from `.opencode/skills/`, `.cursor/skills/`, `.github/skills/`
- Deleted: `commands/commands.json` (redundant), `.github/agents/` (outdated)
- Generated: 14 command `.md` files with YAML frontmatter for OpenCode auto-discovery
- Removed: `command` section from `opencode.json` (commands live in `.opencode/commands/*.md`)
- Fixed: 48 `#runSubagent Explore` → `@apollo` across agents, instructions, prompts
- Unified continuation: `cancel-relentless` → alias for `stop-continuation --relentless`
- Fixed: auto-continue skill "3 gates" → "4 gates" (was missing GATE 0), activation text
- Fixed: "Todo-Continuation" → "Auto-Continue" in 5 platform relentless-mode files
- Removed: dead code in `install.mjs` (lines 607-611 command merge block)
- Synced: `npm run sync` — 6 platforms, 22 files regenerated

## 2026-05-21 — Phases 0-4 Routing Refactor

**Completed:**
- Created `routing.yml` (1302 lines) — canonical routing source with 18 agents, 35 delegation rules, 27 handoffs
- Stripped VS Code/Copilot sections from all 11 dirty canonical agents
- Cleaned stale bodyFilters from all 6 platform adapters
- Enhanced sync engine with routing.yml parsing and auto-injection into zeus files
- Modularized install.mjs from 1278 → 108 lines into 7 modules under scripts/install/
- Created validate-routing.mjs (124 checks, all pass)
- Created generate-routing-docs.mjs (199 lines auto-generated)
- Added routing validation to CI pipeline
- Added `npm run validate` and `npm run docs` scripts
- Version 3.7.1 released via PR #10

**Files changed:** ~74 files, ~2500 insertions, ~500 deletions across all phases

## 2026-05-21 — Permission & Dispatch Enforcement Patch + Hooks Bridge

### Completed
- **Permission Hygiene**: All 18 agents now have explicit `edit:` permissions in both opencode.json and agent.md files
- **CLAUDE.md fix**: Added missing Argus and Agora agents
- **ROADMAP fix**: Restructured stale v3.5.0 section
- **SETUP→INSTALLATION merge**: Single source of truth for setup docs
- **Repo memory language**: Portuguese→English translation
- **Athena/Gaia descriptions**: Fixed inaccuracies
- **Agora self-consistency**: Fixed "never dispatch" contradiction, DISC template, Mnemosyne handoff
- **disable-model-invocation sync**: Consistent across opencode.json and agent.md
- **Talos boundary enforcement**: validate-talos-scope.sh PreToolUse hook
- **Formatting hooks**: Added to all 8 implementer agents
- **Dispatch validation**: Enhanced on-subagent-delegation-start/stop hooks with routing.yml validation
- **Post-condition checks**: validate-post-conditions.sh checks REVIEW artifacts
- **Hooks bridge**: opencode-hooks-plugin installed, .claude/settings.json configured, scripts adapted to Claude Code stdin JSON protocol
- **Agora permission hardening**: task restricted to mnemosyne only, task_budget lowered
- **Agora adapter fix**: Added to adapter.json modeOverrides

### Files Changed
- `opencode.json` — permissions, agora task, plugin, agent descriptions
- `agents/*.agent.md` (18 files) — edit permissions, cleaned dead hooks
- `routing.yml` — Talos pre/post conditions
- `scripts/hooks/validate-talos-scope.sh` — created/updated for stdin JSON
- `scripts/hooks/validate-post-conditions.sh` — created/updated for stdin JSON
- `scripts/hooks/on-subagent-delegation-start.sh` — enhanced with validation
- `scripts/hooks/on-subagent-delegation-stop.sh` — enhanced with reminders
- `.claude/settings.json` — new hooks definitions
- `platform/opencode/adapter.json` — agora modeOverride
- `CLAUDE.md` — added Argus + Agora
- `ROADMAP.md` — restructured v3.5.0
- `docs/INSTALLATION.md` — merged SETUP content
- `docs/SETUP.md` — redirect to INSTALLATION
- `memories/repo/conventions.md` — translated to English
- `memories/repo/stack.md` — translated to English

## [2026-05-22] — Multi-Platform Optimization & Restructuring Plan v2

**Status:** ✅ Planned and documented
- Reframed strategy from single-platform hardening to **multi-platform conformance-first** execution
- Defined canonical contract approach (`agents/*.agent.md` + `routing.yml` + adapter outputs)
- Added 30/60/90 roadmap focused on platform parity, adapter conformance tests, and CI matrix validation
- Established cross-platform release gate criteria for supported runtimes (OpenCode, Claude, Cursor, Cline, Continue, Windsurf, Copilot)
- Registered ownership model by canonical agents (Athena/Themis/Prometheus/Nyx/Mnemosyne/Zeus)
- Persisted plan in memory bank active context for future sprint execution

---

## [2026-05-22] — Agent Audit + Auto-Continue Fix + Agora Restoration

### Status: ✅ Done

### Changes Made

**1. Created `agents/agora.agent.md`** (was missing entirely)
- Agora was referenced in opencode.json, adapter.json, AGENTS.md, CLAUDE.md, athena, zeus — but the file never existed
- Created as council synthesis engine: dispatches to 3-5 specialists in parallel, synthesizes agreements/divergences/recommendation
- mode: subagent, edit: deny, bash: deny, task allowed to all specialists
- Synced to `~/.config/opencode/agents/agora.md` ✅

**2. Fixed auto-continue overreach in `agents/zeus.agent.md`**
- Root cause: AUTO-CONTINUE PATTERN had condition "User requests autonomous/batch implementation (4+ todos created)"
- Zeus creates 4+ todos for normal planning → self-activated auto-continue without user request
- Fix: Removed "4+ todos created" trigger. Auto-continue now ONLY activates when user EXPLICITLY says "relentless mode" / "run without stopping"

**3. Restored agora in `routing.yml`**
- Agent was commented out as "removed" but config files still referenced it
- Uncommented and restored agent definition with correct capabilities + delegation rules
- Restored `agora_decision` handoff in zeus handoffs section

**4. Updated `agents/zeus.agent.md` — multi-perspective routing**
- Changed from "inline task() dispatch" to "delegate to @agora"
- Fixed zeus handoffs: replaced broken self-referential "Multi-Perspective → zeus" with "Agora Council → agora"
- Added agora to zeus agents list

### Agent Audit Summary (18 agents)

| Agent | Status | Issues |
|---|---|---|
| agora | ✅ CREATED | Was missing — now live |
| zeus | ✅ FIXED | Auto-continue overreach + agora routing |
| routing.yml | ✅ FIXED | Agora restored in agents + delegation + handoffs |
| argus | ⚠️ MINOR | mode=primary, but visual-only (consider subagent) |
| talos | ⚠️ MINOR | Only 59 lines — possibly incomplete |
| hermes, themis, mnemosyne | ✅ OK | mode=subagent as intended |
| All others (14) | ✅ OK | No issues |

### oh-my-opencode-slim Council Analysis
- oh-my-opencode-slim's `@council` runs DIFFERENT MODELS in parallel (multi-model)
- Pantheon's `@agora` runs DIFFERENT AGENTS (domain specialists) in parallel (multi-specialist)
- These are complementary, not competing patterns
- Agora now works — users can `@agora <question>` for multi-specialist council synthesis
- `/pantheon` command still works for quick inline dispatch within Zeus session

---

## [2026-05-22] — Claude Code Parity + YAML Fixes + todoContinuation Config

### Problems Identified & Fixed
1. **`.claude/agents/` empty (0 files)** — `sync-platforms.mjs claude` generated to `platform/claude/agents/` but never deployed to `.claude/agents/`. Fixed by creating `sync-claude.sh` (mirrors `sync-opencode.sh`) and running it.
2. **17 agents in Claude adapter (missing agora)** — Fixed by running sync after `agora.agent.md` was created last session.
3. **`todoContinuation` not configured in opencode.json** — Added config with `autoEnable: false`, `cooldownMs: 3000`, `maxContinuations: 5`, `autoEnableThreshold: 4` (matches oh-my-opencode-slim safe defaults).
4. **YAML indentation bugs in 2 agents** — `athena.agent.md` had `web/fetch` at 4-space indent (sub-item), `iris.agent.md` had `execute/getTerminalOutput` at 4-space indent. Both caused js-yaml to parse compound strings like `"read/readFile - web/fetch"`. Fixed to consistent 2-space indent.

### What Was Created/Modified
- `sync-claude.sh` (NEW) — full sync script for Claude Code platform
- `.claude/agents/` (NEW) — 18 agents deployed for the first time
- `opencode.json` — `todoContinuation` config added
- `agents/athena.agent.md` — YAML tools indentation fixed (3→2 spaces)
- `agents/iris.agent.md` — YAML tools indentation fixed (4→2 spaces for getTerminalOutput)

### Verification
- `./sync-claude.sh` → 0 tool mapping warnings, 18 agents in `.claude/agents/`
- `./sync-opencode.sh` → 18 agents synced to `~/.config/opencode/agents/`
- All 18 agent frontmatters parse cleanly via Python yaml.safe_load

### Remaining Aphrodite Warnings (Non-blocking)
- `aphrodite` body mentions `search/changes`, `browser/readPage`, `browser/screenshotPage` in documentation text (not tool declarations)
- These are intentional: the text explains what aphrodite CAN'T do on those platforms
- Not a bug, not a blocker

---

## 2026-05-23 — v3.8.1 Released

Release: https://github.com/ils15/pantheon/releases/tag/v3.8.1
PR: https://github.com/ils15/pantheon/pull/14

### What shipped
- XDG Base Directory compliance (new `scripts/paths.py` module)
- Agora real multi-agent dispatch with timeout protection
- Step reductions for multi-agent stages (zeus 30→20, agora 20→10)
- Canonical tool name fix (agent vs task)
- THROUGHPUT_TPS dedup

### Agents involved
- @zeus — orchestration, step reduction design
- @athena — planning
- @hermes — paths.py, XDG integration
- @themis — code review
- @iris — PR #14, release v3.8.1

### 2026-06-20 — Level 2 Compression + OpenCode-Only Agent Cleanup
- Level 2 context compression implemented: priority scoring (5 deterministic dimensions), budget allocation (100-line cap), cross-references (D/E/M/C IDs), ZZ artifact format
- 14 agent `.agent.md` files stripped of non-OpenCode frontmatter (`tools:`, `handoffs:`, `agents:`, `color:`, `hidden:`, etc.)
- TUI plugin temporarily removed (plugins-disabled/, config cleaned)
- Stale references to removed agents (chiron, echo, argus, agora) cleaned from 40+ files across platforms, docs, tests
- Agent count unified to 14 everywhere
- _xref/_next_id.json created, scrub-secrets.py made executable
- Missing skill references (code-discipline, architecture-diagrams) removed

## [2026-06-20] — v3.13.0 Released

**Status:** ✅ Published
- **Level 2 Context Compression**: priority scoring engine, semantic summarization, budget allocation, cross-references, ZZ artifact format
- **OpenCode-Only Agent Cleanup**: 14 agent .agent.md files stripped of non-OpenCode frontmatter
- **Agent count unified**: 14 everywhere, stale references to chiron/echo/argus/agora removed
- **TUI Plugin**: temporarily removed to plugins-disabled/
- **CHANGELOG cleaned**: 4 duplicate v3.12.1 entries and empty v3.12.2 removed
- **105 routing checks PASSED**
- **Release**: https://github.com/ils15/pantheon/releases/tag/v3.13.0

## [2026-07-09] — July 2026 OpenCode Changelog Features (P1-P4)

**Status:** ✅ Implemented (54 tests, Themis APPROVED)

### Features Delivered

**P1 — MCP Resources Support**
- `scripts/mcp_resources_server.py` — FastMCP server exposing Pantheon data as MCP resources
- Recursos: `pantheon://agents`, `pantheon://agents/{name}`, `pantheon://skills`, `pantheon://skills/{name}`, `pantheon://routing`, `pantheon://deepwork/{slug}`, `pantheon://deepwork/{slug}/status`, `pantheon://memory-bank/{path}`
- Path traversal security: resolved path must start with `docs/memory-bank/`
- **30 testes, ruff clean**

**P2 — Code Mode MCP Adapter**
- `scripts/code_mode_server.py` — FastMCP server com `execute_code_script` tool
- Scripts confinados em `.pantheon/code-mode/`, apenas `.sh` e `.py`, timeout 30s
- Path traversal bloqueado, extensões não permitidas bloqueadas, nomes começando com `.` bloqueados
- **24 testes, ruff clean**

**P3 — YOLO Mode / Auto-Approve**
- `permission.mcp` adicionado ao `opencode.json` (pantheon-resources: allow, code-mode: ask, *: ask)
- Seção YOLO Security Boundaries documentada em `instructions/mcp-security.instructions.md`
- **Config validado, boundaries definidas**

**P4 — Reasoning Effort per Agent**
- `reasoning_effort: high|medium|low` adicionado nos 14 agentes em `routing.yml` e frontmatter `.agent.md`
- high: athena, gaia, themis | medium: zeus, hermes, aphrodite, demeter, prometheus, hephaestus | low: apollo, nyx, iris, mnemosyne, talos
- `adapter.json`, `validate-agent-frontmatter.py`, `zeus-timeout-retry.instructions.md` atualizados

### Config Changes
- `opencode.json` — MCPs simplificados: só pantheon-resources + pantheon-code-mode (context7/gh_grep/playwright removidos — bifrost cobre)
- `python` → `python3` nos comandos MCP (path fix)
- `permission.mcp` com auto-approve para servidores first-party

### Files Changed
23 files across 4 features. 54 tests passing, ruff clean, Themis APPROVED (C-001 filename mismatch fixed).

### Agents Involved
- @zeus — orchestration, council on repo split decision
- @apollo — discovery (phase 1)
- @hermes — P1+P2+P3 implementation
- @athena — P4 reasoning effort assignment
- @themis — full integration review (P1+P2+P3+P4)
- @mnemosyne — memory bank update

### Decision Log
- Monorepo mantido (council decidiu contra split OpenCode-only)
- Filename: `mcp_resources_server.py` (underscores, compatível com Python import)
- YOLO renomeado para `allow` (compatibilidade com OpenCode config)

## [2026-07-09] — Unified Memory MCP Server (v3.17.0)

**Status:** ✅ Implemented (40 tests, ruff clean)

### Descrição
Substitui o sistema split (Vector Memory + auto-index + compressão) por um único MCP server de memória usando ChromaDB + sentence-transformers + FastMCP. Tudo local, zero API cost, zero dependência externa.

### Features
- **9 MCP tools**: memory_store, memory_search, memory_recall, memory_compress, memory_expand, memory_sessions, memory_verify, memory_consolidate, memory_export
- **2 MCP resources**: pantheon://memory/status, pantheon://memory/sessions
- **Multi-strategy search**: dense vector + freshness decay (30-day half-life) + importance boost
- **Freshness decay**: exponential decay time-weighted recall (Shokunin-inspired)
- **Claim verification**: staleness check (Shokunin-inspired)
- **Range compression**: DCP-style summarization of oldest entries
- **Markdown export**: memory-bank compatible output
- **Test isolation**: _reset_test_state + _set_memory_dir for temp dir per test

### Inspirações Incorporadas
- **Shokunin** (102⭐): 9 MCP tools, freshness decay, claim verify, session management
- **DCP** (19.3K weekly): range compression, compress/expand pattern
- **Magic Context** (1.2K⭐): cross-session memory, cache-aware (conceito)
- **RTK** (69.7K⭐): output filtering philosophy, dedup/grouping/truncation patterns
- **LCM**: auto-recall, deterministic budgets (conceito)
- **ACP**: model-managed compression (87% cache hit — referência)

### Arquitetura
```
ChromaDB PersistentClient (~/.pantheon/memory/)
├── Collection: pantheon_memory
├── Embedding: all-MiniLM-L6-v2 (sentence-transformers, ~80MB, offline)
├── Filter: category, session_id, timestamp, importance, verified
└── Search: dense vector + freshness decay + importance boost
```

### Config
- `opencode.json`: pantheon-memory MCP server registrado
- `.mcp.json`: para compatibilidade com Claude
- `permission.mcp`: pantheon-memory = allow
- Storage: `~/.pantheon/memory/chroma.sqlite3` + vector index files
- Download único: ~80MB (all-MiniLM-L6-v2 model)

### Files Changed
- `scripts/memory_mcp_server.py` — NEW (972 lines)
- `tests/test_memory_mcp_server.py` — NEW (676 lines, 40 tests)
- `opencode.json` — MODIFIED (added pantheon-memory)
- `.mcp.json` — MODIFIED (added pantheon-memory)
- `tests/conftest.py` — EXISTING (reused import path)

### Custo
- RAM: ~300-400MB
- Disco: ~80MB (modelo, download único) + dados
- API: R$ 0,00 (tudo local)
- CPU: ~50ms/embedding, ~10ms/search
