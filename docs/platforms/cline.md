# Pantheon for Cline

**Status:** 🧪 **Preview** — Rule-based agents via `.clinerules` directory.

Cline (formerly Claude Dev) is an open-source VS Code extension that acts as an autonomous coding agent. Unlike VS Code's `.agent.md` system, Cline uses **rules files** (`.clinerules` or `.clinerules/`) that act as system prompts — there is no formal agent definition format, no frontmatter, and no tool declarations.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **VS Code** installed | [code.visualstudio.com](https://code.visualstudio.com) |
| **Cline extension** installed | Install from VS Code Marketplace or [github.com/cline/cline](https://github.com/cline/cline) |
| **Node.js 18+** | Only needed for the sync engine (`npm run sync`) and installer script |

---

## Installation

### Using the Install Script (when available)

```bash
node scripts/install.mjs --target /path/to/your-project
```

Once `install.mjs` supports `--target cline`, this will auto-detect and copy rules to `.clinerules/`.

### Manual Installation

```bash
# Clone Pantheon
git clone https://github.com/ils15/Pantheon.git
cd Pantheon
npm install

# Copy generated rules into your project
mkdir -p /path/to/your-project/.clinerules
cp -r platform/cline/.clinerules/* /path/to/your-project/.clinerules/

# OR copy skills for skill-based rules
cp -r skills/ /path/to/your-project/.clinerules/skills/
```

### What Gets Installed

```
your-project/
└── .clinerules/              # Directory mode — multiple rule files
    ├── zeus                  # Plain markdown (no frontmatter)
    ├── athena
    ├── apollo
    ├── hermes
    ├── aphrodite
    ├── demeter
    ├── themis
    ├── prometheus
    ├── iris
    ├── mnemosyne
    ├── talos
    ├── hephaestus
    ├── chiron
    ├── echo
    ├── nyx
    └── gaia
```

---

## Configuration

### How Cline Rules Work

Cline supports two modes for loading rules:

| Mode | Location | How it works |
|------|----------|-------------|
| **Single file** | `.clinerules` in project root | One markdown file, auto-loaded as system prompt |
| **Directory** | `.clinerules/` in project root | Multiple markdown files, merged at runtime |

Pantheon uses the **directory mode** (`.clinerules/`) so each agent can be a separate file. Since Cline merges all `.clinerules` files into a single system prompt, each file should contain a focused, self-contained rule for one agent.

### Global Rules

Global/personal preferences go in:

```
~/Documents/Cline/Rules/
```

These apply across all your projects and are merged with project-level rules.

### Custom Instructions (VS Code Settings)

Cline also supports custom instructions set in VS Code extension settings:
1. Open VS Code Settings (`Ctrl+,`)
2. Search for "Cline: Custom Instructions"
3. Add markdown content as system prompt additions

---

## Rule Format

Cline rules are **plain markdown with no frontmatter**. This is the key difference from VS Code `.agent.md` files and Cursor `.mdc` files.

### VS Code Format (canonical)

```yaml
---
name: zeus
description: "Central orchestrator"
tools:
  - agent
  - read/readFile
  - execute/runInTerminal
---
```

### Cline Format (generated)

```markdown
> Pantheon rule for Cline. This content is loaded as system prompt context.

# Zeus - Main Conductor

You are an ORCHESTRATOR ONLY. You NEVER implement code...
```

Everything is plain markdown. Tool declarations, descriptions, and other frontmatter fields are stripped — Cline automatically decides tool access based on the task.

---

## Differences from VS Code Copilot

| Feature | VS Code (.agent.md) | Cline (.clinerules) |
|---|---|---|
| **Agent format** | `.agent.md` with YAML frontmatter | Plain markdown, no frontmatter |
| **Agent system** | Formal agent system with `@agent` mentions | Rules only — all rules merge into one system prompt |
| **Frontmatter** | `name`, `description`, `tools`, `skills` etc. | **None** — fully stripped |
| **Tool declarations** | Tools listed in frontmatter | Cline decides tools automatically |
| **Skills** | Skill tool in frontmatter | Not supported — manuals kills as separate rules |
| **Handoffs** | `handoffs` YAML with agent/label/prompt | Not supported |
| **Subagent delegation** | `runSubagent` via agents list | Direct task execution by Cline |
| **Lifecycle hooks** | PreToolUse, PostToolUse, Stop | Not supported |
| **Model routing** | Per-agent model in frontmatter | Global model selection in settings |
| **Orchestration** | Formal multi-agent orchestration | Single-agent — rules act as system prompt context |

### Example Translation

**Canonical (VS Code `.agent.md`):**
```yaml
---
name: hermes
description: Backend specialist for FastAPI, Python, async, TDD
tools:
  - read/readFile
  - edit/editFiles
  - execute/runInTerminal
  - search/codebase
  - web/fetch
handoffs:
  - label: "Database Schema"
    agent: demeter
---
# Hermes — Backend Implementation

You are a backend specialist...
```

**After Cline adapter conversion:**
```markdown
> Pantheon rule for Cline. This content is loaded as system prompt context.

# Hermes — Backend Implementation

You are a backend specialist...
```

No frontmatter, no handoff definitions, no tool lists — just the body content that acts as the system prompt.

---

## Cline-Specific Features

### Autonomous Agent Mode

Cline operates as an autonomous agent that can:
- Read, write, and edit files
- Execute terminal commands
- Search codebase (grep, glob)
- Fetch web content
- Install dependencies and run tests

Unlike formal agent systems, Cline doesn't require explicit tool declarations in frontmatter. It automatically determines available tools based on the task context.

### Cost Control

Cline provides built-in cost tracking and API usage monitoring. Since there's no per-agent model routing, configure your preferred model in Cline's extension settings.

### Task Execution

Cline handles tasks through a conversational loop:
1. User describes the task
2. Cline plans the approach (using loaded rules as context)
3. Cline executes the plan with file operations and commands
4. User reviews and approves changes

The `.clinerules` files become part of Cline's system prompt, guiding its behavior for each task.

### Custom Instructions

Accessible via VS Code extension settings:
- **Mode-specific instructions** — Act as system prompt additions
- **Always-include instructions** — Prepended to every request

These work alongside `.clinerules` files to shape Cline's behavior.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Rules not loading | Verify `.clinerules/` (directory mode) or `.clinerules` (single file) exists in project root |
| Rules merged incorrectly | Cline merges all files in `.clinerules/` — ensure rules don't conflict |
| Agent behavior unexpected | Rules become system prompt; check for contradictory instructions across files |
| Frontmatter appears in content | Cline doesn't parse YAML frontmatter — remove `---` delimiters if the sync engine generated them |
| Missing tool access | Cline auto-decides tools — you can't declare tools in frontmatter |
| Global rules not applied | Check `~/Documents/Cline/Rules/` exists and has valid markdown files |
| Custom instructions not working | Verify VS Code extension settings → Cline → Custom Instructions |
| High token usage | All `.clinerules` files merge into one system prompt — keep total content concise |

### Known Limitations

- **No agent system** — Cline doesn't have `@agent` mentions or formal agent delegation. All rules merge into a single system prompt.
- **No frontmatter** — Tool declarations, model routing, and handoffs defined in frontmatter are lost. The adapter strips them entirely.
- **No parallel execution** — Cline works as a single autonomous agent. There's no built-in subagent orchestration.
- **Single-file mode** — In `.clinerules` (single file) mode, all agent instructions must be in one file, which can get large.
- **Sync engine limitation** — The current sync engine (`scripts/sync-platforms.mjs`) always wraps output in `---` frontmatter delimiters even when `include` is empty. Manual removal of the first line may be needed until the engine supports a `skipFrontmatter` option.

### Verification Checklist

- [ ] `.clinerules/` directory exists in project root (or `.clinerules` file)
- [ ] Rule files are plain markdown with no YAML frontmatter
- [ ] Rules don't contain tool references that Cline can't use
- [ ] Total rule content is concise enough for system prompt context window
- [ ] Global rules in `~/Documents/Cline/Rules/` complement (don't contradict) project rules
- [ ] Custom instructions in VS Code settings are aligned with `.clinerules` content

---

## Comparison: Cline vs Other Platforms

| Feature | VS Code | OpenCode | Claude Code | Cursor | Windsurf | **Cline** |
|---|---|---|---|---|---|---|
| **Agent format** | `.agent.md` | `.md` + frontmatter | `.md` + comma tools | `.mdc` rules | `.md` rules | **`.clinerules` plain md** |
| **Frontmatter** | Full YAML | YAML subset | YAML subset | Minimal name+desc | Minimal name+desc | **None** |
| **Tool declarations** | In frontmatter | In frontmatter | In frontmatter | Stripped | Stripped | **Auto-decided** |
| **Agent system** | Built-in | `agent` config | Agent definitions | `@agent` mentions | Cascade | **Rules only** |
| **Subagents** | `runSubagent` | Task tool | Task tool | Native | Cascade | **Single agent** |
| **Handoffs** | ✅ | ✅ (via prompts) | ✅ | ❌ | ❌ | **❌** |
| **Lifecycle hooks** | ✅ | ⚠️ Partial | ❌ | ❌ | ❌ | **❌** |
| **Model routing** | Per-agent | Per-agent + plans | Per-agent | Settings only | TBD | **Settings only** |
| **Status** | ✅ Active | ✅ Active | ✅ Active | ✅ Active | 🧪 Preview | **🧪 Preview** |

---

[Main Documentation](../../README.md)
