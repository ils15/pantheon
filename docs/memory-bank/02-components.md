# 🧩 Components — Pantheon Agent System

> **18 agents, 48 skills, 9 instructions, 16+ plans, 5 platforms**

---

## Orchestrator Tier

| Agent | Responsibility | Model Tier | Tools |
|---|---|---|---|
| **Zeus** | Coordenação central, delegates para agentes especializados | premium | agent, askQuestions, search |
| **Athena** | Planejamento estratégico, Agora Mode, não implementa | premium | search, read, webfetch, agent |
| **Apollo** | Descoberta de codebase, 3-10 buscas paralelas, read-only | fast | search, grep, read, webfetch |

## Implementation Tier

| Agent | Responsibility | Model Tier |
|---|---|---|
| **Hermes** | Backend FastAPI/Python, TDD async | default |
| **Aphrodite** | Frontend React/TypeScript, WCAG, TDD | default |
| **Demeter** | Database SQLAlchemy/Alembic, migrações, queries | default |
| **Hephaestus** | Pipelines de IA (RAG, LangChain, vector stores) | default |
| **Chiron** | Roteamento multi-modelo, AWS Bedrock, custos | default |
| **Echo** | IA Conversacional (Rasa NLU, diálogo multi-turno) | default |

## Quality & Infrastructure Tier

| Agent | Responsibility | Model Tier |
|---|---|---|
| **Themis** | Revisão de código, OWASP, >80% cobertura | premium |
| **Nyx** | Observabilidade, OpenTelemetry, custos | fast |
| **Prometheus** | Docker, docker-compose, CI/CD | default |

## Release & Support Tier

| Agent | Responsibility | Model Tier |
|---|---|---|
| **Iris** | GitHub (PRs, issues, releases, tags) | fast |
| **Mnemosyne** | Memory bank, ADRs, fatos atômicos | fast |
| **Talos** | Hotfixes rápidos (CSS, typos, 1 file) | fast |

## Domain Specialist Tier

| Agent | Responsibility | Model Tier |
|---|---|---|
| **Argus** | Análise visual (screenshots, PDFs, diagramas) | fast |
| **Gaia** | Sensoriamento remoto (LULC, satélite, séries temporais) | default |

---

## Skills (48 modules)

Disponíveis em `~/.config/opencode/skills/` e carregadas on-demand pelo agente (48 skills ao total):

`agent-coordination`, `agent-evaluation`, `agent-observability`, `ai-slop-remover`, `api-design-patterns`, `artifact-management`, `auto-continue`, `cache-strategy`, `category-routing`, `codemap`, `code-review-checklist`, `conversational-ai-design`, `customize-opencode`, `database-migration`, `database-optimization`, `docker-best-practices`, `fastapi-async-patterns`, `file-prompts`, `frontend-analyzer`, `handoff`, `hashline-edits`, `init-deep`, `internet-search`, `interview`, `mcp-server-development`, `metis-gap-analysis`, `multi-model-routing`, `nextjs-seo-optimization`, `orchestration-workflow`, `performance-optimization`, `prompt-improver`, `prompt-injection-security`, `rag-pipelines`, `relentless-mode`, `remote-sensing-analysis`, `review-work`, `security-audit`, `security-audit-pro`, `session-goal`, `session-recovery`, `simplify`, `streaming-patterns`, `task-system`, `tdd-with-agents`, `test-architecture`, `vector-search`, `web-ui-analysis`, `wisdom-accumulation`

---

## Instructions (9 files)

- `backend-standards.instructions.md`
- `code-review-standards.instructions.md`
- `database-standards.instructions.md`
- `documentation-standards.instructions.md`
- `frontend-standards.instructions.md`
- `memory-bank-standards.instructions.md`
- `security-standards.instructions.md`
- `artifact-protocol.instructions.md`
- `.github/copilot-instructions.md`

---

## Platform Plans (16+)

`platform/plans/` inclui planos para OpenCode, GitHub Copilot (Free/Pro/Pro+/Student/Business/Enterprise), Cursor (Hobby/Pro/Ultra), Claude Code (Pro/Max 5x/Max 20x), BYOK (cheap/balanced/best).

---

> **Note:** This file is a map. For agent instructions, refer to `agents/*.agent.md`.
