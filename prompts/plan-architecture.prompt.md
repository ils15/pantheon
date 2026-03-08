---
name: plan-architecture
description: "Plan system architecture with strategic research and TDD-driven implementation plan"
argument-hint: "[Architecture topic or feature area]"
agent: athena
tools: ['search', 'usages']
---

# Plan Architecture Strategically (Athena)

## Planning Process

### 1. Understand Requirements
- What do you want to build?
- How does it connect with the existing system?
- What constraints do we have?

### 2. Research Phase (Parallel)
Use @apollo for exploration.
If you need isolated read-only research, use `#runSubagent Explore`.
- Discover related files
- Understand dependencies
- Identify existing patterns

### 3. Create TDD Plan

Your plan MUST have:
- **Overview**: What will be built, success criteria
- **3-5 Phases**: Each phase self-contained with tests
- **Phase Structure**:
  - Tests to write (RED)
  - Minimal code (GREEN)
  - Files to modify
  - External dependencies
  
- **Risks & Mitigation**: What could go wrong?

### 4. Web Research Integration
For advanced patterns, research:
- JWT specifications (RFC 7519)
- REST API design (RFC 7231)
- Domain-Driven Design patterns
- Security best practices (OWASP)

### 5. Offer Handoff
After plan, offer:
"Ready to execute with @zeus? I can coordinate all agents..."

## Output Format
- 📋 Requirements summary
- 🔍 Codebase findings
- 📝 Comprehensive TDD plan
- ⚠️ Risk assessment
- 🤔 Design decisions with rationale
- ✋ Ready for @zeus handoff

## When to Use
- Planning complex features (payment, auth, etc)
- Architectural decisions
- When you want deep research first
