---
name: git-workflow-and-versioning
description: "Atomic commits, conventional commits, trunk-based development"
---

# Git Workflow & Versioning

**Commits atômicos, mensagens claras, trunk-based.**

## Commit Style (Conventional Commits)
```
feat: add login endpoint
fix: handle null user in profile
refactor: extract auth middleware
test: add migration up/down test
docs: update README setup steps
```

## Rules
1. **Atomic commits** — um commit = uma mudança lógica. Não acumule
2. **Trunk-based** — branches curtas (< 2 dias), PRs pequenos
3. **Mensagens no imperativo** — "add" não "added" ou "adds"
4. **Commits quebram o build?** Só se for intencional (WIP)
5. **Nunca force push em branch compartilhada**

## Branch Strategy
```
main ← produção
├── feat/<descrição>  — features
├── fix/<descrição>   — bug fixes
└── refactor/<descrição> — refatorações
```
