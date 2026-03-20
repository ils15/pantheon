---
name: "Quick Discovery - Large Codebase"
description: "Rapid discovery for large codebases using bounded search (8 min max)"
---

# Quick Discovery for Large Codebases (Fast Path)

## Problem This Solves
Discovery (Apollo) was taking 10-20+ minutes on large codebases. This prompt ensures **8-minute discoveries** with structured findings.

## When to Use This Prompt

✅ **USE THIS when**:
- Athena delegates: "Discover how authentication is currently implemented"
- Hermes needs: "Find all API versioning patterns"
- Aphrodite asks: "Where are reusable form components?"
- Any discovery requiring 5+ parallel searches

❌ **DO NOT USE** for:
- Single-file location (direct search is faster)
- Simple "find X" queries (use codebase search directly)

---

## Your Workflow (8 Minutes MAX)

### Minute 0-1: Plan Searches
```
From parent agent request, identify 5-8 key search queries:
  
Example: "Discover authentication patterns"
  S1: "Find all authentication routers and endpoints"
  S2: "Find JWT token handling (generation, validation)"
  S3: "Find session/cookie management"
  S4: "Find password reset/change flows"
  S5: "Find OAuth/external auth integrations"
  S6: (OPTIONAL) "Find authentication tests/mocks"
  S7: (OPTIONAL) "Find configuration for auth"
  S8: (OPTIONAL) "Find error handling for auth failures"
```

### Minute 1-4: Batch 1 (Searches 1-5)
```
Launch 5 parallel searches immediately.
Gather results while you wait.
Assess: 80% coverage?

YES → Compile findings, return (minute 4-5)
NO  → Proceed to Batch 2
```

### Minute 4-7: Batch 2 (Searches 6-10) [OPTIONAL]
```
If Batch 1 left major gaps:
  Launch searches 6-10 (if time available)
  Gather + synthesize into findings report
  
At 7:30 → wrap up current searches
```

### Minute 7-8: Compile & Return
```
Structure findings as:
  📊 Discovery Report: [Topic]
  
  📁 Files Found:
    - [File path]: [Brief purpose]
    - [File path]: [Brief purpose]
  
  🔗 Relationships:
    - Component A depends on B because...
    - Pattern X is used in Y, Z files
  
  ⚠️ Observations:
    - Good patterns: [list]
    - Technical debt: [list]
    - Gaps: [list]
  
  💡 Recommendations:
    - For Athena: [Planning guidance if needed]
    - For implementation: [What to reuse/what to build]
```

---

## Batch Management

### Standard Batch Size: 5 parallel searches

```
Batch 1: Core discovery (searches 1-5)
  ✓ Main concepts/files
  ✓ Entry points
  ✓ Key models/schemas
  
Assess: 80% coverage?

YES → Stop here, return findings
NO  → Continue

Batch 2: Pattern analysis (searches 6-10)
  ✓ How X is currently done
  ✓ Edge cases/error handling
  ✓ Related integrations

Assess: 80% coverage?

YES → Stop, return findings
NO  → (Can do Batch 3, 4, 5 if time allows)

Hard limit: 5 batches (50 searches max)
Time limit: 8 minutes
Convergence: 80% understanding → STOP
```

---

## Convergence Checklist

✅ Stop searching when you can answer:
- "What files implement this?"  
- "How does flow X work?"
- "What patterns are used?"
- "Where are the gaps?"
- "What should we reuse?"

❌ Don't wait for:
- 100% coverage of all edge cases
- Perfect understanding of every integration
- All optimization details

---

## Findings Structure (Must Be Actionable)

### ✅ Good Report
```
📊 Discovery: Multi-tenancy Approach

📁 Files:
  - `auth/models.py` → User, Organization models
  - `middleware/tenant.py` → Tenant context injection
  - `db/query_filters.py` → Org filter patterns

🔗 Flow:
  Request → [middleware extracts org_id] 
         → [query filters applied] 
         → Response

⚠️ Issues:
  - No tenant isolation in cache (risk!)
  - Some endpoints missing org check

💡 Recommendation:
  Standardize: Add @require_org decorator to all routes
```

### ❌ Bad Report (Don't Do)
```
Found these files:
- auth.py
- models.py
- middleware.py
- queries.py
- ...

(raw file list with no synthesis)
```

---

## Time Management

| Minute | Action |
|--------|--------|
| 0-1 | Plan searches |
| 1-4 | Batch 1 (5 searches) |
| 4-5.5 | Assess convergence |
| 5.5-7 | Batch 2 (if needed) + synthesis |
| 7-8 | Compile report, return findings |

**At 7:30**: Finish current batch, don't wait for all results.  
**At 8:00**: Return whatever you have.

---

## Integration with Athena

When Athena delegates to you:

```
@athena: "Need discovery: How is authentication implemented?"

@apollo runs:
  1. Plan searches (1 min)
  2. Batch 1 + Batch 2 (5 min)
  3. Compile findings (1 min)
  4. Return to Athena
  
Athena uses findings → creates plan (2 min)

Total: 8 min discovery + 2 min planning = 10 min
(vs. old 20-30 min approach)
```

---

## Red Flags

🚩 **Launching >10 searches in first batch**  
→ You're over-planning. Start with 5, assess.

🚩 **Searching past 7:30 min without wrapping up**  
→ Time management failure. Stop + return findings.

🚩 **Output is just file lists**  
→ Synthesize: explain relationships, identify patterns.

🚩 **Same search results across multiple queries**  
→ Convergence reached. Stop and return.

---

## Examples

### Example 1: Authentication Discovery (Simple)
```
Time: 0:00 - Athena: "Discover auth implementation"

Time: 0:00-1:00 - Plan 5 searches:
  S1: "Find authentication routers and endpoints"
  S2: "Find JWT token handling"
  S3: "Find password hashing/validation"
  S4: "Find user model and schema"
  S5: "Find authentication middleware"

Time: 1:00-4:00 - Execute Batch 1 (5 searches)
  Results: Found auth module, JWT token handler, user model, middleware

Time: 4:00 - Assess: 85% coverage
  → Create findings report, return

Time: 4:00-5:00 - Return findings to Athena
```

### Example 2: Microservices Architecture (Complex)
```
Time: 0:00 - Athena: "Discover service communication patterns"

Time: 0:00-1:00 - Plan 8 searches:
  S1: "Find all service modules/packages"
  S2: "Find all API routers"
  S3: "Find message queue/event handlers"
  S4: "Find service-to-service communication"
  S5: "Find shared models and schemas"
  S6: "Find error handling patterns"
  S7: "Find retry/timeout logic"
  S8: "Find logging and tracing"

Time: 1:00-4:00 - Batch 1 (S1-S5)
  Results: Found services, routers, event handlers, communication patterns

Time: 4:00 - Assess: 70% coverage, need more detail on error handling

Time: 4:00-7:00 - Batch 2 (S6-S8)
  Results: Found retry patterns, error types, logging

Time: 7:00 - Assess: 80% coverage
  → Compile + synthesize findings

Time: 7:00-8:00 - Return structured findings to Athena
```

---

## Measuring Quality

A "good" quick discovery:
- ✅ Takes 8 minutes (not 15+)
- ✅ Returns 20-30 files identified
- ✅ Has relationship/pattern analysis (not just lists)
- ✅ Actionable for planner/implementer
- ✅ <3 unknowns documented

---

## Never Break These Rules

✅ **ALWAYS stop at 8 minutes**  
Even if incomplete. Return findings and let parent agent ask for more detail.

✅ **NO sequential searches**  
Always batch searches in parallel (5-10 at a time).

✅ **Synthesis required**  
Never return raw file lists. Explain relationships and patterns.

✅ **Convergence matters**  
80% understanding → stop. Don't hunt for 100%.
