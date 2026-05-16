# ADR: DAG Wave Execution

**Date:** 2026-05-16

## Context
Execução sequencial de fases (planejar→implementar backend→implementar frontend→revisar) desperdiçava tempo ocioso de agentes. Backend e frontend não têm dependências entre si e poderiam rodar em paralelo.

## Decision
Adotar Directed Acyclic Graph (DAG) Wave Execution:

- Wave 1: demeter (schema) + apollo (research) — paralelo, sem dependências
- Wave 2: hermes (backend) + aphrodite (frontend) — paralelo, dependem do schema da Wave 1
- Wave 3: themis (review) — sequencial, depende das Waves 1 e 2
- Wave 4: prometheus (deploy) — sequencial, depende da aprovação

## Consequences
- Tempo total = caminho crítico, não soma de todas as fases
- Paralelismo total entre backend/frontend
- Complexidade adicional no rastreamento de dependências
- Themis revisa ao final de cada wave, não de cada agente
