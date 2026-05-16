# Simplify Skill

Behavior-preserving code simplification. Reduce complexity, eliminate noise, and improve readability without changing what the code does.

---

## When to load this skill

Load when asked to:
- "Simplify this function/module"
- "Reduce complexity without changing behavior"
- "Clean up this code"
- "Refactor for readability"
- "Remove dead code / unused paths"

---

## Core Rule: Behavior Is Invariant

Every simplification MUST preserve observable behavior:
- Same inputs → same outputs
- Same side effects
- Same error conditions
- Same public API surface

If a simplification changes behavior, it is a bug, not a simplification.

---

## Simplification Checklist

Work through these categories in order. Stop at any category where a change risks behavior — flag it and ask before proceeding.

### 1. Dead Code Removal (zero-risk)
- [ ] Remove imports that are never used
- [ ] Remove variables assigned but never read
- [ ] Remove functions/methods never called (verify with usages search)
- [ ] Remove commented-out code blocks older than the last commit
- [ ] Remove `pass` statements in non-empty bodies

**Verification**: Run existing tests. If they pass, the removal was safe.

### 2. Redundancy Elimination (low-risk)
- [ ] Replace repeated literals with a named constant
- [ ] Collapse duplicate conditional branches with identical bodies
- [ ] Merge nested `if` chains into a single compound condition where intent is clearer
- [ ] Remove double negations (`not not x` → `bool(x)` or just `x` where truthy is enough)
- [ ] Replace `if x == True:` with `if x:` and `if x == False:` with `if not x:`

### 3. Standard Library Substitution (medium-risk — test after each)
- [ ] Replace manual loop patterns with built-ins (`any()`, `all()`, `sum()`, `min()`, `max()`)
- [ ] Replace `dict.get(key, None)` with `dict.get(key)` (same default)
- [ ] Replace string concatenation in loops with `"".join()`
- [ ] Replace manual null-checks on dict access with `dict.get()`
- [ ] Replace `len(x) == 0` with `not x` (only for types where falsy = empty)

### 4. Structural Flattening (higher-risk — require test coverage before touching)
- [ ] Extract repeated logic into a helper function (only if used 3+ times)
- [ ] Flatten deeply nested callbacks/try-except into early returns
- [ ] Convert `if/elif/elif/else` chains that are purely data into a lookup dict
- [ ] Break functions longer than ~50 lines into focused sub-functions

### 5. Naming Clarity (cosmetic — no behavior risk)
- [ ] Rename single-letter variables to descriptive names (except loop indices `i`, `j`, `k`)
- [ ] Rename boolean variables to `is_`, `has_`, `can_`, `should_` prefix
- [ ] Rename functions whose name contradicts what they do

---

## Process

```
1. Read the target file(s)
2. Run existing tests to establish a green baseline
   → If no tests exist: STOP and report — simplifying untested code is risky
3. Work through checklist categories 1 → 5
4. After each category: run tests again
5. If a test fails: revert the last change, flag it as unsafe, continue with next item
6. Report: what was simplified, what was skipped and why
```

---

## Output Format

```
## Simplification Report: <file>

### Applied
- Removed 3 unused imports (F401)
- Collapsed duplicate if-branch in `process_order()` (lines 45-60)
- Replaced manual loop sum with `sum()` in `calculate_total()`

### Skipped (behavior risk)
- `legacy_path()` — called from 2 external modules not in this repo; cannot verify safely
- Nested try-except in `parse_config()` — unclear if all error paths are covered by tests

### Test Results
- Before: 47 tests passing
- After: 47 tests passing (0 regressions)

### Lines changed: 312 → 247 (-21%)
```

---

## Anti-Patterns to Avoid

| Temptation | Why to avoid |
|---|---|
| "This logic can be a one-liner" | One-liners can obscure intent — only collapse if clarity improves |
| "This variable is obvious from context" | Removing names makes debugging harder; keep them |
| "Dead code — just delete it" | Always verify with `search/usages` first; it may be called via reflection |
| "The tests are slow, I'll skip them" | You have no evidence the simplification is safe without tests |
| "I'll simplify and add new behavior at the same time" | Never mix simplification with feature changes in one step |

---

## Integration Notes

- **Agents that use this skill**: Hermes (backend cleanup), Aphrodite (frontend cleanup), Talos (fast cleanup), Themis (refactor suggestions in review)
- **Always pair with**: existing test suite. No tests = no simplification.
- **Scope**: one file or one function at a time. Don't batch-simplify across many files in one pass.
