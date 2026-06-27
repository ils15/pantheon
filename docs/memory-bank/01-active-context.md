# Active Context

> Priority file — agents read first. Keep current. Stale is worse than none.

## Current Focus
v3.15.0 — Level 3 Vector Memory + Two-Tier Persistence

## What Changed (2026-06-21)
- **quality-gate skill criado** em `skills/quality-gate/SKILL.md` — skill obrigatório para agentes de implementação rodarem auto-verificação (lint, type-check, testes, build) antes de reportar conclusão a Zeus
- **Skills atualizados em 5 agentes** — quality-gate adicionado em routing.yml e .agent.md de hermes, aphrodite, demeter, hephaestus, themis
- **Deepwork Workflow documentado** em `AGENTS.md` — estrutura `.pantheon/deepwork/`, gatilhos de qualidade, anti-stall, padrão Apollo Discovery

## Key Decisions
- Agentes implementadores agora se auto-verificam via quality-gate skill antes de chamar Themis
- Zeus não verifica qualidade manualmente — skill quality-gate é o pré-filtro
- Deepwork workflow documentado em AGENTS.md (não em docs/ separado para maior visibilidade)

## Next
- quality-gate skill, deepwork workflow ✅ (v3.14.0)
- Considerar Apollo write permission restrita a `.pantheon/deepwork/*/DISCOVERY.md`
- Consider vector memory (Level 3) when LLM providers support dynamic-prefix caching

## Blockers
None

## What Changed (2026-06-26) — Deepwork v3.15
- **Stream A: Exa Cleanup** — `exa-mcp-server` removido de `opencode.json` (redundante com Exa nativo do OpenCode). `apollo.agent.md` atualizado para usar `websearch` nativo.
- **Stream B: Context Compressor Trigger** — Seção "Context Compression Trigger" adicionada ao `zeus.agent.md`. Script de teste `scripts/test-context-compression.sh` criado e validado.
- **Naming Fix** — "relentless mode" renomeado para "auto-continue" em 43 arquivos (skills, commands, agent files, platform copies). Único termo padronizado.
- **Roadmap NOTE0010** — Documento de visão de longo prazo com 5 fases: do básico ao plugin architecture.
- **Level 3 Vector Memory Phase 1** — Core infra implementada: `scripts/vector_memory/schema.py` (FTS5 + sqlite-vec híbrido), `index.py` (indexação dupla com idempotência + quick_index()), `query.py` (fallback chain: vector KNN → FTS5 BM25 → grep), `test_memory.py` (8 testes passando).
- **Two-Tier Persistence Model** — Auto-index (Tier 1) para resultados de background agents via `quick_index()`, compressão completa (Tier 2) só no Themis APPROVED. Documentado em `zeus.agent.md`, `context-compression/SKILL.md`, `orchestration-workflow/SKILL.md`.

## Key Decisions
- "auto-continue" é o nome canônico — "relentless" removido completamente
- Level 3 usa arquitetura híbrida: sqlite-vec (semântico) como primário, FTS5 (keyword) como fallback sempre disponível
- TASK-016 documenta o plano completo de implementação do Level 3 (5 fases, 24 tasks)
- Two-Tier: background agents sempre persistem no Vector Memory (Tier 1), compressão completa só com Themis APPROVED (Tier 2)
- quick_index() registra subtask_summary inline sem escanear arquivos — idempotente por content_hash

## Next
- ✅ v3.15.0 released — Level 3 Vector Memory + Two-Tier Persistence + Background Agents
- 🔜 Level 3 Phase 4: Plugin V2 API — aguardar Plugin V2 API estabilizar (NOTE0010)
- 🔜 TUI Plugin: rebuild para OpenCode v1.17.x (incompatibilidade @opentui/core 0.2.x vs >=0.3.4)
- Level 3 Phase 4: Auto-tagging + rebuild
