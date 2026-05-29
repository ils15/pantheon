# MCP Server Recommendations for Pantheon

Tiered MCP server recommendations organized by project type and agent role. MCP servers extend Pantheon agents with external tool access — databases, APIs, web search, browser automation, and more.

> 💡 **New:** Use `node scripts/install-mcp.mjs` to automatically install and configure MCPs for your platform. See [Quick-Start Checklist](#-quick-start-checklist) below.

---

## 🚀 Quick-Start Checklist

### Automatic Setup (Recommended)
```bash
# Install essential MCPs (Context7 + GitHub)
node scripts/install-mcp.mjs

# Install domain-specific MCPs interactively
node scripts/install-mcp.mjs --tier 2

# See what's available
node scripts/install-mcp.mjs --list

# Dry-run: see what would be installed
node scripts/install-mcp.mjs --dry-run
```

### Manual Setup Checklist
- [ ] **Context7** — Library documentation (free, no API key needed)
- [ ] **GitHub MCP** — Repository access (OAuth, no PAT needed)
- [ ] **Playwright** — Browser automation (for frontend agents)
- [ ] **PostgreSQL** — Database access (requires DATABASE_URL)
- [ ] **Brave Search** — Web search (requires BRAVE_API_KEY)
- [ ] **Docker** — Container management (requires Docker CLI)

> **Minimum for Pantheon to work:** Context7 + GitHub MCP (Tier 1)

---

## 📦 MCP Inventory — Complete

All MCPs currently configured across Pantheon's 17 agents:

### Active MCPs by Agent

| MCP | Used By (agents) | Type | Setup |
|-----|-----------------|------|-------|
| **context7** | 13 agents (zeus, athena, apollo, hermes, aphrodite, demeter, themis, hephaestus, chiron, echo, nyx, talos, gaia) | Local | `npx -y @upstash/context7-mcp` — free, no API key |
| **brave-search** | 4 agents (athena, apollo, gaia, chiron) | Local | `npx -y @anthropic/brave-search-mcp` — requires `BRAVE_API_KEY` |
| **playwright** | 4 agents (aphrodite, themis, hermes, argus) | Local | `npx -y @playwright/mcp@latest` — free |
| **exa** | 1 agent (apollo) | Local | `npx -y exa-mcp` — requires `EXA_API_KEY` |
| **grep-app** | 1 agent (apollo) | Local | `npx -y @modelcontextprotocol/server-grepapp` — requires `GREP_APP_API_KEY` |
| **postgresql** | 2 agents (hermes, demeter) | Local | `npx -y @anthropic/postgres-mcp` — requires `DATABASE_URL` |
| **docker** | 1 agent (prometheus) | CLI | Uses Docker CLI — requires Docker installed |
| **github** | 2 agents (zeus, iris) | Remote | `https://api.githubcopilot.com/mcp/` — OAuth, no PAT needed |
| **figma** | 1 agent (aphrodite) | Local | Requires Figma access token |
| **memory** | 1 agent (mnemosyne) | Built-in | VS Code OpenCode native memory — no setup |

### Installation Status

```bash
# Essential (Tier 1) — install these first
node scripts/install-mcp.mjs --tier 1

# Domain (Tier 2) — install as needed
node scripts/install-mcp.mjs --tier 2

# Specific MCP
node scripts/install-mcp.mjs --mcp playwright,postgresql
```

---

## 🖥️ Platform-Specific MCPs

Some platforms support MCPs that aren't in the canonical agent templates but enhance the experience:

### OpenCode-Specific
| MCP | Description | Config |
|-----|-------------|--------|
| **Exa AI** | Web search + content fetching | Already in Apollo template |
| **Grep.app** | Public GitHub code search | Already in Apollo template |
| **Context7** | Library docs (OpenCode has native integration) | Already in Apollo template |

### VS Code / Cursor-Specific
| MCP | Description | When to add |
|-----|-------------|-------------|
| **vscode-mcp-server** | File system, terminal, editor access | When agents need workspace-level operations |
| **Sequential Thinking** | Step-by-step reasoning for complex tasks | Architecture-heavy projects |

### Claude Code-Specific
| MCP | Description | When to add |
|-----|-------------|-------------|
| **Filesystem MCP** | Read/write outside workspace | When agents need file ops beyond project root |
| **Web Fetch MCP** | Alternative HTTP client | When fetch tool is insufficient |

### Docker / Container Workflows
| MCP | Description | When to add |
|-----|-------------|-------------|
| **Docker MCP** | Container lifecycle management | When using Docker for dev/test |
| **Kubernetes MCP** | K8s cluster management | When deploying to Kubernetes |

### Observability
| MCP | Description | When to add |
|-----|-------------|-------------|
| **Sentry MCP** | Error tracking and performance | Production apps with error tracking |
| **OpenTelemetry** | Distributed tracing | Microservices architectures |

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

## MCP Configuration via Frontmatter

Each agent template now includes a `mcpServers` field in its frontmatter that declares which MCP servers the agent can use. This enables per-agent MCP binding with tool scoping.

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
    when: "visual verification needed"
```

### Agent-MCP Mapping

| Agent | MCPs | Tier |
|-------|------|------|
| @zeus | context7, github | Core |
| @hermes | context7, postgresql, playwright | Role-Specific |
| @aphrodite | context7, playwright, figma | Role-Specific |
| @demeter | postgresql, context7 | Role-Specific |
| @prometheus | docker, context7 | Role-Specific |
| @apollo | context7, brave-search, exa, grep-app | Optional |
| @argus | playwright | Role-Specific |
| @iris | github | Role-Specific |
| @mnemosyne | memory | Core |
| Others | context7 | Core |

> **Note:** The `constraints` field in the schema above enables per-agent security hardening. For example, `queryMode: "parameterized-only"` on PostgreSQL MCP prevents SQL injection. See the [Security Hardening](#security-hardening) section below for details.

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

---

## Security Hardening

See `instructions/mcp-security.instructions.md` for complete MCP security rules.

### Constraint Types

| Constraint | Purpose | Example |
|-----------|---------|---------|
| `queryMode` | Restrict SQL query types | `"parameterized-only"` |
| `readOnly` | Prevent write operations | `true` for Hermes |
| `forbiddenFlags` | Block dangerous flags | `["--privileged"]` |
| `requiredFlags` | Enforce safety flags | `["--cap-drop=ALL"]` |
| `auditLog` | Require audit comments | `true` for Demeter |
| `imagePolicy` | Restrict image sources | `"verified-only"` |

### Enforcement

These constraints are enforced by @themis during code review. Violations are CRITICAL and block the review.

---

## 🔧 Troubleshooting

### MCP Not Connecting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "MCP server not found" | Server not installed | Run `node scripts/install-mcp.mjs --mcp <name>` |
| "Connection refused" | URL wrong or server not running | Check the URL in your platform config |
| "Tool not available" | Agent template missing mcpServers entry | Verify `agents/*.agent.md` has the MCP in frontmatter |
| "Authentication failed" | Missing env var | Set `DATABASE_URL`, `BRAVE_API_KEY`, etc. |
| "Command not found: npx" | Node.js not installed | Install Node.js 18+ from nodejs.org |

### Platform-Specific Issues

**VS Code / Cursor:**
- Restart VS Code after modifying `.vscode/mcp.json` or `.cursor/mcp.json`
- Open Command Palette → `MCP: List Servers` to verify connection

**OpenCode:**
- Config is in `opencode.json` under `mcpServers`
- Run `opencode mcp list` to see configured servers
- Run `opencode mcp debug <name>` to test connectivity

**Claude Code:**
- Config is in `.mcp.json` (project) or `~/.claude/settings.json` (global)
- Run `claude mcp list` to verify
- Project config takes precedence over global

**Windsurf:**
- Config is in `~/.codeium/windsurf/mcp_config.json` (global only)
- Restart Windsurf after modifying config

### Verify MCP is Working

After installation, check that your agents can actually use the MCP:

```bash
# OpenCode
opencode mcp list
opencode mcp debug context7

# Claude Code
claude mcp list

# VS Code
# Command Palette → MCP: List Servers
```
