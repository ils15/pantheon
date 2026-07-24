---
description: "Enforce TODO tracking across agents and sessions"
agent: zeus
---

Track and enforce TODO items:

1. Read current todos via session.todo()
2. Cross-reference with kv_store("todo:..." entries
3. Flag stale or overdue items
4. Suggest next actions for each TODO
