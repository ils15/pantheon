# MCP Server Recommendations for Pantheon

Tiered MCP server recommendations organized by project type and agent role. MCP servers extend Pantheon agents with external tool access — databases, APIs, web search, browser automation, and more.

---

## Tier 1 — Essential (All Projects)

These two servers should be enabled in every Pantheon project.

| Server | What it does | Why it matters |
|---|---|---|
| **Context7** | Fetches up-to-date, version-specific library documentation | Eliminates API hallucinations. LLMs train on stale data; Context7 ensures agents reference current APIs. |
| **GitHub MCP** | Repository access, PR/issue management, code search, CI/CD, security scanning | Agents can manage PRs, triage issues, search across repos, and monitor workflows without leaving the session. |

**Already configured in:** `.vscode/mcp.json`, `.mcp.json`, `.cursor/mcp.json`

---

## Tier 2 — Domain-Specific

Add based on your project's tech stack.

| Server | Best for | Agent that uses it most |
|---|---|---|
| **Playwright MCP** | Frontend projects with E2E testing needs | Aphrodite (frontend verification), Themis (visual regression) |
| **PostgreSQL MCP** | Projects using PostgreSQL | Demeter (schema analysis, query optimization), Hermes (DB debugging) |
| **Brave Search MCP** | Any project needing real-time web access | Athena (research), Apollo (external discovery), Gaia (scientific literature) |
| **Fetch MCP** | Any project consuming external APIs | Hermes (API integration), Apollo (external docs), Chiron (provider specs) |
| **Filesystem MCP** | Projects needing file ops outside workspace | All agents (controlled access to parent directories) |
| **Sequential Thinking MCP** | Architecture-heavy projects | Athena (complex planning), Zeus (orchestration decisions) |

---

## Tier 3 — Project-Specific

Add when the project has these specific needs.

| Server | When to add | Agent |
|---|---|---|
| **Sentry MCP** | Production apps with error tracking | Nyx (error analysis), Themis (security audit) |
| **Docker MCP** | Containerized deployments | Prometheus (container management, health checks) |
| **Slack MCP** | Team communication integration | Iris (notifications), Zeus (status updates) |
| **Jira MCP** | Project management integration | Iris (issue tracking), Zeus (sprint coordination) |
| **Linear MCP** | Lightweight issue tracking | Iris (task management) |
| **Figma MCP** | Design-to-code workflow | Aphrodite (design token extraction) |
| **Stripe MCP** | Payment integration | Hermes (payment API), Themis (security review) |

---

## MCP by Agent Role

| Agent | Recommended MCP servers | Key tools used |
|---|---|---|
| **Zeus** | GitHub, Context7 | `create_pull_request`, `get_library_docs` |
| **Athena** | Context7, Brave Search, Sequential Thinking | `get_library_docs`, `web_search`, `sequential_thinking` |
| **Apollo** | GitHub, Context7, Brave Search | `search_code`, `get_library_docs`, `web_search` |
| **Hermes** | Context7, PostgreSQL, Fetch | `get_library_docs`, `execute_query`, `fetch_url` |
| **Aphrodite** | Context7, Playwright, Figma | `get_library_docs`, `browser_snapshot`, `get_figma_data` |
| **Demeter** | PostgreSQL, Context7 | `execute_query`, `get_schema`, `get_library_docs` |
| **Themis** | GitHub, Context7, Sentry | `get_code_scanning`, `get_library_docs`, `get_issues` |
| **Prometheus** | Docker, Context7 | `list_containers`, `get_logs`, `get_library_docs` |
| **Hephaestus** | Context7, Fetch | `get_library_docs` (LangChain, vector DBs) |
| **Chiron** | Context7, Fetch | `get_library_docs` (AWS Bedrock, model specs) |
| **Echo** | Context7, Brave Search | `get_library_docs` (Rasa, dialogue patterns) |
| **Nyx** | Context7, Sentry | `get_library_docs` (OpenTelemetry, LangSmith) |
| **Iris** | GitHub, Linear/Jira | `create_pull_request`, `list_issues`, `create_release` |
| **Talos** | Context7, Filesystem | `get_library_docs`, `read_file` (outside workspace) |
| **Gaia** | Context7, Brave Search | `get_library_docs`, `web_search` (scientific papers) |

---

## Platform-Specific Configuration

### OpenCode

Add to `opencode.json`:

```json
{
  "mcp": {
    "github": {
      "type": "remote",
      "url": "https://api.githubcopilot.com/mcp/",
      "enabled": true
    },
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    },
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"],
      "enabled": true
    }
  }
}
```

CLI management:
```bash
opencode mcp add github          # interactive setup
opencode mcp list                # list all servers
opencode mcp debug github        # test connection
```

### VS Code Copilot

Add to `.vscode/mcp.json` (workspace) or user `mcp.json`:

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

CLI: `MCP: Add Server` in Command Palette.

### Claude Code

Add to `.mcp.json` (project-scoped, committed to git):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

CLI: `claude mcp add github --scope project`

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json` (global only — Windsurf doesn't support project-scoped MCP):

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

⚠️ **Windsurf limitation:** Hard cap of 100 tools across all servers. Choose servers carefully.

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

- **Never commit secrets** in MCP config files. Use `${VAR}` interpolation.
- **Sandbox local MCP servers** when possible (VS Code supports `sandboxEnabled: true`).
- **Review MCP tool permissions** before enabling. Some servers expose destructive tools.
- **Windsurf has a 100-tool hard limit** — audit tool counts before adding servers.
- **GitHub MCP remote** (api.githubcopilot.com) uses OAuth — no PAT needed.
