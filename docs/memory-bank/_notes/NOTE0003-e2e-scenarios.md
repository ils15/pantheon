# NOTE-003: E2E Orchestration Scenarios

**Status:** Active  
**Date:** 2026-05-22

## Happy Path: Full Feature Delivery
1. User requests a new feature
2. Zeus delegates to Athena for planning
3. Athena creates TDD plan → delegates to Themis for plan validation
4. Zeus dispatches implementation to Hermes/Aphrodite/Demeter (parallel)
5. Each implementer calls Themis for post-implementation review
6. Themis approves → Zeus delegates to Mnemosyne for documentation
7. Success criteria: all artifacts created, no blockers, Themis APPROVED

## Degraded Path: Hook Unavailable
1. Platform doesn't support hooks (e.g., Cursor, Cline, Continue, Windsurf)
2. Zeus detects hook absence from capability flags
3. Falls back to inline validation in agent instructions
4. Quality gates consolidated at Themis review phase
5. Success criteria: quality maintained without hooks

## Failure Path: Agent Delegation Broken
1. Delegation target agent not available on target platform
2. Router returns clear error: "Agent X not found on Platform Y"
3. Zeus receives failure diagnostic via task agent
4. Logs actionable message with suggested fix (re-sync platform)
5. Runbook NOTE-005 triage procedure triggered

## Recovery Path: Sync Drift Detected
1. Canonical agent file updated
2. `npm run sync:check` fails in CI — detects drift
3. Blocking until `npm run sync` resolves the drift
4. Conformance report identifies which agents/platforms drifted
5. PR blocked until sync freshness restored
