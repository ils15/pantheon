# ADR: Learning Routing Triple

**Date:** 2026-05-16

## Context
O framework misturava fatos imutáveis (stack, comandos), patterns reutilizáveis (procedimentos multi-passo) e convenções de projeto (naming, estilo) no mesmo bucket, causando duplicação e inconsistência.

## Decision
Separar em 3 categorias com políticas de carregamento distintas:

| Category | Storage | Auto-loaded? |
|---|---|---|
| **Facts** | `/memories/repo/` | ✅ Yes (zero token cost) |
| **Patterns** | `skills/` | ❌ No (loaded on-demand) |
| **Conventions** | `.github/copilot-instructions.md` | ✅ Yes |

## Consequences
- Facts nunca mudam e são carregados automaticamente
- Patterns são carregados sob demanda por nome (skill tool)
- Conventions são compartilhadas com todo o time via repo
- Regra: se algo pertence a outra categoria, mover — não duplicar
