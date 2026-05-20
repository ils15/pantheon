# Pantheon — Multi-Agent Framework

> 18 agents for VS Code Copilot/OpenCode. Conductor-Delegate pattern.
> Docs: [agents](agents/README.md) · [skills](skills/README.md) · [platforms](docs/platforms/)

## Agents (18)
| premium | Zeus (orchestrate), Athena (plan), Themis (review), Agora (synthesis) |
| default | Hermes (backend), Aphrodite (frontend), Demeter (db), Prometheus (infra), Hephaestus (AI), Chiron (routing), Echo (chat), Gaia (remote sensing), Nyx (observability) |
| fast | Apollo (discover), Iris (GitHub), Mnemosyne (memory), Talos (hotfix), Argus (visual) |

**Full details:** `agents/<name>.agent.md`

## Golden Rules
1. **TDD** — RED→GREEN→REFACTOR, coverage >80%. See `skills/tdd-with-agents`
2. **Quality gate** — Themis review MANDATORY after every implementation phase
3. **Pause points** — Plan approval → Phase review → User commits (never auto-commit)
4. **No excessive files** — Info lives in git commits, code comments, tests, `/memories/repo/`
5. **No status files** — Never create plan.md, phase-N-complete.md, complete.md

## Commands
```bash
./platform/select-plan.sh {list|status|<plan>}  # Model plans
opencode sync status                            # Sync config
pytest -v / npx vitest run                      # Tests
ruff check / biome check                        # Lint
```

## Model Tiers
| fast (0.33x) | default (1x) | premium (3-7.5x) |
|---|---|---|
| Apollo, Iris, Mnemosyne, Talos, Argus, Nyx | Hermes, Aphrodite, Demeter, Prometheus, Hephaestus, Chiron, Echo, Gaia | Zeus, Athena, Themis, Agora |

## Dispatch Patterns
| Bug | Apollo → Hermes → Themis | Feature | Athena → Hermes/Aphrodite/Demeter → Themis |
| Optimize | Apollo → Demeter → Themis | Hotfix | Talos | Infra | Apollo → Prometheus |

## Memory
| Type | Location | Loaded |
|---|---|---|
| Facts | `/memories/repo/*.md` | Always (zero cost) |
| Project | `docs/memory-bank/00-project.md` | On-demand |
| Active | `docs/memory-bank/01-active-context.md` | On-demand (read first) |
| Skills | `skills/*/SKILL.md` (40 skills) | Lazy-load |
| ADRs | `docs/memory-bank/_notes/` | On-demand |

## Artifacts
| Prefix | By | Location |
|---|---|---|
| PLAN-/IMPL-/REVIEW- | Athena/Hermes/Themis | `docs/memory-bank/.tmp/` (gitignored) |
| ADR- | Any | `docs/memory-bank/_notes/` (committed) |

## MCP
Tier 1: Context7, GitHub, grep.app · Tier 2: Playwright, PostgreSQL, Fetch
Full: `docs/mcp-recommendations.md`

## Health Check
```
Ping: @zeus @athena @apollo @hermes @aphrodite @demeter @themis @prometheus @iris @talos @mnemosyne @hephaestus @chiron @echo @nyx @gaia @argus @agora
```
