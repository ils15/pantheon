---
description: "TDD standards for the Pantheon agent system — RED→GREEN→REFACTOR cycle"
name: "TDD Standards"
applyTo: "**/*.py,**/*.{ts,tsx}"
---

# TDD Standards

## TDD Cycle (RED → GREEN → REFACTOR)

All implementation agents (Hermes, Aphrodite, Demeter) follow the same cycle:

### RED — Write a failing test
- Write a test that validates the expected behavior
- The test MUST fail on first run (proves the test works)
- Run the test to confirm failure

### GREEN — Write minimal code to pass
- Write the minimum code required to make the test pass
- No optimization, no extras
- Run the test to confirm it passes

### REFACTOR — Improve without breaking
- Clean up the implementation
- Optimize, extract functions, improve naming
- Run the test again — it must still pass

## Domain-Specific Adaptations

### Backend (Hermes)
- Use pytest for testing
- Every endpoint/function needs a test
- CRITICAL: Run tests non-interactively (e.g., `pytest -v`). Never use `--pdb` in CI.

### Frontend (Aphrodite)
- Use React Testing Library for component tests
- Verify: `npm test` passes, `npm run lint` passes
- Test behavior, not implementation

### Database (Demeter)
- Write migration test: validates the new schema state
- Verify: `alembic upgrade head && pytest` AND `alembic downgrade -1 && pytest`
- Test both upgrade AND downgrade

## Non-Negotiable Rules
- Never write code without a failing test first (except Talos hotfixes)
- Coverage minimum: 80%
- All tests must pass before committing
