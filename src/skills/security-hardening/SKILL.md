---
name: security-hardening
description: "Security gate — OWASP, SAST, secrets, MCP hardening, dependency audit"
---

# Security Hardening

**Código inseguro em produção = pesadelo. Isso é não-negociável.**

## Scope
| Domain | Coverage |
|--------|----------|
| **SAST** | SQL injection, XSS, CSRF, path traversal, command injection |
| **MCP** | Credential leakage prevention, tool access control, input sanitization |
| **Secrets** | No hardcoded keys, tokens, passwords in code/logs |
| **Deps** | Known CVEs, outdated packages, deprecated libs |
| **Container** | Non-root user, health checks, minimal base images |

## MCP Security (Mandatory)
- Never log credentials, tokens, or API keys
- Validate all MCP inputs
- Restrict tool access per agent via `mcp_tools` YAML field
- Audit MCP server URLs (no unverified endpoints)

## SAST Checklist
- [ ] Input validation on ALL endpoints
- [ ] Parameterized queries (no string concatenation)
- [ ] CSRF protection on state-changing requests
- [ ] Rate limiting on sensitive endpoints
- [ ] Safe error messages (no stack traces to client)

## Dep Audit
```bash
pip-audit --requirement requirements.txt
npm audit
```
