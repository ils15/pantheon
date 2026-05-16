---
name: audit
description: "Comprehensive code review with security audit, test coverage analysis, and quality gates"
argument-hint: "[Files to review or PR description]"
agent: themis
tools: ['search', 'usages']
---

# Review Code with Security (Themis)

## Review Checklist

### Correctness (CRITICAL)
- [ ] Logic correct and complete
- [ ] Edge cases handled
- [ ] Error handling appropriate
- [ ] Performance acceptable
- [ ] No OWASP vulnerabilities

### Code Quality
- [ ] No duplication (DRY)
- [ ] Single responsibility functions
- [ ] Clear naming
- [ ] Reasonable complexity
- [ ] Appropriate file size

### Architecture & Design
- [ ] Follows design patterns
- [ ] Proper separation of concerns
- [ ] Dependencies well managed
- [ ] Extensibility considered
- [ ] Consistent with codebase

### Testing
- [ ] Unit tests written
- [ ] >80% coverage
- [ ] Integration tests exist
- [ ] Edge cases tested
- [ ] Error conditions tested

### Documentation
- [ ] Public functions documented
- [ ] Comments explain WHY
- [ ] README/guides accurate
- [ ] API docs complete
- [ ] Assumptions documented

### Security (OWASP)
- [ ] Input validation present
- [ ] No hardcoded secrets
- [ ] Secure dependencies
- [ ] No XXE, CSRF, XSS
- [ ] Auth/authz correct
- [ ] Encryption for sensitive data
- [ ] Session/token management
- [ ] Rate limiting
- [ ] Audit logging

## Feedback Format

**Result**: APPROVED | NEEDS_REVISION | FAILED

**Issues by Severity**:
- 🔴 CRITICAL: Security, data loss, breaking change
- 🟠 HIGH: Correctness, performance problem
- 🟡 MEDIUM: Code quality, maintainability
- 🟢 LOW: Style, non-critical

## When to Use
- Before merge to main
- Security audits
- Verify compliance
