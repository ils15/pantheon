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

## Auto-Continue & Safety Gate Review

When reviewing code related to auto-continue, autonomous sessions, or safety gate configurations:

1. **Check gate compliance**: Verify all Tier 1 gates (plan, commit, deploy, council, destructive operations) are respected. No auto-continue should bypass these.
2. **Verify checkpoint saves**: Checkpoints must save before any delegate dispatch or phase transition. Gate decisions must be logged to `gate_history`.
3. **Validate auto-approve policies**: Auto-approve must have explicit conditions (tests pass, no CRITICAL/HIGH issues, within plan scope, coverage ≥80%).
4. **Test idle detection**: Verify the warning → stall → pause sequence works correctly with correct timeout thresholds.
5. **Multi-platform compatibility**: Verify instructions work across all target platforms (OpenCode, VS Code Copilot, Cursor, Windsurf, Continue.dev).
6. **Agent safety profiles**: Verify each agent's safety profile is correct — read-only agents should have no Tier 1 gates, hotfix agents should only gate on escalation.
7. **Gate logging audit**: All gate decisions must be logged to session checkpoint with timestamp and conditions met.

Reference: `instructions/auto-continue-safety-gates.instructions.md`

## Feedback Format
- Return: APPROVED | NEEDS_REVISION | FAILED
- Categorize: CRITICAL | HIGH | MEDIUM | LOW
- Provide specific file:line references
- Suggest solutions or alternatives
