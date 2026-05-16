# 🏛️ Architecture

> **Pantheon** — Conductor-Delegate pattern com DAG Wave Execution.

---

## System Design

```
User Request
     │
     ▼
┌─────────┐
│  ZEUS   │  Orchestrator (premium model, no edits)
└────┬────┘
     │
     ├──► Athena (planning + council) ──► Apollo (discovery)
     │
     ├──► Hermes (backend)     ◄──┐
     ├──► Aphrodite (frontend)     │  Parallel DAG Waves
     ├──► Demeter (database)    ──┘
     │
     ├──► Hephaestus (AI pipelines)
     ├──► Chiron (model routing)
     ├──► Echo (conversational AI)
     │
     ├──► Themis (quality + security gate) ── MANDATORY review
     │
     ├──► Prometheus (infra/Docker)
     ├──► Iris (GitHub PRs/issues)
     │
     ├──► Nyx (observability)
     ├──► Argus (visual analysis)
     ├──► Gaia (remote sensing)
     │
     ├──► Talos (hotfix express)
     └──► Mnemosyne (memory/docs)
```

---

## Core Patterns

| Pattern | Description |
|---|---|
| **Conductor-Delegate** | Zeus coordena, nunca implementa. Agentes especializados executam tarefas específicas |
| **DAG Wave Execution** | Tarefas independentes rodam em paralelo (waves), ondas fluem sequencialmente conforme dependências |
| **TDD (RED → GREEN → REFACTOR)** | Todo código começa com teste falhando. Implementação mínima para passar. Refatoração segura |
| **3 Approval Gates** | Planejamento → Revisão → Commit. Nenhuma fase avança sem aprovação humana |
| **Nested Subagents** | Implementadores podem chamar Apollo para descoberta isolada (2.8+) |
| **Learning Routing Triple** | Facts → `/memories/repo/`, Patterns → `skills/`, Conventions → `.github/copilot-instructions.md` |
| **Agent Lifecycle Hooks** | PreToolUse (segurança), PostToolUse (formatação), SubagentStart/Stop (delegação) |

---

## Model Tiers

| Tier | Purpose | Cost | Agents |
|---|---|---|---|
| **fast** | Operações rápidas e baratas | Baixo | Apollo, Iris, Mnemosyne, Talos, Nyx |
| **default** | Qualidade/velocidade balanceada | Médio | Hermes, Aphrodite, Demeter, Prometheus, Hephaestus, Chiron, Echo, Gaia |
| **premium** | Raciocínio profundo, crítico | Alto | Zeus, Athena, Themis |

---

## Layer Hierarchy (Agent Stack)

```
Planning Tier (Athena)
  └── Discovery Tier (Apollo)
        └── Implementation Tier (Hermes, Aphrodite, Demeter, Hephaestus, Chiron, Echo)
              └── Quality Tier (Themis)
                    └── Infrastructure Tier (Prometheus)
                          └── Release Tier (Iris)
                                └── Memory Tier (Mnemosyne)
```

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Conductor-Delegate over flat agents** | Separa responsabilidades, conserva contexto, permite paralelismo |
| **DAG Waves over sequential phases** | Reduz tempo total ao caminho crítico (não soma de todas as fases) |
| **3-tier memory** | Facts (zero-cust), Patterns (on-demand), Conventions (sempre em contexto) |
| **TDD compulsório** | Garante >80% cobertura, evita regressão, documenta comportamento |
| **Model tiers (fast/default/premium)** | Otimiza custo sem sacrificar qualidade nas decisões críticas |
| **Plan files em platform/plans/** | Abstraindo modelos concretos dos agentes canônicos |

---

> **See also:** `_notes/` and `decisions/` for detailed ADRs.
