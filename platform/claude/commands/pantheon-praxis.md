---
description: "Execute a plan via the task system with dependency ordering and mandatory gates. Usage: /pantheon-praxis"
agent: "zeus"
---
# /pantheon-praxis — Plan Execution

**What:** Creates tasks from an Athena plan, executes with dependency ordering, stops at mandatory gates.
**Usage:** `/pantheon-praxis [plan-name]`
**Agents:** Zeus → Hermes/Aphrodite/Demeter → Themis → Mnemosyne
**Gates:** Plan approval → Phase review → Git commit
