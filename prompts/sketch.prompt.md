---
name: sketch
description: "Turn a rough idea into a structured spec through a short Q&A interview — ask 3–5 targeted questions, then produce a complete feature spec"
agent: athena
tools: ['search', 'agent/askQuestions']
---

# Sketch — Idea to Spec (Athena)

## Idea

$input

---

## Interview Protocol

### Phase 1: Discover (3–5 questions, one at a time)

Ask questions in this priority order, stopping after enough clarity:

1. **Scope** — "What's the minimum viable version of this feature?"
2. **Users** — "Who uses this and what's their primary workflow?"
3. **Constraints** — "Are there tech, time, or integration constraints?"
4. **Success criteria** — "How will you know this is working correctly?"
5. **Non-goals** — "What should this explicitly NOT do?"

**Rules:**
- Ask **one question at a time** — never batch
- Wait for the answer before asking the next
- Stop after at least 3 answers
- If the user is unsure, offer 2–3 concrete options

### Phase 2: Confirm

Summarize understanding in 2–3 sentences. Ask: "Does this match what you have in mind?"

### Phase 3: Write the Spec

Produce only after confirmation.

---

## Spec Output Format

```markdown
# Feature Spec: <Feature Name>

**Date:** YYYY-MM-DD
**Status:** Draft

## Overview
<2–3 sentence description>

## Goals
- <Goal 1>

## Non-Goals
- <Explicitly excluded>

## Functional Requirements

### Must Have (MVP)
- [ ] <Requirement 1>

### Should Have (v1.1)
- [ ] <Requirement 4>

## Technical Constraints
- **Stack:** <relevant tech>
- **Integrations:** <APIs, services>
- **Security:** <auth, data sensitivity>

## Success Criteria
- [ ] <Measurable outcome 1>

## Open Questions
- [ ] <Unresolved decision 1>

## Suggested Implementation Phases
1. **Phase 1:** <database/schema>
2. **Phase 2:** <backend API>
3. **Phase 3:** <frontend>
```

---

After the spec, hand off to Zeus:
```
@zeus: Implement this feature based on the spec above
```
