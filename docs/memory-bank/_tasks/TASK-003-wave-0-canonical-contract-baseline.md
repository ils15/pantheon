# TASK-003: Wave 0 — Canonical Contract & Baseline

**Date:** 2026-05-22
**Status:** In progress

## Summary
Establish a single canonical contract and baseline parity before any platform-specific hardening.

## Objectives
1. Freeze canonical contract (`agents/*.agent.md`, `routing.yml`, permission shape, skills/commands metadata).
2. Detect drift between canonical sources and generated platform outputs.
3. Produce baseline report with known gaps.

## Execution Checklist
- [ ] Define contract checklist (required vs optional fields).
- [ ] Run sync dry-run for all adapters.
- [ ] Compare canonical registry with platform outputs.
- [ ] Register all drifts with severity (critical/high/medium).
- [ ] Publish baseline report and risk list.

## Validation Commands
- `npm run sync -- --dry-run`
- `npm run validate`
- `node scripts/validate-routing.mjs`

## Exit Criteria
- Baseline report published
- Drift inventory created with owners
- No unknown critical gaps

## Owners
- Lead: `@athena`
- Quality gate: `@themis`
- Discovery support: `@apollo`

## Deliverables
- Contract checklist
- Baseline parity report
- Prioritized drift backlog
