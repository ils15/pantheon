# Audit — Code Review with Security (Themis)

Run a comprehensive code review with security audit and quality gates on the specified files or changes.

**Target:** $ARGUMENTS

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

### Testing
- [ ] Unit tests written
- [ ] >80% coverage
- [ ] Integration tests exist
- [ ] Edge cases tested

### Security (OWASP)
- [ ] Input validation present
- [ ] No hardcoded secrets
- [ ] Secure dependencies
- [ ] No XXE, CSRF, XSS
- [ ] Auth/authz correct
- [ ] Rate limiting
- [ ] Audit logging

## Feedback Format

**Result**: APPROVED | NEEDS_REVISION | FAILED

**Issues by Severity**:
- 🔴 CRITICAL: Security, data loss, breaking change
- 🟠 HIGH: Correctness, performance problem
- 🟡 MEDIUM: Code quality, maintainability
- 🟢 LOW: Style, non-critical
