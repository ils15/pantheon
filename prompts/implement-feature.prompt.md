---
name: implement-feature
description: "Implement a complete feature end-to-end with TDD, parallel execution, and quality gates"
argument-hint: "[Brief feature description]"
agent: zeus
tools: ['search', 'usages', 'edit', 'runCommands', 'runTasks']
---

# Implement Feature with TDD (Zeus Orchestration)

## Complete Workflow (5 Phases)

### Phase 1 - Planning (@Athena)
Use @aphrodite-subagent to:
- Research existing architecture
- Create detailed TDD plan (3-10 phases)
- Analyze risks and mitigations
- Offer automatic handoff

### Phase 2 - Parallel Implementation
Check which to combine (backend, frontend, database):
- @hermes-subagent → Backend APIs & services (FastAPI)
- @aphrodite-subagent → Frontend components (React/TypeScript)
- @demeter-subagent → Database migrations (SQLAlchemy)

**Execute in parallel!** This reduces time by 60%.

### Phase 3 - Quality Gate (@Themis)
- Review ONLY changed files
- Check: OWASP Top 10, coverage >80%, TDD followed
- Return: APPROVED | NEEDS_REVISION | FAILED

### Phase 4 - Integration Testing
- Test end-to-end workflows
- Verify data consistency
- Performance testing

### Phase 5 - Deployment (@Prometheus)
- Deploy to staging
- Health checks
- Smoke tests
- Deploy to production

## Success Criteria
✅ Tests pass (>80% coverage)
✅ Code reviewed & approved
✅ No OWASP vulnerabilities
✅ Performance acceptable
✅ Documentation updated
✅ Deployed successfully

## When to Use
- Implement new complex feature
- When you want automatic QA
- To coordinate parallel work
