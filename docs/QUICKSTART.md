# Pantheon Quick Start

## What is Pantheon

A multi-agent framework for VS Code Copilot, OpenCode, Claude Code, Cursor, Windsurf, Cline, and Continue.dev using the Conductor-Delegate pattern. 14 specialized agents coordinate through Zeus (orchestrator) to implement features with TDD enforcement and mandatory quality gates.

## Installation

```bash
# Clone the repo
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Install for your platform (pick one)
./sync-platform.sh copilot --global   # VS Code (global)
./sync-platform.sh opencode           # OpenCode
./sync-platform.sh claude             # Claude Code
./sync-platform.sh cursor             # Cursor
./sync-platform.sh windsurf           # Windsurf
./sync-platform.sh cline              # Cline
./sync-platform.sh continue           # Continue.dev
```

See [docs/INSTALLATION.md](INSTALLATION.md) for detailed platform-specific setup.

## Available Agents (14)

| Agent | Role | Tier |
|---|---|---|
| **Zeus** | Central orchestrator — delegates work, never implements | Premium |
| **Athena** | Strategic planner — architecture decisions, trade-off analysis | Premium |
| **Themis** | Quality & security gate — mandatory review after every phase | Premium |
| **Hermes** | Backend — FastAPI, Python, async/await, TDD | Default |
| **Aphrodite** | Frontend — React, TypeScript, WCAG accessibility | Default |
| **Demeter** | Database — SQLAlchemy, Alembic, query optimization | Default |
| **Prometheus** | Infrastructure — Docker, docker-compose, CI/CD | Default |
| **Hephaestus** | AI pipelines — RAG, LangChain, vector stores | Default |
| **Gaia** | Remote sensing — LULC analysis, geospatial pipelines | Default |
| **Apollo** | Investigation scout — parallel codebase searches (read-only) | Fast |
| **Nyx** | Observability — tracing, monitoring, cost tracking | Fast |
| **Iris** | GitHub ops — branches, PRs, issues, releases | Fast |
| **Mnemosyne** | Memory bank — ADRs, project.md, atomic facts | Fast |
| **Talos** | Hotfix express — small bugs, CSS, typos (no TDD) | Fast |


Full details: [agents/README.md](../agents/README.md)

## Key Commands

| Command | Agent | Purpose |
|---|---|---|
| `/focus` | Zeus | Pin session goal — prevents scope drift |
| `/pantheon` | Athena | Multi-perspective synthesis (3-5 experts in parallel) |
| `/subtask` | Any | Bounded child worker with structured result |
| `/sketch` | Athena | Turn rough idea into spec via Q&A interview |
| `/audit` | Themis | Security + quality review of current changes |
| `/mirrordeps` | Apollo | Clone dependency source into `.deps/` for inspection |
| `/plan-architecture` | Athena | Create TDD implementation roadmap |
| `/debug-issue` | Apollo | Root cause analysis with parallel searches |
| `/optimize-database` | Demeter | Query analysis and index recommendations |

## Recent Changes

| Change | Description |
|---|---|



## Architecture

```
User → Zeus (orchestrator)
         ├── Athena (plans) → Apollo (discovers)
         ├── Hermes (backend) ─┐
         ├── Aphrodite (FE)    ├─ Parallel DAG waves
         ├── Demeter (DB)     ─┘
         └── Themis (review) → MANDATORY gate before merge
```

| Principle | How it works |
|---|---|
| **Conductor-Delegate** | Zeus coordinates, specialists implement, Themis reviews |
| **TDD enforced** | RED (write failing test) → GREEN (minimal code) → REFACTOR |
| **Quality gates** | Themis review mandatory after every implementation phase |
| **Parallel execution** | Independent tasks run in DAG waves (e.g. backend + frontend simultaneously) |
| **Pause points** | User approves at planning, phase review, and git commit — never auto-merges |

## File Structure

```
pantheon/
├── opencode.json              # Agent config, commands, permissions, MCP servers
├── agents/                    # 14 agent definitions (*.agent.md)
│   ├── zeus.agent.md          # Orchestrator
│   ├── athena.agent.md        # Planner
│   ├── themis.agent.md        # Quality gate
│   └── ...                    # 14 more specialists
├── skills/                    # On-demand procedural knowledge
│   ├── tdd-with-agents/       # TDD workflow enforcement
│   ├── api-design-patterns/   # REST API standards
│   ├── security-audit/        # OWASP Top 10 checks
│   └── ...                    # 28 more skills
├── platform/
│   └── examples/              # Reference model configs (documentation only)
├── prompts/                   # Reusable prompt templates
├── instructions/              # Standards documents (coding, review, memory)
└── docs/
    ├── QUICKSTART.md          # This file
    ├── INSTALLATION.md        # Platform-specific setup
    ├── INDEX.md               # Documentation index
    └── mcp-recommendations.md # MCP server recommendations
```

## Next Steps

1. Run `@zeus: Ping all agents` to verify setup
2. Start with a simple task: `@apollo: Find all authentication-related files`
3. Read [agents/README.md](../agents/README.md) for full agent commands and workflows
