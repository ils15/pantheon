# Semantic Summarization — Template

## Instruction
Summarize a completed subtask for context compression. Your summary will be read by the NEXT agent in the pipeline.

## Input Fields
**Agent:** {agent_name}
**Phase:** {phase_number}
**Summary:** {raw_summary_text}
**Files changed:** {files_changed_list}
**Test results:** {test_status}
**Priority:** {priority_label}
**Next agent:** {next_agent_name}
**Next agent needs:** {what_next_agent_needs}

## Output Format

### Sentence 1 — What changed
One sentence describing the core change.

- For Hermes→Aphrodite: Include API contract details (endpoint, request/response shape, status codes)
- For Hermes→Demeter: Include model/schema details, table names, relationships
- For Demeter→Hermes: Include table/column names, migration version, FK references
- For Aphrodite→Hermes: Include component name, data requirements, API expectations
- For Hermes→Prometheus: Include ports, env vars, external dependencies
- For Prometheus→Hermes: Include service names, ports, healthcheck paths
- For Themis→any: Include only the verdict and critical issues

### Sentence 2 — Why it matters to the reader
One sentence connecting this work to what {next_agent_name} will do next.
Be specific about what the next agent should USE or AVOID.

### Sentence 3 (CRITICAL only) — Gotcha/Decision
One sentence about a key decision, trade-off, or pitfall the next agent must know.
If nothing notable, skip this sentence entirely.

## Examples

**Input:** Agent=hermes, Phase=2, Summary="Created /api/users/preferences endpoint with PATCH method", Next=aphrodite, Next needs="frontend component to consume this API"
**Output:**
Created PATCH /api/users/preferences returning {theme, notifications, language}. Supports partial updates — the frontend can save fields independently. Use this contract for PreferencesPanel; opted for PATCH over PUT to avoid full-state requirements.

**Input:** Agent=demeter, Phase=2, Summary="Added user_preferences table migration abc123", Next=hermes, Next needs="update UserService to include preferences"
**Output:**
Added user_preferences table (migration abc123) with FK→users, columns: theme, notifications_enabled, language. Use joinedload(User.preferences) in UserService.get_profile to avoid N+1 on the profile endpoint.

## Output Rules
- Return ONLY the summary text. No preamble, no markdown formatting.
- Max 60 words for HIGH, 90 words for CRITICAL.
- If there's no meaningful gotcha for CRITICAL, produce only 2 sentences.
