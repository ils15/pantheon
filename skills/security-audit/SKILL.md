---
name: security-audit
description: "Security audit and vulnerability detection - OWASP Top 10, input validation, injection attacks"
context: fork
argument-hint: "Security audit scope — describe codebase area, threat model, compliance requirements (OWASP/SOC2/PCI), and severity thresholds"
globs: ["**/*.py", "**/*.ts", "**/*.tsx"]
alwaysApply: false
---

# Security Audit Skill

## OWASP Top 10 Checks

### 1. Broken Access Control
```python
# ❌ WRONG: No authorization check
@router.delete("/users/{user_id}")
async def delete_user(user_id: int):
    await db.delete(User, user_id)

# ✅ RIGHT: Check permissions
@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: User):
    if user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorized")
    await db.delete(User, user_id)
```

### 2. Cryptographic Failures
```python
# ❌ WRONG: Store plain password
user.password = password

# ✅ RIGHT: Hash password
user.password = hashlib.sha256(password.encode()).hexdigest()
# Better: use bcrypt/argon2
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"])
user.password = pwd_context.hash(password)
```

### 3. Injection Attacks
```python
# ❌ WRONG: SQL injection
query = f"SELECT * FROM users WHERE email = '{email}'"

# ✅ RIGHT: Parameterized queries
query = select(User).where(User.email == email)
```

### 4. Insecure Design
- Input validation on ALL endpoints
- Rate limiting on sensitive operations
- CSRF tokens for state changes
- CORS properly configured

### 5. Security Misconfiguration
```python
# ❌ WRONG: Debug in production
app = FastAPI(debug=True)

# ✅ RIGHT: Debug only in dev
app = FastAPI(debug=os.getenv("ENVIRONMENT") == "development")
```

### 6. Vulnerable & Outdated Components
- Pin dependencies versions
- Regular security updates
- Audit packages: `pip audit`
- Use dependabot/renovate

### 7. Authentication Failures
```python
# ✅ Best Practice: JWT with expiration
token = jwt.encode(
    {
        "sub": user.id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    },
    SECRET_KEY,
    algorithm="HS256"
)
```

### 8. Software & Data Integrity Failures
- Verify package signatures
- Use HTTPS only
- Sign API responses (when needed)

### 9. Logging & Monitoring Failures
```python
# ✅ Log security events
logger.warning(f"Failed login attempt for {email}")
logger.error(f"SQL error encountered: {error_code}")
# BUT: Never log passwords, tokens, PII!
```

### 10. Server-Side Request Forgery (SSRF)
- Validate URLs before fetching
- Whitelist allowed domains
- Disabled redirects to internal IPs

## Checklist
- [ ] All inputs validated
- [ ] Passwords hashed (bcrypt/argon2)
- [ ] No hardcoded secrets
- [ ] CORS configured properly
- [ ] Rate limiting active
- [ ] Errors don't leak info
- [ ] HTTPS only
- [ ] Security headers set

## LLM-Specific Security (AI Security Top 10)

### Prompt Injection Detection
```python
import re
from typing import Optional

class PromptInjectionDetector:
    """Detect prompt injection attempts in user inputs."""
    
    # Common jailbreak patterns
    JAILBREAK_PATTERNS = [
        r"ignore all (previous|prior) instructions",
        r"you are now (acting as|role.?play)",
        r"forget (everything|all rules|all instructions)",
        r"DAN|do.anything.now",
        r"system.?prompt.?override",
        r"output (raw|original|internal|system) (prompt|instructions|promt)",
        r"bypass.?restrictions",
        r"reveal.?prompt",
    ]
    
    # Payload splitting patterns
    SPLIT_PATTERNS = [
        r"combine the (first|last) (part|half|letter)",
        r"ignore the (first|last) (sentence|paragraph|part)",
        r"decrypt|base64.?decode|rot13",
    ]
    
    @classmethod
    def scan(cls, text: str) -> list[dict]:
        findings = []
        for i, pattern in enumerate(cls.JAILBREAK_PATTERNS):
            if match := re.search(pattern, text, re.IGNORECASE):
                findings.append({
                    "type": "jailbreak_attempt",
                    "pattern": pattern,
                    "match": match.group(),
                    "severity": "HIGH",
                    "score": 0.9
                })
        return findings
```

### Output Sanitization & PII Redaction
```python
import re

class OutputSanitizer:
    """Sanitize LLM outputs to prevent data leakage."""
    
    PII_PATTERNS = {
        "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "api_key": r"(?:sk-[a-zA-Z0-9]{32,}|AIza[0-9A-Za-z\-_]{35})",
        "phone": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
        "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
        "ip_address": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
    }
    
    @classmethod
    def sanitize(cls, text: str, redact: bool = True) -> str:
        if not redact:
            return text
        for name, pattern in cls.PII_PATTERNS.items():
            text = re.sub(pattern, f"[REDACTED:{name}]", text)
        return text
```

### AWS Bedrock Guardrails
```python
class BedrockGuardrailConfig:
    """Configuration for AWS Bedrock Guardrails."""
    
    @staticmethod
    def create_guardrail_config() -> dict:
        return {
            "contentPolicyConfig": {
                "filtersConfig": {
                    "filters": [
                        {"type": "SEXUAL", "inputStrength": "HIGH", "outputStrength": "HIGH"},
                        {"type": "HATE", "inputStrength": "HIGH", "outputStrength": "HIGH"},
                        {"type": "VIOLENCE", "inputStrength": "HIGH", "outputStrength": "HIGH"},
                        {"type": "INSULTS", "inputStrength": "MEDIUM", "outputStrength": "MEDIUM"},
                    ]
                }
            },
            "sensitiveInformationPolicyConfig": {
                "piiEntitiesConfig": {
                    "type": "PIN",
                    "action": "BLOCK"  # or "ANONYMIZE"
                }
            },
            "topicPolicyConfig": {
                "topicsConfig": [{
                    "name": "HarmfulTopics",
                    "definition": "Topics related to harmful or illegal activities",
                    "examples": ["how to hack", "phishing template"],
                    "type": "DENY"
                }]
            }
        }
```
