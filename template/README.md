# Pantheon Project Template

> This is a **GitHub Template repository**. Click **"Use this template"** to create a new project pre-configured with Pantheon agents, skills, and workflows.

---

## What You Get

When you create a repo from this template:

| Component | Included | Customize? |
|---|---|---|
| **12 AI agents** (Zeus, Athena, Hermes, etc.) | ✅ `agents/` | Edit `.agent.md` files |
| **18 shared skills** | ✅ `skills/` | Add your own |
| **9 instruction files** | ✅ `instructions/` | Edit to match your stack |
| **6 prompt templates** | ✅ `prompts/` | Add workflow prompts |
| **Memory bank** | ✅ `docs/memory-bank/` | Fill in for your project |
| **CI/CD workflows** | ✅ `.github/workflows/` | Modify as needed |
| **Plugin manifest** | ✅ `plugin.json` | Update version |

---

## Quick Start

```bash
# 1. Click "Use this template" above → creates your repo
# 2. Clone your new repo
git clone https://github.com/<your-org>/<your-project>.git
cd <your-project>

# 3. Install VS Code plugin (add to settings.json)
# "chat.plugins.marketplaces": ["ils15/pantheon"]

# 4. Start coding with AI
@zeus: Initialize the memory bank for this project
```

---

## Customization Checklist

- [ ] Edit `.github/copilot-instructions.md` with your stack
- [ ] Fill `docs/memory-bank/00-overview.md` with project scope
- [ ] Fill `docs/memory-bank/03-tech-context.md` with tech details
- [ ] Add project-specific skills to `skills/`
- [ ] Update `package.json` with your project name
- [ ] Commit and push — all agents + workflows are ready
