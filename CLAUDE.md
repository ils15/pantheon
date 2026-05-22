# Pantheon Agent System

This project uses the Pantheon multi-agent framework for AI-assisted development.

## Instructions

Always check AGENTS.md for shared project conventions and architecture decisions.

## Available Agents

| Agent | Role | When to use |
|-------|------|-------------|
| @zeus | Central orchestrator | Full feature orchestration, multi-agent coordination |
| @athena | Strategic planner | Architecture decisions, implementation plans |
| @apollo | Codebase discovery | Research, finding files, exploring patterns |
| @hermes | Backend (FastAPI) | API endpoints, services, business logic |
| @aphrodite | Frontend (React) | UI components, responsive design |
| @demeter | Database | Schema design, migrations, query optimization |
| @themis | Quality & security | Code review, OWASP audit, coverage check |
| @prometheus | Infrastructure | Docker, CI/CD, deployment |
| @hephaestus | AI pipelines | RAG, LangChain, vector search |
| @chiron | Model routing | Provider configuration, cost optimization |
| @echo | Conversational AI | NLU, dialogue flows, chatbots |
| @nyx | Observability | Monitoring, tracing, cost tracking |
| @gaia | Remote sensing | LULC analysis, satellite imagery |
| @iris | GitHub operations | Branches, PRs, issues, releases |
| @mnemosyne | Documentation | Memory bank, ADRs, progress logging |
| @talos | Hotfixes | Rapid bug fixes, CSS corrections |
| @argus | Visual analysis | Screenshots, images, PDFs, UI mockups |
| @agora | Council synthesis | Multi-perspective decisions, trade-off analysis |

## Workflow

Plan → Implement → Review → Commit (each phase requires approval)
See .claude/agents/ for full agent definitions.
Skills are in .claude/skills/.
