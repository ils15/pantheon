# Pantheon for Windsurf

## Prerequisites

- [Windsurf IDE](https://codeium.com/windsurf) installed
- Active Windsurf subscription (required for Cascade agent mode)

## Installation

Use the universal install script (auto-detects platform):

```bash
node scripts/install.mjs --target /path/to/your-project
```

### Manual Setup

```bash
git clone https://github.com/anomalyco/Pantheon.git
cd Pantheon
npm install
```

Windsurf uses the `.windsurf/` directory for agent configurations (adapter v2.0.0, now production-ready):

1. Create the `.windsurf/` directory in your project root
2. Copy agent files from `agents/` into `.windsurf/agents/`
3. Copy instruction files from `instructions/` into `.windsurf/instructions/`

## Configuration

### Directory Structure

```
.windsurf/
├── agents/          # Agent definitions (.agent.md)
├── rules/           # Custom rules and instructions
└── global_rules/    # Global rules applied across all agents
```

### Agent File Placement

Place `.agent.md` files in `.windsurf/agents/`. Windsurf automatically discovers agents placed in this directory.

### Rules Configuration

Windsurf supports two types of rules:

- **Global rules** (`.windsurf/global_rules/`) — applied to all conversations
- **Agent-specific rules** (`.windsurf/rules/`) — applied to specific agents

Rules can reference instruction files from this repository's `instructions/` directory, though some reformatting may be needed due to format differences.

## Agent Format (adapter v2.0.0)

Windsurf supports `.agent.md` format similar to VS Code Custom Agents, now production-ready:

| Feature | VS Code | Windsurf |
|---------|---------|----------|
| Agent discovery | `.github/agents/` or custom path | `.windsurf/agents/` |
| Frontmatter | YAML with `name`, `description`, `model`, `tools` | YAML with `name`, `description`, `tools`, `mode`, `skills`, `instructions` |
| Tool naming | `search/codebase`, `edit/editFiles` | Mapped via toolMap to Windsurf-native names |
| Instructions | `.github/copilot-instructions.md` | `.windsurf/rules/` files |
| ensureAgentTool | Default true | Set to `false` |

### Format Differences

- Windsurf uses `Codeium` model identifiers instead of Copilot model names
- Tool names are automatically mapped via the adapter's `toolMap` — no manual translation needed
- Frontmatter supports `mode` (`plan`, `implement`, `review`), `skills`, and `instructions` fields
- `ensureAgentTool` is set to `false` to prevent automatic agent tool injection

## Windsurf-Specific Features

### Cascade Agent Mode

Cascade is Windsurf's default agent mode. It provides:
- Multi-file editing capabilities
- Terminal command execution
- Context-aware code generation
- File system operations

### Windsurf Flow

Flow mode enables step-through execution of agent tasks, allowing you to review and approve each action before it runs. This is useful for validating agent behavior when porting agents from VS Code.

### Tab Completion

Windsurf provides AI-powered tab completions inline, which complement agent-generated code by offering real-time suggestions as you type.

### MCP Support

Windsurf supports MCP (Model Context Protocol) servers. Configure MCP servers in:

```json
.windsurf/mcp_config.json
```

Refer to [MCP documentation](../mcp/README.md) for server configuration details compatible with Windsurf.

## Troubleshooting

### Known Limitations

- **Agent format parity**: Some VS Code agent frontmatter fields (`handoffs`, `agents`, `user-invocable`) may not be supported — test thoroughly when porting agents
- **Rule application**: `.windsurf/rules/` may process rules differently than VS Code's `copilot-instructions.md` — verify behavior with complex instructions
- **Nested subagents**: Delegation follows a different model than VS Code's `runSubagent` — use direct `@agent` mentions

### Common Issues

| Issue | Solution |
|-------|----------|
| Agent not discovered | Verify `.agent.md` is in `.windsurf/agents/` |
| Frontmatter parsing error | Check YAML syntax; remove unsupported fields |
| Tool not found | Refer to Windsurf's tool reference for correct naming |
| Rules not applying | Ensure rules are in `.windsurf/rules/` with `.md` extension |

---

[Main Documentation](../../README.md)
