---
name: implement-feature
description: "Implement a complete feature end-to-end with TDD, parallel execution, and quality gates"
agent: zeus
tools: ['search', 'usages', 'edit', 'runCommands', 'runTasks']
---

# Implement Feature with TDD (Zeus Orchestration)

See `prompts/orchestrate-with-zeus.prompt.md` for the full master orchestration workflow.

## Quick Reference (5 Phases)

### Phase 1 — Planning
Delegate to @athena: research architecture, create TDD plan (3-10 phases), analyze risks.

### Phase 2 — Parallel Implementation
Dispatch agents in parallel based on scope:
- @hermes → Backend APIs (FastAPI)
- @aphrodite → Frontend components (React/TypeScript)
- @demeter → Database migrations (SQLAlchemy)

### Phase 3 — Quality Gate
Route to @themis: review changed files, OWASP Top 10, coverage >80%.

### Phase 4 — Integration Testing
End-to-end workflows, data consistency, performance.

### Phase 5 — Deployment
@prometheus: staging, health checks, smoke tests, production.

## Success Criteria
- Tests pass (>80% coverage)
- Code reviewed & approved
- No OWASP vulnerabilities
- Performance acceptable
- Documentation updated
- Deployed successfully
