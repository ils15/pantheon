# TASK-004: Wave 1 — Adapter Conformance & CI Matrix

**Date:** 2026-05-22
**Status:** Planned

## Summary
Implement and enforce adapter conformance tests for all supported platforms.

## Objectives
1. Add adapter conformance tests (schema + mapping + permissions + delegation surface).
2. Add CI matrix jobs per platform adapter.
3. Fail fast on critical conformance regressions.

## Platforms
- OpenCode
- Claude
- Cursor
- Cline
- Continue
- Windsurf
- Copilot

## Execution Checklist
- [ ] Create adapter conformance test suite.
- [ ] Add platform matrix jobs in CI.
- [ ] Validate generated outputs for required fields and tool mapping.
- [ ] Validate supported/unsupported capability handling (with explicit fallbacks).
- [ ] Publish matrix report in PR checks.

## Validation Commands
- `npm run sync`
- `npm run validate`
- `npm test`

## Exit Criteria
- CI matrix active for all supported platforms
- 100% required conformance checks pass
- Unsupported capability behavior documented (no silent failure)

## Owners
- Lead: `@prometheus`
- Quality gate: `@themis`
- Routing alignment: `@athena`

## Deliverables
- Adapter conformance test suite
- CI matrix pipeline updates
- Platform conformance report template
