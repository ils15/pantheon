---
name: spec-driven-development
description: "Define requirements via spec-first before any code — PRD, edge cases, acceptance criteria"
---

# Spec-Driven Development

**Não escreva código sem entender o problema primeiro.**

## Workflow
1. **Interview** — Extraia requisitos com perguntas iterativas (o usuário nunca sabe exatamente o que quer)
2. **PRD** — Escreva um documento de requisitos: objetivo, personas, fluxos, regras de negócio, critérios de aceitação
3. **Edge Cases** — Mapeie entradas inválidas, concorrência, falhas de API, estados vazios
4. **Technical Spec** — Decisões de arquitetura: componentes, dados, API contracts, deploy
5. **Approval** — Apresente ao usuário antes de codar. "É isso mesmo?"

## Anti-patterns
- ❌ Pular direto pra implementação
- ❌ Assumir que entendeu sem confirmar
- ❌ Spec muito detalhada (5+ páginas) — mantenha enxuta

## Output
`spec.md` no diretório raiz ou no `.pantheon/deepwork/<feature>/` — usado como input pro /plan.
