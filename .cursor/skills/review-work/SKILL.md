---
name: review-work
description: "Parallel review with 5 checks: goal, quality, security, QA, context. Use for comprehensive post-implementation validation."
context: fork
globs: []
alwaysApply: false
---

# Review-Work — Parallel Review Orchestrator

Use this skill to run comprehensive post-implementation review through 5 parallel checks. All checks must pass for the review to pass. Replaces sequential review with parallel execution.

---

## The Core Principle

> **5 eyes are better than 1. Run them in parallel, not sequentially.**

Instead of a single reviewer checking everything sequentially, launch 5 specialized sub-checks simultaneously. Each focuses on one dimension.

---

## The 5 Parallel Checks

### 1. Goal Verification
**Question:** Does the implementation match the plan?

**Checks:**
- [ ] All planned features are implemented
- [ ] No scope creep (features not in plan)
- [ ] Acceptance criteria are met
- [ ] User's original intent is satisfied

**Output:**
```
✅ Goal Verification: PASS
- All 4 planned endpoints implemented
- No scope creep detected
- Acceptance criteria met
```

### 2. Code Quality
**Question:** Is the code clean, maintainable, and following standards?

**Checks:**
- [ ] SOLID principles followed
- [ ] DRY — no code duplication
- [ ] Type hints on all functions (backend) / TypeScript strict (frontend)
- [ ] File size < 300 lines
- [ ] No dead code or unused imports
- [ ] Consistent naming conventions
- [ ] Proper error handling (no silent fallbacks)

**Output:**
```
⚠️ Code Quality: NEEDS_REVISION
- 2 functions missing type hints (src/services/review.py:45, 67)
- File src/routes/reviews.py is 350 lines (split needed)
```

### 3. Security
**Question:** Are there security vulnerabilities?

**Checks:**
- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (escaped output)
- [ ] CSRF protection (if applicable)
- [ ] Authentication/authorization checks
- [ ] Rate limiting on public endpoints
- [ ] No sensitive data in logs

**Output:**
```
✅ Security: PASS
- No secrets found
- All inputs validated with Pydantic
- Parameterized queries used
```

### 4. QA (Test Quality)
**Question:** Do the tests actually test something?

**Checks:**
- [ ] Test coverage > 80%
- [ ] Happy path covered
- [ ] Edge cases covered (null input, empty list, max values)
- [ ] Error scenarios covered (404, 500, validation errors)
- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests run non-interactively
- [ ] No "tests pass but test nothing" (mutation testing)

**Output:**
```
⚠️ QA: NEEDS_REVISION
- Coverage: 76% (target: 80%)
- Missing test for empty review list edge case
- Missing test for invalid user ID (404)
```

### 5. Context Mining
**Question:** Is anything missing or undocumented?

**Checks:**
- [ ] All file references documented
- [ ] Complex logic has comments (not AI slop)
- [ ] API changes documented (if applicable)
- [ ] Database migrations documented
- [ ] Environment variables documented
- [ ] Breaking changes noted

**Output:**
```
✅ Context Mining: PASS
- All file refs documented
- Migration has clear description
- No undocumented breaking changes
```

---

## Aggregation Logic

The review passes ONLY if all 5 checks pass:

| Scenario | Result |
|----------|--------|
| All 5 PASS | ✅ APPROVED |
| 1-4 NEEDS_REVISION | ❌ NEEDS_REVISION (list issues) |
| Any FAILED | ❌ FAILED (block merge) |

**Output format:**
```markdown
## Review Summary

| Check | Status | Issues |
|-------|--------|--------|
| Goal Verification | ✅ PASS | — |
| Code Quality | ⚠️ NEEDS_REVISION | 2 type hints, 1 file too long |
| Security | ✅ PASS | — |
| QA | ⚠️ NEEDS_REVISION | Coverage 76%, 2 missing tests |
| Context Mining | ✅ PASS | — |

**Overall: ❌ NEEDS_REVISION**

### Required Fixes:
1. Add type hints to src/services/review.py:45, 67
2. Split src/routes/reviews.py (350 lines → 2 files)
3. Add test for empty review list
4. Add test for invalid user ID (404)
```

---

## Integration with Themis

Themis uses this skill to run parallel review:

```
Themis receives code for review
  ↓
Applies Review-Work skill
  ↓
Launches 5 parallel sub-checks
  ↓
Aggregates results
  ↓
Returns APPROVED or NEEDS_REVISION
```

This is NOT a separate agent — it's a skill that Themis applies during review.

---

## Performance

- Sequential review: ~5 minutes (5 checks × 1 minute each)
- Parallel review: ~1 minute (5 checks simultaneously)
- **Speedup: 5x faster**
