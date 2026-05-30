# MCP Server Recommendations for Pantheon

MCP (Model Context Protocol) servers extend Pantheon agents with external capabilities — library documentation lookup, web search, content fetching, and browser automation.

This document covers the **3 MCPs we actively use** across Pantheon agents.

---

## Our MCPs at a Glance

| MCP | What it does | Who uses it | Setup |
|-----|-------------|-------------|-------|
| **context7** | Fetches up-to-date, version-specific library documentation | 13 agents (zeus, athena, apollo, hermes, aphrodite, demeter, themis, hephaestus, chiron, echo, nyx, talos, gaia) | `npx -y @upstash/context7-mcp` — free, no API key needed |
| **exa** | Web search + content fetching (structured results) | apollo | `npx -y exa-mcp-server` — requires `EXA_API_KEY` |
| **playwright** | Browser automation — screenshots, accessibility snapshots | aphrodite, themis, hermes, argus | `npx -y @playwright/mcp@latest` — free, requires Playwright browsers installed |

---

## Quick Setup

### context7 (Library Documentation)

**No API key required.** Zero-config after install.

```bash
npx -y @upstash/context7-mcp
```

**What it provides:**
- `context7_resolve-library-id` — Resolves a package name to a Context7 library ID
- `context7_query-docs` — Queries library documentation with a specific question

**Used by:** Agents needing current API docs — Hermes (FastAPI), Aphrodite (React), Demeter (SQLAlchemy), Hephaestus (LangChain), etc.

---

### exa (Web Search + Content Fetching)

Provides structured web search and full-page content retrieval.

```bash
npx -y exa-mcp-server
```

Requires the `EXA_API_KEY` environment variable. Set it in your platform's MCP config:

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    }
  }
}
```

**What it provides:**
- `exa_web_search_exa` — Search the web with natural language queries
- `exa_web_fetch_exa` — Fetch and read full webpage content as clean markdown

**Used by:** Apollo for external discovery, research, and documentation lookups.

---

### playwright (Browser Automation)

Enables browser-level interaction: navigation, screenshot capture, accessibility tree snapshots.

```bash
npx -y @playwright/mcp@latest
# Then install browsers:
npx playwright install chromium
```

**What it provides:**
- `browser/screenshotPage` — Full-page screenshot capture
- `browser/snapshot` — Accessibility/structured content tree
- Navigation, click, type, and other browser interaction tools

**Used by:** Aphrodite (visual review pipeline), Themis (visual regression checking), Argus (external screenshot analysis).

---

## MCP Configuration via Frontmatter

Each agent template includes an `mcpServers` field in its frontmatter that declares which MCP servers the agent can use. This enables per-agent MCP binding with tool scoping.

### Schema

```yaml
mcpServers:
  - name: string (required)
    tools: [string] (required)
    when: string (required)
    constraints: object (optional)
      queryMode: string ("parameterized-only" | "free")
      readOnly: boolean
      forbiddenPatterns: [string]
      forbiddenFlags: [string]
      requiredFlags: [string]
      imagePolicy: string ("verified-only" | "any")
      auditLog: boolean
```

### Constraints
- Maximum 5 MCPs per agent
- `tools` lists the MCP tools the agent can access
- `when` describes the activation condition

### Example

```yaml
mcpServers:
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"
  - name: playwright
    tools:
      - browser_screenshotPage
      - browser_snapshot
    when: "visual verification needed"
```

### Agent-MCP Mapping

| Agent | MCPs |
|-------|------|
| @zeus | context7 |
| @athena | context7 |
| @apollo | context7, exa |
| @hermes | context7, playwright |
| @aphrodite | context7, playwright |
| @demeter | context7 |
| @themis | context7, playwright |
| @prometheus | context7 |
| @hephaestus | context7 |
| @chiron | context7 |
| @echo | context7 |
| @nyx | context7 |
| @iris | — |
| @talos | context7 |
| @gaia | context7 |
| @argus | playwright |
| @mnemosyne | — (built-in memory) |

---

## MCP Tool Discovery Pattern

When an agent needs external capabilities beyond the codebase:

1. **Check if MCP is available** — ask the user or check config
2. **Use progressive discovery** — don't load all tool definitions; search for the right tool
3. **Prefer MCP over webfetch** — MCP tools have typed schemas and structured outputs
4. **Fall back to webfetch** — if no MCP server is configured for the needed capability

Example (Athena researching a library):
```
Need: Current FastAPI documentation
MCP: context7/get-library-docs → structured, version-specific
Fallback: web/fetch → unstructured, may be stale
```

---

## Security Notes

- **Never commit secrets** in MCP config files. Use `${VAR}` interpolation for env variables.
- **Sandbox local MCP servers** when possible (VS Code supports `sandboxEnabled: true`).
- **Review MCP tool permissions** before enabling. Some servers expose destructive tools.
- **Exa API key** should be stored in an environment variable, never inlined in config.
- **Playwright** runs headless Chromium locally — ensure it's used in a controlled environment.

---

## Security Hardening

See `instructions/mcp-security.instructions.md` for complete MCP security rules.

### Constraint Types

| Constraint | Purpose | Example |
|-----------|---------|----------|
| `readOnly` | Prevent write operations | `true` for Apollo (exa read-only) |
| `auditLog` | Require audit comments | `true` for certain operations |

### Enforcement

These constraints are enforced by @themis during code review.

---

## 🔧 Troubleshooting

### MCP Not Connecting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "MCP server not found" | Server not installed | Run `npx -y @upstash/context7-mcp` or install via your platform's MCP config |
| "Tool not available" | Agent template missing mcpServers entry | Verify `agents/*.agent.md` has the MCP in frontmatter |
| "Authentication failed" | Missing env var | Set `EXA_API_KEY` if using exa |
| "Command not found: npx" | Node.js not installed | Install Node.js 18+ from nodejs.org |
| "Browser not found" | Playwright browsers not installed | Run `npx playwright install chromium` |

### Platform-Specific Issues

**OpenCode:**
- Config is in `opencode.json` under `mcpServers`
- Run `opencode mcp list` to see configured servers
- Run `opencode mcp debug <name>` to test connectivity

**VS Code / Cursor:**
- Restart after modifying `.vscode/mcp.json` or `.cursor/mcp.json`
- Open Command Palette → `MCP: List Servers` to verify connection

**Claude Code:**
- Config is in `.mcp.json` (project) or `~/.claude/settings.json` (global)
- Run `claude mcp list` to verify
- Project config takes precedence over global

### Verify MCP is Working

```bash
# OpenCode
opencode mcp list
opencode mcp debug context7

# Claude Code
claude mcp list

# VS Code
# Command Palette → MCP: List Servers
```