# Pantheon Quick Start

## What is Pantheon

A multi-agent framework for VS Code Copilot and OpenCode using the Conductor-Delegate pattern. 17 specialized agents coordinate through Zeus (orchestrator) to implement features with TDD enforcement and mandatory quality gates.

## Installation

```bash
# Clone into your project
git clone https://github.com/anomalyco/pantheon.git .pantheon

# Copy agents, skills, and config to project root
cp -r .pantheon/agents/ .pantheon/skills/ .pantheon/opencode.json ./

# For OpenCode: copy to global config
cp -r .pantheon/agents/ .pantheon/skills/ ~/.config/opencode/
```

See [docs/INSTALLATION.md](INSTALLATION.md) for platform-specific setup (VS Code, Cursor, Claude Code, Windsurf).

## Model Configuration

**No models are hardcoded by default.** OpenCode uses its built-in defaults until you configure a plan.

| Command | What it does |
|---|---|
| `/forge` | Lists all available plans, you choose one |
| `/forge auto` | Clears all model overrides, uses OpenCode defaults |
| `/forge <plan-name>` | Applies a plan (e.g. `/forge opencode-go`) |
| `/forge <model-id>` | Sets a specific model directly (e.g. `/forge anthropic/claude-sonnet-4-20250620`) |

**How it works:** `/forge` reads `platform/plans/*.json` files and edits `opencode.json` directly — setting `model`, `small_model`, and per-agent `model` fields. No symlinks or intermediate files needed.

**Available plans** (18 total): `opencode-go`, `opencode-zen-free`, `copilot-free`, `copilot-pro`, `copilot-pro-plus`, `copilot-business`, `copilot-enterprise`, `copilot-student`, `cursor-hobby`, `cursor-pro`, `cursor-ultra`, `claude-pro`, `claude-max-5x`, `claude-max-20x`, `byok-cheap`, `byok-balanced`, `byok-best`, and more in `platform/plans/`.

## Available Agents (17)

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
| **Chiron** | Model routing — multi-provider, AWS Bedrock, cost optimization | Default |
| **Echo** | Conversational AI — Rasa NLU, dialogue management | Default |
| **Gaia** | Remote sensing — LULC analysis, geospatial pipelines | Default |
| **Apollo** | Investigation scout — parallel codebase searches (read-only) | Fast |
| **Argus** | Visual analysis — screenshots, images, PDFs, UI mockups | Fast |
| **Iris** | GitHub ops — branches, PRs, issues, releases | Fast |
| **Mnemosyne** | Memory bank — ADRs, project.md, atomic facts | Fast |
| **Talos** | Hotfix express — small bugs, CSS, typos (no TDD) | Fast |
| **Nyx** | Observability — OpenTelemetry, LangSmith, cost tracking | Fast |

Full details: [agents/README.md](../agents/README.md)

## Key Commands

| Command | Agent | Purpose |
|---|---|---|
| `/forge` | Zeus | Configure model provider and plan |
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
| **Argus agent added** | Visual analysis specialist (screenshots, images, PDFs) — was missing from AGENTS.md, causing CI failures |
| **Hardcoded models removed** | `opencode.json` no longer has root `model`/`small_model` or per-agent model fields — uses OpenCode defaults until `/forge` is run |
| **`/forge` rewritten** | Now edits `opencode.json` directly instead of managing `plan-active.json` symlinks |
| **`plan-active.json` defaults to auto** | Falls back to OpenCode defaults when no plan is explicitly selected |

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
├── agents/                    # 17 agent definitions (*.agent.md)
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
│   ├── plans/                 # 18+ model plan files (*.json)
│   └── select-plan.sh         # CLI plan selector
├── prompts/                   # Reusable prompt templates
├── instructions/              # Standards documents (coding, review, memory)
└── docs/
    ├── QUICKSTART.md          # This file
    ├── INSTALLATION.md        # Platform-specific setup
    ├── INDEX.md               # Documentation index
    └── mcp-recommendations.md # MCP server recommendations
```

## Next Steps

1. Run `/forge` to select a model plan
2. Run `@zeus: Ping all agents` to verify setup
3. Start with a simple task: `@apollo: Find all authentication-related files`
4. Read [agents/README.md](../agents/README.md) for full agent commands and workflows
