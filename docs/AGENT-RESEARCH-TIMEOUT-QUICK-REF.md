# Agent Research Timeouts - Quick Reference

## 🚀 TL;DR

**If a research phase takes >10 minutes → something is wrong.**

| Agent | Phase | Timeout | What to Do |
|--------|-------|---------|-----------|
| Athena | Planning | 5 min | Do quick 3-query research, delegate to Apollo for complex discovery |
| Apollo | Discovery | 8 min | Max 10 parallel searches, stop at 80% convergence |
| Hermes | Implementation | 30 min | Max 2-3 searches, focus on coding not research |
| Aphrodite | Implementation | 30 min | Max 2-3 searches, focus on coding not research |
| Maat | Implementation | 30 min | Max 2-3 searches, focus on coding not research |
| Temis | Review | 2 min | Only check changed files, no discovery |

---

## 🛑 What's Changed?

### BEFORE (Broken)
```
@athena /plan-feature "add auth"
  → Searches for: auth, authentication, JWT, OAuth, SSO, security, ...
  → Gets 30+ results
  → Each result triggers follow-up searches
  → Never converges
  → TIMEOUT after 3-5 hours
  ❌ Feature never planned
```

### AFTER (Fixed)
```
@athena /plan-feature "add auth"
  → Does 3 targeted searches
  → Finds key patterns
  → Creates plan in 10 minutes
  → Asks for approval
  ✅ Ready to execute
```

---

## ⚙️ Implementation Details

### Convergence Check (80% Rule)
```
Iteration 1: Found 60% of needed info → KEEP SEARCHING
Iteration 2: Found 75% → KEEP SEARCHING  
Iteration 3: Found 85% → ENOUGH! STOP
Iteration 4: (never reached because already stopped)
```

### Query Limits Per Agent
```
Athena: "auth", "jwt", "token-refresh"     (3 queries, stop)
Apollo: auth-patterns, jwt-usage, 
        token-handling, security-checks,
        relevant-tests, existing-routers,
        pydantic-schemas, error-handling,
        cache-usage, logger-usage         (10 queries max, parallel)
Hermes: "FastAPI auth endpoints", "JWT dependency" (2 queries, stop)
```

### Token Savings
```
Before: 25+ searches × 500 tokens avg = 12,500 tokens (often unused)
After:  5-10 searches × 500 tokens avg = 2,500-5,000 tokens
Savings: 60-80% token reduction per research phase
```

---

## 🐛 Debugging Timeout Issues

**If @athena takes 30+ minutes:**
1. Check: Are you doing >3 searches?
   - If yes: Reduce to 3 max, delegate to @apollo
2. Check: Is @apollo returning results?
   - If no: @apollo may be stuck (has 8-min timeout)
   - Break it down to smaller queries

**If @apollo takes >10 minutes:**
1. Check: Parallel query count
   - If >10: Cap at 10
2. Check: Relevance filtering
   - If keeping junk results: Use relevance score >0.7
3. Time-box: Hard stop at 8 minutes

**If @temis takes >5 minutes:**
1. Check: Are you reviewing entire codebase?
   - If yes: Review ONLY changed files
2. Check: Are you doing discovery searches?
   - If yes: Stop. Escalate unclear context to @zeus, don't investigate.

---

## ✅ Implementation Checklist

- [x] Athena: 5-min timeout, max 3 searches
- [x] Apollo: 8-min timeout, max 10 parallel, 80% convergence rule
- [x] Hermes: 30-min phase timeout, max 2-3 searches
- [x] Aphrodite: 30-min phase timeout, max 2-3 searches  
- [x] Maat: 30-min phase timeout, max 2-3 searches
- [x] Temis: 2-min timeout, no searches (escalate if needed)

---

## 📚 Full Details

See: `docs/AGENT-RESEARCH-OPTIMIZATION.md`

**Updated:** 2026-03-13  
**Status:** ACTIVE (all agents updated)
