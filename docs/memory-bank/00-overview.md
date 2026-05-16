# 🗺️ Project Overview

> **Pantheon** — Framework multi-agente para VS Code Copilot/OpenCode com 17 agentes especializados.

---

## What is this project?

Pantheon é um **framework de orquestração multi-agente** para VS Code Copilot e OpenCode. Ele implementa o padrão **Conductor-Delegate** onde um orquestrador central (Zeus) coordena 16 agentes especializados em planejamento, descoberta, implementação backend/frontend/database, revisão de qualidade, infraestrutura, operações GitHub, hotfixes, pipelines de IA, roteamento de modelos, IA conversacional, observabilidade, análise visual e sensoriamento remoto.

---

## Problem it solves

Times de desenvolvimento perdem tempo com context-switching entre ferramentas, tarefas repetitivas de setup e documentação, e falta de padronização em código, testes e revisão. Pantheon automatiza o ciclo inteiro: **planejar → descobrir → implementar → revisar → implantar → documentar**, com TDD rigoroso, 3 gates de aprovação humana e >80% de cobertura de testes.

---

## Users and Stakeholders

| Role | Description |
|---|---|
| **Desenvolvedor** | Usa agentes implementadores (Hermes, Aphrodite, Demeter) para codificar com TDD |
| **Arquiteto** | Usa Athena para planejamento estratégico e análises de trade-off (Council Mode) |
| **Tech Lead / Revisor** | Usa Themis para revisão de código e auditoria de segurança |
| **DevOps** | Usa Prometheus para infraestrutura Docker e CI/CD |
| **Cientista de Dados / RS** | Usa Gaia para análise de sensoriamento remoto e LULC |
| **Tech Stack** | Usa o framework completo ou agentes individuais |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Agent Runtime** | Markdown/YAML (`.agent.md`), JSON (config), Shell (scripts) |
| **Platform** | VS Code Copilot, OpenCode, Cursor, Claude Code, Windsurf |
| **CI/CD** | GitHub Actions |
| **Models** | Multi-provedor: OpenAI, Anthropic, Google, AWS Bedrock, DeepSeek, Qwen |
| **Backend (exemplos)** | Python 3.12+ / FastAPI (implementado por Hermes) |
| **Frontend (exemplos)** | React 19 / TypeScript strict (implementado por Aphrodite) |
| **Database (exemplos)** | PostgreSQL / SQLAlchemy 2.0 / Alembic (implementado por Demeter) |

---

## Repository Structure

```
/
├── agents/              # 17 agent definitions (.agent.md)
│   └── README.md
├── skills/              # 31 reusable skill modules
├── instructions/        # 9 instruction sets (.instructions.md)
├── prompts/             # 13 prompt templates (.prompt.md)
├── platform/            # Platform adapters
│   ├── plans/           # 16+ model plan configurations
│   └── opencode/        # OpenCode-specific configs
├── docs/
│   └── memory-bank/     # Project memory bank (00-05 + _notes + _tasks + decisions)
├── .github/
│   └── copilot-instructions.md  # Repo-shared conventions
├── opencode.json        # OpenCode project config
├── AGENTS.md            # Agent architecture docs
└── README.md            # Main documentation
```

---

## Important Links

- Repo: https://github.com/ils15/pantheon (local: /home/ils15/pantheon)
- Docs: README.md (documentação principal)
- Plans: `./platform/select-plan.sh` (seleção de modelos)

---

> **For agents:** This file is informational. For current sprint state, read `04-active-context.md`.
