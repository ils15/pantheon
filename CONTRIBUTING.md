# Contributing to VSCode Copilot Agents

Welcome to the Multi-Agent Orchestration System! This system is designed to be highly modular and extensible. Since this architecture leverages specialized VS Code Copilot agents, contributing means extending its cognitive capabilities rather than just adding code.

This guide explains how to add new Skills, Instructions, and Agents to the system properly.

---

## 1. Adding a New Skill

Skills are the "how-to" guides for the agents. They contain step-by-step examples, templates, and reference materials.

### Directory Structure
To add a new skill, create a new directory inside `/skills/` with a descriptive, lowercase name (e.g., `brand-new-skill`).

### The `SKILL.md` File
Every skill **must** have a `SKILL.md` file at its root. This file is mandatory and must contain YAML frontmatter so Copilot can index it properly.

```markdown
---
name: "Brand New Skill"
description: "A short, 1-2 sentence description of what this skill teaches the agent."
---

# Brand New Skill

## Overview
Briefly explain what this skill is and when an agent should use it.

## Examples
Provide clear, copy-pasteable examples of the code or patterns this skill enforces.

## Dependencies
List any other skills or tools required to use this skill.
```

### Adding Supporting Files
If your skill is complex, you can add sub-files (like `USAGE.md`, `TEMPLATES.md`, or a `scripts/` folder) inside your skill directory. Make sure to link to them from your main `SKILL.md`.

---

## 2. Adding Custom Instructions

Instructions are the strict, unbreakable rules (quality gates) that agents must follow when writing code in specific domains (e.g., frontend, database).

### File Naming
Create a new file in the `/instructions/` directory following the pattern: `[domain]-standards.instructions.md`.

### The Global Targeting Frontmatter
Instructions **must** have YAML frontmatter with the `applyTo` glob pattern. This tells VS Code exactly which files trigger these rules.

```markdown
---
description: "Domain specific development standards"
name: "Domain Development Standards"
applyTo: "**/*.{ext1,ext2}"
---

# Domain Standards (@agent-name)

1. **Rule 1**: Always do X because Y.
2. **Rule 2**: Never do Z.
```
*(Note: Ensure your `applyTo` glob is accurate so the instructions aren't triggered on unrelated files).*

---

## 3. Creating a New Agent

If the existing agents (Zeus, Athena, Apollo, Hermes, Aphrodite, Maat, Temis, Ra, Mnemosyne, Artemis, Gaia, and any you've added) cannot handle a specific domain, you can create a new specialized agent.

### The Agent File
Create a new file in `/agents/` named `[agent-name].agent.md`.

### Required Frontmatter
The file must contain specific VS Code Agent schema frontmatter:

```markdown
---
name: "agent-name"
description: "Short description of the agent's role"
argument-hint: "What the user should ask this agent (e.g., 'Analyze security vulnerabilities')"
model: "Claude Sonnet 4.6 (copilot)" # or your preferred model
user-invokable: false # Set to true ONLY if users should call it directly via @agent-name
tools: ['search', 'usages', 'readFile'] # List exact tools needed
---

You are a SPECIALIZED AGENT for [Domain].
[Include detailed persona, rules, and expected output formats here]
```

### Connecting the Agent (Handoffs)
For your new agent to be part of the orchestration, you must register it with the relevant coordinating agents:

1. **Register with Zeus**: Open `agents/zeus.agent.md` and add your new agent to Zeus's list of subagents so Zeus knows it exists and can delegate to it.
2. **Register with Athena (Optional)**: If your agent is needed during the planning phase, add a rule in `agents/athena.agent.md` explaining when Athena should delegate research or planning to your new agent.

---

## 4. Documentation Philosophy

🚨 **CRITICAL RULE:** Do NOT create standalone `.md` documentation files for features inside the repository tree.

The agent system strictly follows a "Memory Bank" philosophy:
- **All architectural plans, state tracking, and feature documentation** must be placed exclusively in the `/docs/memory-bank/` directory by the `@mnemosyne` agent.
- Operational knowledge belongs in code comments and git commit messages.

When contributing, ensure your agents or skills do not instruct the LLM to write `plan.md` or `summary.md` files in the working directory.

---

## 5. Submitting Your Changes

1. Test your new Skill/Instruction/Agent locally by invoking it in the Copilot Chat.
2. Ensure no linting errors exist in your YAML frontmatter.
3. Commit your changes with a descriptive message.
4. Open a Pull Request!
