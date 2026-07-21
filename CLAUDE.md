# Pantheon Agent System

This project uses the Pantheon multi-agent framework for AI-assisted development.

## Instructions

Always check AGENTS.md for shared project conventions and architecture decisions.

## Available Agents

| Agent | Role |
|-------|------|
| @aphrodite | Frontend specialist — React 19, TypeScript strict, WCAG accessibility, responsive design, TDD, modern API patterns, deprecated npm detection. Calls apollo for discovery, sends to themis for review. |
| @apollo | Read-only investigation scout — 3–10 parallel searches across codebase, external docs, and GitHub. Called by: athena, zeus, hermes, aphrodite, demeter. No edits, no commands. |
| @athena | Strategic planner & architect — research-first, plan-only, never implements. Plans include quality gates (ruff/Biome, dep detection, LTS policy). Calls apollo for discovery. |
| @demeter | Database specialist — SQLAlchemy 2.0, Alembic, query optimization, N+1 prevention, TDD migrations, modern DB libs. Calls apollo for discovery, sends to themis. |
| @gaia | Remote sensing domain specialist — satellite image processing, spectral analysis, SAR, change detection, time series, ML/DL classification. Read-only analysis of geospatial data. |
| @hephaestus | AI tooling & pipelines specialist — LangChain/LangGraph chains, RAG architecture, vector stores, embedding strategies. Forges AI infrastructure. Calls apollo, sends to themis. |
| @hermes | Backend specialist — FastAPI, Python, async, TDD (RED→GREEN→REFACTOR), modern Python stdlib, obsolete lib detection. Calls apollo for discovery, sends to themis. |
| @iris | GitHub operations specialist — branches, pull requests, issues, releases, tags. Called by zeus after review. Never pushes or merges without explicit human approval. Integrates with VS Code GitHub Pull Requests extension. |
| @mnemosyne | Memory bank quality owner — initializes .pantheon/memory-bank/, writes ADRs and task records on explicit request. Called by zeus. Never invoked automatically after phases. |
| @nyx | Observability & monitoring specialist — OpenTelemetry tracing, token/cost tracking, agent performance analytics, LangSmith integration. Calls apollo for discovery, sends to themis. |
| @prometheus | Infrastructure + model provider specialist — Docker, CI/CD, multi-model routing, cost optimization, provider abstraction |
| @talos | Hotfix express lane — direct fixes for small bugs, CSS, typos, minor logic. No TDD ceremony, no orchestration overhead. Standalone, no subagents. Escalates complex issues to zeus. |
| @themis | Quality & security gate — ruff/Biome linting, dead/legacy code detection, OWASP Top 10, coverage >80%, correctness, deprecation audit. Called by implementers; escalates blockers to zeus. |
| @zeus | Central orchestrator — never implements. Delegates to: athena, apollo, hermes, aphrodite, demeter, prometheus, themis, iris, mnemosyne, talos, hephaestus, nyx |

## Workflow

Plan → Implement → Review → Commit (each phase requires approval)
See .claude/agents/ for full agent definitions.
Skills are in .opencode/skills/ (or globally at ~/.config/opencode/skills/).
