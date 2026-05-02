# Pantheon for Continue.dev

> Continue is not a "framework" — it's a system-prompt injection layer. Pantheon becomes a collection of context rules that teach Continue to think in specialized roles.

## What is Continue.dev?

[Continue.dev](https://docs.continue.dev) is an open-source AI coding assistant for VS Code and JetBrains. It uses a `config.yaml` file to define models, rules, and MCP servers. Instead of a formal agent system, it injects **rules** (markdown files in `.continue/rules/`) into the system prompt on every interaction.

Pantheon adapts to Continue by converting each agent definition into a rule file. When you ask a question, all active rules are concatenated into the system message, giving Continue context about the Pantheon agent roles and workflows.

## Prerequisites

| Requirement | Notes |
|---|---|
| **VS Code** or **JetBrains** | Continue runs as an IDE extension |
| **Continue extension** | Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Continue.continue) or [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/22707-continue) |
| **Node.js 18+** | Needed for the sync engine (`npm run sync`) |
| **Git** | Any recent version |

## Installation

### Step 1: Clone Pantheon

```bash
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install
```

### Step 2: Sync Canonical Agents → Continue Rules

```bash
npm run sync continue
```

This generates `.md` rule files in `platform/continue/rules/` from the canonical `.agent.md` files. Each rule is the agent body with VS Code-specific sections stripped.

### Step 3: Copy Rules to Your Project

```bash
mkdir -p .continue/rules
cp -r platform/continue/rules/. .continue/rules/
cp platform/continue/config.yaml .continue/config.yaml
```

### Step 4: Configure Models

Edit `.continue/config.yaml` to set your API keys and model preferences:

```yaml
models:
  - title: Gemini 2.5 Pro
    provider: google
    model: gemini-2.5-pro
    apiKey: YOUR_API_KEY
  - title: GPT-4o
    provider: openai
    model: gpt-4o
    apiKey: YOUR_API_KEY
```

### Step 5: Customize Active Rules (Optional)

Continue loads all rules referenced in `config.yaml`. To reduce context usage, comment out rules you don't need:

```yaml
rules:
  - ./rules/hermes.md
  - ./rules/aphrodite.md
  - ./rules/maat.md
  - ./rules/temis.md
  # - ./rules/zeus.md     # comment out unused rules
  # - ./rules/athena.md
```

## Project Structure

```
your-project/
├── .continue/
│   ├── config.yaml              # Main configuration (models, rules, MCP)
│   ├── rules/                   # Rule files (markdown — system prompt injections)
│   │   ├── zeus.md
│   │   ├── athena.md
│   │   ├── apollo.md
│   │   ├── hermes.md
│   │   ├── aphrodite.md
│   │   ├── maat.md
│   │   ├── temis.md
│   │   ├── ra.md
│   │   ├── hefesto.md
│   │   ├── quiron.md
│   │   ├── eco.md
│   │   ├── nix.md
│   │   ├── gaia.md
│   │   ├── iris.md
│   │   ├── mnemosyne.md
│   │   └── talos.md
│   ├── models/                  # Model configs (optional — shared via Continue Hub)
│   └── .continue.hub.json       # Continue Hub credentials (auto-generated)
```

## How Continue Rules Work

### System Prompt Injection

Continue concatenates all active rule files into the system message on every interaction. This means:

- Every rule file's content is injected into the LLM context
- Rules act as persistent system instructions — the model always sees them
- More rules = more context used (be selective)

### What the Pantheon Rules Do

Each rule teaches Continue about a specific agent role:

| Rule | Injects knowledge about |
|---|---|
| `zeus.md` | Orchestration workflow, phase transitions, delegation patterns |
| `hermes.md` | Backend TDD, FastAPI patterns, async/service architecture |
| `aphrodite.md` | Frontend React patterns, accessibility, responsive design |
| `maat.md` | Database schema design, migration strategy, N+1 prevention |
| `temis.md` | Code review checklist, OWASP security, coverage enforcement |
| `athena.md` | Architecture planning, phased roadmaps, technology decisions |
| `apollo.md` | Codebase discovery, parallel search, evidence gathering |
| `ra.md` | Docker multi-stage builds, deployment, health checks |
| `hefesto.md` | RAG pipelines, vector search, LangChain chain composition |
| `quiron.md` | Multi-model routing, cost optimization, provider abstraction |
| `eco.md` | Conversational AI, intent/entity design, dialogue management |
| `nix.md` | Observability, OpenTelemetry, cost tracking, structured logging |
| `gaia.md` | Remote sensing, LULC analysis, inter-product agreement |
| `iris.md` | GitHub operations, conventional commits, PR workflows |
| `mnemosyne.md` | Memory bank management, ADR documentation, decision logging |
| `talos.md` | Hotfix patterns, rapid repair, bypassing standard orchestration |

### Local Rules vs Hub Rules

Continue supports two types of rules:

- **Local rules** (`.continue/rules/`): Markdown files on your filesystem
- **Hub rules** (Continue Hub): Shareable rules from [Continue Mission Control](https://hub.continue.dev)

Pantheon rules are local. To share them with your team, you can upload to Continue Hub.

### MCP Servers

Continue supports MCP servers for extended capabilities. Configure them in `config.yaml`:

```yaml
mcpServers:
  fetch:
    url: https://mcp.run/...
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."]
```

## Differences from VS Code Copilot

| Feature | VS Code Copilot | Continue.dev |
|---|---|---|
| **Agent system** | Native `@name` agent invocation | No agent system — rules are injected into system prompt |
| **Agent definition** | `.agent.md` with YAML frontmatter (tools, handoffs, model, skills) | `.md` files with no frontmatter (just markdown content) |
| **Tool permissions** | Per-agent tool allowlists | All tools always available — no tool scoping |
| **Handoffs** | Native handoff buttons in chat UI | No handoff mechanism |
| **Subagent delegation** | `runSubagent` with `agents:` allowlist | Not supported |
| **Skills** | Skill registry with `skill` tool | No skill system — rules replace this |
| **Lifecycle hooks** | Pre/Post tool use hooks, security gates | Not supported |
| **Model routing** | Per-agent model field, tier-based handoff models | Single model per session (switched manually) |
| **Parallel execution** | Yes (subagent parallelism) | No — single-threaded |
| **Nested subagents** | Yes (5 levels deep) | Not supported |
| **Plugin system** | VS Code plugin marketplace | Continue Hub for rules/models/MCP |

## Customizing System Messages

Continue supports custom system message overrides in `config.yaml`:

```yaml
# Chat mode (default)
baseSystemMessage: |
  You are an expert software engineer and architect.

# Agent mode (when using /agent command)
baseAgentSystemMessage: |
  You are an expert software engineer. Use your tools to accomplish tasks.

# Plan mode (when using /plan command)
basePlanSystemMessage: |
  You are an expert software architect. Create detailed plans.
```

You can reference Pantheon rules within these messages to focus the model:

```yaml
baseSystemMessage: |
  You are a Pantheon-powered Continue assistant.
  Use the following agent roles based on the task:

  - For backend work: reference the Hermes rule (hermes.md)
  - For frontend: reference the Aphrodite rule (aphrodite.md)
  - For database: reference the Maat rule (maat.md)
  - For code review: reference the Temis rule (temis.md)

  Always consult the relevant rule file before responding.
```

## Continue Hub Integration

[Continue Hub](https://hub.continue.dev) lets you share rules, models, and MCP servers with your team. To publish Pantheon rules to Hub:

1. Open Continue in VS Code
2. Open the Continue sidebar
3. Go to **Mission Control** → **Rules**
4. Click **Add Rule** → **From File** → select a `.continue/rules/*.md` file
5. Configure visibility (private to your org or public)

## Updating Rules

When Pantheon agents are updated, regenerate the rules:

```bash
cd pantheon
git pull
npm run sync continue
cp -r platform/continue/rules/. /path/to/your-project/.continue/rules/
```

## Troubleshooting

| Problem | Solution |
|---|---|
| Rules not taking effect | Run `/reload` in Continue chat to reload config. Check `config.yaml` has the correct paths to rule files. |
| Too much context used | Reduce the number of active rules in `config.yaml`. Only enable rules relevant to your current task. |
| Model not responding as expected | Adjust `baseSystemMessage` in `config.yaml` to focus the model on specific agent behaviors. |
| Config changes not applied | Continue auto-reloads `config.yaml` on save. If not, use `/reload`. |
| Rules not found | Verify paths in `config.yaml` are relative to `.continue/`. Use absolute paths if unsure. |
| MCP server not connecting | Check server URL/command in `config.yaml`. Ensure the server is running and accessible. |

---

[Main Documentation](../../README.md)
