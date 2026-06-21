# Active Context

> Priority file — agents read first. Keep current. Stale is worse than none.

## Current Focus
v3.14.0 — quality-gate skill, deepwork workflow

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
