# Subtask — Bounded Delegation

Delegate a bounded, isolated task to a specialist and receive a structured result back.

**Task:** $ARGUMENTS

## Delegation Brief

Parse the request to identify:
- **Agent:** who receives the task
- **Scope:** exactly what to do (no more, no less)
- **Inputs:** files or context the agent needs
- **Output format:** structured result to return
- **Constraints:** what NOT to change

## Protocol

1. Confirm the task is self-contained (no unresolved dependencies).
2. Delegate with the brief above.
3. Receive and summarize the result.
4. Integrate the result back into the parent session.

## When to Use

- Focused investigation without polluting main context
- A specialist can complete the work independently
- You want an isolated, auditable result before integrating

## When NOT to Use

- Task depends on unfinished in-session work
- Trivial (< 2 steps) — just do it inline
- Requires continuous back-and-forth
