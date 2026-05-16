# ADR: Bounded Research Framework

**Date:** 2026-05-16

## Context
Planejamento de features grandes estava levando 30+ minutos. Agentes de pesquisa (Athena, Apollo) iteravam sem limite, buscando "understanding perfeito" antes de produzir planos.

## Decision
Implementar limites rígidos para pesquisa:

- **Athena**: max 3 searches diretas + delegar para Apollo se complexo. Convergence rule: 80% understanding OR 5 min → stop
- **Apollo**: max 10 parallel searches per batch, max 5 batches. 8 min time limit
- **Output**: structured findings, NOT raw dumps

## Consequences
- Tempo de planejamento reduziu de 30+ min para ~5 min (70%+ improvement)
- Planos são incrementais (plan-review-implement-approve-plan-next)
- Risco: planos podem perder detalhes de borda → mitigado por revisão do Themis
