# ADR-0003: DAG Wave Execution

**Status:** Accepted
**Date:** 2026-05-16

## Context
Sequential phase execution (plan→backend→frontend→review) wasted idle agent time. Backend and frontend have no dependencies and could run in parallel.

## Decision
Adopt Directed Acyclic Graph (DAG) Wave Execution:
- **Wave 1**: demeter (schema) + apollo (research) — parallel
- **Wave 2**: hermes (backend) + aphrodite (frontend) — parallel, depend on Wave 1
- **Wave 3**: themis (review) — sequential, depends on Waves 1+2
- **Wave 4**: prometheus (deploy) — sequential, depends on approval

## Consequences
- Total time = critical path, not sum of all phases
- Full parallelism between backend/frontend
- Added complexity in dependency tracking
- Themis reviews at end of each wave, not per agent
