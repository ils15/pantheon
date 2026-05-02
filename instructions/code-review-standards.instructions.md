---
description: "Code review standards and security audit guidelines"
name: "Code Review & Security Standards"
applyTo: "**"
---

# Code Review Standards (Themis)

## Review Scope
- Review ONLY changed files
- Check diff, not entire file
- Review related commits
- Link to related PRs/issues

## Correctness
- Logic is correct and complete
- Edge cases handled
- Error handling appropriate
- Performance acceptable

## Code Quality
- No duplication (DRY principle)
- Single responsibility functions
- Clear and descriptive naming
- Reasonable complexity
- Proper file sizes

## Testing
- Unit tests written
- >80% code coverage
- Integration tests for workflows
- Edge cases tested
- Error conditions tested

## Security (OWASP Top 10)
- Input validation present
- No hardcoded secrets/credentials
- Secure dependencies
- No XXE, CSRF, XSS vulnerabilities
- Authentication/authorization proper
- Encryption for sensitive data
- Secure session/token management
- Rate limiting on sensitive endpoints
- Audit logging for security events

## Documentation
- Public functions documented
- Comments explain WHY not WHAT
- README/guides accurate
- API documentation complete

## Feedback Format
- Return: APPROVED | NEEDS_REVISION | FAILED
- Categorize: CRITICAL | HIGH | MEDIUM | LOW
- Provide specific file:line references
- Suggest solutions or alternatives
