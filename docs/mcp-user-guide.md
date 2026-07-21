# MCP User Guide: Adding Custom Servers & Agent Awareness

This guide explains how to add your own MCP servers to Pantheon and make agents aware of them.

---

## Quick Start

Add an MCP server to your platform config. All examples below use a fictional `my-tools` server:

**OpenCode** (`opencode.json`):
```json
{
  "mcp": {
    "my-tools": {
      "type": "local",
      "command": ["node", "my-mcp-server.js"],
      "enabled": true
    }
  }
}
```

**Claude Code** (`.mcp.json`):
```json
{
  "mcpServers": {
    "my-tools": {
      "command": "node",
      "args": ["my-mcp-server.js"]
    }
  }
}
```

**VS Code / Cursor** (`.vscode/mcp.json` or `.cursor/mcp.json`):
```json
{
  "servers": {
    "my-tools": {
      "type": "stdio",
      "command": "node",
      "args": ["my-mcp-server.js"]
    }
  }
}
```

**Cline** (`cline_mcp_settings.json`):
```json
{
  "mcpServers": {
    "my-tools": {
      "command": "node",
      "args": ["my-mcp-server.js"]
    }
  }
}
```

After adding, restart your MCP client. Verify the server connects.

---

## Making Agents Aware of Custom MCPs

Adding a server to config is only half the work. **Agents don't auto-discover MCP tools** — you must declare them in the agent's `.agent.md` file.

### Step 1: Add `mcp_tools:` to Frontmatter

In the agent's YAML frontmatter, add an `mcp_tools:` block listing which tools from which server the agent can use:

```yaml
---
name: hermes
mcp_tools:
  my-tools:
    - analyze_dependency
    - scan_vulnerabilities
---
```

This tells the platform to inject these tool definitions into the agent's context.

### Step 2: Document Tools in the Agent Body

Add a `## Custom MCP Tools` section in the agent's body so the agent understands *when* and *how* to use each tool:

```markdown
## Custom MCP Tools

| Server | Tool | Signature | When to use |
|--------|------|-----------|-------------|
| **my-tools** | `analyze_dependency(package, depth?)` | Check a dependency for known vulnerabilities |
| **my-tools** | `scan_vulnerabilities(path)` | Scan a directory for security issues |
```

### Step 3: Set Access Control

**OpenCode** (`opencode.json`):
```json
{
  "permission": {
    "mcp": {
      "my-tools": "ask"
    }
  }
}
```

Values: `allow` (auto-approve), `ask` (prompt user), `deny` (block).

---

## Full Example: GitHub MCP

### 1. Install & Configure

**OpenCode** (`opencode.json`):
```json
{
  "mcp": {
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "{env:GITHUB_TOKEN}"
      },
      "enabled": true
    }
  }
}
```

### 2. Declare in Agent Frontmatter

```yaml
---
name: iris
mcp_tools:
  github:
    - create_issue
    - list_pull_requests
    - search_code
---
```

### 3. Document in Agent Body

```markdown
## Custom MCP Tools

| Server | Tool | Signature | What it does |
|--------|------|-----------|-------------|
| **github** | `create_issue(title, body, labels?)` | Create a GitHub issue in the current repo |
| **github** | `list_pull_requests(state?: "open")` | List PRs with optional state filter |
| **github** | `search_code(query)` | Search code across the repository |
```

### 4. Configure Permissions

```json
{
  "permission": {
    "mcp": {
      "github": "ask"
    }
  }
}
```

---

## Best Practices

| Practice | Recommendation |
|----------|---------------|
| **Server names** | Short, descriptive, lowercase (e.g., `github`, `postgres`, `slack`). They become the prefix. |
| **Tool declarations** | Only declare tools the agent actually needs. |
| **Documentation** | Always add a `## Custom MCP Tools` table with signature + purpose. |
| **Permission** | Start with `ask` for new MCPs. Only downgrade to `allow` after verifying read-only safety. |
| **Max MCPs** | Follow the 3-7 rule: 3 core + up to 4 custom. Beyond 7, accuracy degrades. |
| **Naming** | Match `mcp_tools:` keys to the server name in your config. They must be identical. |
| **Environment variables** | Use `{env:VAR}` interpolation for secrets. Never inline tokens in config. |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Agent says "I don't have that tool" | MCP not declared in frontmatter | Add `mcp_tools:` entry |
| Tool exists but agent doesn't use it | No body documentation | Add `## Custom MCP Tools` section |
| "Server not found" | Config typo | Check server name matches config |
| "Tool call failed" | Permission denied | Set to `allow` or `ask` in config |
| Agent uses wrong tool | Too many MCPs | Reduce to ≤5 per agent |
| Changes not taking effect | Client cache | Restart the MCP client |

---

## Reference

- [MCP Tool Registry](mcp-tools.md) — Canonical reference of built-in Pantheon MCP tools
- [MCP Security](skill: mcp-security) — Security hardening rules
