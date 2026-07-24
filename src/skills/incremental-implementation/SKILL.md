---
name: incremental-implementation
description: "Implement in thin vertical slices — one commit per task, testable, rollback-safe"
---

# Incremental Implementation

**Construa em fatias finas testáveis. Um commit por task.**

## Rules
1. Cada slice entrega valor testável de forma independente
2. Um commit por slice — sempre com tests passando
3. Se o slice cresceu > 50 linhas, quebre em 2
4. Rollback de um slice não quebra os anteriores

## Slice Pattern
```
Slice 1 — Schema + model (migration up/down testada)
Slice 2 — API endpoint (teste → implementação → refactor)
Slice 3 — Frontend component (mock API → UI → integração)
Slice N — Integração E2E (caminho feliz + edge cases)
```

## Anti-patterns
- ❌ Slices horizontais (backend inteiro, depois frontend inteiro)
- ❌ Commits de 500+ linhas
- ❌ Implementar sem testar antes (RED → GREEN)
