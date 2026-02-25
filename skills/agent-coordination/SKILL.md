---
name: agent-coordination
description: "Master guide to orchestrating the multi-agent system for rapid, TDD-driven feature development with guaranteed code quality and audit trails"
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
🔥 HERMES   💎 APHRODITE 🌊 MAAT   ⚖️ TEMIS    ⚙️ RA
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
**Delegates to:** Athena → Apollo → {Hermes, Aphrodite, Maat} → Temis → Ra → Mnemosyne

**Example:**
```
@zeus: Implement email verification flow with JWT expiry

- Athena plans 3 phases
- Apollo finds related code
- Hermes: backend endpoints (TDD)
- Aphrodite: verification form (TDD)
- Maat: migration schema (TDD)
- Temis: reviews each phase (coverage >80%)
- Ra: Docker updates
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

### 🌊 Maat (Database)
**Role:** Schema design, query optimization, migrations  
**When:** Creating/modifying database structure, fixing N+1 queries  
**Invocation:** `@maat: [Design/Optimize] [table/query]`  
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

### ⚖️ Temis (Code Reviewer)
**Role:** Code review, security audit, coverage enforcement  
**When:** Auto-invoked after each phase by Zeus  
**Manual Invocation:** `@temis: Review [PR/code] for security`  
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

### ⚙️ Ra (Infrastructure)
**Role:** Docker, deployment, CI/CD  
**When:** Containerizing services, deployment strategy, env config  
**Invocation:** `@ra: Create/Update [dockerfile/compose]`  
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
├── phase-1-complete.md     # Schema done (Temis approved)
├── phase-2-complete.md     # Backend done (Temis approved)
├── phase-3-complete.md     # Frontend done (Temis approved)
└── complete.md             # Final summary (all phases)

Each file contains:
- Phase objective
- Files modified/created
- Tests added + coverage %
- Temis approval status
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
    Temis reviews + runs coverage check
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
Phase approved by Temis
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

Zeus orchestrates Hermes + Aphrodite + Maat (in parallel when possible)

Each phase: Zeus → implementation → Temis review → ⏸️ PAUSE POINT 2 → you see results

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
│  └─ USE: @maat (schema + TDD)
│
├─ "Code review / security check"
│  └─ USE: @temis (audit + coverage check)
│
├─ "Docker / deployment"
│  └─ USE: @ra (infrastructure)
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
🎯 **Coverage matters** - Temis enforces >80%, you get confidence  
🎯 **Git is yours** - You decide commits, no auto-commits  
🎯 **Errors caught early** - RED tests first, not at merge  

---

## Examples

### Example 1: Simple Bug Fix (Apollo → Hermes → Temis)
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

### Example 3: Optimization (Apollo → Maat → Temis)
```
Discovery: @apollo: Find N+1 queries in user list
Optimize: @maat: Optimize users table queries
Review: Auto-invoked by Maat
Result: EXPLAIN ANALYZE before/after, better performance
```

---

**Version:** 1.0  
**System:** Multi-Agent Orchestration  
**Status:** Production-Ready  
**Last Updated:** Feb 2026

Next: Read `AGENTS.md` for agent reference or run `@zeus: Implement [feature]`
