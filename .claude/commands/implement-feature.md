# Implement Feature (Zeus Orchestration)

Implement a complete feature end-to-end with TDD, parallel agent execution, and quality gates.

**Feature:** $ARGUMENTS

## Workflow (5 Phases)

### Phase 1 — Planning (Athena)
- Research existing architecture
- Create TDD plan (3–5 phases)
- Analyze risks and mitigations
- Present plan for approval before proceeding

### Phase 2 — Parallel Implementation
Execute in parallel where scopes don't overlap:
- **Hermes** → Backend APIs & services (FastAPI)
- **Aphrodite** → Frontend components (React/TypeScript)
- **Demeter** → Database migrations (SQLAlchemy)

### Phase 3 — Quality Gate (Themis)
- Review only changed files
- Check: OWASP Top 10, coverage >80%, TDD followed
- Result: APPROVED | NEEDS_REVISION | FAILED

### Phase 4 — Integration Testing
- End-to-end workflow tests
- Data consistency verification

### Phase 5 — Deployment (Prometheus)
- Deploy to staging → health checks → smoke tests → production

## Success Criteria
- Tests pass (>80% coverage)
- Code reviewed and approved
- No OWASP vulnerabilities
- Documentation updated
