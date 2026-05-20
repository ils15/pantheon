# Pantheon — Multi-Agent Framework

> 18 agents for VS Code Copilot/OpenCode. Conductor-Delegate pattern.

## What
Automates **plan → discover → implement → review → deploy → document** with TDD, 3 human approval gates, >80% coverage.

## Architecture
```
User → ZEUS → Athena (plan) → Apollo (discover)
              ↓
  Hermes + Aphrodite + Demeter → Themis (quality gate)
  Prometheus → Iris  Nyx → Argus → Gaia  Talos  Mnemosyne
```
**Patterns:** Conductor-Delegate | DAG Waves | TDD (RED→GREEN→REFACTOR)

## Agents (by tier)
| premium | Zeus (orchestrate), Athena (plan), Themis (review) |
| default | Hermes (backend), Aphrodite (frontend), Demeter (db), Prometheus (infra), Hephaestus (AI), Chiron (routing), Echo (chat), Gaia (remote sensing) |
| fast | Apollo (discover), Iris (GitHub), Nyx (observability), Mnemosyne (memory), Talos (hotfix), Argus (visual), Agora (synthesis) |

## Tech Stack
| Layer | Tech |
|---|---|
| Agent format | Markdown + YAML (`.agent.md`) |
| Config | JSON (`opencode.json`) |
| Platform | VS Code Copilot, OpenCode, Cursor, Claude Code |
| CI/CD | GitHub Actions |
| Backend | Python 3.12+, FastAPI |
| Frontend | React 19, TypeScript strict |
| Database | PostgreSQL, SQLAlchemy 2.0, Alembic |

## Repo Structure
```
/agents/  /skills/  /instructions/  /prompts/  /platform/  /memories/repo/
```

## Commands
```bash
./platform/select-plan.sh {list|status|<plan>}  # Model plans
opencode sync status                            # Sync config
pytest -v / npx vitest run                      # Tests
ruff check / biome check                        # Lint
```

## Key Decisions
| Decision | Why |
|---|---|
| Conductor-Delegate | Separation of concerns, parallelism |
| DAG Waves | Critical path, not sum of phases |
| TDD compulsório | >80% coverage, no regression |
| 3-tier memory | Facts (zero-cost) / Patterns (lazy) / Conventions (always) |
| Skills lazy-load | 39 skills, only relevant ones loaded |

> **Agents:** Read `01-active-context.md` first. See `_notes/_index.md` for ADRs.
> **Memory rules:** `skills/memory-bank-rules/SKILL.md`
