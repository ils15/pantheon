---
description: "Analyze repeated work friction and suggest reusable improvements — skills, commands, agents, or playbooks. Evidence-driven: recommends nothing if evidence is weak."
agent: "zeus"
---
# /reflect — Friction Analysis & Improvement

## What
Analyzes recent session history to identify patterns of repeated work friction, then recommends the smallest useful improvement: a reusable skill, a custom command, an agent prompt adjustment, a config rule, or a project playbook.

## Why
Teams accumulate friction silently — the same manual steps, the same workarounds, the same "let me just check that again." `/reflect` surfaces these patterns and suggests the **smallest change that removes the most friction.**

## How It Works

```
1. SCAN — Review recent session context for friction signals:
   - Repeated file reads without action
   - Manual multi-step processes done 3+ times
   - Delegation failures with same error pattern
   - "Let me just..." workarounds
   - Context thrashing (re-reading same files)

2. CLASSIFY — Categorize each friction signal:
   - Discovery gap (could be a codemap or apollo query)
   - Workflow gap (could be a skill or command)
   - Knowledge gap (could be a prompt rule or agent instruction)
   - Tool gap (could be an MCP server or new tool)

3. RECOMMEND — For each category, suggest the smallest fix:
   | Friction | Category | Recommendation |
   |----------|----------|----------------|
   | Repeated grep for same pattern | Discovery gap | Create codemap or add to /memories/repo/ |
   | Manual 3-step process done often | Workflow gap | Create a skill or /command |
   | Agent consistently misroutes tasks | Knowledge gap | Update agent prompt or routing.yml |
   | Missing tool capability | Tool gap | Add MCP server or skill |

4. REPORT — Output a structured reflection:
   - **Friction found:** [count] patterns
   - **Top recommendation:** [the one change with highest impact/lowest effort]
   - **Evidence strength:** Strong / Moderate / Weak
   - **If weak:** "Insufficient evidence to recommend changes. Continue working and run /reflect again after more sessions."
```

## Usage
```
/reflect                  # Analyze all recent friction
/reflect --focus=<area>   # Analyze only specific area (delegation, discovery, workflow, testing)
/reflect --last=<N>       # Analyze only last N sessions (default: 5)
```

## Output Format
```
## 🔍 Reflection Report

### Friction Patterns Detected: [N]

| # | Pattern | Frequency | Category | Impact |
|---|---------|-----------|----------|--------|
| 1 | [description] | [count] times in [N] sessions | [category] | High/Med/Low |

### Recommendation

**[One-line recommendation]**

**What to change:** [specific file or config to modify]
**Effort:** Low / Medium / High
**Expected impact:** [what friction this removes]

### Evidence Strength: [Strong / Moderate / Weak]

[If Weak]: Not enough data to recommend changes. Run /reflect again after 3+ more sessions.
```

## Safety
- Read-only — never modifies files
- Evidence-driven — won't fabricate recommendations
- Respects session privacy — analyzes patterns, not content
- Can be run at any time without disrupting work
