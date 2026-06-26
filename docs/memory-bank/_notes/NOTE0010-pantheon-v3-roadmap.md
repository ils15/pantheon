# NOTE0010 — Pantheon v3 Roadmap

**Status:** Active
**Date:** 2026-06-26
**Author:** Zeus (via deepwork pantheon-v3.15)

---

## Vision

Pantheon evolves from a static agent configuration into a **living agent ecosystem** with:
1. **Reliable context management** — automatic, tested compression pipeline
2. **Persistent semantic memory** — agents recall past decisions without re-reading files
3. **Plugin architecture** — core subsystems packaged as reusable OpenCode plugins
4. **Lightweight dependencies** — FTS5 over vector DBs, zero external API costs

---

## Current State (v3.15)

| System | Status | Notes |
|--------|--------|-------|
| Agent framework | ✅ Mature | 14 agents, routing.yml, skills |
| Memory Bank (Level 0) | ✅ Active | docs/memory-bank/ with ADRs, tasks, progress log |
| Context Compression (Level 2) | ✅ Active | Trigger in zeus.agent.md, test script validated |
| Vector Memory (Level 3) | ✅ Phase 1-4 Complete | Hybrid FTS5 + sqlite-vec, 6 scripts, 8 tests |
| MCP Configuration | ✅ Clean | Exa removido, 3 MCP servers (context7, gh_grep, playwright) |
| OpenCode Integration | ✅ Synced | Native websearch, background agents, skill discovery |
| Auto-Continue | ✅ Standardized | "relentless" removido, nome único em 43 arquivos |
| Agent Pre-Action Hooks | ✅ Added | Todos 6 agents com @mnemosyne Recall |

---

## Completed in Deepwork v3.15

### Stream A — Exa Cleanup ✅
- Exa MCP removido de `opencode.json`
- `apollo.agent.md` atualizado para usar websearch nativo do OpenCode

### Stream B — Context Compressor ✅
- Trigger explícito em `zeus.agent.md` (quando Themis APPROVED → compress_context)
- `scripts/test-context-compression.sh` criado e validado (5/5 checks)
- Pipeline Level 2 agora é testável e documentado

### Naming Fix — relentless → auto-continue ✅
- 43 arquivos atualizados (skills, commands, agent files, platform copies)
- Único termo canônico: **auto-continue**
- Commands `/cancel --relentless` removido

### Level 3 Phase 1 — Core Infrastructure ✅
- `scripts/vector_memory/schema.py` — DB schema: FTS5 + vec0 tables, triggers, graceful degradation
- `scripts/vector_memory/index.py` — Dual indexing: content_hash idempotency, FTS5 always + optional embeddings
- `scripts/vector_memory/query.py` — Fallback chain: vector KNN → FTS5 BM25 → flat grep
- `scripts/vector_memory/test_memory.py` — 8 testes (schema, idempotência, recall, filtros, fallback)
- `scripts/vector_memory/requirements.txt` — sqlite-vec, sentence-transformers

### Level 3 Phase 2 — Mnemosyne Integration ✅
- `@mnemosyne Recall` command handler documentado em `mnemosyne.agent.md`
- `compress_context` handoff → auto-index via `index_all()`
- `Close sprint` → final batch index
- routing.yml `compress_context` handoff verificado e funcional

### Level 3 Phase 3 — Agent Pre-Action Hooks ✅
- `zeus.agent.md` — pre-planning recall
- `hermes.agent.md` — pre-implementation recall
- `aphrodite.agent.md` — pre-implementation recall
- `demeter.agent.md` — pre-migration recall
- `themis.agent.md` — pre-review recall
- `athena.agent.md` — pre-planning recall

### Level 3 Phase 4 — Rebuild, CLI, Auto-Tagging ✅
- `scripts/vector_memory/rebuild.py` — full re-index from scratch
- `scripts/vector_memory/cli.py` — CLI: index, rebuild, query, status
- `index.py` auto-tagging melhorado: +5 keyword categories, @agent extraction, reference ID extraction
- `opencode.json` — vector_memory config block adicionado

### MCP Frontmatter Cleanup ✅
- `AGENTS.md` atualizado — MCP servers são globais via opencode.json, não per-agent

---

## Phase 2 — OpenCode v1.17+ Integration (Next Sprint)

Novos recursos do OpenCode v1.17.x que o Pantheon deve adotar:

### Background Agents (v1.16.2+)
- [ ] Zeus dispara Apollo/Hermes/Themis em background sem polling
- [ ] Progresso via push em vez de "are you done yet?"
- [ ] Permite orquestração paralela real sem bloqueio

### Skill Discovery Nativo (v1.16.0)
- [ ] OpenCode já descobre skills de `skills/` — confirmar funcionamento
- [ ] Se funcionar: remover plataformas duplicadas (`.claude/skills/`, `.cursor/skills/` etc)
- [ ] Simplificar manutenção: skills só na fonte canônica

### Session Snapshots (v1.17.11)
- [ ] Avaliar uso para checkpoints do deepwork
- [ ] Possível substituir `.pantheon/deepwork/<slug>/` por snapshots nativos

### Plugin V2 API Monitoring (v1.17.10)
- [ ] Acompanhar maturação da Plugin API V2
- [ ] Quando estável: criar `@pantheon/context` plugin
- [ ] Quando estável: criar `@pantheon/memory` plugin

---

## Phase 3 — Memory Enhancement

### Auto-Trigger Context Compression
- [ ] Monitor de saúde de contexto (tamanho do contexto ativo)
- [ ] Auto-trigger compressão quando > threshold (ex: 200 linhas)
- [ ] Threshold por modelo (inspirado no Issue #11314)

### Auto-Delegation for Scale
- [ ] Apollo spawns child instances para investigações grandes
- [ ] Entity model: Project→Module→File→Symbol

---

## Phase 4 — Plugin Architecture (Strategic)

- [ ] Package memory system (Level 3) as `@pantheon/memory` plugin
- [ ] Package observability (Nyx) as `@pantheon/observability` plugin
- [ ] Package quality gate (Themis) as `@pantheon/quality-gate` skill/plugin

**Trigger:** Plugin V2 API estável + demanda de comunidade

---

## Decision Log

| Decision | Chosen | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Memory retrieval | Hybrid: FTS5 + sqlite-vec | Pure vectors, pure FTS5 | FTS5 sem ML deps, vectors quando disponível |
| Compression trigger | Explicit (Themis APPROVED) + auto-threshold | Auto-only, manual-only | Híbrido: explícito pra confiabilidade, auto pra safety net |
| Plugin packaging | Strategic (Phase 4) | Immediate | Plugin API V2 ainda maturando (v1.17.10) |
| Auto-continue naming | "auto-continue" apenas | "relentless mode" | Nome único, sem confusão |
| Plugin Pantheon Context? | **Não agora** | Sim | OpenCode já cobre 90% via nativo; plugin quando API V2 estável |

## References

- `docs/memory-bank/_notes/NOTE0009-level3-vector-memory-design.md` — Level 3 design
- `.pantheon/deepwork/pantheon-v3.15/DISCOVERY.md` — full discovery findings
- `.pantheon/deepwork/pantheon-v3.15/PLAN.md` — deepwork plan
- `.pantheon/deepwork/pantheon-v3.15/STATUS.md` — deepwork status
- `skills/context-compression/SKILL.md` — Level 2 compression design
- `scripts/vector_memory/` — Level 3 implementation (6 files)
- https://github.com/chriswritescode-dev/opencode-memory
- https://github.com/plutarch01/opencode-lcm
- https://github.com/DasDigitaleMomentum/opencode-processing-skills
- https://opencode.ai/docs/plugins/
- OpenCode Changelog v1.17.0 → v1.17.11 (June 2026)
