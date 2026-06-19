---
applyTo: "agents/{aphrodite,zeus}.agent.md"
---

# Visual Review Pipeline

Automated visual review: Aphrodite captures screenshots via Playwright MCP → Self-analyzes for visual issues → Addresses findings in a loop.

---

## Overview

This pipeline establishes a formal workflow for detecting and resolving visual regressions and design issues. It is a self-review architecture where Aphrodite captures, analyzes, and fixes in a single feedback loop:

1. **Aphrodite** captures screenshots via Playwright MCP
2. **Aphrodite** self-analyzes screenshots for visual issues (layout, contrast, responsive, accessibility)
3. **Aphrodite** addresses findings
4. **Zeus** escalates if issues persist after iterations

The pipeline enforces structured JSON output, iteration limits, and escalation criteria to prevent infinite fix loops.

### Pipeline Flow

```
Aphrodite implements UI
    ↓
📸 Playwright screenshot (browser/screenshotPage)
    ↓
🧠 Aphrodite self-analyzes (layout, contrast, responsive, accessibility)
    ↓
┌─ verdict: pass → proceed to Themis review
├─ verdict: fail + iteration < 3 → Aphrodite fix → re-capture
└─ verdict: fail + iteration = 3 → Zeus escalation
```

---

## Workflow Steps

### Step 1: Capture

Aphrodite uses Playwright MCP to capture screenshots of the component or page under review.

**Actions:**
- Navigate to target URL or render component
- Capture full-page screenshot via `browser/screenshotPage`
- Capture viewport-specific screenshots for responsive checks
- Name files descriptively: `screenshot-iteration-N-component.png`

**Output:** Screenshot file(s) with consistent naming

### Step 2: Analyze

Aphrodite self-analyzes screenshots using visual inspection capabilities.

**Actions:**
- Examine screenshot(s) for visual issues
- Identify problems in layout, contrast, responsive behavior, and accessibility
- Return findings in the structured JSON schema (see below)
- Include iteration number in findings
- Mark issues with `pass_if_fixed` IDs

**Output:** Structured JSON findings object

### Step 3: Fix

Aphrodite addresses each finding from its self-analysis.

**Actions:**
- Triage findings by severity (critical → high → medium → low)
- Fix each issue in the component code
- Commit changes with descriptive message
- Re-capture screenshot for next iteration

**Output:** Fixed component with updated screenshot

### Step 4: Loop

Repeat Steps 1-3 for up to **3 iterations**.

**Rules:**
- Each iteration must fix at least one `pass_if_fixed` issue
- Track iteration count in findings object
- If no progress detected (zero fixes applied), escalate immediately
- Compare before/after screenshots to verify fixes

### Step 5: Escalate

Zeus intervenes if issues persist after 3 iterations.

**Trigger:** 3 iterations exhausted or zero-progress detected
**Action:** Zeus coordinates manual review or architectural decision

---

## JSON Schema

Aphrodite must return findings in this exact structure:

```json
{
  "verdict": "pass | fail | warn",
  "iteration": 1,
  "max_iterations": 3,
  "issues": [
    {
      "id": "VIS-001",
      "category": "layout",
      "severity": "high",
      "description": "Sidebar overflows on viewport width < 768px",
      "screenshot_region": "left-panel at x:0,y:0 width:300px",
      "recommendation": "Add responsive breakpoint to collapse sidebar below 768px"
    }
  ],
  "summary": "One-line summary of overall visual state",
  "pass_if_fixed": ["VIS-001", "VIS-002"]
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `verdict` | enum | `pass` = no issues, `fail` = blocking issues, `warn` = non-blocking issues |
| `iteration` | int | Current iteration number (1-3) |
| `max_iterations` | int | Always 3 |
| `issues` | array | List of visual issues found |
| `issues[].id` | string | Unique ID in format `VIS-NNN` |
| `issues[].category` | enum | Issue category (see Categories below) |
| `issues[].severity` | enum | Severity level (see Severity below) |
| `issues[].description` | string | Clear description of the issue |
| `issues[].screenshot_region` | string | Bounding box or region reference |
| `issues[].recommendation` | string | Suggested fix |
| `summary` | string | One-line overall assessment |
| `pass_if_fixed` | string[] | Issue IDs that must be resolved to pass |

---

## Categories

| Category | Description | Examples |
|----------|-------------|---------|
| `layout` | Positioning, alignment, overflow | Element misplaced, container overflow, z-index issues |
| `contrast` | Color contrast, visibility | Text hard to read, low contrast ratio |
| `responsive` | Mobile/tablet behavior | Elements break at specific breakpoints |
| `missing_element` | Expected element not rendered | Button not visible, icon missing |
| `typography` | Font, size, weight, spacing | Wrong font family, text truncation |
| `spacing` | Margins, padding, gaps | Uneven spacing, cramped elements |
| `accessibility` | ARIA, focus states, keyboard nav | Missing alt text, no focus ring |

---

## Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| `critical` | Blocks user interaction or content | Must fix before merge |
| `high` | Significant visual regression | Must fix before merge |
| `medium` | Noticeable but not blocking | Fix in current sprint |
| `low` | Minor polish item | Backlog, fix when convenient |

---

## Iteration Rules

1. **Minimum progress:** Each iteration must fix at least one issue listed in `pass_if_fixed`
2. **No regression:** Fixes must not introduce new issues
3. **Track state:** Include iteration count in findings JSON
4. **Early exit:** If `verdict` is `pass`, stop iterating
5. **Immediate escalation:** If zero issues are fixed in an iteration, escalate to Zeus

### Progress Detection

```
Iteration N:
  - Compare pass_if_fixed list to previous iteration
  - If any ID removed from pass_if_fixed → progress detected
  - If pass_if_fixed unchanged → zero progress → escalate
```

---

## Escalation Criteria

Zeus must be invoked when:

1. **3 iterations exhausted** — visual issues cannot be resolved within the pipeline
2. **Backend/data dependency** — issue requires API changes, data model updates, or backend fixes
3. **Architectural issue** — problem stems from component architecture, not CSS/styling
4. **Zero progress** — no `pass_if_fixed` issues resolved in an iteration
5. **Conflicting fixes** — resolving one issue introduces another

**Escalation format:**
```
@zeus Visual review escalation: [component] failed after [N] iterations.
Remaining issues: [list of unresolved pass_if_fixed IDs]
Root cause: [backend | architectural | conflicting]
```

---

## MCP Requirements

### Playwright MCP (Required for Screenshots)

- Use `browser/screenshotPage` for full-page captures
- Use `browser/snapshot` for accessibility tree context
- Fallback: If Playwright MCP is unavailable, skip screenshot capture with warning:
  ```
  ⚠️ Playwright MCP unavailable — visual review skipped.
  Install Playwright MCP server to enable visual review pipeline.
  ```

## Visual Review Responsibility

Visual review is handled by Aphrodite self-review as part of the frontend implementation workflow. No separate visual analysis agent is needed.

---

## Integration Points

### With Code Review (Themis)

- Visual review runs as part of frontend code review
- Themis may invoke this pipeline when reviewing UI changes
- Findings feed into Themis's overall review verdict

### With Artifact Protocol

- Visual review findings can be attached to `IMPL-` artifacts
- Escalation decisions documented in `_notes/` if architectural

### With Memory Bank

- Recurring visual issues documented in `01-active-context.md`
- Architectural visual decisions recorded as `_notes/NOTE000X-*.md`

---

## Example Workflow

```
1. Aphrodite captures screenshot of LoginButton component
   → screenshot-iteration-1-login-button.png

2. Aphrodite self-analyzes and returns:
   {
     "verdict": "fail",
     "iteration": 1,
     "issues": [
       {
         "id": "VIS-001",
         "category": "contrast",
         "severity": "high",
         "description": "White text on light blue background, contrast ratio 2.1:1",
         "screenshot_region": "button center at x:50,y:25 width:200px height:40px",
         "recommendation": "Darken background to #1a56db or use dark text"
       }
     ],
     "pass_if_fixed": ["VIS-001"]
   }

3. Aphrodite fixes contrast, re-captures:
   → screenshot-iteration-2-login-button.png

4. Aphrodite re-analyzes:
   {
     "verdict": "pass",
     "iteration": 2,
     "issues": [],
     "summary": "All visual issues resolved",
     "pass_if_fixed": []
   }

5. Pipeline complete — 2 iterations, all issues fixed.
```
