---
name: session-recovery
description: "Session recovery patterns — recover from missing tool results, thinking block violations, empty messages, context window limits, and JSON parse errors."
context: fork
globs: []
alwaysApply: false
---

# Session Recovery — Error Recovery Patterns

Use this skill to recover from common session failures without user intervention. The session recovers transparently — the user sees the result, not the failure.

---

## Recovery Scenarios

### 1. Missing Tool Results

**Symptom:** Tool result is missing or corrupted in message history.

**Recovery:**
```
1. Identify the missing tool call from the message history
2. Re-execute the tool call
3. Replace the missing result
4. Continue from where the session left off
```

**Implementation:**
```python
def recover_missing_tool_result(message_history):
    """Find and recover missing tool results."""
    for i, msg in enumerate(message_history):
        if msg.role == "assistant" and msg.tool_calls:
            for tool_call in msg.tool_calls:
                # Check if corresponding result exists
                result_exists = any(
                    m.tool_call_id == tool_call.id
                    for m in message_history[i+1:]
                    if m.role == "tool"
                )
                if not result_exists:
                    # Re-execute the tool
                    return re_execute_tool(tool_call)
    return None
```

### 2. Thinking Block Violations

**Symptom:** API returns error about thinking block mismatch.

**Recovery:**
```
1. Identify the thinking block error
2. Remove or fix the thinking block in the message
3. Retry the request with corrected message
4. Continue normally
```

**Common causes:**
- Thinking block in message but model doesn't support thinking
- Thinking block format mismatch
- Thinking block exceeds budget

### 3. Empty Messages

**Symptom:** Message content is missing or empty.

**Recovery:**
```
1. Identify the empty message
2. Check if it was a tool result or assistant message
3. If tool result: re-execute the tool
4. If assistant message: retry the request
5. Continue normally
```

### 4. Context Window Limits

**Symptom:** API returns "context window exceeded" error.

**Recovery:**
```
1. Identify the oldest messages in the session
2. Compact/summarize old messages
3. Remove tool outputs that are no longer needed
4. Keep only essential context (plan, current task, recent results)
5. Retry the request with compacted context
```

**Compaction Strategy:**
```python
def compact_context(message_history, target_tokens):
    """Compact message history to fit within token limit."""
    # Keep the system prompt and last 5 messages
    essential = message_history[:1] + message_history[-5:]
    
    # Summarize middle messages
    middle = message_history[1:-5]
    summary = summarize_messages(middle)
    
    return essential[:1] + [summary] + essential[1:]
```

### 5. JSON Parse Errors

**Symptom:** Tool output contains invalid JSON.

**Recovery:**
```
1. Identify the invalid JSON in the tool output
2. Attempt to fix common JSON issues:
   - Trailing commas
   - Unescaped quotes
   - Missing braces
3. If fix fails, truncate the output and retry
4. Continue normally
```

---

## Recovery Flow

```
Error detected
  ↓
Identify error type
  ↓
Apply recovery strategy
  ↓
Retry the failed operation
  ↓
Success? → Continue normally
  ↓
Failed? → Try next recovery strategy
  ↓
All strategies failed? → Report to user
```

---

## When Recovery Fails

If all recovery strategies fail:

```
⚠️ Session Recovery Failed

The session encountered an error that could not be automatically recovered:
- Error type: <type>
- Recovery attempts: <list of attempted strategies>
- Suggested action: <what the user should do>

Please try again or start a new session with /handoff to preserve context.
```

---

## Integration with Hooks

These recovery patterns are implemented as hooks:

| Hook | Event | Recovery |
|------|-------|----------|
| `session-recovery` | Event | Missing tool results, empty messages |
| `thinking-block-validator` | Transform | Thinking block violations |
| `json-error-recovery` | PostToolUse | JSON parse errors |
| `context-window-monitor` | Event | Context window limits |

---

## Best Practices

1. **Recover silently** — User should see the result, not the error
2. **Log recovery attempts** — For debugging and monitoring
3. **Don't infinite loop** — Max 3 recovery attempts per error
4. **Preserve context** — Don't lose important session state during recovery
5. **Report failures** — If recovery fails, tell the user what happened
