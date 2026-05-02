---
name: code-review-checklist
description: Systematic code review using quality gates, SOLID principles, error handling patterns, and test coverage analysis. Provides structured feedback with severity levels and actionable improvements.
argument-hint: "Code review scope — describe files changed, programming language, architecture layer, and review focus (security/performance/correctness)"
globs: ["**/*.py", "**/*.ts", "**/*.tsx"]
alwaysApply: false
---

# Code Review Checklist Skill

## When to Use

Use this skill when:
- Reviewing pull requests
- Validating code quality before merge
- Checking test coverage
- Ensuring SOLID principles
- Validating error handling
- Reviewing documentation
- Checking for anti-patterns

## Review Framework

### 1. Code Quality Gates

```
✅ Must Pass:
- [ ] No linting errors (flake8/ESLint)
- [ ] Type checking passes (mypy/tsc)
- [ ] Tests pass (pytest/jest)
- [ ] Coverage ≥ 80%
- [ ] No security vulnerabilities
- [ ] Documentation updated
```

### 2. SOLID Principles

```
S - Single Responsibility
    ❌ Function does multiple unrelated things
    ✅ Function has one clear purpose

O - Open/Closed
    ❌ Modifying existing code for new features
    ✅ Extending via inheritance/composition

L - Liskov Substitution
    ❌ Subclass changes parent behavior
    ✅ Subclass is drop-in replacement

I - Interface Segregation
    ❌ Large interfaces with unused methods
    ✅ Small, focused interfaces

D - Dependency Inversion
    ❌ High-level depends on low-level
    ✅ Both depend on abstractions
```

### 3. Error Handling Patterns

```python
# ✅ Proper error handling
from fastapi import HTTPException

async def get_user(user_id: int) -> User:
    user = await user_repository.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ❌ Anti-patterns
async def get_user(user_id: int):
    try:
        return await user_repository.get(user_id)
    except:  # Never bare except!
        return None  # Hiding errors
```

### 4. Test Coverage Analysis

```
✅ Required Coverage:
- Unit tests: ≥ 80%
- Integration tests: Critical paths
- E2E tests: User journeys

✅ Test Quality:
- [ ] Tests are independent
- [ ] Tests have clear assertions
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] No flaky tests
```

### 5. Documentation Check

```
✅ Required Docs:
- [ ] Function docstrings (purpose, params, returns)
- [ ] Complex logic explained
- [ ] API endpoints documented
- [ ] README updated if needed
- [ ] CHANGELOG updated
```

## Review Severity Levels

```
🔴 BLOCKER - Must fix before merge
   - Security vulnerability
   - Breaking change
   - Test failure
   - Data loss risk

🟠 MAJOR - Should fix before merge
   - Missing error handling
   - Poor performance
   - Missing tests
   - Unclear logic

🟡 MINOR - Nice to fix
   - Style issues
   - Minor refactoring
   - Documentation gaps
   - Code duplication

🟢 SUGGESTION - Optional improvement
   - Alternative approach
   - Future optimization
   - Best practice tip
```

## Output Format

```markdown
## Code Review Summary

### Overview
- Files reviewed: X
- Lines changed: +X / -X
- Test coverage: X%

### Quality Gates
- ✅ Linting: Passed
- ✅ Type checking: Passed
- ⚠️ Tests: 2 failures
- ❌ Coverage: 65% (target: 80%)

### Findings

#### 🔴 [BLOCKER] Missing input validation
- **File**: `services/user_service.py:45`
- **Issue**: User input not sanitized
- **Fix**: Add Pydantic validation

#### 🟠 [MAJOR] N+1 query in get_orders
- **File**: `repositories/order_repo.py:23`
- **Issue**: Eager loading missing
- **Fix**: Use `selectinload()`

### Verdict
- ✅ APPROVE (with suggestions)
- ⚠️ REQUEST CHANGES (blockers found)
```

## Example Usage

```
@reviewer Review the PR for user authentication feature
@reviewer Check test coverage on the new endpoints
@reviewer Validate error handling in payment service
@reviewer Analyze code for SOLID violations
```
