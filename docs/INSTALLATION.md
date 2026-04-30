# Pantheon Installation Guide

> Choose your platform and install Pantheon in minutes.

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

## VS Code Copilot

### Option A: Plugin Marketplace (30 seconds)

Add to your VS Code `settings.json`:

```json
{
  "chat.plugins.enabled": true,
  "chat.plugins.marketplaces": [
    "ils15/pantheon"
  ]
}
```

All 12 agents load automatically. Try `@zeus: Implement a feature` in Copilot Chat.

### Option B: Manual copy (2 minutes)

```bash
# Clone alongside your project
git clone https://github.com/ils15/pantheon.git

# Copy what you need
cp -r pantheon/agents      /path/to/your-project/agents
cp -r pantheon/skills      /path/to/your-project/skills
cp -r pantheon/instructions /path/to/your-project/instructions
cp -r pantheon/prompts     /path/to/your-project/prompts
cp -r pantheon/.github     /path/to/your-project/.github
```

---

## OpenCode

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git

# Link config (from your project root)
ln -s pantheon/opencode/opencode.json opencode.json

# Or copy agents
cp -r pantheon/opencode/agents /path/to/your-project/.opencode/agents
```

OpenCode agents appear automatically. Run `skill-registry` to index the 18 shared skills.

---

## Claude Code

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Install Claude Code agents
node scripts/install.mjs claude
```

This copies agents to `.claude/agents/` in your project. Use `@agent-name` in Claude Code to invoke them.

---

## Cursor

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Install Cursor rules
node scripts/install.mjs cursor
```

This copies `.mdc` files to `.cursor/rules/`. Use `@agent-name` in Cursor chat.

---

## Manual Copy (any platform)

```bash
# From the Pantheon root, copy generated platform configs
cp -r platform/<name>/agents/ /path/to/your-project/<target-dir>/
```

See [Platforms docs](PLATFORMS.md) for target directories per platform.

---

## Verification

After installing, open your editor and type:

```
@zeus: What agents are available?
```

You should see a response listing all 12 Pantheon agents. If agents don't appear:

- **VS Code**: Restart Copilot (`Developer: Reload Window`)
- **OpenCode**: Verify `opencode.json` is in project root
- **Claude/Cursor**: Verify `.claude/agents/` or `.cursor/rules/` exist with files

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Agents not loading | Run `npm run sync` to regenerate platform configs |
| Plugin not found | Verify `chat.plugins.marketplaces` uses `"ils15/pantheon"` |
| Skills not loading | Run `skill-registry` in your editor (OpenCode) |
| Install script fails | Ensure Node.js 18+ and `npm install` was run |
| Git clone URL | `https://github.com/ils15/pantheon.git` |
