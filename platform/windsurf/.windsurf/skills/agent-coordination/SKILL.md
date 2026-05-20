---
name: agent-coordination
description: "Orchestrate multi-agent system for TDD-driven development. Use for coordinating complex features end-to-end."
context: fork
globs: ["**/.github/agents/**", "**/agents/*.agent.md"]
alwaysApply: false
---

# Agent Coordination System

Master guide to orchestrating the complete agent system for rapid, TDD-driven feature development with guaranteed code quality and audit trails.

## System Overview

**Architecture:** Conductor-Delegate pattern with specialized agents (extensible)

```
                    ⚡ ZEUS (Orchestrator)
                           |
     ┌─────────────────────┼─────────────────────┐
     |                     |                     |
🧠 ATHENA            🔍 APOLLO          Stage 1: Planning
(Plans)          (Discovers)
     |                     |
     └─────────────────────┼─────────────────────┘
                           |
  ┌────────────┬───────────┼───────────┬────────────┐
  |            |           |           |            |
🔥 HERMES   💎 APHRODITE 🌊 DEMETER   ⚖️ THEMIS    ⚙️ PROMETHEUS
Backend     Frontend   Database   Review   Infrastructure
  |            |           |           |            |
  └────────────┴───────────┼───────────┴────────────┘
                           |
                    📚 MNEMOSYNE (Artifacts)
```

---

## Agent Roles & When to Invoke

### ⚡ Zeus (Orchestrator)
**Role:** Central coordinator for multi-phase features  
**When:** Complex features spanning backend + frontend + database  
**Invocation:** `@zeus: Implement [feature description]`  
**Output:** Full feature with all phases, TDD + artifacts  
**Delegates to:** Athena → Apollo → {Hermes, Aphrodite, Demeter} → Themis → Prometheus → Mnemosyne

**Example:**
```
@zeus: Implement email verification flow with JWT expiry

- Athena plans 3 phases
- Apollo finds related code
- Hermes: backend endpoints (TDD)
- Aphrodite: verification form (TDD)
- Demeter: migration schema (TDD)
- Themis: reviews each phase (coverage >80%)
- Prometheus: Docker updates
- Mnemosyne: artifacts + docs
```

---

### 🧠 Athena (Strategic Planner)
**Role:** Design architecture & create TDD roadmaps  
**When:** Complex features, significant design decisions  
**Invocation:** `@athena: Plan [architecture] for [feature]`  
**Output:** Concise plan presented in chat with 3-5 phases  
**Depends on:** Apollo (for discovery of existing patterns)

**Plan Structure:**
```
plans/feature-name/
├── plan.md
│   ├── Overview & objectives
│   ├── Phase 1-N breakdown with test requirements
│   ├── Files to create/modify
│   ├── Risk assessment
│   └── Technology choices with rationale
```

**Example Plan (JWT Auth):**
```markdown
# Phase 1: Database Schema
- Create User table with hashed_password
- Create RefreshToken table with TTL
- Write tests FIRST (RED)

# Phase 2: Backend Services
- Create JWTService for token generation
- Create AuthService for validation
- Create POST /auth/login endpoint
- Write tests FIRST (RED)

# Phase 3: Frontend Integration
- Create LoginForm component
- Store token in secure storage
- Add Authorization header to API calls
- Write component tests FIRST (RED)
```

---

### 🔍 Apollo (Code Explorer)
**Role:** Rapid codebase discovery via parallel searches  
**When:** Need to understand existing patterns before building  
**Invocation:** `@apollo: Find [what] in [codebase]`  
**Output:** Structured findings (NOT raw code), organized by relevance  
**Parallelism:** Can run 3-10 searches simultaneously

**Example Searches (Parallel):**
```
@apollo: Find all authentication patterns
  - Search 1: "auth" in backend/
  - Search 2: "login" in frontend/
  - Search 3: "JWT" in services/
  - Search 4: "middleware" patterns
  - Search 5: Token storage approaches
  
Output: Structured summary with specific file recommendations
```

**Efficiency:** 60-70% context saved by returning summaries, not raw code.

---

### 🔥 Hermes (Backend Implementation)
**Role:** FastAPI services, async APIs, business logic  
**When:** Creating/modifying backend endpoints, services, data processing  
**Invocation:** `@hermes: Create [endpoint/service]`  
**Specialization:**
- FastAPI async/await patterns
- Database integration (SQLAlchemy)
- Error handling & validation
- Security (no SQL injection, auth, CORS)
- Performance optimization

**TDD Workflow (Hermes):**
```
Step 1: RED - Write failing tests
  def test_user_password_hashing():
      user = User(email="test@example.com", password="secret")
      assert user.password != "secret"  # Should be hashed

Step 2: GREEN - Write minimal code
  class User:
      def __init__(self, email, password):
          self.password = bcrypt.hashpw(password)

Step 3: REFACTOR - Improve without changing behavior
  class User:
      """User with secure password handling."""
      def __init__(self, email: str, password: str):
          if not email or not password:
              raise ValueError("Email and password required")
          self.password = self._hash_password(password)

Coverage requirement: >80%
```

---

### 💎 Aphrodite (Frontend Implementation)
**Role:** React components, responsive design, accessibility  
**When:** Creating/modifying UI, components, user flows  
**Invocation:** `@aphrodite: Build [component/page]`  
**Specialization:**
- React component composition
- TypeScript strict mode
- WCAG accessibility (ARIA, semantic HTML)
- Responsive design (mobile-first)
- State management (hooks)
- Testing (vitest)

**TDD Workflow (Aphrodite):**
```
Step 1: RED - Component test fails
  test("LoginForm submits with email and password", () => {
    render(<LoginForm />);
    userEvent.type(screen.getByRole("textbox", {name: /email/i}), "test@ex.com");
    userEvent.type(screen.getByLabelText("password"), "secret123");
    userEvent.click(screen.getByRole("button", {name: /login/i}));
    expect(onSubmit).toHaveBeenCalled();
  });

Step 2: GREEN - Minimal component
  export function LoginForm({onSubmit}) {
    return (
      <form onSubmit={onSubmit}>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button>Login</button>
      </form>
    );
  }

Step 3: REFACTOR - Add accessibility, validation
  export function LoginForm({onSubmit}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit({email, password});
      }}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={...} required />
        
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={...} required />
        
        <button type="submit">Login</button>
      </form>
    );
  }

Coverage requirement: >80%
```

---

### 🌊 Demeter (Database)
**Role:** Schema design, query optimization, migrations  
**When:** Creating/modifying database structure, fixing N+1 queries  
**Invocation:** `@demeter: [Design/Optimize] [table/query]`  
**Specialization:**
- SQLAlchemy ORM + query patterns
- Alembic migrations (zero-downtime strategy)
- Query optimization (EXPLAIN ANALYZE)
- N+1 prevention
- Index strategy
- Connection pooling
- Backward compatibility (expand-contract pattern)

**Example: N+1 Fix**
```
❌ BEFORE (N+1 queries):
  users = User.query.all()  # 1 query
  for user in users:
    posts = user.posts  # N queries (1 per user!)
  Total: N+1 queries

✅ AFTER (Optimized):
  users = User.query.options(
    relationship(User.posts)  # Eager loading
  ).all()
  Total: 1 query
```

---

### ⚖️ Themis (Code Reviewer)
**Role:** Code review, security audit, coverage enforcement  
**When:** Auto-invoked after each phase by Zeus  
**Manual Invocation:** `: Review [PR/code] for security`  
**Authority:** Can block phase if:
- Coverage <80% (minimum)
- OWASP Top 10 violations
- Hardcoded secrets/credentials
- SQL injection vulnerabilities
- No error handling

**Review Checklist:**
```
✅ Coverage >80% (use: pytest --cov)
✅ No hardcoded secrets (grep: password, api_key, token)
✅ Type hints on all functions
✅ Security audit passed (OWASP Top 10)
✅ Tests cover happy + error paths
✅ Error messages don't leak internals
✅ Async code properly handled
✅ Database queries optimized (no N+1)
✅ Frontend: WCAG AAA compliance
✅ No deprecated function usage
```

---

### ⚙️ Prometheus (Infrastructure)
**Role:** Docker, deployment, CI/CD  
**When:** Containerizing services, deployment strategy, env config  
**Invocation:** `: Create/Update [dockerfile/compose]`  
**Specialization:**
- Multi-stage Docker builds
- Non-root user execution
- Health checks
- Zero-downtime deployments
- Environment variable management
- Secrets from vault (not hardcoded)

**Docker Best Practice:**
```dockerfile
# Multi-stage build (reduces image size)
FROM python:3.12-slim as builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.12-slim
RUN useradd -m appuser  # Non-root user
WORKDIR /app
COPY --from=builder /root/.local /home/appuser/.local
COPY . .
USER appuser
HEALTHCHECK --interval=30s CMD curl http://localhost:8000/health
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

---

### 📚 Mnemosyne (Memory & Artifacts)
**Role:** Auto-generate artifacts, maintain audit trail  
**When:** Auto-invoked after each phase by Zeus  
**Manual Invocation:** `@mnemosyne: Document decision [topic]`  
**Output:** Structured artifacts in `plans/[feature]/`

**Artifacts Generated:**
```
plans/jwt-auth/
├── plan.md                 # Initial plan (Athena)
├── phase-1-complete.md     # Schema done (Themis approved)
├── phase-2-complete.md     # Backend done (Themis approved)
├── phase-3-complete.md     # Frontend done (Themis approved)
└── complete.md             # Final summary (all phases)

Each file contains:
- Phase objective
- Files modified/created
- Tests added + coverage %
- Themis approval status
- Git commit message
- Decisions + rationale
```

---

## 3 Mandatory Pause Points

Control stays with YOU through mandatory pauses:

### ⏸️ Pause Point 1: Plan Approval
```
Athena creates: plans/[feature]/plan.md
                      ↓
            YOU REVIEW the plan
                      ↓
        YOU APPROVE or request changes
                      ↓
        Zeus proceeds to implementation
```

**What you check:**
- Is the architecture solid?
- Are the 3-10 phases reasonable?
- Do all files to modify make sense?
- Any concerns about approach?

---

### ⏸️ Pause Point 2: Phase Completion (Per Phase)
```
Phase 1-X implementation complete
                      ↓
    Themis reviews + runs coverage check
                      ↓
 Mnemosyne creates: phase-N-complete.md
                      ↓
            YOU SEE RESULTS
                      ↓
        Continue to next phase or fix
```

**What you see:**
- Coverage % (must be >80%)
- Security audit result
- Test results (all passing?)
- Files changed in this phase
- Git commit message ready

---

### ⏸️ Pause Point 3: Git Commit
```
Phase approved by Themis
                      ↓
          YOU RUN: git commit
                      ↓
       Next phase launches
```

**Why:** You control git history. No auto-commits. Atomic per-phase commits.

---

## Quick Workflow: Your First Feature (45 min)

### 1. Plan (5 min)
```bash
@athena: Plan adding JWT auth with refresh tokens
```

### 2. Review Plan (10 min)
```
👀 Read: plans/jwt-auth/plan.md
⏸️ PAUSE POINT 1: Approve or iterate
```

### 3. Implement All Phases (25 min)
```bash
@zeus: Implement JWT auth using the plan I approved
```

Zeus orchestrates Hermes + Aphrodite + Demeter (in parallel when possible)

Each phase: Zeus → implementation → Themis review → ⏸️ PAUSE POINT 2 → you see results

### 4. Commit Each Phase (3 min each)
```bash
⏸️ PAUSE POINT 3: git commit
```

### 5. Check Artifact Trail
```
✅ plans/jwt-auth/complete.md
   - 3 phases done
   - 94% coverage
   - All tests passing
   - Ready to merge
```

---

## Agent Selection Decision Tree

```
START: What do you need?

├─ "Complex multi-layer feature"
│  └─ USE: @zeus (orchestrates all)
│
├─ "Just planning, no implementation"
│  └─ USE: @athena (create plan)
│
├─ "Find where something is used"
│  └─ USE: @apollo (parallel searches)
│
├─ "New API endpoint / backend service"
│  └─ USE: @hermes (backend + TDD)
│
├─ "New React component / UI"
│  └─ USE: @aphrodite (frontend + TDD)
│
├─ "Database schema / query optimization"
│  └─ USE: @demeter (schema + TDD)
│
├─ "Code review / security check"
│  └─ USE:  (audit + coverage check)
│
├─ "Docker / deployment"
│  └─ USE:  (infrastructure)
│
└─ "Document decision / update artifact"
   └─ USE: @mnemosyne (memory bank)
```

---

## Performance Metrics

**Context Window Efficiency:**
- Traditional monolithic agent: 70-80% context on analysis
- Multi-agent system: 10-15% context per agent, 70-80% free for reasoning

**Result:** ~5-10x more reasoning per context window.

**Quality Metrics:**
- Coverage enforcement: >80% minimum
- Security: OWASP Top 10 compliance
- Performance: N+1 query detection
- Accessibility: WCAG AAA for frontend
- Code review: Automated + human-ready

---

## Tips & Tricks

🎯 **Always plan first** - `@athena` before `@zeus`  
🎯 **Use pause points** - Review at critical junctures  
🎯 **Check artifacts** - `plans/[feature]/` is your audit trail  
🎯 **Direct agents for quick tasks** - Don't always orchestrate  
🎯 **Coverage matters** - Themis enforces >80%, you get confidence  
🎯 **Git is yours** - You decide commits, no auto-commits  
🎯 **Errors caught early** - RED tests first, not at merge  

---

## Examples

### Example 1: Simple Bug Fix (Apollo → Hermes → Themis)
```
Discovery: @apollo: Find all 500 errors in auth service
Fix: @hermes: Fix the validation error in POST /auth
Review: Auto-invoked by Hermes
Result: Minimal code change, >80% coverage
```

### Example 2: Feature (Athena → Zeus → Artifacts)
```
Plan: @athena: Plan adding 2FA to login flow
Review: You approve 3-phase plan
Implement: @zeus: Implement 2FA using approved plan
Result: 3 phases, each reviewed, all TDD, all documented
```

### Example 3: Optimization (Apollo → Demeter → Themis)
```
Discovery: @apollo: Find N+1 queries in user list
Optimize: @demeter: Optimize users table queries
Review: Auto-invoked by Demeter
Result: EXPLAIN ANALYZE before/after, better performance
```

---

**Version:** 1.0  
**System:** Multi-Agent Orchestration  
**Status:** Production-Ready  
**Last Updated:** Feb 2026

## MCP Discovery Integration

### Runtime MCP Tool Registration
The agent-coordination system now supports dynamic MCP (Model Context Protocol) tool discovery:

```python
# Zeus can discover available MCP tools at runtime
mcp_tools = await discover_mcp_tools(
    servers=["file:///home/ils15/.config/opencode/mcp.json"]
)

# Each discovered tool has a name, description, and input schema
# Zeus can route tasks to MCP tools alongside existing agents
```

### Agent-to-MCP Routing
When Zeus delegates tasks, it can route to MCP tools as an alternative to subagents:

| Task Type | Route To | Fallback |
|-----------|----------|----------|
| File search | MCP glob/grep tools | Apollo search |
| Web fetch | MCP fetch tool | web/fetch skill |
| External API | MCP REST connector | Hermes backend |

## LangGraph Stateful Workflow Integration

### Graph-Based Agent Routing
For complex features, Zeus can coordinate agents as a LangGraph state machine:

```python
from langgraph.graph import StateGraph, END

# Define agent workflow as a state machine
workflow = StateGraph(AgentState)

# Nodes are agent delegation points
workflow.add_node("plan", athena_delegate)
workflow.add_node("implement_backend", hermes_delegate)
workflow.add_node("implement_frontend", aphrodite_delegate)
workflow.add_node("review", themis_delegate)

# Edges define routing with conditional logic
workflow.add_edge("plan", "implement_backend")
workflow.add_conditional_edges(
    "implement_backend",
    needs_database_schema,  # Conditional: route to demeter if needed
    {True: "demeter_delegate", False: "implement_frontend"}
)
workflow.add_edge("implement_frontend", "review")
workflow.add_edge("review", END)
```

### Benefits over Sequential Delegation
- **State persistence**: Agent state survives across delegation chain
- **Conditional branching**: Route based on intermediate results
- **Parallel forks**: Fan-out to multiple agents simultaneously with join points
- **Human-in-the-loop**: Pause at approval gates with agent/askQuestions
- **Checkpointing**: Resume from any point on failure

---

Next: Read `AGENTS.md` for agent reference or run `@zeus: Implement [feature]`

---

# Appendix: Step-by-Step Orchestration Workflow

Practical walkthrough for using the multi-agent system end-to-end. This is your "how-to" guide for orchestrating features from planning through production deployment.

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
@athena: Plan JWT authentication with refresh tokens

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
├─ Phase 1: Database Schema (Demeter)
│  ├─ Tasks: Create user + token tables
│  ├─ Test requirements: 5 test cases
│  └─ Risk: Zero-downtime migration
├─ Phase 2: Backend Services (Hermes)
│  ├─ Tasks: JWT service + endpoints
│  ├─ Test requirements: 8 test cases
│  └─ Risk: Token expiry edge cases
├─ Phase 3: Frontend Integration (Aphrodite)
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

**Zeus delegates to Demeter:**
```
@demeter: Implement database schema for JWT auth

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

**Demeter does:**
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

**Demeter delivers:** Schema files + 4 test cases, 100% coverage

**Themis reviews:**
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

**Themis reviews:**
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

**Zeus delegates to Aphrodite:**
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

**Aphrodite does (TDD):**

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

**Aphrodite delivers:** Components + 13 component tests, 94% coverage

**Themis reviews:**
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
@athena: Plan [feature description]

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
4. Themis reviews again
5. Mnemosyne updates phase-N-complete.md
```

### Problem: Security audit found SQL injection

**Solution:**
```
Themis: "SQL injection in query (BLOCKED)"

Action:
1. Demeter fixes query (parameterized)
2. Re-runs security audit
3. Verify fix
4. Themis reviews again
5. Phase proceeds
```

### Problem: Frontend accessibility score 82/100 (target 95)

**Solution:**
```
Themis: "Accessibility 82/100, need 95+ (BLOCKED)"

Action:
1. Aphrodite improves accessibility
2. Runs accessibility audit again
3. Adds missing ARIA labels
4. Improves keyboard navigation
5. Re-checks: 97/100 ✅
6. Themis approves
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
Plan:        @athena: Plan architecture
Review:      User approves 5-phase plan ⏸️
Orchestrate: @zeus: Implement using plan
Result:      Complete 5-phase feature, 95% coverage
Timeline:    1-2 days
```

### Pattern 3: Database Optimization (Skip Athena, Use Apollo + Demeter)
```
Discovery:   @apollo: Find N+1 queries
Optimize:    @demeter: Add indexes + optimize queries
Review:      Auto-invoked by Demeter
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
🎯 **Trust Themis** - Code review catches issues early  
🎯 **Read Artifacts** - Plans contain everything you need  
🎯 **Commit Atomically** - One phase = one commit  
🎯 **Test First** - RED tests before code  
🎯 **Coverage Matters** - <80% = blocked, no exceptions  
🎯 **Security First** - Themis enforces OWASP compliance  

---

## Next Steps

1. ✅ Read this guide (done!)
2. ✅ Review agent reference above
3. ✅ Review TDD standards in `tdd-with-agents/SKILL.md`
4. ✅ Review artifacts in `artifact-management/SKILL.md`
5. 🚀 Start your first feature: `@athena: Plan [your idea]`

---

**Version:** 1.0  
**Purpose:** Practical walkthrough of multi-agent system  
**Time to complete:** Your first feature in 1-2 days  
**Status:** Ready to use

Remember: Plan → Orchestrate → Review → Commit → Deploy
Every phase has a pause point where YOU control the outcome.
