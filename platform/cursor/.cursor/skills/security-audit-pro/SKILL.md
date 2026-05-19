---
name: security-audit-pro
description: "Professional security audit — SAST, SCA, container security, SBOM, PII detection, and compliance (GDPR, LGPD, HIPAA). Used by Themis during review."
context: fork
globs: ["**/*.py", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.yml", "**/*.yaml", "**/Dockerfile*", "**/docker-compose*"]
alwaysApply: false
---

# Security Audit Pro — Comprehensive Security Review

Use this skill for professional-grade security auditing. Covers SAST, SCA, container security, SBOM, PII detection, and compliance patterns. Used by Themis during code review.

---

## Scope

This skill replaces and expands the basic `security-audit` skill. It covers:

| Domain | Coverage |
|--------|----------|
| **SAST** | SQL injection, XSS, CSRF, path traversal, command injection |
| **SCA** | Dependencies with known CVEs, outdated packages |
| **Container** | Non-root user, health checks, secrets, minimal base images |
| **SBOM** | Software Bill of Materials generation |
| **PII** | Detection of personal data in code/logs |
| **Compliance** | GDPR, LGPD, HIPAA patterns |

---

## SAST — Static Application Security Testing

### SQL Injection

**❌ Vulnerable:**
```python
query = f"SELECT * FROM users WHERE email = '{email}'"
await db.execute(query)
```

**✅ Safe:**
```python
query = text("SELECT * FROM users WHERE email = :email")
await db.execute(query, {"email": email})
```

### XSS (Cross-Site Scripting)

**❌ Vulnerable:**
```python
return HTMLResponse(content=f"<h1>Welcome, {user.name}</h1>")
```

**✅ Safe:**
```python
from markupsafe import escape
return HTMLResponse(content=f"<h1>Welcome, {escape(user.name)}</h1>")
```

### CSRF

**Check:**
- [ ] CSRF tokens on state-changing endpoints
- [ ] SameSite cookie attribute set
- [ ] Origin/Referer header validation

### Path Traversal

**❌ Vulnerable:**
```python
file_path = f"/uploads/{filename}"
return FileResponse(file_path)
```

**✅ Safe:**
```python
import os
base_dir = "/uploads"
file_path = os.path.join(base_dir, os.path.basename(filename))
if not file_path.startswith(base_dir):
    raise HTTPException(400, "Invalid path")
return FileResponse(file_path)
```

### Command Injection

**❌ Vulnerable:**
```python
os.system(f"convert {input_file} {output_file}")
```

**✅ Safe:**
```python
import subprocess
subprocess.run(["convert", input_file, output_file], check=True)
```

---

## SCA — Software Composition Analysis

### Dependency Audit

Run these commands to check for vulnerabilities:

```bash
# Python
pip-audit -r requirements.txt
safety check -r requirements.txt

# Node.js
npm audit
npx audit-ci --moderate
```

### Common Vulnerable Patterns

| Pattern | Risk | Fix |
|---------|------|-----|
| `requests < 2.31.0` | CVE-2023-32681 | Upgrade to >= 2.31.0 |
| `pydantic < 2.0` | Validation bypass | Upgrade to >= 2.7 |
| `sqlalchemy < 2.0` | SQL injection risk | Upgrade to >= 2.0 |
| `express < 4.18.2` | Open redirect | Upgrade to >= 4.18.2 |

---

## Container Security

### Dockerfile Checklist

- [ ] Non-root user (`USER appuser`)
- [ ] Health check defined (`HEALTHCHECK`)
- [ ] No hardcoded secrets (use env vars or vault)
- [ ] Minimal base image (`python:3.12-slim` not `python:3.12`)
- [ ] Multi-stage build (build deps not in final image)
- [ ] `.dockerignore` present
- [ ] No `COPY . .` (copy only needed files)

### docker-compose Checklist

- [ ] No secrets in environment variables (use `.env` or vault)
- [ ] Resource limits defined (`deploy.resources`)
- [ ] Network isolation (separate networks for frontend/backend)
- [ ] Read-only filesystem where possible (`read_only: true`)
- [ ] No `privileged: true`

---

## SBOM — Software Bill of Materials

Generate SBOM for compliance:

```bash
# Python
pip install cyclonedx-bom
cyclonedx-py -r requirements.txt -o sbom.json --format json

# Node.js
npm install --save-dev @cyclonedx/cyclonedx-npm
npx cyclonedx-npm --output-file sbom.json
```

---

## PII Detection

Scan code and logs for personal data:

| Pattern | Example | Severity |
|---------|---------|----------|
| Email in logs | `logger.info(f"User {email} logged in")` | High |
| SSN/CPF in code | `cpf = "123.456.789-00"` | Critical |
| Phone numbers | `phone = "+55 11 99999-9999"` | High |
| Credit cards | `card = "4111 1111 1111 1111"` | Critical |
| Passwords in code | `PASSWORD = "secret123"` | Critical |

### PII Protection Patterns

```python
# ❌ Logging PII
logger.info(f"User {user.email} with CPF {user.cpf} created account")

# ✅ Hashing PII in logs
import hashlib
logger.info(f"User {hashlib.sha256(user.email.encode()).hexdigest()[:8]} created account")
```

---

## Compliance Patterns

### GDPR (EU)

- [ ] Right to be forgotten implemented (delete user data endpoint)
- [ ] Data portability (export user data endpoint)
- [ ] Consent management (explicit opt-in, not opt-out)
- [ ] Data minimization (only collect what's needed)
- [ ] Privacy by design (privacy considered in architecture)

### LGPD (Brazil)

- [ ] Same as GDPR + ANPD notification procedures
- [ ] Data Protection Officer (DPO) contact available
- [ ] Portuguese privacy policy

### HIPAA (US Healthcare)

- [ ] Encryption at rest (database encryption)
- [ ] Encryption in transit (TLS 1.2+)
- [ ] Access logging (who accessed what, when)
- [ ] Audit trails (immutable logs)
- [ ] Business Associate Agreements (BAAs) with vendors

---

## Integration with Themis

Themis applies this skill during code review:

```
Themis receives code for review
  ↓
Applies security-audit-pro skill
  ↓
Runs SAST checks (manual pattern matching)
  ↓
Runs SCA checks (pip-audit / npm audit)
  ↓
Checks container security (Dockerfile, docker-compose)
  ↓
Scans for PII patterns
  ↓
Checks compliance patterns
  ↓
Returns security review results
```
