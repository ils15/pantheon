# Pantheon Agent System

This project uses the Pantheon multi-agent framework with 17 specialized agents.

## Available Agents

| Agent | Role | Invocation |
|-------|------|------------|
| @zeus | Central orchestrator | Coordinates all agents |
| @athena | Strategic planner | Creates TDD-driven plans |
| @apollo | Codebase discovery | Parallel research |
| @hermes | Backend (FastAPI) | API implementation |
| @aphrodite | Frontend (React) | UI components |
| @demeter | Database | Schema & optimization |
| @themis | Quality & security | Code review |
| @prometheus | Infrastructure | Docker & deployment |
| @hephaestus | AI pipelines | RAG & LangChain |
| @chiron | Model routing | Provider hub |
| @echo | Conversational AI | NLU & dialogue |
| @nyx | Observability | Tracing & monitoring |
| @gaia | Remote sensing | LULC analysis |
| @iris | GitHub operations | PRs & releases |
| @mnemosyne | Documentation | Memory bank |
| @talos | Hotfixes | Rapid repairs |

## Commands

- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Conventions

- TDD: Write failing test first, then implement
- Coverage minimum: 80%
- Async/await on all I/O
- Type hints on all functions
