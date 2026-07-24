# 🗺️ Pantheon Roadmap

> **Last updated:** v5.0-dev (2026-07-24)
>
> Roadmap atualizado com base em pesquisa do ecossistema awesome-opencode.
> Sem referências a concorrentes. Foco no que Pantheon já tem e no que falta.

---

## ✅ v5.0-dev — Em desenvolvimento (Julho 2026)

### Entregue desde v3.14.0

| Versão | O que foi entregue |
|--------|-------------------|
| **v3.15.0** | Memory MCP com sqlite-vec + fastembed |
| **v3.16.0** | Level 2 Context Compression, sync engine |
| **v3.17.0** | MCP Resources Server, Code Mode Server |
| **v3.18.0** | Themis review gate, routing.yml, reasoning effort |
| **v3.19.0** | Memory Persistence Protocol, ADR-006, 14 skills |

---

## 🔜 v5.0 — Próximos Sprints

### Sprint 1 ✅ — Memory Commands & Limpeza (Concluído)

| Item | Status |
|------|--------|
| `/pantheon-remember`, `/pantheon-search`, `/pantheon-consolidate`, `/pantheon-forget` | ✅ |
| Consolidar 23→14 comandos `/pantheon-*` | ✅ |
| Remover 9 comandos obsoletos | ✅ |
| `/pantheon-optimize` (archive + cache + dry-run) | ✅ |
| Deepwork archive (20→9 ativos) | ✅ |
| Sync engine, MCP servers, ROADMAP.md, research | ✅ |

### Sprint 2 — NPM + CLI Installer (3-5d)

```
@pantheon/cli (npm)
├── npx pantheon init / update / doctor / status
├── TUI interativo de setup
└── Plugin OpenCode: 14 agentes + 14 skills + 14 comandos + 3 MCPs
```

### Sprint 3 — Themis 2.0 + IntentGate (4-5d) 🚧 Já planejado

```
Layer 1 — Heuristic Scanner (zero LLM)
├── 50+ anti-patterns de IA slop
├── Hash-anchored edit verification
├── ruff + Biome + coverage delta (<2s, zero tokens)
└── Score 0-100 + blocking?

Layer 2 — Themis Review (LLM leve, ~500 tokens)
├── Só roda se Layer 1 passar
├── Confidence score por arquivo
└── Regression prediction

Layer 3 — Verification Planning
├── Pré-análise para mudanças N>5 files
└── Themis sugere + executa verificações

IntentGate: routing.yml classifica request antes de delegar (regex, zero LLM)
```

### Sprint 4 — Background Agents + Full-Auto (4-6d) 🚧 Já planejado

```
├── Background agents first-class (parallel dispatch, push notification)
├── TODO Enforcer (idle detection, retry automático)
├── Hash-anchored edits
├── /pantheon-deepwork --full-auto (modo autônomo, gates automáticos)
└── Respeitar subagent_depth: 2
```

### Sprint 5 — Pruning + Cache + Memory (3-4d) 🚧 Já planejado

```
├── Tool output pruning (relevance scoring, auto-tagging)
├── Memory importance scoring + decay (entradas velhas perdem peso)
├── memory_search reranking
├── Anti-junk filter (threshold 0.4)
└── /pantheon-optimize --cache
```

### Sprint 6 — YAGNI + Code Reuse (2-3d) 🚧 Já planejado

```
├── Escada YAGNI no Zeus (antes de cada delegação)
├── Anti-overengineering no Themis (10+ padrões)
└── Consulta ao codebase antes de implementar
```

---

## 🆕 v5.0+ — Novos Sprints (Pesquisa Community-Informed)

**Baseado em pesquisa do ecossistema awesome-opencode (9k⭐, 300+ plugins)
por 5 agentes — 2.717 linhas de análise.**

### Sprint 7 — Background Architecture (4-6d)

*Expande Sprint 4: runtime → API formal de desenvolvedor.*

```
├── Delegate/Read/List 3-Tool API
│   ├── delegate(prompt, agent?) → task_id
│   ├── delegation_read(id) → result
│   └── delegation_list() → tasks[]
├── Read-only background enforcement (edit=deny, write=deny)
├── 15-min timeout + persistence before notification
├── Compaction-aware context (experimental.session.compacting hook)
└── Auth interceptor: plugin hook para providers + multi-account rotation
```

### Sprint 8 — Community Integration (3-5d)

```
├── awesome-opencode listing
├── Plugin template repo (pantheon-org/plugin-template)
├── Publicar agentes como templates (canais comunitários)
├── Cross-orchestrator adapters
├── Skill registry leve (YAML catalog + npx pantheon install)
└── Plugin API contract documentado
```

### Sprint 9 — Dashboard UX (4-6d)

```
├── Token/cost tracking widget (footer: last + total, per-agent)
├── Agent status summary (idle/working/blocked/complete)
├── Multi-channel notifications (OS + push + webhook)
└── Accessibility mode (emoji→ASCII, reduced animation, high contrast)
```

### Sprint 10 — Memory 2.0 (5-8d)

*Expande Sprint 5: importância estática → sistema dinâmico.*

```
├── Confidence/decay system (boost no acesso, decay diário, archive <0.2)
├── Agent self-editable memory (memory_write, memory_forget tools)
├── Memory feedback tool (reforça/penaliza por score)
├── Security scanner em memory_store (detecta secrets antes de persistir)
├── Auto-deduplication (fuzzy matching + merge)
└── Cross-project memory (global namespace + TTL longo)
```

### Sprint 11 — Themis 2.5: Safety (5-7d)

*Expande Sprint 3: código → governança.*

```
├── Agent contract registry (allowed/forbidden per agent, YAML + Zod)
├── Step confirmation hooks (pause a cada N tool calls)
├── Output redaction (API keys, tokens, 74+ patterns)
└── Regression prediction from diff
```

### Sprint 12 — Multi-Model Routing (3-5d)

```
├── Tier 1 (cheap): exploração → flash/haiku
├── Tier 2 (balanced): implementação → sonnet/gpt-4o
└── Auto-select baseado na tarefa
```

### Sprint 13 — Stabilization (3-5d)

`Buffer: integração, documentação, performance, tech debt.`

---

## 🧠 Decisões de Arquitetura (v5.x)

1. **IntentGate heurístico** — Zero LLM, regex no routing.yml.
2. **Themis é o diferencial** — Gate de qualidade multi-camada.
3. **npm primeiro** — Sem adoção, não importa o quão bom é.
4. **Integrar com OpenCode, não competir** — Usar APIs nativas.
5. **subagent_depth: 2** — Zeus → Especialista, nunca sub-sub.
6. **Memory contínuo** — Confidence decay, agent-writable, auto-dedup.
7. **Background first-class** — Delegate/read/list API.
8. **Sem Rego/OPA por enquanto** — JSON/YAML + Zod é suficiente.
9. **Acessibilidade como diferencial** — Ninguém resolve isso em terminal.
10. **Sem tmux isolation** — Git worktree basta, menos complexidade.

---

## 📈 Métricas de Sucesso

| Métrica | Atual | v5.0 Target |
|---------|-------|-------------|
| **npm downloads** | 0 | 500/mo |
| **awesome-opencode listed** | ❌ | ✅ |
| **GitHub stars** | — | 500+ |
| **Community plugins** | 0 | 5+ |
| **Themis patterns** | 20 | 50+ |
| **Tests** | ~50 | 200+ |
| **Coverage** | ~60% | >80% |

---

## 🔬 Fontes da Pesquisa

### Deepwork Session: roadmap-v4-community
5 agentes, 2.717 linhas de análise:

| Agente | Relatório | Foco |
|--------|-----------|------|
| 🛸 Apollo | DISCOVERY-APOLLO.md | Mapeamento do ecossistema |
| 🏛 Hermes | DISCOVERY-HERMES.md | Backend e infraestrutura |
| 🎨 Aphrodite | DISCOVERY-APHRODITE.md | UX e frontend |
| 🌾 Demeter | DISCOVERY-DEMETER.md | Memória e dados |
| ⚖️ Themis | DISCOVERY-THEMIS.md | Segurança e governança |

### Repositórios de Referência
- [awesome-opencode/awesome-opencode](https://github.com/awesome-opencode/awesome-opencode)
- [smc2315/harness-memory](https://github.com/smc2315/harness-memory)
- [xenitV1/lemma](https://github.com/xenitV1/lemma)
- [kdcokenny/opencode-background-agents](https://github.com/kdcokenny/opencode-background-agents)

---

## Changelog

| Data | Mudança |
|------|---------|
| 2026-07-24 v6 | **Cleanup:** removidas referências a concorrentes, tabela competitiva removida. Sprints reorganizados: S6 (YAGNI) reconhecido como já planejado, S4 full-auto = modo autônomo, S5 decay já existe. Novos sprints (S7-S13) são expansões do que já existe, não features do zero. |
| 2026-07-24 v5 | Corrigido para v5.0. Revisão Themis aplicada. |
| 2026-07-24 v4 | Pesquisa comunitária. 6 novos sprints. |
| 2026-07-22 v3 | OpenCode v1.18 insights |
| 2026-07-22 v2 | Roadmap reescrito |
| 2026-06-20 | Última v3.14.0 |
