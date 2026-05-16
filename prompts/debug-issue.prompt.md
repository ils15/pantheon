---
name: debug-issue
description: "Rapidly debug issues with parallel file discovery and analysis"
agent: apollo
tools: ['search', 'usages']
---

# Debug Quickly (Apollo - Scout)

## 5-10 Parallel Searches

Apollo launches simultaneous parallel searches:

Search 1: Exact error message
Search 2: Mentioned function/class
Search 3: Related file patterns
Search 4: Similar test cases
Search 5: Related issues/PRs
Search 6: Stack trace patterns
Search 7: Config files
Search 8: Logging statements
Search 9: Mentioned dependencies
Search 10: Recent changes in area

## Analysis & Synthesis
- Eliminate duplicates
- Identify file relationships
- Extract patterns
- Return prioritized findings

## Recommendations

After analysis, @apollo returns:
1. **Root Cause Hypothesis**: What's probably wrong
2. **Key Files**: Most relevant files
3. **Reproduction Steps**: How to reproduce
4. **Suggested Fix**: Solution direction
5. **Next Steps**: Next agents to involve

## When to Use
- Bug report received
- Confusing error stack trace
- Performance issue diagnosis
- Regression debugging
- When you need quick exploration
