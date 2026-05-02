# Changelog

All notable changes to **Pantheon** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [3.4.0] - 2026-05-02

### Added

#### 🔒 Per-Agent Security Model
- **Granular `temperature` + `steps`** — cada um dos 16 agentes agora tem parâmetros individuais no `opencode.json`: Athena opera com precisão cirúrgica (0.1), Aphrodite com liberdade criativa (0.5), Talos executa em 3 steps (hotfix relâmpago), Zeus orquestra em 25 steps (visão completa do tabuleiro).
- **Per-agent bash permissions** — 7 agentes com superfícies de ataque drasticamente reduzidas: Zeus (task-only), Athena/Apollo/Gaia (read-only), Themis (apenas pytest/ruff/grep), Iris (apenas git/gh), Talos (apenas git add/prettier), Mnemosyne (sem bash), Nyx (apenas pip/pytest).
- **Global bash tiers** em 3 níveis: `allow` (git, npm, pytest, ruff, docker, gh), `ask` (rm, mv, cp, chmod, sudo), `deny` (rm -rf, dd, mkfs, fdisk) — zero chance de um comando destrutivo escapar.
- **Anti-Rationalization Tables** — Hermes, Aphrodite e Demeter agora reconhecem e rejeitam 6 desculpas clássicas: "pular TDD", "vou testar depois", "cobertura já está boa" — o agente simplesmente se recusa a continuar.

#### 🧩 DAG Wave Execution
- **Zeus** agora orquestra por DAG (Directed Acyclic Graph): tarefas independentes são agrupadas em waves paralelas, reduzindo o tempo total de execução ao caminho crítico mais longo.
- Wave 1: demeter-schema + apollo-research (paralelo); Wave 2: hermes-backend + aphrodite-frontend (paralelo, usando mocks); Wave 3: integração real com banco; Wave 4: themis-review; Wave 5: prometheus-deploy.
- **~50% menos tempo de execução** vs o modelo sequencial anterior — agents nunca ficam ociosos esperando.

#### 🧠 Learning Routing Triple
- Framework de organização de memória em 3 categorias que elimina duplicação: **Facts** → `/memories/repo/` (auto-carregado, custo zero), **Patterns** → `skills/` (carregado sob demanda por nome), **Conventions** → `.github/copilot-instructions.md` (sempre em contexto).
- Regra de ouro: "Se encontrar conteúdo na categoria errada, mova. Nunca duplique."

#### 🪞 Self-Reflection Quality Gate (Themis)
- Themis agora se autoavalia em 6 dimensões (1-10): Correctness, Coverage, Security, Performance, Completeness, Clarity.
- Qualquer nota <7 dispara **NEEDS_REVISION** automático — sem exceção, sem apelação.
- **Review Scope Levels** sob medida: Plan (~2min), Wave (~5min), Task (~3min), Final (~10min) — o nível certo de escrutínio para cada momento.

#### 🤖 PR-Native Output (Iris)
- Iris agora tem Pull Request como **output padrão** — `gh pr create` com Conventional Commits, corpo estruturado, e DRAFT por segurança.
- Exceção inteligente: se o usuário disser "don't create a PR", mostra o diff limpo.
- **Assign-Issue Workflow** — Iris lê uma issue do GitHub, extrai requisitos automaticamente, coordena a implementação com os agentes certos, e abre o PR.

#### 📋 Plan Format Guide (Athena)
- Template de plano padronizado: Goal → DAG Waves → Phases → **Pre-Mortem** → Test Strategy → Acceptance Criteria.
- O Pre-Mortem obriga Athena a considerar riscos _antes_ da aprovação — gargalos, dead ends, e dependências ocultas vêm à tona cedo.

#### ☁️ Cloud Delegation + Worktree Isolation (Zeus)
- **Cloud Delegation** — tarefas longas (builds pesados, testes de regressão) são delegadas para background via `npx copilot-cli` ou scripts locais.
- **Worktree Isolation** — git worktrees dedicados para cada agente paralelo, eliminando conflitos de arquivo e permitindo verdadeiro paralelismo.

#### 📦 Plugin Marketplace
- Estrutura de plugin documentada em `platform/opencode/README.md`.
- Compatível com VS Code (full), OpenCode (full), Claude Code (manual), Cursor (conversão automática).

#### 🛡️ Agent-Scoped Hooks (Themis)
- Themis agora tem `hooks: PostToolUse` no frontmatter YAML — toda edição feita pelo agente é automaticamente formatada e validada antes de ser salva.

#### 📚 Model Selection Priority Chain
- Cadeia de decisão documentada no AGENTS.md: 1) Modelo explícito na chamada → 2) Modelo configurado no YAML do agente → 3) Modelo da conversa principal.
- Regra de segurança: o modelo requisitado nunca pode exceder o cost tier do modelo da conversa principal — sem surpresas na conta.

### Changed

- **Skills** — Todos os 27 skills agora têm `context: fork` (skills >200 linhas executam em subagente isolado), `argument-hint` (descrição no slash command), `globs` para ativação contextual, e `alwaysApply: false` para carregamento inteligente.
- **Agentes** — Hermes, Aphrodite, Demeter, Prometheus e Themis agora têm referências `#tool:` no body text, deixando explícito quais ferramentas cada um usa.
- **Gaia** — Adicionado `agents: ['apollo']` + handoffs YAML completos (themis + athena) + descrição atualizada com "Calls apollo... Sends work to themis".
- **opencode.json** — `model` hardcoded removido (não fixa mais o modelo), `temperature` e `steps` agora configurados por agente individualmente.
- **Global skill corrigido** — 8 ocorrências do bug Athena→Aphrodite no `~/.config/opencode/skills/orchestration-workflow/SKILL.md` finalmente corrigidas.
- **plugin.json** — Descrição atualizada de "12 agents, 18 skills" para "16 agents, 27 skills"; lista de skills expandida com 9 novos.
- **README.md** — Badge de versão atualizado para 3.4.0.

### Fixed

- **Skill orchestration-workflow** — 7 referências trocadas Athena→Aphrodite em tarefas de frontend corrigidas no repositório.
- **AGENTS.md** — Duplicação de conteúdo consolidada; seção DAG Wave Execution mantida intacta (já era a versão correta).

## [3.3.0] - 2026-05-02

### Added

- **2 new platforms**: Cline (`platform/cline/`) and Continue.dev (`platform/continue/`) — adapters, setup guides, sync engine integration.
- **New platform guides**: `docs/platforms/cline.md` and `docs/platforms/continue.md` with full installation and configuration docs.
- **VS Code doc update**: `target`, `hooks` frontmatter fields, tool aliases section (`execute`, `read`, `edit`, `search`, `agent`, `web`, `todo`), `/create-agent` command, `.github/agents/` discovery path, `chat.agentFilesLocations` setting.
- **OpenCode doc update**: Desktop app, `/init` command, ACP server, `default_agent` config, task permissions, `mode: primary/subagent`, Claude Code compatibility mode.
- **Claude Code doc update**: 16 frontmatter fields (`disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `initialPrompt`, `color`), agent priority system, `/agents` command, skills with `context: fork`, Claude Agent SDK section.
- **Cursor doc update**: Skills system (`SKILL.md`, dynamic loading), `AGENTS.md` nested support, plugin system (`.cursor-plugin/plugin.json`), remote rule import from GitHub.
- **Windsurf doc update**: Modern `.windsurf/rules/` format with 4 trigger modes, `AGENTS.md` auto-scoping, global vs workspace rules, character limits.
- **README.md**: Comprehensive rewrite — new badges (version, built-with), platform comparison table, model plans section (`fast`/`default`/`premium` tiers), 662→827 lines.
- **Platform READMEs**: `platform/claude/README.md` expanded 30→90 lines; `platform/windsurf/README.md` updated from "Preview" to "Production Ready".
- **`mode: subagent`** added to Apollo's canonical frontmatter.

### Changed

- **Claude adapter v2.1.0**: Added `model` and `mcpServers` to frontmatter include (Claude Code now supports per-agent model + MCP config).
- **Cursor adapter v2.1.0**: Added `globs` to frontmatter include, populated toolMap with Cursor-native tool names.
- **Windsurf adapter v3.0.0**: Fixed body filter patterns — VS Code Copilot Workflow and VS Code Integration sections now properly stripped from all generated rules.
- **All doc fixes**: "12 agents" → "16 agents" across 5 files; CONTRIBUTING.md title generalized.
- **Install script**: Added `installContinue()` function for Continue.dev platform support.
- **CLAUDE.md template**: Added notes on `model`, `mcpServers`, and `mode: subagent` frontmatter support.

---

## [3.2.1] - 2026-05-02

### Changed

- **OpenCode adapter**: toolMap corrigido (`codesearch` → `grep`), `vscode/askQuestions` mapeado para `question`, formato de tools convertido para permission object (`tool: allow`).
- **Cursor adapter**: formato `.mdc` corrigido com `alwaysApply` e `globs` para compatibilidade com Agent mode.
- **Windsurf adapter**: migrado de `.windsurf/agents/` para `.windsurf/rules/` com trigger `model_decision`.

### Added

- **Skills**: instalados automaticamente em TODAS as plataformas (OpenCode, Claude, Cursor, Windsurf, VS Code).
- **Windsurf Workflows**: workflows `/orchestrate` e `/code-review` em `.windsurf/workflows/`.
- **AGENTS.md**: criado/atualizado para Cursor e Windsurf com regras do projeto.
- **Sync engine**: suporte a `toolsFormat` (permission/object) e `addFields` para plataformas que precisam de campos estáticos no frontmatter.

### Fixed

- `ensureAgentTool` removido do adapter OpenCode (não é uma tool válida).
- Permissão `skill: *: allow` adicionada no `opencode.json` instalado.
- Instruções `AGENTS.md` e `instructions/*.instructions.md` registradas no `opencode.json`.

---

## [3.2.0] - 2026-05-01

### Added

#### 🧠 **Capability Taxonomy** — deterministic cross-platform tool coverage

`scripts/sync-platforms.mjs` now ships a built-in capability taxonomy that classifies all 30 canonical tools by portability tier:

| Tier | Meaning | Examples |
|---|---|---|
| `portable` | Works on all platforms natively | `search/*`, `read/readFile`, `execute/runInTerminal` |
| `mappable` | Works when adapter declares an explicit mapping | `agent`, `vscode/askQuestions`, `search/changes` |
| `optional-accelerator` | Enhances UX; OK to exclude silently | `read/problems`, `browser/*` |
| `local-only` | VS Code IDE only; must be excluded elsewhere | `vscode/runCommand`, `execute/createAndRunTask` |

New validation gates:
- `validateAdapterCoverage` — warns when portable/mappable tools are unclassified in a non-passthrough adapter
- `validateBodyForExcludedTools` — warns when generated body text references a tool that was excluded for that platform

#### 📋 **`capabilityFlags` in all platform adapters**

Each `platform/*/adapter.json` now declares which capability classes are supported:

```json
"capabilityFlags": {
  "orchestration": true,
  "approval": false,
  "diagnostics": false,
  "browser-ui": false,
  "ide-local": false,
  "github-service": false
}
```

Platforms: OpenCode, Claude Code, Cursor, Windsurf.

#### 📦 **`scripts/install.mjs`** — multi-platform agent installer

New one-command installer that auto-detects platforms and deploys all 16 agents:

```
node scripts/install.mjs --target /path/to/project --platforms all
```

Installs 86 files across 5 platforms:
- OpenCode → `.opencode/agents/` + `opencode.json`
- Claude Code → `.claude/agents/` + `CLAUDE.md` + `settings.json` + `AGENTS.md`
- Cursor → `.cursor/rules/`
- Windsurf → `.windsurf/agents/` + `.windsurfrules`
- VS Code / Copilot → `.github/agents/`

Supports `--target`, `--platforms`, `--dry-run`, auto-detection, and full idempotency.

#### 🌉 **`template/CLAUDE.md`** — cross-platform bridge template

Template referencing `AGENTS.md` as the shared source of truth, enabling Claude Code users to adopt Pantheon alongside other platforms.

### Fixed

#### 🔧 **Platform adapter tool name mappings — critical cross-platform fix**

**Problem:** OpenCode, Claude Code, and Windsurf adapters were generating agent files with VS Code canonical tool names (`search/codebase`, `read/readFile`, `execute/runInTerminal`) that target platforms do not recognize — resulting in silent tool misconfiguration across all generated agents.

**Fix — All 3 adapters updated to v2.0:**

| Platform | Before (broken) | After (fixed) |
|---|---|---|
| **OpenCode** | `toolMap: {}` — empty passthrough | 13 mappings: `codesearch`, `read`, `edit`, `bash`, `glob`, `grep`, `list`, `webfetch`, `task` |
| **Claude Code** | `agent→Task`, `read/readFile` unmapped | `agent→Agent`, `AskUserQuestion`, `Read`, `Edit`, `Bash`, `Glob`, `Grep`, `WebFetch` |
| **Windsurf** | Stub/preview status | v2.0 with Cascade naming, full frontmatter support |

Body-level permission blocks removed from OpenCode agents (using frontmatter `permission:` instead). All 32 Claude/OpenCode agent files regenerated; Cursor and Windsurf (16 each) already aligned.

#### 🔧 **Canonical agent toolsets aligned to portable baseline**

| Agent | Change |
|---|---|
| **Athena** | Added `search/fileSearch`, `search/textSearch`, `search/listDirectory`, `read/readFile` — planner was under-tooled for codebase discovery |
| **Iris** | Added `search/changes` — needed for git-aware GitHub workflows |
| **Prometheus** | Removed `execute/createAndRunTask` — VS Code-local task runner, not portable |
| **Talos** | Removed `vscode/runCommand` — VS Code-local command, not portable |
| **Gaia** | Added `vscode/askQuestions` — allows interactive clarification as domain expert |
| **Mnemosyne** | Added `agent` — enables bounded delegation for documentation tasks |

All 64 platform files (16 agents × 4 platforms) regenerated and validated — `npm run sync:check` passes with 0 drift.

### Changed

#### 📚 **Platform documentation updated for adapter v2**

- `docs/platforms/opencode.md` — tool mapping table, install.mjs, adapter v2
- `docs/platforms/claude.md` — native Claude tool names, install.mjs
- `docs/platforms/windsurf.md` — Cascade 2.0, production status, install.mjs
- `docs/platforms/cursor.md` — install.mjs reference
- `docs/platforms/vscode.md` — install.mjs as alternative method

#### 📝 **AGENTS.md tool tables aligned to canonical reality**

- Corrected Athena, Prometheus, Talos, Iris, Gaia tool lists
- Fixed Iris: removed `mcp_github2_*` references (platform MCP, not canonical); replaced `agent/askQuestions` with `vscode/askQuestions`

### Versioning

- Aligned `package.json`, `plugin.json`, `.github/plugin/plugin.json` to `3.2.0` (was stuck at `3.0.0` while GitHub releases had reached `v3.1.1`)

---

## [v3.0.0] — April 30, 2026

### ⚠️ Breaking Changes

- **Repository renamed** from `ils15/mythic-agents` to `ils15/pantheon`
- **Project renamed** from "Mythic-Agents" to "Pantheon" everywhere
- **Root `opencode/` deprecated** — use `platform/opencode/` instead (root `opencode/` works in v3.x, removed in v4.0)
- **Plugin marketplace** changed from `ils15/mythic-agents` to `ils15/pantheon`

### Added

#### 🏛️ **Multi-Platform Architecture** — 5 platforms, 1 canonical source

Pantheon now supports **5 AI coding platforms** from a single canonical agent source:

| Platform | Format | Status |
|---|---|---|
| VS Code Copilot | `.agent.md` | ✅ Active |
| OpenCode | `.md` + opencode.json | ✅ Active |
| Claude Code | `.md` (comma-separated tools) | ✅ Active |
| Cursor | `.mdc` rules | ✅ Active |
| Windsurf | `.md` (stub) | 🧪 Preview |

**New engine:**
- `scripts/sync-platforms.mjs` — transforms canonical `agents/` into platform-specific formats
- `scripts/lib/canonical.mjs` — YAML frontmatter parser for `.agent.md` files
- `scripts/lib/transform.mjs` — adapter-based transformation pipeline
- `scripts/validate-sync.mjs` — CI drift detection
- `scripts/install.mjs` — CLI installer (`node scripts/install.mjs <platform>`)
- `scripts/release-bundle.mjs` — generates `pantheon-vX.Y.Z.tar.gz` for releases

**Platform adapters** (each in `platform/<name>/adapter.json`):
- `vscode/` — identity copy (byte-identical to canonical)
- `opencode/` — strips VS Code fields, appends permission blocks
- `claude/` — comma-separated tools, VS Code sections removed
- `cursor/` — `.mdc` rule files with stripped frontmatter
- `windsurf/` — stub adapter with tool name mapping

**Template for new platforms:**
- `platforms/_template/` — copy + edit `adapter.json` → `npm run sync`

#### 📚 **Documentation Restructured**

- `docs/PLATFORMS.md` — platform comparison, format reference, "which to pick"
- `docs/INSTALLATION.md` — consolidated install guide for all 5 platforms
- `docs/RELEASING.md` — versioning policy, release workflow, consumption paths
- `docs/INDEX.md` — rewritten as Pantheon documentation hub
- `platforms/*/README.md` — per-platform installation notes (all 5 + template)
- `template/README.md` — GitHub Template quickstart
- Badges in `README.md`: version, license, platforms (5), agents (12)

#### 🔧 **CI/CD Improvements**

- `validate-agents.yml` — matrix validation across all platforms
- `verify.yml` — validates canonical + opencode + all platform frontmatter + identity sync
- `sync-check.yml` — blocks PRs if `platforms/` is stale vs `agents/`
- `release.yml` — generates release bundle + attaches to GitHub Release
- `version-recommendation.yml` — error handling for script failures

### Changed

- `README.md` — rewritten Quick Start (references INSTALLATION.md + PLATFORMS.md)
- All workflows — `platforms/**` trigger paths added
- `plugin.json` + `.github/plugin/plugin.json` — `agents` path updated, `platforms` field added
- `package.json` — added `sync`, `sync:check`, `bundle` scripts; `js-yaml` devDependency

### Fixed

- 12 workflow issues across 5 pipelines (matrix coverage, npm installs, action versions, permissions)
- `.gitignore` — `INDEX.md` rule was ignoring `docs/INDEX.md`
- `scripts/lib/transform.mjs` — toolMap now runs before comma-separated transform

#### 🤖 **4 New Agents** (v3 expansion)

| Agent | Domain | Specialty |
|-------|--------|-----------|
| **Hephaestus** | AI tooling & pipelines | RAG, LangChain/LangGraph chains, vector stores, embeddings |
| **Chiron** | Model provider hub | Multi-model routing, AWS Bedrock, cost optimization, local inference |
| **Echo** | Conversational AI | Rasa NLU pipelines, dialogue management, intent/entity design |
| **Nyx** | Observability & monitoring | OpenTelemetry tracing, token/cost tracking, LangSmith, analytics |

Total agents: **12 → 16**

#### 📚 **9 New Skills**

| Skill | Domain | Agents |
|-------|--------|--------|
| `rag-pipelines` | AI — RAG architecture, chunking, embedding strategies | Hephaestus |
| `vector-search` | AI — Vector databases, similarity search, hybrid retrieval | Hephaestus |
| `mcp-server-development` | AI — MCP protocol, tool/resource definition | Hephaestus, Chiron, Nyx |
| `multi-model-routing` | AI — Provider abstraction, cost routing, fallback | Chiron, Hephaestus |
| `agent-observability` | Ops — OpenTelemetry, Prometheus, cost tracking | Nyx, Chiron |
| `streaming-patterns` | Ops — SSE, WebSocket, LLM token streaming | Nyx |
| `conversational-ai-design` | AI — Rasa NLU, dialogue management, stories | Echo |
| `prompt-injection-security` | Security — Jailbreak detection, guardrails, red-teaming | Themis, Echo |
| `agent-evaluation` | QA — Hallucination detection, behavioral testing | Hephaestus, Themis |

Total skills: **18 → 27**

#### 📖 **Documentation Restructured**

New documentation architecture with platform separation:

- **`README.md`** — Generic overview with architecture diagrams (mermaid), hyperlinks per platform
- **`agents/README.md`** — All 16 agents detailed with delegation matrix and selection guide
- **`skills/README.md`** — All 27 skills categorized by 8 domains
- **`docs/platforms/`** — 5 platform-specific setup guides (VS Code, OpenCode, Claude Code, Cursor, Windsurf)
- **`scripts/validate-agents.py`** — Integration validation (16 agents, 27 skills, cross-agent deps)

#### 🛠️ **8 Skills Updated with New Integrations**

| Skill | New Content |
|-------|-------------|
| `agent-coordination` | MCP discovery, LangGraph stateful workflows |
| `internet-search` | MCP search servers (Brave, Tavily, Perplexity) |
| `fastapi-async-patterns` | LangChain model interface, Bedrock runtime, MCP tool exposition |
| `security-audit` | LLM-specific: prompt injection, jailbreaking, output sanitization |
| `docker-best-practices` | GPU inference containers, agent sandboxing |
| `tdd-with-agents` | Agent-level evaluation, hallucination testing, LangSmith integration |
| `database-optimization` | LLM-assisted index suggestions, migration safety review |
| `remote-sensing-analysis` | STAC MCP servers, Earth Engine integration, automated literature review |

#### ⚡ Agent Enhancements

- **Zeus** — New handoffs for Hephaestus, Chiron, Echo, Nyx; updated parallel execution patterns
- **Gaia** — Fixed missing YAML frontmatter in remote-sensing-analysis skill

---

## [v2.9.0] — April 24, 2026

### Added

#### 🌐 **opencode Compatibility** — Multi-Platform Agent Support

Pantheon now ships agents for both **GitHub Copilot (VS Code)** and **[opencode](https://opencode.ai)**.

**New structure:**
- `vscode/agents/` — 12 `.agent.md` files (VS Code Copilot format, previously `agents/`)
- `opencode/agents/` — 12 `.md` files with opencode-native frontmatter (`mode`, `permission`, `provider/model-id`)
- `opencode/opencode.json` — config wiring shared `instructions/` and `skills/` into opencode sessions

**Shared across both platforms (unchanged):**
- `skills/` — 18 on-demand SKILL.md files (opencode discovers them natively from `.agents/skills/`)
- `instructions/` — all coding standards (loaded via `opencode.json` → `instructions` field)
- `prompts/`, `docs/memory-bank/` — unchanged

**Installation options added to README:**
- Option A: opencode (copy `opencode/` + `skills/` into project)
- Option B: VS Code Agent Plugin (unchanged)
- Option C: VS Code manual copy (previously Option B)

**opencode frontmatter mapping:**
- `user-invocable: true/false` → `mode: primary / subagent`
- `tools: [list]` → `permission: {edit, write, bash, webfetch, task}`
- `model: ['GPT-5.4 (copilot)']` → `model: openai/gpt-4o`
- `agents: [list]` → `permission.task: {"*": "deny", "agent": "allow"}`
- VS Code-only fields (`argument-hint`, `handoffs`) removed from opencode variants

### Changed

- `agents/` directory moved to `vscode/agents/` — update any manual copy scripts
- `plugin.json` + `.github/plugin/plugin.json` updated to point to `./vscode/agents`

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
  - **Demeter** → calls `apollo` to find optimization opportunities and query patterns
  - **Prometheus** → calls `apollo` to discover infrastructure patterns and deployment strategies

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
- **Demeter**: Added "**Calls apollo as nested subagent for optimization patterns**"
- **Prometheus**: Added "**Calls apollo as nested subagent for pattern discovery**"

#### Settings Configuration
- `.vscode/settings.json` — Added `chat.subagents.allowInvocationsFromSubagents: true` to enable recursive agent delegation

#### Package Metadata
- `package.json` — Updated description to include "nested subagent delegation"

#### Documentation Clarity
- `README.md` and `AGENTS.md` — Clarified that `@agent` invocations must be entered in VS Code Copilot Chat, not in `bash`/terminal shells

### Technical Details

#### Files Modified
- `agents/athena.agent.md` — Frontmatter: `agents: ['apollo']` (removed mnemosyne, themis handoffs)
- `agents/hermes.agent.md` — Frontmatter: `agents: ['apollo']` (removed mnemosyne from nested agents list)
- `agents/aphrodite.agent.md` — Frontmatter: `agents: ['apollo']` (changed from `['apollo', 'mnemosyne']`)
- `agents/demeter.agent.md` — Frontmatter: `agents: ['apollo']` (changed from `['apollo', 'mnemosyne']`)
- `agents/prometheus.agent.md` — Frontmatter: `agents: ['apollo']` (changed from `['mnemosyne']`)
- `.vscode/settings.json` — New setting: `chat.subagents.allowInvocationsFromSubagents: true`
- `package.json` — Version 2.8.1 → 2.8.2, description updated

**Rationale**: Handoffs (themis, mnemosyne) are explicitly called via `handoffs` property and should NOT appear in `agents` list. Only async helper agents (apollo) that agents can autonomously invoke belong in `agents`.

---

## [v2.8.1] — March 25, 2026

### Changed

#### Tool Namespace Standardization & Model Optimization 🔧
- **Agent Tool References** — Updated all agent YAML frontmatter to use correct VS Code Copilot tool names:
  - Replaced deprecated `agent/askQuestions` with `vscode/askQuestions` (19 total occurrences across 7 agents)
  - Refactored browser operations to use `browser/*` namespace (`browser/openBrowserPage`, `browser/navigatePage`, `browser/readPage`, `browser/screenshotPage`)
  - Cleaned up tool declarations in: Zeus, Iris, Athena, Themis, Prometheus, Aphrodite, Demeter, Apollo

- **Model Priority Update** — Optimized Claude Haiku 4.5 as primary model (first fallback):
  - `agents/apollo.agent.md` — `['Claude Haiku 4.5 (copilot)', 'Gemini 3 Flash (Preview) (copilot)']`
  - `agents/mnemosyne.agent.md` — `['Claude Haiku 4.5 (copilot)', 'GPT-5.4 mini (copilot)']`
  - `agents/talos.agent.md` — `['Claude Haiku 4.5 (copilot)', 'GPT-5.4 (copilot)']`
  
  **Rationale:** Fast models (Haiku, Gemini Flash) optimized for shallow discovery and rapid iteration; maintains fallback to GPT-5.4/Sonnet for complex reasoning.

**Files changed:** 9
- agents/aphrodite.agent.md, apollo.agent.md, athena.agent.md, iris.agent.md, prometheus.agent.md, themis.agent.md, zeus.agent.md
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
  - Use cases per agent (Hermes, Aphrodite, Demeter, Prometheus, Themis, Iris)
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

#### Quality Gate Optimization ()
- Redesigned `` (Quality & Security Gate) to run **lightweight quality checks on changed files only**:
  - Trailing whitespace detection (grep-based, BLOCKER)
  - Hard tabs in Python detection (grep-based, BLOCKER)
  - Wild imports detection (`from X import *`, MEDIUM severity)
  - Optional tool-based checks (ruff, black, isort, eslint, prettier) when installed
- Removed dependency on `git diff` — implementation agents now provide changed files list directly
- Maintains OWASP Top 10, >80% coverage, and security validation in manual review
- Updated documentation across `agents/themis.agent.md`, `AGENTS.md`, `README.md`, and `.github/copilot-instructions.md`
- Reduced  execution time to ~30 seconds for typical phases

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
  - Zeus, Athena, Hermes, Demeter, Themis, Prometheus, Iris: `GPT-5.4` primary + `Claude Opus 4.6` fallback
  - Aphrodite: `Gemini 3.1 Pro` primary + `GPT-5.4` fallback
  - Talos: `Claude Haiku 4.5` primary + `GPT-5.4` fallback
  - Gaia: `Claude Sonnet 4.6` primary + `GPT-5.4` fallback
  - Apollo and Mnemosyne unchanged by role design (fast discovery/docs focus)
- Added explicit plan-validation lane in orchestration: Athena drafts, Themis validates plan quality/risk/test strategy, Zeus executes only after approval.
- Completed browser modernization to VS Code native integrated browser tools for UI discovery/validation workflows.

#### Agent and Tooling Updates
- **`agents/aphrodite.agent.md`** — Expanded integrated browser toolkit with:
  - `openBrowserPage`, `navigatePage`, `readPage`, `clickElement`, `typeInPage`, `hoverElement`, `dragElement`, `handleDialog`, `screenshotPage`
  - clear enablement steps (`workbench.browser.enableChatTools=true` + Share with Agent)
- **`agents/themis.agent.md`** — Added integrated browser validation flow for critical UI/user-journey review evidence.
- **`agents/apollo.agent.md`** — Added integrated browser reconnaissance support for live-page evidence during discovery.

#### Documentation Synchronization
- **`AGENTS.md`** — Updated model strategy and browser-integration guidance; documented plan-validation lane.
- **`README.md`** — Updated model assignment table and changelog entries to current strategy.
- **`CONTRIBUTING.md`** — Modernized frontmatter example to model array + canonical tool naming.

#### Verification
- Instructions and skills audited for modernization compatibility; no conflicting browser-tool remnants found.

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
- **`.github/plugin/plugin.json`** — Declares the repo as an installable VS Code Agent Plugin (Claude Code spec format). Bundles all 12 agents and 19 skills into a single installable package. Users can now install Pantheon without cloning or copying files:
  ```json
  // settings.json
  { "chat.plugins.marketplaces": ["ils15/Pantheon"] }
  ```
  Then browse and install from Extensions view (`@agentPlugins` search) or via local path:
  ```json
  { "chat.plugins.paths": { "/path/to/Pantheon": true } }
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
- **`CHANGELOG.md`** — This file. Standalone changelog added to repo root. Previously the changelog existed only as a section inside `README.md`; README now links here instead of duplicating release notes.

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
- `skills/frontend-analyzer/SKILL.md` — updated to use integrated browser validation notes
- `skills/remote-sensing-analysis/SKILL.md` (full rewrite)
- `prompts/optimize-database.prompt.md`
- `agents/zeus.agent.md` — isolated Portuguese word (`"Nenhum"` → `"None"`)

### Fixed
- **`agents/gaia.agent.md`** — YAML syntax error: `model:` second entry was missing quotes, causing invalid frontmatter
- **`AGENTS.md`** — Zeus `Delegates to:` chain was missing `talos`; updated to reflect the full 9-agent delegation list

---

## [v2.3] and earlier

This file is the canonical changelog for the repository.
