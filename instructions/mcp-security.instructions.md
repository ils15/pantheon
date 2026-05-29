---
description: "MCP security hardening — SQL injection, container escape, credential leakage prevention"
name: "MCP Security Hardening"
applyTo: "agents/*.agent.md"
---

# MCP Security Hardening

Mandatory security measures for all MCP server usage in Pantheon agents.

---

## 1. PostgreSQL MCP — SQL Injection Prevention

### Affected Agents
- **Demeter** (read/write: `postgresql_query`, `postgresql_schema`, `postgresql_execute`)
- **Hermes** (read-only: `postgresql_query`, `postgresql_schema`)

### Rules

1. **Parameterized queries only** — Never interpolate values into SQL strings:
   ```python
   # ✅ SAFE
   psql_query("SELECT * FROM users WHERE id = $1", [user_id])
   # ❌ UNSAFE
   psql_query(f"SELECT * FROM users WHERE id = {user_id}")
   ```

2. **Validate dynamic identifiers** — Table/column names from variables must be checked against `postgresql_schema` first.

3. **Read-only for Hermes** — Only `SELECT` queries. Write operations → delegate to @demeter.

4. **DDL justification** (Demeter only) — Every `postgresql_execute` must include a comment explaining why Alembic cannot handle the operation.

### Audit
- Log every `postgresql_execute` with: purpose, table name, operation type (DDL/DML)
- Format: `--audit: creating composite index on orders(payment_status, created_at)`

---

## 2. Docker MCP — Container Escape Prevention

### Affected Agents
- **Prometheus** (full access: `docker_build`, `docker_run`, `docker_compose`)

### Rules

1. **Mandatory security flags** on every `docker_run`:
   ```
   --cap-drop=ALL
   --security-opt=no-new-privileges
   --read-only
   --user=1000:1000
   ```

2. **Forbidden flags** — escalate to Zeus if required:
   `--privileged`, `--pid=host`, `--network=host`, `--security-opt=seccomp=unconfined`, `--security-opt=apparmor=unconfined`

3. **Dockerfile rules**: multi-stage build, non-root user, drop SUID bits (`chmod -s`), pin image tags, no `:latest`

4. **Image provenance**: Verify source labels before running pulled images.

### Audit
- Every `docker_run`/`docker_build` call includes a `# purpose:` comment
- Log image name, flags used, and purpose

---

## 3. Web/Fetch — Credential Leakage Prevention

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

## 4. Enforcement

These rules are enforced by **@themis** during code review:

| Risk Area | Themis Check | Severity if Violated |
|-----------|-------------|---------------------|
| Non-parameterized SQL | grep for `f"`, `.format(`, `+` in SQL strings | CRITICAL — block review |
| Missing docker security flags | grep for `docker_run` without `--cap-drop` | CRITICAL — block review |
| Credentials in fetch URLs | grep for `token=`, `key=`, `secret=` in URLs | HIGH — block review |
| Missing audit comments | grep for `postgresql_execute\|docker_run` without `# audit:` or `# purpose:` | MEDIUM — flag for revision |

> **Reference:** `instructions/mcp-security.instructions.md`
