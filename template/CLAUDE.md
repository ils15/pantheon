# Pantheon Agent System — Project Instructions

This project uses the [Pantheon](https://github.com/ils15/pantheon) multi-agent framework for AI-assisted development.

## How to Use

### Quick Start
1. Run `node scripts/install.mjs` to set up agents for your platform
2. Invoke `@zeus` to orchestrate features, or call agents directly (`@hermes`, `@aphrodite`, etc.)

### Shared Conventions
For shared project conventions, architecture decisions, and coding standards, **always read `AGENTS.md`** (or `AGENTS.md` in the project root).

### Available Agents (in `.claude/agents/`)
| Agent | Role | Invocation |
|---|---|---|
| `zeus` | Central orchestrator (delegates to all agents) | `@zeus Implement user auth feature` |
| `athena` | Strategic planner & architect | `@athena Plan the database schema` |
| `apollo` | Investigation scout | `@apollo Find all auth-related files` |
| `hermes` | Backend (FastAPI, Python, TDD) | `@hermes Create POST /users endpoint` |
| `aphrodite` | Frontend (React, TypeScript, UI) | `@aphrodite Build UserProfile component` |
| `maat` | Database (SQLAlchemy, Alembic) | `@maat Add email_verified column to users` |
| `temis` | Quality & security gate | `@temis Review the latest changes` |
| `ra` | Infrastructure (Docker, CI/CD) | `@ra Update docker-compose for Redis` |
| `talos` | Hotfix express (simple fixes) | `@talos Fix this CSS typo` |
| `iris` | GitHub operations (PRs, issues) | `@iris Create a PR for this feature` |
| `mnemosyne` | Memory & documentation | `@mnemosyne Save this ADR` |
| `gaia` | Remote sensing domain expert | `@gaia Analyze LULC agreement` |
| `hefesto` | AI pipelines (RAG, LangChain) | `@hefesto Build a RAG pipeline` |
| `quiron` | Model providers (routing, costs) | `@quiron Configure Bedrock provider` |
| `eco` | Conversational AI (chatbots) | `@eco Design the NLU pipeline` |
| `nix` | Observability (tracing, costs) | `@nix Set up OpenTelemetry` |

### Notes
- `AGENTS.md` contains shared cross-platform conventions (also read by Cursor, Windsurf, Copilot, Codex)
- This `CLAUDE.md` supplements with Claude Code-specific instructions
- Skills in `.claude/skills/` are auto-discovered by Claude Code
- MCP servers configured in `.mcp.json` are automatically available

### Compaction Instructions
When context compaction occurs, preserve:
- The current task and its requirements
- Key architectural decisions made so far
- List of files modified in this session
- Any pending decisions or open questions
