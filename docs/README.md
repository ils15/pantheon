# Pantheon Documentation

Reference documentation for the Pantheon multi-agent framework.

## Contents

- **[model-routing.md](reference/model-routing.md)** — Deep analysis of model assignments per plan with per-plan fallback chains, cost optimization, and benchmark data (LMSYS Arena, SWE-bench, Artificial Analysis). Covers all 17 plans and 24 unique models.

## Structure

| File | Purpose |
|------|---------|
| `reference/` | Framework reference docs (benchmark data, model analysis, architecture) |
| `memory-bank/` | Project-specific context — **not tracked in git** (initialized by adopters) |

## Note

The `docs/memory-bank/` directory is **not tracked in git**. It exists as a template structure for projects that adopt Pantheon. Each project initializes its own memory bank with project-specific context.
