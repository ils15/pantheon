# 🗺️ Pantheon Roadmap

> **Last updated:** v4.0-dev (2026-07-22)
>
> Roadmap atualizado com base em pesquisa competitiva do ecossistema
> awesome-opencode, análise do OpenCode v1.18, e decisões alinhadas com o usuário.

---

## ✅ v3.19.3 — Atual (Julho 2026)

### Entregue desde v3.14.0

| Versão | O que foi entregue |
|--------|-------------------|
| **v3.15.0** | Memory MCP com sqlite-vec + fastembed (substituiu ChromaDB, ~50MB vs ~1.4GB) |
| **v3.16.0** | Level 2 Context Compression, agent frontmatter cleanup, sync engine |
| **v3.17.0** | MCP Resources Server (pantheon:// URIs), Code Mode Server |
| **v3.18.0** | Themis formal review gate, routing.yml com handoffs, reasoning effort por agente |
| **v3.19.0** | Memory Persistence Protocol, ADR-006, doc audit, 44 skills |
| **v3.19.1-3** | Patches: sync engine fixes, opencode.json tuning |

---

## 🔜 v4.0 — Próximo Release

**Tema:** Comandos consolidados, qualidade implacável, distribuição npm, background agents.

### Sprint 1 ✅ — Memory Commands & Limpeza (Concluído)

| Item | Status |
|------|--------|
| `/pantheon-remember` — memory_store + recall interativo | ✅ |
| `/pantheon-search` — memory_search com filtros | ✅ |
| `/pantheon-consolidate` — merge de duplicatas | ✅ |
| `/pantheon-forget` — range compression | ✅ |
| Consolidar 23→14 comandos (todos `/pantheon-*`) | ✅ |
| Remover 9 comandos obsoletos | ✅ |
| `/pantheon-optimize` melhorado (archive + cache + dry-run) | ✅ |
| Deepwork archive (20→9 ativos, 7 arquivados, 4 deletados) | ✅ |
| Sync engine consertado (spawnSync import faltando) | ✅ |
| MCP servers corrigidos (FastMCP description→instructions) | ✅ |
| ROADMAP.md reescrito com análise competitiva | ✅ |
| Research awesome-opencode (OMO, OMO-slim, weisser-dev) | ✅ |
| Research OpenCode v1.18 (subagent_depth, auto-compact) | ✅ |

### Sprint 2 🔜 — NPM + CLI Installer (3-5d)

**Prioridade #1 — Adoção.** OMO (25.3k+ downloads npm) e weisser-dev provaram que npm publish é o que move adoção.

```
@pantheon/cli (npm)
├── npx pantheon init          → detecta plataforma, copia configs, setup MCPs
├── npx pantheon update        → sync latest agents/skills/commands
├── npx pantheon doctor        → valida instalação, corrige problemas
├── npx pantheon status        → versão + agentes carregados
└── TUI interativo de setup    → perguntas → config (weisser-dev style)

Plugin OpenCode oficial
├── contributes.agents → 14 agentes
├── contributes.skills → 44 skills (on-demand)
├── contributes.commands → 14 comandos /pantheon-*
└── contributes.mcpServers → memory + resources + code-mode
```

### Sprint 3 🔜 — Themis 2.0 + IntentGate (4-5d)

**Diferencial competitivo mais forte.** Nenhum concorrente tem revisão de qualidade real. Enquanto OMO e weisser competem em número de agentes, a gente compete em qualidade de entrega.

```
Layer 1 — Heuristic Scanner (zero LLM, pré-commit)
├── Anti-pattern scanner: 50+ padrões de IA slop
│   ├── Comentários óbvios ("// This function increments x")
│   ├── Boilerplate genérico, nomes placeholder
│   ├── Error handling genérico ("except: pass")
│   └── Código morto detectado por ruff (F401, F841)
│
├── Hash-anchored edit verification
│   ├── Antes: hash do arquivo
│   ├── Depois: compara hash + diff mínimo esperado
│   └── Se não mudou → edição falhou (retry)
│
├── Ruff + Biome + coverage delta → tudo 0 tokens, <2s
└── Score consolidado (0-100) → blocking? sim/não

Layer 2 — Themis Review Otimizado (LLM leve, ~500 tokens)
├── Só roda se Layer 1 passar
├── Prompt minimalista com confidence score por arquivo
└── Regression prediction (diff analysis)

Layer 3 — Verification Planning (pré-mudança)
├── Antes de mudanças complexas (N>5 files)
├── Themis sugere: "Para mudar X, preciso verificar Y"
└── Executa verificações automaticamente

IntentGate Heurístico (zero LLM)
├── routing.yml: classifica request antes de delegar
├── "bug|error|crash" → FIX
├── "how|what|compare" → RESEARCH/INVESTIGATE
├── "plan|architecture" → PLAN
├── "implement|create|add" → IMPLEMENT
└── fallback → IMPLEMENT
```

### Sprint 4 🔜 — Background Agents + Qualidade (4-6d)

**Nota:** OpenCode v1.18.2 (Jul 2026) introduziu `subagent_depth` — subagentes não lançam subagentes aninhados por padrão. Pantheon deve respeitar `subagent_depth: 2` (Zeus → Hermes, mas Hermes não → sub-sub-agent).

```
├── Background agents first-class
│   ├── Paralelo real: dispatch 5+ agents simultaneamente
│   ├── Scheduler nativo do OpenCode v1.16.2+
│   ├── Respeitar subagent_depth: 2 (OpenCode v1.18.2)
│   └── Sem polling — push notification
│
├── TODO Enforcer
│   ├── Se agente ficar ocioso >N turns → força continuar
│   ├── Não para até tarefa completar
│   └── Idle detection + retry automático
│
├── Hash-anchored edits (validação de edição)
│
└── /pantheon-deepwork --full-auto
    ├── Modo autônomo: assume aprovado em gates
    └── Equivalente ao "ultrawork" do OMO
```

### Sprint 5 🔜 — Pruning + Cache + Memory (3-4d)

**Nota:** OpenCode v1.18 tem `auto-compact` nativo — compressão automática de histórico quando bate no limite de contexto. Pantheon deve integrar com isso, não duplicar.

```
├── Tool Output Pruning (Level 2 Compression v2)
│   ├── Poda outputs obsoletos do histórico (>5 turns)
│   ├── Relevance scoring por idade/tamanho/tipo
│   ├── Auto-tagging de relevância
│   └── Integrar com auto-compact do OpenCode (não recompactar)
│
├── Memory recall tuning
│   ├── Importance scoring (0.0-1.0) por entrada
│   ├── Anti-junk filter aprimorado
│   └── memory_search com reranking
│
└── /pantheon-optimize --cache
    ├── Script memory-cache.py
    ├── Lê memory-bank flat files → memory_store() no MCP
    └── Archive opcional dos originais
```

### Contínuo — Memory & Qualidade (sem sprint dedicado)

Melhorias incrementais na memory ao longo de todos os sprints:

| Item | Quando |
|------|--------|
| Memory recall tuning (top_k dinâmico, score threshold) | Contínuo |
| memory_search reranking (cross-encoder leve) | Sprint 5 |
| Importância decay (entradas velhas perdem peso) | Sprint 5 |
| memory_consolidate automático semanal | Pós-v4.0 |

---

## 📊 Comparação Competitiva

| Feature | Pantheon v4.0 | Oh My OpenCode | weisser-dev | OMO-slim |
|---------|---------------|----------------|-------------|----------|
| **Plataformas** | 7 | 2 | 1 | 1 |
| **Agentes** | 14 | 11 | 108 | 7 |
| **Skills** | 44 | ~8 | 15 | 8 |
| **TDD enforcement** | ✅ | ❌ | ❌ | ❌ |
| **Themis review gate** | ✅ | ❌ | ❌ | ❌ |
| **npm publish** | 🔜 Sprint 2 | ✅ | ✅ | ✅ |
| **Memory MCP** | ✅ | básico | ❌ | ❌ |
| **Background agents** | 🔜 Sprint 4 | ✅ | ❌ | ✅ |
| **AI Slop detection** | 🔜 Sprint 3 | comment checker | ❌ | ❌ |
| **Multi-model** | ❌ (deliberado) | council | ❌ | council |
| **subagent_depth limit** | 🔜 Sprint 4 | configurável | ❌ | configurável |
| **Auto-compact nativo** | integração 🔜 S5 | nativo OpenCode | nativo | nativo |

---

## 🧠 Decisões de Arquitetura (v4.0)

1. **Sem multi-model council** — Custo alto, benefício nicho. Foco em qualidade (Themis 2.0) em vez de quantidade de modelos.
2. **Sem "ultrawork" keyword** — `/pantheon-deepwork --full-auto` já cobre o caso de uso sem criar jargão novo.
3. **IntentGate heurístico** — Zero LLM, zero latência. Regex no routing.yml em vez de chamada de modelo. OMO gasta tokens pra classificar; a gente não.
4. **Themis 2.0 é o diferencial real** — Nenhum concorrente tem gate de qualidade. Enquanto eles competem em número de agentes, a gente compete em qualidade de entrega.
5. **npm primeiro** — Sem adoção, não importa o quão bom é o produto.
6. **Integrar com OpenCode, não competir** — OpenCode v1.18 já tem auto-compact, subagent_depth, background dispatch. A gente usa e estende, não recria.
7. **subagent_depth: 2** — Zeus → Especialista, nunca Especialista → sub-sub. Respeita limite do OpenCode v1.18.2.
8. **Memory improvements contínuos** — Memory não é sprint único, é melhoria contínua.

---

## 🔬 Referências da Pesquisa

| Fonte | Insights |
|-------|----------|
| [awesome-opencode/awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) | Lista curada central do ecossistema |
| [weisser-dev/awesome-opencode](https://github.com/weisser-dev/awesome-opencode) | 108 agentes, CLI interativo, Docker sandbox |
| [opensoft/oh-my-opencode](https://github.com/opensoft/oh-my-opencode) | Sisyphus orchestrator, background agents, LSP |
| [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) | 7 agentes, council, verification-planning skill |
| [code-yeongyu/oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | 11 agentes, 54 hooks, ultrawork, IntentGate |
| [OpenCode v1.18 Changelog](https://opencode.ai/changelog) | subagent_depth, auto-compact, Desktop v2 |
| [OpenCode Context Management](https://deepwiki.com/sst/opencode/2.4-context-management-and-compaction) | Auto-compact, overflow detection, tool output pruning |

---

## Como Contribuir

### Prioridades definidas por:

1. **Issues** com label `roadmap`
2. **Votação** nas issues existentes
3. **PRs** com a mudança desejada

### Release cadence

| Tipo | Frequência | Exemplo |
|------|-----------|---------|
| Major | A cada 3-6 meses | v4.0.0 |
| Minor | 1-2 meses | v4.1.0 |
| Patch | Imediato para fixes críticos | v4.0.1 |

---

## Changelog do Roadmap

| Data | Mudança |
|------|---------|
| 2026-07-22 v2 | Adicionado: OpenCode v1.18 insights (subagent_depth, auto-compact), memory improvements contínuos, referências da pesquisa, decisão de arquitetura #6-8 |
| 2026-07-22 v1 | Roadmap reescrito para v4.0 com 4 sprints, análise competitiva |
| 2026-06-20 | Última atualização v3.14.0 |
