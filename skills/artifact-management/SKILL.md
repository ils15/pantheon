---
name: artifact-management
description: "Complete guide to the artifact trail system - plans directory structure, templates, and best practices for documenting feature implementations"
context: fork
argument-hint: "Artifact to create or manage — e.g. 'PLAN', 'IMPL', 'REVIEW', 'DISC', 'ADR' with topic and scope"
globs: ["**/docs/memory-bank/**", "**/instructions/**"]
alwaysApply: false
---

# Artifact Management & Plans Directory Structure

Complete guide to the artifact trail system that documents every feature implementation. This skill covers the plans/ directory structure, artifact templates, and best practices for maintaining institutional memory.

---

## The Artifact Trail System

**What:** Repository of all feature planning, phase results, and completion artifacts  
**Where:** `/plans/` directory (excluded from git by default)  
**Who:** Athena (creates plans), Themis (reviews phases), Mnemosyne (documents completion)  
**Why:** Audit trail, knowledge transfer, resumable work, accountability

---

## Directory Structure

```
plans/
├── .gitignore              # Exclude plans from git (optional)
├── README.md              # How to use plans directory
│
├── jwt-authentication/     # Feature 1
│   ├── plan.md            # Planning phase (Athena)
│   ├── phase-1-complete.md
│   ├── phase-2-complete.md
│   ├── phase-3-complete.md
│   └── complete.md        # Final summary (Mnemosyne)
│
├── email-verification/     # Feature 2
│   ├── plan.md
│   ├── phase-1-complete.md
│   ├── phase-2-complete.md
│   └── complete.md
│
├── payment-integration/    # Feature 3
│   ├── plan.md
│   ├── phase-1-complete.md
│   ├── phase-2-complete.md
│   ├── phase-3-complete.md
│   ├── phase-4-complete.md
│   └── complete.md
```

**Key Point:** Each feature is a directory with time-stamped artifacts tracking every phase.

---

## Artifact Types & Templates

### 1️⃣ Artifact Type: plan.md (Created by Athena)

**Purpose:** Detailed planning document with phases, tasks, and requirements  
**Created by:** @athena during planning phase  
**Reviewed by:** User (Pause Point 1)  
**Stored at:** `plans/[feature-name]/plan.md`

**Template:**

```markdown
# Feature: [Feature Name]

**Status:** APPROVED by [user/team] on [date]  
**Estimated Duration:** [X hours/days]  
**Archive Date:** [When will this feature be "done"?]

## Overview

[2-3 sentence summary of feature purpose and user value]

**Why:** [Business/user value]  
**Scope:** [What's included, what's NOT included]  
**Out of Scope:** [Explicitly list what NOT to do]

---

## Architecture Overview

[Brief architecture description]

**Technology Stack:**
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Frontend: React 18, TypeScript, Vite
- Database: PostgreSQL 14+
- Testing: pytest, vitest

**Key Design Decisions:**
- Decision 1: [Why we chose this]
- Decision 2: [Alternative considered, why rejected]

---

## Implementation Phases (TDD-Driven)

### Phase 1: Database Schema
**Duration:** ~1-2 hours  
**Owner:** Demeter  
**Files to create/modify:**
- `migrations/001_create_jwt_tokens.py` (new)
- `models/JWTToken.py` (new)
- `tests/test_jwt_token_model.py` (new)

**Test Requirements (RED phase):**
```
✓ JWTToken model stores user_id, token, issued_at, expires_at
✓ Token expiry validation
✓ Token revocation support
✓ Migration backward compatible
✓ Indexes on user_id + token for queries
```

**Acceptance Criteria:**
- ✅ Migration applies cleanly (up + down)
- ✅ Schema matches diagram below
- ✅ Coverage >80%

**Potential Risks:**
- Risk: Database lock during migration
- Mitigation: Use zero-downtime expand-contract strategy

---

### Phase 2: Backend Services
**Duration:** ~2-3 hours  
**Owner:** Hermes  
**Files to create/modify:**
- `services/JWTService.py` (new)
- `services/AuthService.py` (modify)
- `endpoints/auth.py` (modify)
- `tests/test_jwt_service.py` (new)
- `tests/test_auth_endpoints.py` (modify)

**Test Requirements (RED phase):**
```
✓ Generate JWT with claims (user_id, exp)
✓ Verify JWT signature
✓ Decode JWT securely
✓ Refresh token generation
✓ Token revocation (blacklist check)
✓ POST /auth/login returns JWT
✓ POST /auth/refresh returns new JWT
✓ GET /auth/verify validates token
✓ Expired token returns 401
```

**API Contracts:**
```
POST /auth/login
  Request: {email: string, password: string}
  Response: {access_token: string, refresh_token: string, expires_in: number}
  Error: 401 if credentials invalid

POST /auth/refresh
  Request: {refresh_token: string}
  Response: {access_token: string, expires_in: number}
  Error: 401 if refresh token expired

GET /auth/verify (with Authorization header)
  Response: {valid: boolean, user_id: number, exp: timestamp}
  Error: 401 if token invalid
```

**Acceptance Criteria:**
- ✅ All 8 test cases passing
- ✅ Coverage >80%
- ✅ Security: No secrets in logs
- ✅ Performance: Token verify <10ms

**Potential Risks:**
- Risk: Token expiry race condition
- Mitigation: Use server time, not client time

---

### Phase 3: Frontend Integration
**Duration:** ~2-3 hours  
**Owner:** Athena  
**Files to create/modify:**
- `components/LoginForm.tsx` (new)
- `hooks/useAuth.ts` (modify)
- `utils/tokenStorage.ts` (new)
- `tests/LoginForm.test.tsx` (new)
- `tests/useAuth.test.ts` (modify)

**Test Requirements (RED phase):**
```
✓ LoginForm renders email + password inputs
✓ Form submission calls auth API
✓ Success stores tokens in secure storage
✓ Error displays validation message
✓ useAuth hook reads token from storage
✓ useAuth provides logout function
✓ Logout clears tokens
✓ Expired token triggers re-login
✓ WCAG AA accessibility

```

**Component Contracts:**
```typescript
// LoginForm.tsx
interface LoginFormProps {
  onLoginSuccess: () => void;
  onError?: (error: string) => void;
}

// useAuth.ts
interface AuthState {
  isLoggedIn: boolean;
  user?: User;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

**Acceptance Criteria:**
- ✅ LoginForm accepts email + password
- ✅ Tokens stored securely (not localStorage)
- ✅ Auto-refresh on token expiry
- ✅ WCAG AA compliant
- ✅ Coverage >80%

**Potential Risks:**
- Risk: Token XSS vulnerability
- Mitigation: Use secure cookie or httpOnly storage

---

## Approval Gates

```
After each phase completes:

Phase Complete
    ↓
Themis Review:
  ✓ Coverage >80%?
  ✓ Security pass?
  ✓ Tests all green?
    ↓
  ✅ APPROVED → Next phase
  ❌ BLOCKED  → Fix + retry
```

---

## Timeline

| Phase | Start | Duration | Owner | Status |
|-------|-------|----------|-------|--------|
| 1. Schema | [date] | 1-2h | Demeter | ⏳ Pending |
| 2. Backend | [date] | 2-3h | Hermes | ⏳ Pending |
| 3. Frontend | [date] | 2-3h | Athena | ⏳ Pending |
| **Total** | | **5-8h** | All | ⏳ Pending |

---

## FAQ

**Q: What if a phase takes longer than estimated?**  
A: Report immediately. Adjust timeline. No hidden delays.

**Q: Can phases run in parallel?**  
A: Yes! After schema is done (Phase 1), Backend (Phase 2) and Frontend (Phase 3) can run in parallel.

**Q: What if we discover a design issue mid-phase?**  
A: Document decision in phase-N-complete.md. Discuss with team. Proceed if minor, revisit plan if major.

---

**Approved by:** [Name/Team]  
**Date:** [YYYY-MM-DD]  
**Next Review:** After Phase 1

---

[END OF PLAN.MD TEMPLATE]
```

**plan.md Checklist:**
- ✅ Overview is clear & reasons explained
- ✅ Architecture diagram included (if complex)
- ✅ 3-10 phases clearly defined
- ✅ Each phase has: owner, files to modify, test requirements, risks
- ✅ API contracts defined (if backend feature)
- ✅ Component contracts defined (if frontend feature)
- ✅ Approval gates documented
- ✅ Timeline realistic
- ✅ FAQ addresses common questions

---

### 2️⃣ Artifact Type: phase-N-complete.md (Created by Mnemosyne)

**Purpose:** Document single phase results, metrics, and approval status  
**Created by:** @mnemosyne after each phase completes  
**Created after:** Themis approves phase (coverage >80%, security pass, all tests pass)  
**Stored at:** `plans/[feature-name]/phase-N-complete.md`

**Template:**

```markdown
# Phase N Complete: [Phase Description]

**Completion Date:** [YYYY-MM-DD]  
**Completed by:** [Agent names: Hermes + Athena + Demeter]  
**Reviewed by:** Themis  
**Status:** ✅ APPROVED

---

## Summary

[1-2 paragraph summary of what was implemented in this phase]

**Phase Objective:** [Repeat from plan.md]  
**Result:** ✅ Successfully completed

---

## Files Modified/Created

### Created (New Files)
- `services/JWTService.py` - JWT generation, verification, refresh
- `tests/test_jwt_service.py` - 24 test cases, all passing
- `migrations/001_create_jwt_tokens.py` - Database schema

### Modified (Existing Files)
- `services/AuthService.py` - Added refresh token method (line 45-62)
- `endpoints/auth.py` - Added 3 new endpoints (POST /auth/login, etc)
- `tests/test_auth_endpoints.py` - Added 12 new integration tests

### Unchanged
- `models/User.py` - No changes needed
- `database/__init__.py` - Backward compatible

**Total Lines Added:** 1,247  
**Total Lines Modified:** 89  
**Total Lines Deleted:** 0 (no breaking changes)

---

## Tests Summary

### Backend (Hermes)
```
File: tests/test_jwt_service.py
  ✅ test_generate_jwt_with_claims → PASSED
  ✅ test_verify_jwt_valid → PASSED
  ✅ test_verify_jwt_expired → PASSED
  ✅ test_verify_jwt_invalid_signature → PASSED
  ✅ test_refresh_token_generates_new_jwt → PASSED
  ... (19 more tests)
  
Total: 24 tests, 100% passing
Coverage: app/services/jwt.py = 96% (24/25 lines)
```

### Frontend (Athena)
```
File: tests/LoginForm.test.tsx
  ✅ test_login_form_renders → PASSED
  ✅ test_login_form_submits_with_credentials → PASSED
  ✅ test_login_form_displays_error_on_failure → PASSED
  ✅ test_login_form_WCAG_AA_compliant → PASSED
  ✅ test_login_form_secure_token_storage → PASSED
  ... (8 more tests)
  
Total: 13 tests, 100% passing
Coverage: src/components/LoginForm.tsx = 94% (32/34 lines)
```

### Database (Demeter)
```
File: tests/test_migrations.py
  ✅ test_migration_001_applies_forward → PASSED
  ✅ test_migration_001_reverts_backward → PASSED
  ✅ test_jwt_token_table_has_correct_schema → PASSED
  ✅ test_jwt_token_indexes_exist → PASSED
  
Total: 4 tests, 100% passing
Coverage: migrations/001_create_jwt_tokens.py = 100%
```

---

## Code Quality Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Coverage | >80% | 95% | ✅ |
| Cyclomatic Complexity | <10 | 4 | ✅ |
| Type Hints | 100% | 100% | ✅ |
| Doc Strings | 100% | 100% | ✅ |
| Linting (pylint) | 0 errors | 0 errors | ✅ |

---

## Security Audit (Themis Review)

**OWASP Top 10 Check:**
- ✅ A01 Broken Access Control: Token validation implemented
- ✅ A02 Cryptographic Failures: bcrypt + secure random (not MD5)
- ✅ A03 Injection: Parameterized queries only
- ✅ A04 Insecure Design: Rate limiting on login (5 attempts/min)
- ✅ A05 Security Misconfiguration: Secrets from env, not hardcoded
- ✅ A06 Vulnerable Components: Dependencies up-to-date
- ✅ A07 Auth Failures: Proper timeout + refresh logic
- ✅ A08 Software Data Integrity: Signed JWTs
- ✅ A09 Logging & Monitoring: Errors logged with context
- ✅ A10 SSRF: No external calls in token flow

**Additional Security Checks:**
- ✅ No SQL injection vulnerabilities
- ✅ No hardcoded secrets/credentials in code
- ✅ No sensitive data in logs
- ✅ No XXE vulnerabilities
- ✅ CORS properly configured
- ✅ API rate limiting enabled

**Result:** ✅ APPROVED

---

## Performance Analysis

### Backend
- Token generation: 2.3ms (target <5ms) ✅
- Token verification: 1.8ms (target <5ms) ✅
- Database queries: 0 N+1 detected ✅
- Memory usage: No leaks detected ✅

### Frontend
- LoginForm render time: 12ms (target <50ms) ✅
- Token storage/retrieval: 0.5ms (target <5ms) ✅
- No console errors ✅
- Accessibility score: 98/100 ✅

### Database
- Migration forward: 45ms ✅
- Migration backward: 38ms ✅
- Index creation: 12ms ✅
- Query performance: All <100ms ✅

**Result:** ✅ APPROVED

---

## Deployment Considerations

### Backward Compatibility
- ✅ Existing auth flow unchanged
- ✅ No database schema breaking changes
- ✅ New endpoints are additive only
- ✅ Frontend works with or without tokens

### Zero-Downtime Deployment
1. Deploy backend first (adds JWT endpoints, doesn't remove old)
2. Wait 5 minutes for load balancers
3. Deploy frontend (uses new endpoints)
4. Monitor 15 minutes for errors
5. Remove old auth endpoints (next release)

### Rollback Plan
- If critical issue: Revert frontend first
- Then revert backend (JWT endpoints still live, no harm)
- Database migration reversible (alembic downgrade)

---

## Decisions Made This Phase

**Decision 1: JWT vs Session Tokens**
- Chosen: JWT (stateless, scalable)
- Alternative: Session tokens (stateful, simpler auth)
- Reason: Microservices future-proof, no server-side state

**Decision 2: Refresh Token in Secure Cookie vs Response**
- Chosen: HttpOnly secure cookie (XSS protected)
- Alternative: Response body (easier to refresh)
- Reason: Better security for web, httpOnly prevents JS access

**Decision 3: Token Expiry Time**
- Chosen: 15 minutes access + 7 days refresh
- Alternative: 1 hour access + 30 days refresh
- Reason: Better security balance for typical usage

---

## Test Coverage Map

```
Total Coverage: 95%

app/services/jwt.py  ████████████████████ 96%
endpoints/auth.py    ███████████████████░ 95%
models/jwt_token.py  ████████████████████ 100%
views/login.tsx      ███████████████████░ 94%
hooks/useAuth.ts     ████████████████░░░░ 88%

Lines NOT covered (5%):
- jwt.py line 156: Error fallback (rarely hit)
- auth.py line 203: Redis connection error (retry logic)
- useAuth.ts line 89: Old browser compatibility (IE11 fallback)
```

---

## Lessons Learned

**What Went Well:**
- ✅ TDD approach caught edge cases early
- ✅ Parallel phases (backend + frontend) saved 2 hours
- ✅ Good API contract specs prevented rework
- ✅ Security audit early prevented late fixes

**What Could Improve:**
- ⚠️ Database indexes added late (should be in plan)
- ⚠️ Frontend storage decision changed mid-phase (sync earlier)
- ⚠️ Edge case: token refresh race condition (add test)

**Recommendations for Next Time:**
- Start performance benchmarks earlier
- Lock API contracts before implementation
- Include index strategy in database phase plan

---

## Next Steps

1. ✅ Phase N approved for production
2. 🔄 Prepare Phase N+1 (Frontend integration)
3. 📋 User: Review & commit this phase
4. 🚀 After all phases: Deploy to staging & QA

---

## Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| Developer | Hermes | ✅ Ready | [date] |
| Developer | Athena | ✅ Ready | [date] |
| Developer | Demeter | ✅ Ready | [date] |
| Code Reviewer | Themis | ✅ Approved | [date] |
| QA/Product | [User] | ⏳ Pending | [date] |

---

[END OF PHASE-N-COMPLETE.MD TEMPLATE]
```

**phase-N-complete.md Checklist:**
- ✅ Phase summary clear & concise
- ✅ All files created/modified listed
- ✅ Test results included (all passing)
- ✅ Coverage >80% documented
- ✅ Security audit results included
- ✅ Performance analysis included
- ✅ Deployment considerations documented
- ✅ Decisions + rationale documented
- ✅ Test coverage map shows what's covered
- ✅ Lessons learned noted
- ✅ Sign-off section for accountabilty

---

### 3️⃣ Artifact Type: complete.md (Created by Mnemosyne)

**Purpose:** Final summary after all phases complete  
**Created by:** @mnemosyne after last phase approved  
**Stored at:** `plans/[feature-name]/complete.md`

**Template:**

```markdown
# Feature Complete: [Feature Name]

**Project Duration:** [Start date] to [End date]  
**Total Time:** [X hours/days]  
**Team:** Athena (planning) + Hermes (backend) + Athena (frontend) + Demeter (database) + Themis (review) + Mnemosyne (docs)  
**Status:** ✅ READY FOR PRODUCTION

---

## Executive Summary

[2-3 paragraph summary of feature, value delivered, and quality metrics]

---

## Phases Completed

| Phase | Owner | Status | Coverage | Duration |
|-------|-------|--------|----------|----------|
| 1. Database Schema | Demeter | ✅ Complete | 100% | 1.5h |
| 2. Backend Services | Hermes | ✅ Complete | 96% | 2.5h |
| 3. Frontend Integration | Athena | ✅ Complete | 94% | 2.5h |
| **TOTAL** | **All** | **✅ Complete** | **95% avg** | **6.5h** |

---

## Feature Metrics

### Code Quality
- Total Coverage: **95%** (target: >80%) ✅
- Lines of Code Added: 2,487
- Test Cases Added: 41
- Test Pass Rate: **100%**
- Bugs Found in Testing: 0
- Security Issues Found: 0

### Performance
- Backend Response Time: <50ms (target: <100ms) ✅
- Frontend Render Time: 12ms (target: <50ms) ✅
- Database Query Time: <20ms (target: <100ms) ✅
- No N+1 queries detected ✅

### Accessibility
- WCAG AAA Compliance: **100%** ✅
- Automated audit score: **98/100** ✅
- Keyboard navigation: **100%** ✅
- Screen reader compatible: **Yes** ✅

---

## Files Summary

### Backend
- 3 new service files
- 2 modified endpoint files
- 1 new migration
- 24 new tests (+12 modified)

### Frontend
- 1 new component (LoginForm)
- 1 modified hook (useAuth)
- 1 new utility (tokenStorage)
- 13 new tests (+5 modified)

### Database
- 1 new migration (forward + backward)
- 4 new index definitions
- 0 breaking changes

**Total Files: 18 changed (+5 new)**

---

## What's Included ✅

- ✅ JWT authentication with refresh tokens
- ✅ Secure token storage (httpOnly cookies)
- ✅ Login/logout UI with validation
- ✅ Auto-token-refresh on expiry
- ✅ API rate limiting (5 attempts/min)
- ✅ OWASP compliance (all 10 checks)
- ✅ >95% code coverage
- ✅ Zero-downtime deployment strategy
- ✅ Full TDD test suite (41 tests)
- ✅ Backward compatible

---

## What's NOT Included (Out of Scope) ❌

- ❌ Social login (Google, GitHub)
- ❌ Multi-factor authentication (2FA)
- ❌ Single sign-on (SSO)
- ❌ Password reset flow
- ❌ Email verification

*These can be added in future features*

---

## Deployment Instructions

### Prerequisites
- PostgreSQL 14+
- Python 3.11+
- Node.js 18+
- Redis (optional, for session cache)

### Steps

1. **Backup Database**
   ```bash
   pg_dump production_db > backup_$(date +%s).sql
   ```

2. **Deploy Backend**
   ```bash
   git checkout feature/jwt-auth
   pip install -r requirements.txt
   alembic upgrade head
   python -m pytest tests/ --cov
   docker build -t backend:new .
   kubectl set image deployment/backend backend=backend:new
   ```

3. **Wait 5 minutes** for load balancer sync

4. **Deploy Frontend**
   ```bash
   npm run build
   docker build -t frontend:new .
   kubectl set image deployment/frontend frontend=frontend:new
   ```

5. **Monitor**
   - Watch: Error rate, latency, 401/403 responses
   - Duration: 15 minutes
   - If issues: Kubernetes rollback command ready

### Rollback (if needed)
```bash
# Frontend first
kubectl set image deployment/frontend frontend=frontend:old

# Then backend (JWT endpoints still live, no harm)
kubectl set image deployment/backend backend=backend:old

# Database (backward compatible)
alembic downgrade -1
```

---

## Test Results Summary

### Unit Tests: 41 total, 41 passing ✅

**Backend (24 tests)**
- JWT Service: 8 tests (generation, verify, refresh, expiry)
- Auth Service: 8 tests (edge cases, errors, security)
- Auth Endpoints: 8 tests (API contracts, status codes)

**Frontend (13 tests)**
- LoginForm: 6 tests (render, submit, validation, accessibility)
- useAuth Hook: 5 tests (state, side effects, errors)
- Token Storage: 2 tests (secure storage, retrieval)

**Database (4 tests)**
- Migration forward: 1 test
- Migration backward: 1 test
- Schema validation: 2 tests

### Integration Tests: 8 total, 8 passing ✅
- Full auth flow (login → token → verify → logout)
- Token refresh flow
- Expired token handling
- Rate limiting

### End-to-End Tests: 0 (manual QA phase)
- Login form submission
- Token refresh on expiry
- Logout clearing state

---

## Security Audit Results

**OWASP Top 10: 10/10 Passed** ✅

- ✅ A01 Broken Access Control
- ✅ A02 Cryptographic Failures (bcrypt + JWT signing)
- ✅ A03 Injection (parameterized queries)
- ✅ A04 Insecure Design (threat model reviewed)
- ✅ A05 Security Misconfiguration (secrets from env)
- ✅ A06 Vulnerable Components (dependencies audited)
- ✅ A07 Authentication Failures (proper validation)
- ✅ A08 Data Integrity (signed JWTs)
- ✅ A09 Logging & Monitoring (errors logged)
- ✅ A10 SSRF (no external calls)

**Additional Checks: 12/12 Passed** ✅
- ✅ No hardcoded secrets
- ✅ No SQL injection vulnerabilities
- ✅ No XSS vulnerabilities
- ✅ No CSRF vulnerabilities
- ✅ No XXE vulnerabilities
- ✅ Proper rate limiting
- ✅ Secure token expiry
- ✅ CORS properly configured
- ✅ No sensitive data in logs
- ✅ Error messages don't leak internals
- ✅ HttpOnly cookies used
- ✅ Dependencies up-to-date (npm audit, pip audit)

**Sentiment:** Feature meets security standards for production ✅

---

## Known Limitations

| Limitation | Workaround | Priority |
|-----------|-----------|----------|
| Token revocation requires server-side check | Implement token blacklist in Redis | Medium |
| No password reset flow | Will add in Phase 4 | Medium |
| No email verification | Will add in Phase 5 | Low |
| Mobile app support limited | Need native OAuth flow | High |

---

## Recommendations for Next Feature

1. **Lock API contracts earlier** - Save rework time
2. **Performance benchmarks from phase 1** - Not phase 3
3. **Include database indexes in plan** - Not added after
4. **Earlier security review** - Don't wait for final phase
5. **More integration tests** - Catch cross-layer issues

---

## Files Committed to Git

```bash
git log --oneline [base]..feature/jwt-auth | head -20

abc1234 feat: Complete JWT authentication feature
  - 3 phases completed
  - 95% coverage
  - All security  checks passed
  - Ready for production

abc1235 feat: Add frontend login form with token storage
abc1236 feat: Add JWT service and auth endpoints
abc1237 feat: Create JWT token database schema

# Can now:
git log --stat feature/jwt-auth
git log --patch feature/jwt-auth
git diff main..feature/jwt-auth | wc -l  # 2,487 lines changed
```

---

## What to Do Now

### Option 1: Merge to Staging
```bash
git checkout main
git merge --no-ff feature/jwt-auth
git push origin main
# Triggers CI/CD → automatically deploys to staging
```

### Option 2: Create Pull Request (for review)
```bash
gh pr create --title "feat: Add JWT authentication" \
  --body "See: plans/jwt-authentication/complete.md"
# Let human reviewers approve before merge
```

### Option 3: Manual QA Before Merge
```bash
# Deploy feature branch to QA environment
git checkout feature/jwt-auth
./deploy.sh qa

# Test manually in QA
# If no issues: Merge to main
```

---

## Team Summary

### Metrics by Agent

| Agent | Contribution | Time | Coverage |
|-------|-------------|------|----------|
| Athena | Planning (plan.md) | 0.5h | - |
| Hermes | Backend (2 files, 24 tests) | 2.5h | 96% |
| Athena | Frontend (3 files, 13 tests) | 2.5h | 94% |
| Demeter | Database (1 migration, 4 tests) | 0.5h | 100% |
| Themis | Reviews (all phases) | 1h | - |
| Mnemosyne | Docs (3 artifacts) | 0.5h | - |
| **Total** | | **7.5h** | **95%** |

---

## Success Criteria Met

| Criterion | Requirement | Actual | Status |
|-----------|-------------|--------|--------|
| Code Coverage | >80% | 95% | ✅ |
| Security | OWASP 10/10 | 10/10 | ✅ |
| Performance | <100ms latency | <50ms | ✅ |
| Accessibility | WCAG AAA | 98/100 | ✅ |
| Tests | 100% passing | 41/41 | ✅ |
| Backward Compat | No breaking changes | 0 breaking | ✅ |
| Documentation | Complete & clear | Yes | ✅ |
| Production Ready | Can deploy Friday | Yes ✅ | ✅ |

---

## Next Features (Recommended Roadmap)

1. **Password Reset Flow** (2-3 phases, 6h)
   - Email service integration
   - Secure reset token
   - Frontend reset form

2. **Multi-Factor Authentication** (3-4 phases, 8h)
   - TOTP support (Google Authenticator)
   - SMS backup codes
   - 2FA setup flow

3. **Social Login** (2-3 phases, 6h)
   - Google OAuth
   - GitHub OAuth
   - Microsoft integration

---

## Artifact Trail

All planning & phase documents available at:
```
plans/jwt-authentication/
├── plan.md (Initial plan, 12KB)
├── phase-1-complete.md (Schema, 8KB)
├── phase-2-complete.md (Backend, 15KB)
├── phase-3-complete.md (Frontend, 12KB)
└── complete.md (This file, 18KB)

Total: ~65KB of documentation
Archive forever for: Future team reference, audits, similar features
```

---

## Sign-Off

| Role | Name | Status | Date |
|------|------|--------|------|
| Implementer | @zeus | ✅ Complete | [date] |
| Code Reviewer |  | ✅ Approved | [date] |
| Product | [User] | ⏳ Pending merge | [date] |
| Ops/Deployment | [DevOps] | ⏳ Scheduling | [date] |

---

**Version:** 1.0  
**Feature:** JWT Authentication with Refresh Tokens  
**Status:** ✅ PRODUCTION READY  
**Deployed to:** [Staging/Production]  
**Date Deployed:** [YYYY-MM-DD]

---

🎉 **Feature Complete & Ready for Production!** 🎉

Next: Merge to main, deploy to prod, or start Phase 4.

[END OF COMPLETE.MD TEMPLATE]
```

**complete.md Checklist:**
- ✅ Executive summary (1-2 paragraphs)
- ✅ Phase summary table (all phases + coverage)
- ✅ Feature metrics (coverage, lines, tests, bugs)
- ✅ Performance analysis
- ✅ Accessibility results
- ✅ All files listed (created, modified, unchanged)
- ✅ What's included vs what's NOT included
- ✅ Deployment instructions (step-by-step)
- ✅ Rollback procedure
- ✅ Full test summary (unit + integration + E2E)
- ✅ Security audit results (OWASP 10/10)
- ✅ Known limitations & workarounds
- ✅ Recommendations for next time
- ✅ Git log + merge instructions
- ✅ Team summary by agent
- ✅ Success criteria checklist
- ✅ Recommended roadmap (next features)
- ✅ Artifact trail (where everything is stored)
- ✅ Sign-off section (accountability)

---

## Best Practices

### ✅ DO

✅ **Create plan.md BEFORE starting implementation**
- Prevents rework
- Communicates design early
- Gets user buy-in before effort

✅ **Complete phase-N-complete.md AFTER Themis approves**
- Documents what actually happened (vs what was planned)
- Shows metrics & decisions made
- Creates audit trail

✅ **Store in plans/[feature-name]/ directory**
- Organized by feature
- Easy to find all artifacts for one feature
- Can archive old features

✅ **Use standardized templates**
- Consistency across team
- Easier to read/search
- Reduces documentation work

✅ **Update artifacts as you learn**
- Decisions change mid-phase - document why
- Metrics differ from estimates - explain
- Risks emerge - explain mitigation

✅ **Reference artifacts in git commits**
```bash
git commit -m "feat: Add JWT service

See: plans/jwt-auth/phase-2-complete.md for details
Coverage: 96%, Security: ✅, Tests: 24/24 passing"
```

---

### ❌ DON'T

❌ **DON'T skip planning (Athena)**
- Leads to mid-phase redesign
- Costs 2-3x more time
- Increases bugs

❌ **DON'T skip TDD**
- Tests written after code miss edge cases
- Coverage looks good but isn't
- Bugs escape to production

❌ **DON'T skip code review (Themis)**
- Security issues not caught
- Performance problems not fixed
- Technical debt accumulates

❌ **DON'T leave artifacts empty**
- Future team doesn't know what happened
- Can't learn from past decisions
- Repeats same mistakes

❌ **DON'T make phase-N-complete.md AFTER final commit**
- Metrics might be old
- Changes forgotten
- Document as-you-go

---

## Real-World Example

```
Feature: Email Verification Flow
Plan Duration: 3 phases, 6-8 hours

Timeline:
Morning:
  09:00 - Athena creates plans/email-verification/plan.md
  09:30 - User reviews & approves plan
  10:00 - Hermes starts Phase 1 (Email service)
  
Afternoon:
  12:00 - Hermes Phase 1 done, Themis reviews (coverage 92%)
  12:30 - Mnemosyne creates phase-1-complete.md
  12:45 - User commits Phase 1
  13:00 - Athena Phase 2 (Verification form) + Demeter (migration) parallel
  
Next morning:
  09:00 - Athena + Demeter phases done
  09:30 - Themis reviews both (coverage 94%) 
  10:00 - Mnemosyne creates phase-2 & phase-3-complete.md
  10:30 - Mnemosyne creates complete.md (final summary)
  11:00 - User merges to main
  11:30 - Deployed to staging
  12:00 - QA testing in staging
  14:00 - Deploy to production
  
Total: 1.5 days of work
Artifacts: plan.md + 3x phase-N-complete.md + complete.md
Knowledge: Everything documented for future reference
```

---

**Version:** 1.0  
**Status:** Production-Ready  
**Used by:** Athena, Themis, Mnemosyne, All Agents  
**Location:** `/plans/[feature-name]/`

Remember: Artifacts are your institutional memory. Good documentation means your team can understand, learn, and repeat success.
