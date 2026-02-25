---
name: orchestration-workflow
description: "Practical step-by-step walkthrough for orchestrating features end-to-end using the 9-agent system, from planning through deployment"
---

# Orchestration Workflow: Step-by-Step Guide

Practical walkthrough for using the 9-agent system end-to-end. This is your "how-to" guide for orchestrating features from planning through production deployment.

---

## Your First Feature (Real Example)

**Scenario:** You want to add JWT authentication to your app.  
**Time:** ~6-8 hours total (spread across 1-2 days)  
**Team:** All agents working together  
**Result:** Complete feature with 95% coverage, security audit passed, ready to deploy

---

## Step 1: Plan the Feature (30 minutes)

### What You Do

Open VS Code, start a chat with Copilot:

```
@aphrodite: Plan JWT authentication with refresh tokens

Requirements:
- User login with email + password
- JWT access token (15 min expiry)
- Refresh token (7 day expiry)
- Secure token storage (httpOnly cookies)
- Token verification on protected routes
- Rate limiting (5 attempts/min)
- OWASP Top 10 compliant

Please create a detailed 3-4 phase implementation plan.
```

### What Athena Does

Athena researches patterns, calls Apollo for existing auth code, and creates:

```
plans/jwt-authentication/plan.md
├─ Overview & objectives
├─ Phase 1: Database Schema (Maat)
│  ├─ Tasks: Create user + token tables
│  ├─ Test requirements: 5 test cases
│  └─ Risk: Zero-downtime migration
├─ Phase 2: Backend Services (Hermes)
│  ├─ Tasks: JWT service + endpoints
│  ├─ Test requirements: 8 test cases
│  └─ Risk: Token expiry edge cases
├─ Phase 3: Frontend Integration (Athena)
│  ├─ Tasks: LoginForm + useAuth hook
│  ├─ Test requirements: 6 test cases
│  └─ Risk: Token refresh race condition
└─ FAQ: Answers to common questions
```

**File:** ~500 lines of detail

### What You Do

1. Open `plans/jwt-authentication/plan.md`
2. **Read plan carefully** (10 min)
   - Do the 3 phases make sense?
   - Are the files to modify correct?
   - Are test requirements clear?
3. **Ask questions or approve**
   - If concerns: `@athena: Please adjust plan because...`
   - If approved: `Plan looks good, let's proceed`

### ⏸️ PAUSE POINT 1: Plan Approval

```
User: "Plan looks good"

Athena: ✅ Plan approved! Ready to orchestrate implementation

Next: Starting Phase 1 - Database Schema
```

---

## Step 2: Orchestrate Implementation (5-8 hours)

### Phase 1: Database Schema (1-2 hours)

**You say:**
```
@zeus: Orchestrate Phase 1 of JWT plan - Database Schema
```

**Zeus delegates to Maat:**
```
@maat: Implement database schema for JWT auth

Phase 1 from: plans/jwt-authentication/plan.md

Requirements:
- User table: id, email, hashed_password
- JWTToken table: id, user_id, token, issued_at, expires_at, revoked_at
- Indexes: user(email), token(user_id, token)

Test requirements from plan:
1. User table creation
2. JWTToken table creation
3. Unique constraint on user email
4. Indexes exist and work
5. Migration forward + backward works

Red → Green → Refactor TDD cycle required.
Coverage target: >80%
```

**Maat does:**
1. Write FAILING migration test (RED)
   ```python
   def test_jwt_token_table_exists():
       assert "jwt_token" in get_table_names()
   ```

2. Write minimal migration (GREEN)
   ```python
   def upgrade():
       op.create_table('jwt_token', [
           sa.Column('id', sa.Integer, primary_key=True),
           ...
       ])
   ```

3. Refactor migration (REFACTOR)
   - Add proper types (UUID for id)
   - Add indexes
   - Add constraints
   - Add timestamps

**Maat delivers:** Schema files + 4 test cases, 100% coverage

**Temis reviews:**
```
✅ Coverage: 100% 
✅ Security: No SQL injection
✅ Performance: Indexes present
✅ Tests: All 4 passing

APPROVED for Phase 1
```

**Mnemosyne documents:**
```
plans/jwt-authentication/phase-1-complete.md
├─ What was implemented
├─ Files created/modified
├─ Test results: 4/4 passing
├─ Coverage: 100%
├─ Security: ✅
└─ Git commit ready
```

### ⏸️ PAUSE POINT 2: Review Phase 1 Results

```
Zeus: "Phase 1 complete! See: phase-1-complete.md

Coverage: 100% ✅
Security: ✅
Tests: 4/4 passing ✅

Ready to continue to Phase 2?"

You: "continue"
```

### Phase 2: Backend Services (2-3 hours)

**Zeus delegates to Hermes:**
```
@hermes: Implement backend services for JWT auth

Phase 2 from: plans/jwt-authentication/plan.md
Database schema from Phase 1 complete.

Create:
1. JWTService: generate, verify, refresh JWT
2. AuthService: handle login/logout
3. Auth endpoints: POST /auth/login, POST /auth/refresh, GET /auth/verify

Test requirements:
1. Generate JWT with claims
2. Verify JWT signature
3. Decode JWT securely
4. Refresh token generation
5. Token revocation (blacklist)
6. POST /auth/login returns JWT
7. POST /auth/refresh returns new JWT
8. GET /auth/verify validates token

TDD: RED → GREEN → REFACTOR
Coverage target: >80%
```

**Hermes does (TDD):**

Test 1: RED
```python
def test_jwt_generation():
    service = JWTService()
    token = service.generate(user_id=1, expires_in_seconds=900)
    assert token is not None
    assert isinstance(token, str)
```

Test 1: GREEN
```python
class JWTService:
    def generate(self, user_id, expires_in_seconds):
        import jwt
        return jwt.encode(
            {"user_id": user_id, "exp": time.time() + expires_in_seconds},
            JWT_SECRET,
            algorithm="HS256"
        )
```

Test 1: REFACTOR
```python
class JWTService:
    def generate(self, user_id: int, expires_in_seconds: int) -> str:
        """Generate JWT token with expiry."""
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(seconds=expires_in_seconds),
            "iat": datetime.utcnow()
        }
        return jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm="HS256"
        )
```

...repeats for all 8 test cases...

**Hermes delivers:** Services + 24 unit tests, 96% coverage

**Temis reviews:**
```
✅ Coverage: 96%
✅ Security: Proper hashing, no secrets in logs
✅ Performance: Token verify <10ms
✅ Tests: 24/24 passing

APPROVED for Phase 2
```

**Mnemosyne documents:**
```
plans/jwt-authentication/phase-2-complete.md
├─ What was implemented
├─ Files created/modified  
├─ Test results: 24/24 passing
├─ Coverage: 96%
├─ Security audit: OWASP ✅
└─ Git commit ready
```

### ⏸️ PAUSE POINT 2: Review Phase 2 Results

```
Zeus: "Phase 2 complete! See: phase-2-complete.md

Coverage: 96% ✅
Security: OWASP compliant ✅
Tests: 24/24 passing ✅

Ready to continue to Phase 3?"

You: "continue"
```

### Phase 3: Frontend Integration (2-3 hours)

**Zeus delegates to Athena:**
```
@aphrodite: Implement frontend for JWT auth

Phase 3 from: plans/jwt-authentication/plan.md
Backend API available from Phase 2.

Create:
1. LoginForm component
2. useAuth hook for state management
3. Token storage utility (httpOnly cookies)
4. Protected route wrapper

Test requirements:
1. LoginForm renders email + password inputs
2. Form submission calls POST /auth/login
3. Token stored securely
4. useAuth hook manages auth state
5. Error displays validation message
6. Logout clears tokens
7. Auto-refresh on token expiry
8. WCAG AAA accessibility

TDD: RED → GREEN → REFACTOR
Coverage target: >80%
```

**Athena does (TDD):**

Test: RED
```javascript
test("LoginForm submits with email and password", () => {
    render(<LoginForm />);
    expect(screen.getByRole("textbox", {name: /email/i})).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", {name: /login/i})).toBeInTheDocument();
});
```

Test: GREEN
```jsx
export function LoginForm() {
    return (
        <form>
            <input placeholder="Email" />
            <input placeholder="Password" type="password" />
            <button>Login</button>
        </form>
    );
}
```

Test: REFACTOR
```jsx
export function LoginForm({onSubmitSuccess}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const res = await fetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({email, password})
            });
            
            if (!res.ok) throw new Error("Login failed");
            
            const {access_token} = await res.json();
            // Store token securely
            sessionStorage.setItem("jwt", access_token);
            onSubmitSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
            />
            
            <label htmlFor="password">Password</label>
            <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            
            {error && <p role="alert">{error}</p>}
            
            <button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
            </button>
        </form>
    );
}
```

...repeats for all 8 test cases + useAuth hook + token storage...

**Athena delivers:** Components + 13 component tests, 94% coverage

**Temis reviews:**
```
✅ Coverage: 94%
✅ Security: Tokens in httpOnly cookies
✅ Accessibility: WCAG AAA 98/100
✅ Tests: 13/13 passing

APPROVED for Phase 3
```

**Mnemosyne documents:**
```
plans/jwt-authentication/phase-3-complete.md
├─ What was implemented
├─ Files created/modified
├─ Test results: 13/13 passing
├─ Coverage: 94%
├─ Accessibility: 98/100
└─ Git commit ready
```

### ⏸️ PAUSE POINT 2: Review Phase 3 Results

```
Zeus: "Phase 3 complete! See: phase-3-complete.md

Coverage: 94% ✅
Accessibility: WCAG AAA ✅
Tests: 13/13 passing ✅

All phases approved!"
```

---

## Step 3: Final Summary (15 minutes)

**Mnemosyne creates:**
```
plans/jwt-authentication/complete.md
├─ All 3 phases completed ✅
├─ Total coverage: 95% average
├─ Total tests: 41 (all passing)
├─ Security: OWASP 10/10 compliant
├─ Deployment instructions
└─ Sign-off for production
```

**What you see:**
```
✅ JWT Authentication Complete

📊 Metrics:
- 3 phases: Database, Backend, Frontend
- 95% coverage (41 tests)
- Security: All OWASP checks ✅
- Performance: <50ms latency
- Accessibility: WCAG AAA

🚀 Ready to deploy
```

---

## Step 4: Commit to Git (5 minutes)

### ⏸️ PAUSE POINT 3: Git Commit

```
zeus: "All phases approved! Ready to commit."

Suggested commit message:
feat: Add JWT authentication with refresh tokens

- Create User + JWTToken database schema
- Implement JWTService + AuthService
- Add POST /auth/login, POST /auth/refresh, GET /auth/verify
- Create LoginForm + useAuth hook
- Add secure token storage (httpOnly cookies)
- Full TDD: 41 tests, 95% coverage
- Security: OWASP Top 10 compliant
- Accessibility: WCAG AAA

See: plans/jwt-authentication/complete.md
"

You: "git commit"
```

**Command:**
```bash
git add -A
git commit -m "feat: Add JWT authentication with refresh tokens

- Create User + JWTToken database schema
- Implement JWTService + AuthService
- Add POST /auth/login, POST /auth/refresh, GET /auth/verify
- Create LoginForm + useAuth hook
- Add secure token storage (httpOnly cookies)
- Full TDD: 41 tests, 95% coverage
- Security: OWASP Top 10 compliant
- Accessibility: WCAG AAA

See: plans/jwt-authentication/complete.md"
```

**Result:**
```
[feature/jwt-auth abc1234] feat: Add JWT authentication with refresh tokens
 12 files changed, 2487 insertions(+)
 create mode 100644 app/services/jwt.py
 ...

✅ Committed!
```

---

## Step 5: Deploy (Optional)

### Deploy to Staging
```bash
git push origin feature/jwt-auth
# Triggers CI/CD → Deploys to staging automatically
```

### Manual QA Testing
```bash
# Open staging environment
https://staging.example.com

# Test flow:
1. Click "Login"
2. Enter email + password
3. Should redirect to dashboard
4. JWT visible in browser storage (DevTools)
5. Logout clears token
6. Can't access protected routes without token
```

### Deploy to Production
```bash
# Create PR for review
gh pr create --title "feat: Add JWT authentication"

# Or merge directly if auto-approved by CI
git checkout main
git merge feature/jwt-auth
git push origin main

# Monitor production:
# - Error rate should be 0
# - 401 responses OK (failed logins)
# - 500 errors = problem
```

---

## Quick Reference: Workflow Commands

```bash
# Step 1: Plan
@aphrodite: Plan [feature description]

# Step 2: Orchestrate
@zeus: Implement feature using plan

# Step 3: At pause points
# - Review phase results
# - Approve before proceeding
# - See artifacts in plans/[feature]/phase-N-complete.md

# Step 4: Commit
git add -A
git commit -m "following git commit message format"

# Step 5: Deploy
git push origin [branch]
# CI/CD deploys automatically
```

---

## Troubleshooting

### Problem: Phase coverage is 76% (below 80% minimum)

**Solution:**
```
Zeus: "Coverage 76%, need 80% minimum" (BLOCKED)

Action:
1. Hermes adds missing test cases
2. Re-runs coverage: pytest --cov
3. Verify 80%+ coverage
4. Temis reviews again
5. Mnemosyne updates phase-N-complete.md
```

### Problem: Security audit found SQL injection

**Solution:**
```
Temis: "SQL injection in query (BLOCKED)"

Action:
1. Maat fixes query (parameterized)
2. Re-runs security audit
3. Verify fix
4. Temis reviews again
5. Phase proceeds
```

### Problem: Frontend accessibility score 82/100 (target 95)

**Solution:**
```
Temis: "Accessibility 82/100, need 95+ (BLOCKED)"

Action:
1. Athena improves accessibility
2. Runs accessibility audit again
3. Adds missing ARIA labels
4. Improves keyboard navigation
5. Re-checks: 97/100 ✅
6. Temis approves
```

---

## Common Patterns

### Pattern 1: Simple Bug Fix (Skip Athena, Use Apollo + Hermes)
```
Discovery:   @apollo: Find bug in authentication
Fix:         @hermes: Fix the validation error  
Review:      Auto-invoked by Hermes
Result:      Minimal code change, minimal risk
Timeline:    30 minutes
```

### Pattern 2: Complex Feature (Use Full System)
```
Plan:        @aphrodite: Plan architecture
Review:      User approves 5-phase plan ⏸️
Orchestrate: @zeus: Implement using plan
Result:      Complete 5-phase feature, 95% coverage
Timeline:    1-2 days
```

### Pattern 3: Database Optimization (Skip Athena, Use Apollo + Maat)
```
Discovery:   @apollo: Find N+1 queries
Optimize:    @maat: Add indexes + optimize queries
Review:      Auto-invoked by Maat
Result:      10x faster queries, <80 lines changed
Timeline:    2 hours
```

---

## Metrics to Track

After each feature, track:

```
Coverage:        95% (target >80%)
Security:        ✅ OWASP 10/10
Performance:     <50ms latency
Accessibility:   98/100
Tests:           41 total, 100% passing
Time invested:   6.5 hours
Phases:          3 complete
Commits:         3 atomic commits
Artifacts:       4 documents (plan + 3 phases + complete)
```

---

## Pro Tips

🎯 **Plan First** - Saves 2-3x rework time  
🎯 **Use Pause Points** - You control when to proceed  
🎯 **Trust Temis** - Code review catches issues early  
🎯 **Read Artifacts** - Plans contain everything you need  
🎯 **Commit Atomically** - One phase = one commit  
🎯 **Test First** - RED tests before code  
🎯 **Coverage Matters** - <80% = blocked, no exceptions  
🎯 **Security First** - Temis enforces OWASP compliance  

---

## Next Steps

1. ✅ Read this guide (done!)
2. ✅ Review agent reference in `9-agent-coordination/SKILL.md`
3. ✅ Review TDD standards in `tdd-with-agents/SKILL.md`
4. ✅ Review artifacts in `artifact-management/SKILL.md`
5. 🚀 Start your first feature: `@aphrodite: Plan [your idea]`

---

**Version:** 1.0  
**Purpose:** Practical walkthrough of 9-agent system  
**Time to complete:** Your first feature in 1-2 days  
**Status:** Ready to use

Let's build something great! 🚀

Remember: Plan → Orchestrate → Review → Commit → Deploy
Every phase has a pause point where YOU control the outcome.
