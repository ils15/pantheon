# 📋 Progress Log

> **Append-only.** Never edit previous entries. Add new entries at the top.  
> Format: `## [YYYY-MM-DD] — [Milestone Title]`

---

## How to add an entry

Via agent:
```
@mnemosyne Close sprint: [summary of what was delivered]
```

Or manually:
```markdown
## [YYYY-MM-DD] — [Milestone Title]

**Agents involved:** @hermes, @aphrodite, @demeter  
**Status:** ✅ Delivered

### What was done
- [Item 1]
- [Item 2]

### Key decisions made
- [Relevant decision, if any]

### Main files changed
- `path/to/file.py` — [what changed]
```

---

<!-- Project entries below this line. Most recent at the top. -->

## [2026-05-02] — Ciclo de Adaptações Cross-Platform Completo

**Agentes envolvidos:** @athena, @apollo, @hermes, @aphrodite, @demeter, , , @iris, @mnemosyne, @talos, , , , , @gaia  
**Status:** ✅ Ciclo completo (14 adaptações)

### O que foi feito

#### Alta Prioridade (5)
1. **Per-Agent Permissions** — Permissões granulares por agente no opencode.json (edit deny, bash allow/ask, task routing)
2. **DAG Wave Execution** — Modelo de execução paralela baseado em ondas DAG substituindo fases sequenciais
3. **Learning Routing Triple** — Organização de memória em 3 categorias: Facts (/memories/repo/), Patterns (skills/), Conventions (.github/copilot-instructions.md)
4. **Self-Reflection** — Bounded research framework: limites de tempo (5-8min), queries (3-10), regra de convergência (80% → parar)
5. **PR-Native Workflow** — Modo padrão de criação de PR no Iris, enforcement de Conventional Commits

#### Média Prioridade (5)
6. **Anti-Rationalization Protocol** — Gates de artefato estruturados (PLAN→IMPL→REVIEW) sem documentação desnecessária
7. **Artifact Protocol System** — Ciclo de vida PLAN/IMPL/REVIEW/DISC/ADR com persistência via Mnemosyne
8. **Agent Lifecycle Hooks Fase 1** — Segurança (PreToolUse), Formatação (PostToolUse), Logging (SessionStart)
9. **Agent Lifecycle Hooks Fase 2** — Rastreamento de delegação (SubagentStart/Stop) com handoffs interativos
10. **Copilot Agent Docs Alignment** — Roteamento GPT-5.4 mini, documentação VS Code 1.111-1.114

#### Baixa Prioridade (4)
11. **\`/assign-issue\` Workflow** — Fluxo de issue GitHub para implementação via agentes (agents/iris.agent.md)
12. **Cloud Delegation** — Execução em background para tarefas longas (agents/zeus.agent.md)
13. **Worktree Isolation** — Git worktrees para paralelismo seguro entre agentes (agents/zeus.agent.md)
14. **Plugin Marketplace Structure** — Documentação de instalação como plugin OpenCode (platform/opencode/README.md)

### Decisões principais
- Todo o ciclo de adaptações foi concluído sem quebrar funcionalidades existentes
- Alterações sempre append-only, sem modificação de lógica existente
- Memory bank atualizado com todas as 14 adaptações documentadas

### Arquivos principais alterados
- \`opencode.json\` — Configuração de permissões e agentes
- \`agents/*.agent.md\` — Todos os 16 agentes com permissões e handoffs
- \`platform/opencode/\` — Adapter, README, agentes OpenCode
- \`.github/hooks/\` — Lifecycle hooks security/format/logging/delegation
- \`instructions/\` — Standards e regras
- \`docs/memory-bank/\` — Active context e progress log

## [2026-04-03] — Copilot Agent Docs Alignment and Feature Review

**Agents involved:** GitHub Copilot
**Status:** ✅ Delivered

### What was done
- Updated custom agent frontmatter and orchestration docs to include GPT-5.4 mini alongside Claude Haiku 4.5 where lightweight routing is desired.
- Reviewed GitHub Awesome Copilot, GitHub Copilot changelog, and VS Code 1.111-1.114 release notes for agent workflow improvements.
- Added documentation notes for Chat Customizations editor usage, `/troubleshoot` with session/debug snapshots, semantic-only `#codebase` search, and nested subagent scope.

### Key decisions made
- Keep `GPT-5.4 mini` as the preferred lightweight option where Haiku was previously used for low-latency tasks.
- Document only features that are available in the current VS Code releases or clearly marked as proposed/future.

### Main files changed
- `agents/apollo.agent.md` — model list formatting and ordering
- `agents/mnemosyne.agent.md` — model list ordering
- `agents/talos.agent.md` — model list ordering
- `agents/themis.agent.md` — handoff model updated
- `agents/zeus.agent.md` — handoff model and reference notes updated
- `AGENTS.md` — added VS Code 1.111-1.114 feature adoption guidance
- `README.md` — updated model table and usage guidance

## [2026-03-15] — Agent Lifecycle Hooks Phase 2: Delegation Tracking & Interactive Handoffs

**Agents involved:** GitHub Copilot (Agent Coordination)
**Status:** ✅ Delivered

### What was done
- Implemented SubagentStart hook (`delegation-start.json`) for delegation initiation logging and interactive approval handlers
- Implemented SubagentStop hook (`delegation-stop.json`) for delegation completion tracking with success/failure logging
- Created 4 handler scripts for hook execution (validate salety, delegation tracking, logging)
- Created real-world handoff examples (6 patterns: Hermes→Themis, Aphrodite→Themis, Demeter→Themis, Prometheus→Themis, Athena→Apollo, Iris→PR actions)
- Integrated hooks into `.github/copilot-instructions.md` Agent Coordination section
- Integrated hooks context into `AGENTS.md` Zeus orchestrator documentation

### Key decisions made
- Use JSON hook configs (auto-loaded from `.github/hooks/`) for extensibility
- Log delegations to separate files: `delegations.log` (all) + `delegation-failures.log` (errors only)
- Handler scripts are pure bash + standard Unix tools, zero external dependencies
- Test suite: 5/5 tests passing (validates hook execution, JSON integrity, secret-free content)

### Main files changed
- `.github/hooks/delegation-start.json` — SubagentStart handler configuration
- `.github/hooks/delegation-stop.json` — SubagentStop handler configuration
- `.github/copilot-instructions.md` — Added Phase 2 hook documentation (30 lines)
- `AGENTS.md` — Added Agent Lifecycle Hooks section explaining delegation flow (20 lines)
- `docs/memory-bank/04-active-context.md` — Updated current focus and recent decisions

---

## [2026-03-15] — Agent Lifecycle Hooks Phase 1: Security Gates, Auto-Formatting, Session Logging

**Agents involved:** GitHub Copilot (Agent Security & Quality)
**Status:** ✅ Delivered

### What was done
- Implemented PreToolUse hook (`security.json`) with safety validation script blocking `rm -rf`, `DROP TABLE`, `TRUNCATE`
- Implemented PostToolUse hook (`format.json`) with Biome auto-formatting for all file changes
- Implemented SessionStart hook (`logging.json`) with agent session audit logging
- Created 3 handler scripts (validate tool safety, format code, log sessions)
- Integrated hooks into `.github/copilot-instructions.md` with security gates list and implementation details
- Created comprehensive test suite: 4/4 tests passing (validates hook configs are valid JSON, scripts are executable, no hardcoded secrets)

### Key decisions made
- Hook configs auto-loaded from `.github/hooks/` directory
- Audit logs written to `logs/agent-sessions/` directory
- Security gates are automatic (no user interruption for safe operations)
- Blocks only 3 destructive operations: rm-rf deletion, table drops, truncation
- Handler scripts use zero external dependencies (pure bash + standard tools)

### Main files changed
- `.github/hooks/security.json` — PreToolUse handler for tool safety validation
- `.github/hooks/format.json` — PostToolUse handler for code auto-formatting
- `.github/hooks/logging.json` — SessionStart handler for session audit logging
- `scripts/hooks/` — 3 handler executables (validate-tool-safety.sh, log-session-start.sh, format-code.sh)
- `.github/copilot-instructions.md` — Added Phase 1 hooks section with benefits and configuration details

---

## [2026-03-08] — Release And Push Verification Automation

**Agents involved:** GitHub Copilot
**Status:** ✅ Delivered

### What was done
- Updated release trigger to run on version tags using `v*` pattern.
- Added `.github/workflows/verify.yml` to validate agent frontmatter on push/PR to `main`.
- Added plugin manifest validation (`npm run plugin:validate`) to the verification workflow.

### Key decisions made
- Preserved existing release workflow logic and improved only the tag trigger compatibility.
- Kept verification checks explicit and non-interactive for CI reliability.

### Main files changed
- `.github/workflows/release.yml` — fixed tag trigger and kept release generation flow.
- `.github/workflows/verify.yml` — added new CI workflow for push/PR verification.
