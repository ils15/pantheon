# Pantheon v4.0 — Task Index

> **Data:** 2026-05-19
> **Status:** Aguardando aprovação
> **Princípio:** Zero novos agentes · 19 features · 6 novas skills · 5 novos hooks · 3 novos comandos

---

## 📁 Estrutura

```
pantheon-v4-expansion/
├── PLAN.md      ← Plano completo (conceitos, 19 features, deduplicação, impacto, riscos)
├── WAVE-1.md    ← Core Robustness (4 features + deduplicação)
├── WAVE-2.md    ← Planning & Delegation (4 features + deduplicação)
├── WAVE-3.md    ← Session & Context (3 features + deduplicação)
├── WAVE-4.md    ← Domain Skills (3 features + deduplicação)
└── WAVE-5.md    ← Infrastructure & Polish (5 features + deduplicação)
```

---

## 📊 Resumo por Wave

| Wave | Features | Skills Novas | Hooks Novos | Comandos Novos | Linhas Dedicadas | Economia Tokens |
|------|----------|--------------|-------------|----------------|------------------|-----------------|
| **Wave 1** | 4 | 3 | 4 | 1 | ~194 | -60% overhead |
| **Wave 2** | 4 | 2 | 1 | 0 | ~476 | -15-20% review time |
| **Wave 3** | 3 | 2 | 1 | 2 | — | -60-80% MB reads |
| **Wave 4** | 3 | 3 | 0 | 0 | ~531 | Skills focadas |
| **Wave 5** | 5 | 3 | 3 | 0 | — | -5-10% external calls |
| **Total** | **19** | **13** | **9** | **3** | **~1201** | **-15000/session** |

---

## 🔍 Deduplicação Total (Agora Synthesis)

### Phase 1 — Quick Wins (~776 linhas)
1. Anti-rationalization table extraída → `tdd-with-agents` (~54 linhas)
2. Artifact protocol inline → referência única (~50 linhas)
3. Empty hook boilerplate removido (~90 linhas)
4. `security-audit` removido de Hermes/Demeter (~426 linhas)
5. Copilot-free plan fix (previne cost leak)

### Phase 2 — Structural (~155 linhas)
6. Merge `performance-optimization` + `database-optimization` (~105 linhas)
7. Split `tdd-with-agents` → TDD core + agent-evaluation
8. Format/secret/import checks removidos do Themis (-15-20% review time)
9. Agent group defaults nos plan files (~50 linhas)
10. Handoff template inconsistency fix

### Phase 3 — Caching & Runtime
11. Apollo discovery cache por sessão (-30-50% discovery tokens)
12. Memory Bank read deduplication (-60-80% input tokens)
13. Context7 MCP response cache (-5-10% external calls)

---

## 🎯 Métricas Finais

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Agentes | 18 | 18 | 0 |
| Skills | ~10 | 15 (+6 novas, -1 removida) | +5 |
| Hooks | ~5 | 10 | +5 |
| Comandos | ~5 | 8 | +3 |
| Linhas duplicadas | ~776 | 0 | -100% |
| Token overhead/session | ~5000 | ~2000 | -60% |
| Token savings/session | ~15000 | ~17000 | +13% |
| **Net token impact** | — | **-15000/session** | **+50% vs original** |

---

## ✅ Checklist de Aprovação

- [ ] Plano revisado e aprovado
- [ ] Deduplicações validadas
- [ ] Wave 1 aprovada para implementação
- [ ] Wave 2 aprovada para implementação
- [ ] Wave 3 aprovada para implementação
- [ ] Wave 4 aprovada para implementação
- [ ] Wave 5 aprovada para implementação
