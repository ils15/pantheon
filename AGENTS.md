# Pantheon Agent System

This project uses the Pantheon multi-agent framework with 14 specialized agents.

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

| @nyx | Observability | Tracing & monitoring |
| @gaia | Remote sensing | LULC analysis |
| @iris | GitHub operations | PRs & releases |
| @mnemosyne | Documentation | Memory bank |
| @talos | Hotfixes | Rapid repairs |

### Removed Agents
| Agent | Former Role | Reason |
|-------|-------------|--------|
| @chiron | Model provider hub | Merged into @prometheus |
| @echo | Conversational AI | Merged into @hephaestus |
| @argus | Visual analysis | Removed — never used, capability covered by other agents |

## Commands

- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## MCP Configuration

Each agent template includes a `mcpServers` frontmatter field that declares available MCP servers. This enables per-agent MCP binding with tool scoping.

For details, see `docs/mcp-recommendations.md`.

## Conventions

- TDD: RED → GREEN → REFACTOR cycle enforced. See `instructions/tdd-standards.instructions.md`.
- Coverage minimum: 80%
- Async/await on all I/O
- Type hints on all functions

## Tools

If you are unsure how to do something, use `gh_grep` to search code examples from GitHub.

## Glossary

- **handoff**: A formal named contract (with label, description, prompt) that routes work from one agent to another. Defined in `routing.yml`. Example: `📋 Plan Feature` (Zeus → Athena).
- **skill**: A reusable instruction set loaded via the `skill` tool. Agents declare skills in their YAML frontmatter under `skills:`. Skills provide domain-specific workflows (e.g., `tdd-with-agents`, `rag-pipelines`).
- **subtask**: A lightweight delegation mode for bounded, low-risk work (≤2 files, <10 lines). Skips artifact generation and Themis review. Returns `subtask_summary` inline.
- **artifact**: A structured file produced during a phase (PLAN, IMPL, REVIEW, DISC). Ephemeral artifacts live in `docs/memory-bank/.tmp/` and are deleted on sprint close. Permanent ADRs live in `docs/memory-bank/_notes/`.
- **council**: An inline multi-perspective analysis where Zeus dispatches 2-4 specialists to answer a trade-off question. Synthesized as `## 🏛️ Council Synthesis`.
