---
description: "YAGNI — You Ain't Gonna Need It. Anti-overengineering rules for all agents."
name: "YAGNI Anti-overengineering"
---

## YAGNI Principles

1. **Don't add abstractions before the third repetition** — Two similar pieces of code are a coincidence. Three are a pattern.
2. **Prefer duplication over the wrong abstraction** — A bad abstraction is worse than copy-paste.
3. **Solve today's problem, not tomorrow's** — You don't know what tomorrow looks like.
4. **If it's not tested, it doesn't exist** — Code without tests is not "done".
5. **The simplest working solution is the best** — Fancy patterns add cognitive load.
6. **Don't optimize prematurely** — Measure first, then optimize.
7. **Remove unused code immediately** — Dead code is debt.
8. **Prefer standard library over dependencies** — One less dependency = one less vulnerability.
9. **Avoid configuration systems until something needs to vary** — Hard-coded values are fine until you have at least 3 different values.
10. **Don't build for scale you don't have** — YAGNI applies to infrastructure too.
11. **Delete more than you add** — Every line of code is a liability.
12. **If you're not sure you need it, you don't need it** — Trust your gut.

When reviewing code, always ask: "Is this YAGNI? Could we solve this more simply?"
