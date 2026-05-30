---
description: "MCP security hardening — credential leakage prevention"
name: "MCP Security Hardening"
applyTo: "agents/*.agent.md"
---

# MCP Security Hardening

Mandatory security measures for all MCP server usage in Pantheon agents.

---

## 1. Web/Fetch — Credential Leakage Prevention

### Affected Agents
Apollo, Athena, Argus, Chiron, Echo, Gaia, Hephaestus, Iris, Nyx, Zeus (direct `web/fetch` tool)

### Rules

1. **Never embed credentials in URLs** — No API keys, tokens, or passwords in:
   - Query parameters (`?key=abc123`)
   - URL path segments (`/token/abc123/endpoint`)
   - Fragment identifiers (`#access_token=xyz`)

2. **Use environment variables for auth** — If an API requires authentication, use `Authorization: Bearer $TOKEN` header from env, never inline.

3. **Scrub URLs before logging** — Redact query params and path segments that look like credentials when logging fetch operations.

4. **URL allowlist for fetch** — Only fetch from:
   - Official documentation domains
   - Public RFCs (tools.ietf.org, datatracker.ietf.org)
   - Package registries (pypi.org, npmjs.com, crates.io)
   - Public GitHub repositories (github.com, raw.githubusercontent.com)

5. **Response content never stored** — Fetched content is for in-context analysis only. Never write fetch responses to disk or commit them.

6. **No credential forwarding** — Never pass credentials from one fetched response to another request without scrubbing.

### Audit
- If a fetch URL contains query parameters, log a redacted version: `/api/data?params=<redacted>`
- Flag any URL containing `token`, `key`, `secret`, `password`, `auth` in the URL path

---

## 2. Enforcement

These rules are enforced by **@themis** during code review:

| Risk Area | Themis Check | Severity if Violated |
|-----------|-------------|---------------------|
| Credentials in fetch URLs | grep for `token=`, `key=`, `secret=` in URLs | HIGH — block review |

> **Reference:** `instructions/mcp-security.instructions.md`