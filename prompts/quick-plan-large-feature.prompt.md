---
name: "Quick Plan - Large Feature"
description: "Rapid planning for large/complex features using bounded research (5 min max)"
---

# Quick Planning for Large Features (Fast Path)

## Problem This Solves
Planning for large sites has been slow (30+ min). This prompt ensures **5-minute plans** for even complex features.

## When to Use This Prompt

✅ **USE THIS when**:
- User: "@athena Plan: Add customer dashboard with analytics"
- User: "@athena Plan: Implement multi-tenant architecture"
- User: "@athena Design: Microservices migration strategy"
- Any Feature with >3 implementation phases

❌ **DO NOT USE** for:
- Small bug fixes (use default plan-architecture.prompt)
- Single-component changes

---

## Your Workflow (5 Minutes)

### Minute 0-2: Quick Codebase Scan
```
Goal: Understand current structure (don't aim for comprehensive)

Launch 1-3 parallel searches:
  1. "Find main modules/routers related to [Feature]"
  2. "Find existing models/schemas for [Feature]"
  3. (OPTIONAL) "How is [similar feature] currently implemented?"

While searching: Review Memory Bank if it has content
  - docs/memory-bank/00-overview.md (project scope)
  - docs/memory-bank/01-architecture.md (existing patterns)
```

### Minute 2-4: Synthesis
```
From searches, extract:
  - What exists? (reuse?)
  - What's missing? (build?)
  - What pattern fits? (async? repository? caching?)
  - What are risks? (scale? complexity? performance?)

⚠️ If unclear: Document as "Open Question" → ask user
```

### Minute 4-5: Plan Creation
```
Create 3-5 phase plan:

Format:
  📋 Plan: [Feature Name]
  🎯 Goal: [One sentence outcome]
  
  1️⃣ Phase: [Name] → @agent
     - Quick description
     - Key files: [list]
  
  2️⃣ Phase: [Name] → @agent
     ...
  
  ⚠️ Risks: [ONE sentence]
  🤔 Open Questions: [List if uncertain]
  
  👉 Ready to approve?
```

---

## Decision: Direct vs. Delegate

At minute 2-3, decide:

```
Question: Do I have 80% understanding?

YES → Create plan immediately (skip delegates)
NO  → Check: Need pattern discovery?
       YES → "Need @apollo to discover X. Shall I delegate?" (get approval)
       NO  → Document unknowns as "Open Questions", plan anyway
```

---

## Red Flags (Plan is incomplete)

🚩 **More than 3 open questions**  
→ Ask user for clarification before planning

🚩 **Can't identify affected modules**  
→ Need Apollo discovery: "Unknown scope. Delegate to @apollo?"

🚩 **Risk assessment uncertain**  
→ Document risk/unknowns clearly in plan

🚩 **Implementation unclear**  
→ Break feature into smaller sub-features:  
"Feature too large. Recommend breaking into X, Y, Z. Plan X first?"

---

## Examples

### Example 1: Customer Dashboard (Medium Complexity)
```
Time: 0:00 - User: "Plan: Add customer analytics dashboard"

Time: 0:00-2:00 - Search:
  S1: "Find customer-related routers and models"
  S2: "How are forms/charts rendered in existing UI?"
  S3: (OPTIONAL) "What analytics libraries are available?"

Time: 2:00 - Understanding: 85% coverage
  ✓ Found customer routes, models, existing charts
  ✓ Know Frontend (React) + Backend (FastAPI) structure
  ✓ Slight uncertainty: Analytics data aggregation approach

Time: 2:00-4:00 - Plan:
  Phase 1: Backend analytics API (@hermes)
  Phase 2: Dashboard component (@aphrodite)
  Phase 3: Data aggregation query (@demeter)
  
  Open Question: Real-time vs. daily snapshots?

Time: 4:00-5:00 - Approval + handoff to Zeus
```

### Example 2: Multi-Tenant Architecture (High Complexity)
```
Time: 0:00 - User: "Plan: Make platform multi-tenant"

Time: 0:00-2:00 - Search:
  S1: "Find all authentication/authorization code"
  S2: "Find database schema (how is organization data structured?)"
  S3: (DELEGATE?) "How are other features accessing org context?"

Time: 2:00 - Assessment:
  - Understand current auth: 70%
  - Understand DB structure: 80%
  - Need tenant isolation strategy: UNCLEAR
  
Time: 2:15 - Decision:
  → "This needs architecture review. Delegate to @apollo?"
  → User: "Yes, do it"
  → @apollo discovery (8 min) → returns findings
  → Athena creates plan from findings (1 min)
  → Total: 11 minutes (vs. 30+ old approach)
```

---

## Non-Negotiable Rules

✅ **You MUST stop at 5 minutes**  
Even if uncertain. Plan with 80% knowledge, document unknowns.

✅ **No re-planning**  
One cycle per request. If Zeus discovers plan gaps, that's a new planning request.

✅ **Synthesize, don't explore**  
Fast 1-2 min search, then make decisions with the knowledge you have.

✅ **Output only in chat**  
No artifact files unless explicitly asked by user.

---

## Approval Pattern

After plan, always ask:
```
@ask-questions
- [List 1-2 open questions from plan]
- "Approve this 3-phase plan to proceed?" (yes/no/changes)
- If user asks for changes: "Specific phase to adjust?" (let them steer, don't re-research whole thing)
```

After approval:
```
Perfect! Handing off to @zeus for implementation.

@zeus Implement plan: [Feature Name]
  [Copy full plan into context]
```

---

## Measuring Success

A "good" quick plan:
- ✅ Takes 5 minutes
- ✅ Has 3-5 phases
- ✅ <3 open questions  
- ✅ Clear risk assessment
- ✅ Leads to smooth 1-pass implementation (no major revisions)

