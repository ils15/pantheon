# TASK-002: Multi-Platform Wave Execution Plan (v2)

**Date:** 2026-05-22
**Status:** In progress

## Summary
Operational orchestration artifact to execute the 30/60/90 strategy using DAG waves across all supported platforms (OpenCode, Claude, Cursor, Cline, Continue, Windsurf, Copilot).

## Scope
- Canonical contract and adapter parity
- Cross-platform conformance matrix
- CI wave gates
- Reliability, observability, and release hardening

## Wave Map
- **Wave 0 (Foundation):** Canonical contract freeze + parity baseline
- **Wave 1 (Conformance):** Adapter conformance tests + smoke matrix in CI
- **Wave 2 (Reliability):** E2E orchestration + hooks/fallback verification
- **Wave 3 (Scale):** Observability + quality scoring + release gates

## Dependency Graph
- Wave 1 depends on Wave 0
- Wave 2 depends on Wave 1
- Wave 3 depends on Wave 2

## RACI (Canonical Agents)
- **Accountable:** `@zeus`
- **Responsible (by wave):**
  - Wave 0: `@athena`, `@themis`
  - Wave 1: `@themis`, `@prometheus`
  - Wave 2: `@prometheus`, `@themis`, `@nyx`
  - Wave 3: `@nyx`, `@mnemosyne`, `@iris`
- **Consulted:** `@apollo`, `@argus`

## Global Exit Criteria
- 100% supported-platform matrix green
- 0 critical schema/parity failures
- E2E orchestration stable across adapters
- Release checklist approved

## Key Metrics
- Platform pass rate: target 100%
- Conformance failures: target 0 critical
- E2E success rate: target >= 95%
- Mean wave cycle time: tracked per PR
