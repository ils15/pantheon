# Pantheon Setup Guide

> **From zero to orchestrating with AI agents** — step-by-step setup for every platform.

> 📖 **Platform-specific guides:** [VS Code](platforms/vscode.md) · [OpenCode](platforms/opencode.md) · [Claude Code](platforms/claude.md) · [Cursor](platforms/cursor.md) · [Windsurf](platforms/windsurf.md)

---

## Before You Start

**What is Pantheon?** A framework of 12 specialized AI agents that plan, implement, review, and document code for you — like having a full engineering team in your editor.

**What you need:**
- A GitHub account
- Git installed on your machine
- A supported code editor (pick one below)
- An AI coding subscription (Copilot, Claude, OpenCode, or Cursor)

**Time to complete:** 5–15 minutes depending on platform

---

## 🚀 Quickest Path (VS Code — 2 minutes)

If you use **VS Code with GitHub Copilot**, this is the fastest path:

### Step 1: Add the plugin

Open VS Code and add this to your `settings.json` (File → Preferences → Settings → click the `{}` icon top-right):

```json
{
  "chat.plugins.enabled": true,
  "chat.plugins.marketplaces": ["ils15/pantheon"]
}
```

### Step 2: Verify it works

Open Copilot Chat (`Ctrl+Shift+I` or `Cmd+Shift+I`) and type:

```
@zeus: What agents are available?
```

You should see Zeus respond listing all 12 Pantheon agents. **Done!** ✅

### Step 3: Run your first orchestration

```
@athena: Plan a simple Express.js API with one GET /hello endpoint
```

Athena will create a plan. Approve it, then:

```
@zeus: Implement the API using the approved plan
```

---

## 🖥️ VS Code — Detailed Setup

### Prerequisites

- **VS Code** 1.87+ ([download](https://code.visualstudio.com/))
- **GitHub Copilot** subscription (Chat included in Pro, Pro+, Business, Enterprise)
- **Git** ([download](https://git-scm.com/))

### Method A: Plugin Marketplace (recommended — 30 seconds)

1. Open VS Code settings JSON:
   - `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
   
2. Add these lines:
   ```json
   {
     "chat.plugins.enabled": true,
     "chat.plugins.marketplaces": ["ils15/pantheon"]
   }
   ```

3. Restart VS Code (`Ctrl+Shift+P` → "Developer: Reload Window")

4. All 12 agents appear automatically. No files to copy.

### Method B: Manual copy (for customization)

When you want to **edit the agents** or **use Pantheon as a project template**:

```bash
# 1. Clone the repo
cd ~/repos
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# 2. Regenerate platform configs (optional, already fresh)
npm run sync

# 3. Copy into your project
cp -r agents       /path/to/your-project/agents
cp -r skills       /path/to/your-project/skills
cp -r instructions /path/to/your-project/instructions
cp -r prompts      /path/to/your-project/prompts
```

---

## 💻 OpenCode — Detailed Setup

### Prerequisites

- **OpenCode** installed: `npm i -g opencode-ai` or `brew install opencode-ai`
- An LLM provider API key (Anthropic, OpenAI, Google, or OpenCode Zen)

### Step 1: Clone Pantheon

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install
```

### Step 2: Link agents into your project

From your **project's root directory**:

```bash
# Link the opencode config
ln -s /path/to/pantheon/platform/opencode/opencode.json opencode.json

# Or copy agents directly
mkdir -p .opencode
cp -r /path/to/pantheon/platform/opencode/agents .opencode/agents
cp -r /path/to/pantheon/skills .opencode/skills

# Copy supporting files
cp /path/to/pantheon/AGENTS.md AGENTS.md
cp -r /path/to/pantheon/instructions instructions
```

### Step 3: Configure your API key

Create a `.env` file or set in your shell:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or configure in `opencode.json`:

```json
{
  "instructions": ["./AGENTS.md"],
  "permission": { "skill": { "*": "allow" } }
}
```

### Step 4: Start OpenCode

```bash
cd /path/to/your-project
opencode
```

Press **Tab** to cycle through agents, or `@`-mention any agent directly:

```
@zeus Implement a REST API with JWT auth
```

---

## 🤖 Claude Code — Detailed Setup

### Prerequisites

- **Claude Code** installed (via npm or installer)
- Anthropic API key with Claude access

### Step 1: Clone Pantheon

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install
```

### Step 2: Install Claude Code agents

```bash
node scripts/install.mjs claude
```

This creates `.claude/agents/` with all 12 agents in Claude Code format.

### Step 3: Configure Claude

Create `.claude/settings.json` in your project:

```json
{
  "agents": {
    "zeus": { "instructions": "../AGENTS.md" },
    "athena": { "instructions": "../AGENTS.md" }
  }
}
```

### Step 4: Verify

Open Claude Code in your project and type:

```
@zeus What agents are available?
```

You should see Zeus respond. Try orchestrating:

```
@zeus Plan and implement a file-based todo app
```

---

## 🎯 Cursor — Detailed Setup

### Prerequisites

- **Cursor** IDE installed
- Cursor Pro subscription (for AI features)

### Step 1: Clone Pantheon

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install
```

### Step 2: Install Cursor rules

```bash
node scripts/install.mjs cursor
```

This creates `.cursor/rules/` with all 12 agents as `.mdc` rule files.

### Step 3: Use agents in Cursor

In Cursor chat, use `@` to invoke any agent:

```
@zeus Implement a feature with full TDD
```

Cursor loads the agent as a rule — the agent's instructions guide Cursor's behavior.

### Step 4 (optional): Customize rules

Edit `.cursor/rules/*.mdc` files to adjust agent behavior for your project.

---

## 🧪 Windsurf — Preview

Windsurf support is in preview. A platform adapter exists at `platform/windsurf/` with tool name mappings. Full support is planned for v3.1.

To use the stub:

```bash
node scripts/install.mjs windsurf
```

---

## 🔄 Setup Verification Checklist

After installing, verify these work:

- [ ] `@zeus` responds in chat
- [ ] `@athena` can create plans
- [ ] `@hermes` or `@aphrodite` can implement code
- [ ] Tab cycles between agents (VS Code/OpenCode)
- [ ] Skills load: `@temis` can review code
- [ ] Sync works: `npm run sync && npm run sync:check` passes

---

## 🐛 Troubleshooting

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

---

## 🎓 Next Steps

Once setup is complete:

1. **Read** [AGENTS.md](/AGENTS.md) — full agent reference
2. **Try** a feature: `@zeus: Implement JWT authentication`
3. **Explore** skills: `@hermes: Load skill agent-coordination`
4. **Customize** instructions in `instructions/` for your stack
5. **Add** your own agents by creating new `.agent.md` files in `agents/`

---

> **Need help?** Open an issue at [github.com/ils15/pantheon/issues](https://github.com/ils15/pantheon/issues)
