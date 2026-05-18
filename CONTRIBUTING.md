# Contributing to VSCode Agent Frameworks

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

If the existing agents (Zeus, Athena, Apollo, Hermes, Aphrodite, Demeter, Themis, Prometheus, Mnemosyne, Talos, Gaia, and any you've added) cannot handle a specific domain, you can create a new specialized agent.

### The Agent File
Create a new file in `/agents/` named `[agent-name].agent.md`.

### Required Frontmatter
The file must contain specific VS Code Agent schema frontmatter:

```markdown
---
name: "agent-name"
description: "Short description of the agent's role"
argument-hint: "What the user should ask this agent (e.g., 'Analyze security vulnerabilities')"
model: ['GPT-5.4 (copilot)', 'Claude Opus 4.6 (copilot)'] # Primary + fallback
user-invocable: false # Set to true ONLY if users should call it directly via @agent-name
tools: ['search/codebase', 'search/usages', 'read/readFile'] # List exact tools needed
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

---

## 6. Code of Conduct

Pantheon follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

In short:
- **Be respectful** — disagreement is healthy, personal attacks are not
- **Be constructive** — critique ideas, not people
- **Be collaborative** — help others succeed
- **Be transparent** — disclose conflicts of interest

Violations can be reported by opening an issue with the `conduct` label.

---

## 7. Development Setup

### Prerequisites

- Node.js 20+ (for sync engine and install scripts)
- Git 2.30+
- VS Code Copilot, OpenCode, or Claude Code (your choice)

### Local setup

```bash
# Clone the repo
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Install dependencies
npm install

# Verify sync works
node scripts/sync-platforms.mjs --dry-run

# Select a model plan
./platform/select-plan.sh opencode-go
```

### Running the sync engine

```bash
# Sync all platforms
node scripts/sync-platforms.mjs

# Sync a single platform (faster for development)
node scripts/sync-platforms.mjs opencode

# Dry run (no files written)
node scripts/sync-platforms.mjs --dry-run

# Check sync integrity
node scripts/validate-sync.mjs
```

### Testing your changes

- **Agent changes:** Edit the canonical `.agent.md` in `agents/`, re-run sync, verify the generated output in `platform/<name>/agents/`
- **Skill changes:** Edit `skills/<name>/SKILL.md`, re-run sync to deploy
- **Adapter changes:** Edit `platform/<name>/adapter.json`, re-run sync to regenerate agent files
- **Doc changes:** Read the result in your browser or editor preview

---

## 8. PR Checklist

Before submitting a PR, verify:

- [ ] All canonical agents parse correctly (`node scripts/validate-sync.mjs`)
- [ ] Platform files are in sync (`node scripts/sync-platforms.mjs --dry-run` shows expected changes)
- [ ] No hardcoded model names in canonical agents (use tiers: `fast`/`default`/`premium`)
- [ ] No `search/changes` in toolMap (moved to `excludeTools`)
- [ ] Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- [ ] CHANGELOG.md updated if user-facing change
- [ ] Docs updated if behavior changed (README, AGENTS.md, agents/README.md)
- [ ] Version manifests match (`package.json` == `plugin.json` == `.github/plugin/plugin.json`)

### PR title format

```
type(scope): description
```

Examples:
- `feat(agents): add permission field to all canonical agents`
- `fix(sync): correct tool dedup composite key`
- `docs(readme): fix agent count from 17 to 18`

### PR description template

```markdown
## What changed

[Brief description of the change]

## Why

[Motivation and context]

## How to test

[Steps to verify]

## Breaking changes

[None, or list of breaking changes with migration notes]
```

---

## 9. Issue Templates

### Bug report

```markdown
**Describe the bug**
[A clear description of what isn't working]

**To reproduce**
1. Invoke agent `@...`
2. Run command `...`
3. See error `...`

**Expected behavior**
[What should happen instead]

**Environment**
- Platform: [OpenCode / VS Code / Claude Code / Cursor / Windsurf / Cline / Continue]
- Version: [e.g., v3.4.0]
- Subscription: [e.g., Copilot Pro, OpenCode Go]
```

### Feature request

```markdown
**Is your feature request related to a problem?**
[A clear description of what the problem is]

**Describe the solution you'd like**
[What you want to happen]

**Describe alternatives you've considered**
[Any alternative solutions or workarounds]

**Additional context**
[Any other relevant information]
```
