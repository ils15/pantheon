# Pantheon Installation Guide

> From zero to orchestrating with AI agents — step-by-step setup for every platform.

> 📖 **Platform-specific guides:** [VS Code](platforms/vscode.md) · [OpenCode](platforms/opencode.md) · [Claude Code](platforms/claude.md) · [Cursor](platforms/cursor.md) · [Windsurf](platforms/windsurf.md)

---

## Before You Start

**What is Pantheon?** A framework of 18 specialized AI agents that plan, implement, review, and document code for you — like having a full engineering team in your editor.

**What you need:**
- A GitHub account
- Git installed on your machine
- A supported code editor (pick one below)
- An AI coding subscription (Copilot, Claude, OpenCode, or Cursor)

**Time to complete:** 5–15 minutes depending on platform

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Git** | Any recent version |
| **Node.js 18+** | Only needed for the sync engine and installer script |
| **Supported editor** | VS Code, OpenCode, Claude Code, or Cursor |

---

## Quick Comparison

| Platform | Install Time | Method |
|---|---|---|
| **VS Code Copilot** | 1 min | Marketplace plugin or `cp -r` |
| **OpenCode** | 2 min | Config file + agents |
| **Claude Code** | 1 min | `node scripts/install.mjs claude` |
| **Cursor** | 1 min | `node scripts/install.mjs cursor` |
| **Windsurf** | — | 🧪 Preview, coming soon |

---

## 🚀 Quickest Path (VS Code)

If you use **VS Code with GitHub Copilot**, this is the fastest path.

### Step 1: Add the plugin

Open VS Code and add this to your `settings.json` (File → Preferences → Settings → click the `{}` icon top-right):

```json
{
  "chat.plugins.enabled": true,
  "chat.plugins.marketplaces": ["ils15/pantheon"]
}
```

### Step 2: Verify

Open Copilot Chat (`Ctrl+Shift+I` or `Cmd+Shift+I`) and type:

```
@zeus: What agents are available?
```

### Step 3: Run your first orchestration

```
@athena: Plan a simple Express.js API with one GET /hello endpoint
```

Approve the plan, then:

```
@zeus: Implement the API using the approved plan
```

---

## VS Code Copilot — Detailed Setup

### Prerequisites

- **VS Code** 1.87+ ([download](https://code.visualstudio.com/))
- **GitHub Copilot** subscription (Chat included in Pro, Pro+, Business, Enterprise)
- **Git** ([download](https://git-scm.com/))

### Option A: Plugin Marketplace (recommended — 30 seconds)

1. Open VS Code settings JSON: `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
2. Add these lines:
   ```json
   {
     "chat.plugins.enabled": true,
     "chat.plugins.marketplaces": ["ils15/pantheon"]
   }
   ```
3. Restart VS Code (`Ctrl+Shift+P` → "Developer: Reload Window")
4. All 18 agents appear automatically. No files to copy.

### Option B: Manual copy (for customization)

```bash
# Clone alongside your project
git clone https://github.com/ils15/pantheon.git

# Copy what you need
cp -r pantheon/agents      /path/to/your-project/agents
cp -r pantheon/skills      /path/to/your-project/skills
cp -r pantheon/instructions /path/to/your-project/instructions
cp -r pantheon/prompts     /path/to/your-project/prompts
```

---

## OpenCode

### Prerequisites

- **OpenCode** installed: `npm i -g opencode-ai` or `brew install opencode-ai`
- An LLM provider API key (Anthropic, OpenAI, Google, or OpenCode Zen)

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Copy agents into your project
cp -r platform/opencode/agents /path/to/your-project/.opencode/agents

# Copy the root opencode.json to your project root and edit it
cp opencode.json /path/to/your-project/opencode.json
```

### Configure your API key

Create a `.env` file or set in your shell:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Start OpenCode

```bash
cd /path/to/your-project
opencode
```

Press **Tab** to cycle through agents, or `@`-mention any agent directly.

See [OpenCode setup guide](platforms/opencode.md) for full config options.

---

## Claude Code

### Prerequisites

- **Claude Code** installed (via npm or installer)
- Anthropic API key with Claude access

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Install agents
node scripts/install.mjs claude
```

This creates `.claude/agents/` with all 18 agents in Claude Code format.

### Verify

Open Claude Code in your project and type:

```
@zeus: What agents are available?
```

---

## Cursor

### Prerequisites

- **Cursor** IDE installed
- Cursor Pro subscription (for AI features)

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Install Cursor rules
node scripts/install.mjs cursor
```

This creates `.cursor/rules/` with all 18 agents as `.mdc` rule files.

### Usage

In Cursor chat, use `@` to invoke any agent:

```
@zeus Implement a feature with full TDD
```

Cursor loads the agent as a rule — the agent's instructions guide Cursor's behavior.

### Customize rules (optional)

Edit `.cursor/rules/*.mdc` files to adjust agent behavior for your project.

---

## Windsurf

Windsurf support is in preview. A platform adapter exists at `platform/windsurf/` with tool name mappings. Full support is planned for v3.1.

To use the stub:

```bash
node scripts/install.mjs windsurf
```

---

## Manual Copy (any platform)

```bash
# From the Pantheon root, copy generated platform configs
cp -r platform/<name>/agents/ /path/to/your-project/<target-dir>/
```

See [Platforms docs](PLATFORMS.md) for target directories per platform.

---

## After Installation: Select Your Model Plan

After installing the agents, agents declare abstract tiers (`fast`/`default`/`premium`). Configure your preferred models via your platform's own settings (e.g., `~/.config/opencode/opencode.json` for OpenCode, or your editor's model picker for Copilot/Cursor).

---

## Verification

After installing, open your editor and type:

```
@zeus: What agents are available?
```

You should see a response listing all Pantheon agents.

### Setup Verification Checklist

- [ ] `@zeus` responds in chat
- [ ] `@athena` can create plans
- [ ] `@hermes` or `@aphrodite` can implement code
- [ ] Tab cycles between agents (VS Code/OpenCode)
- [ ] Skills load
- [ ] Sync works: `npm run sync && npm run sync:check` passes

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `@zeus` not recognized | Plugin not loaded | Verify `chat.plugins.marketplaces` in settings.json |
| Agents show but don't respond | Copilot not connected | Check GitHub Copilot status icon in VS Code status bar |
| `npm run sync` fails | Missing dependencies | Run `npm install` first |
| `node scripts/install.mjs` fails | Wrong Node version | `node --version` must be 18+ |
| Agents seem outdated | Platforms stale | `npm run sync` to regenerate |
| OpenCode: no agents found | Config not linked | Check `opencode.json` exists in project root |
| Claude: agents not loading | Wrong directory | Verify `.claude/agents/` exists with `.md` files |
| Cursor: `@agent` not working | Rules not loaded | Verify `.cursor/rules/` exists with `.mdc` files |
| Skills not loading | Registry issue | Run `skill-registry` in your editor (OpenCode) |

---

## Next Steps

Once setup is complete:

1. **Read** [AGENTS.md](/AGENTS.md) — full agent reference
2. **Try** a feature: `@zeus: Implement JWT authentication`
3. **Explore** skills: `@hermes: Load skill agent-coordination`
4. **Customize** instructions in `instructions/` for your stack
5. **Add** your own agents by creating new `.agent.md` files in `agents/`

---

> **Need help?** Open an issue at [github.com/ils15/pantheon/issues](https://github.com/ils15/pantheon/issues)
