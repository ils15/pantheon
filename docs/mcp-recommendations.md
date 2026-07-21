# MCP Server Recommendations for Pantheon

MCP (Model Context Protocol) servers extend Pantheon agents with external capabilities — library documentation lookup, web search, content fetching, browser automation, and **persistent memory**.

This document covers the **6 built-in + external MCPs** available to Pantheon agents.

---

## Our MCPs at a Glance

| MCP | What it does | Who uses it | Setup |
|-----|-------------|-------------|-------|
| **context7** | Fetches up-to-date, version-specific library documentation | 11 agents (zeus, athena, apollo, hermes, aphrodite, demeter, themis, hephaestus, nyx, talos, gaia) | `npx -y @upstash/context7-mcp` — free, no API key needed |
| ~~exa~~ | *Removed in v3.15.0* | — | Use `websearch` tool instead |
| **playwright** | Browser automation — screenshots, accessibility snapshots | aphrodite, themis, hermes | `npx -y @playwright/mcp@latest` — free, requires Playwright browsers installed |
| **pantheon-resources** | Pantheon framework resources — agents, skills, routing, deepwork, memory bank | all agents | `python scripts/mcp_resources_server.py` — built-in, no setup needed |
| **pantheon-code-mode** | Confined orchestration script execution via MCP | zeus, prometheus, hermes, talos | `python scripts/code_mode_server.py` — built-in, scripts in `.pantheon/code-mode/` |
| **pantheon-memory** | Persistent memory with semantic search, recall, knowledge graph, compression, export | all agents | `python scripts/memory_mcp_server.py` — built-in, requires `chromadb` + `sentence-transformers` |

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

> **Note:** Exa MCP was removed in v3.15.0. Use the `websearch` tool instead.

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

**Used by:** Aphrodite (visual review pipeline), Themis (visual regression checking).

---

### pantheon-memory (Persistent Memory)

Built-in Python MCP server providing multi-strategy memory using ChromaDB + sentence-transformers.

```bash
# In the Pantheon project directory
python scripts/memory_mcp_server.py
```

Requires Python packages:
```bash
pip install chromadb sentence-transformers fastmcp
```

**What it provides (14 tools + 2 resources):**

| Category | Tools |
|----------|-------|
| **Store & Recall** | `memory_store`, `memory_recall`, `memory_search` |
| **Knowledge Graph** | `memory_link`, `memory_traverse` |
| **Compression** | `memory_compress`, `memory_expand`, `memory_consolidate` |
| **Management** | `memory_delete`, `memory_update`, `memory_verify`, `memory_cleanup`, `memory_sessions`, `memory_export` |
| **Resources** | `pantheon://memory/sessions`, `pantheon://memory/status` |

**Key features:**
- **Fusion scoring**: dense vector similarity + 30-day freshness decay + importance boost
- **Knowledge graph**: bidirectional links with relation labels (references, causes, supersedes)
- **Deterministic compression**: DCP-style range compression (not LLM-based)
- **Claim verification**: Shokunin-style freshness validation
- **Markdown export**: formatted output for memory-bank archival

**Storage:** `~/.pantheon/memory/chroma.sqlite3` (SQLite-backed ChromaDB)

**Used by:** All 14 agents for persistent memory across sessions. Mnemosyne has the deepest integration (export, consolidate, compress).

---

## Browser MCPs

For browser automation, Pantheon supports a range of MCPs from full Chrome (Playwright) to ultra-lightweight engines (Lightpanda). Pick based on your use case.

| MCP | Engine | Tools | RAM | Speed vs Playwright | Best For |
|-----|--------|-------|-----|---------------------|----------|
| **Playwright MCP** (Microsoft) | Full Chrome | 25+ | ~400MB | 1x (baseline) | SPAs, debugging, screenshot visual review |
| **Lightpanda** (native MCP) | Zig (zero fork) | 11 | ~50MB | **11x faster** | Scraping, docs, simple navigation |
| **Pandabridge** (community) | Lightpanda + CDP | 23 | ~60MB | **9x faster** | Scraping + compact agent interaction |
| **Agent-Browser** (community) | Lightpanda + Chromium fallback | 55 | 50-300MB | Auto-fallback | Production: combines speed + reliability |

### Decision Guide

| If you need... | Pick |
|----------------|------|
| Screenshots, visual review, SPA interaction | **Playwright** (~400MB, 25+ tools) |
| Fast scraping, docs, simple nav (lightweight) | **Lightpanda** (~50MB, 11 tools) |
| Scraping with richer interaction tools | **Pandabridge** (~60MB, 23 tools) |
| Production dual-engine (speed + fallback) | **Agent-Browser** (50-300MB, 55 tools) |

**Pantheon default:** Playwright MCP — required by Aphrodite's visual review pipeline and Themis for visual regression checking.

---

## Documentation & Knowledge MCPs

For library docs, web search, and content extraction — these MCPs overlap in capability but differ in focus:

| MCP | Benchmark Score | Setup | Best For |
|-----|----------------|-------|----------|
| **context7** | **🥇 89** | `npx -y @upstash/context7-mcp` — free, no API key | Library docs, version-pinned APIs |
| **mcp-fetch** (official) | **🥈 86** | Zero config (built-in to Claude) | Simple webpage fetching |
| ~~Exa Search~~ | *Removed in v3.15.0* | — | Use `websearch` tool instead |
| **Firecrawl** | — | API key required | Web-to-markdown, clean content extraction |

### Which One to Use

| Task | Use |
|------|-----|
| "How do I use FastAPI's `Annotated` dependency injection?" | **context7** — version-pinned library docs |
| "Find recent blog posts about RAG evaluation techniques" | **websearch** — semantic web search |
| "Read this specific article and summarize it" | **mcp-fetch** — zero config, just works |
| "Extract clean markdown from this messy product page" | **Firecrawl** — intelligent content cleaning |

**Pantheon default:** context7 for library documentation (11 agents, no API key). Exa was removed in v3.15.0 — use the built-in `websearch` tool instead.

---

## Infrastructure & DevOps MCPs

Connect Pantheon agents directly to your infrastructure — databases, CI/CD, cloud services, and monitoring.

| MCP | Official? | Setup | Best For |
|-----|-----------|-------|----------|
| **GitHub MCP** | ✅ Anthropic (official) | GitHub token | PRs, issues, code search, Actions management |
| **Postgres MCP** | ✅ Anthropic (official) | DB credentials | Direct database queries (read-only mode) |
| **Supabase MCP** | ✅ Supabase | API key | Full Supabase stack: DB, auth, storage |
| **Cloudflare MCP** | ✅ Cloudflare | API token | Workers, KV, D1, R2, DNS |
| **Sentry MCP** | ✅ Sentry | DSN | Error tracking, traces, performance in-prompt |
| **Kubernetes MCP** | ❌ Community | kubeconfig | kubectl operations through MCP |
| **AWS MCP** | ❌ Community | AWS credentials | EC2, S3, Lambda, CloudWatch |

### Reliability Note (Galaxy/Telemetry — May 2026)

A production benchmark across **140 tasks over 14 agents** (May 2026) found:

- **Official Anthropic MCPs** (Filesystem, GitHub, Postgres) — **>85% reliability**
- **Community MCPs** — **34-68% reliability**

Prefer official servers when available. Community MCPs are useful but budget extra review time.

---

## Which MCPs Should You Install?

For most Pantheon setups, start with these **3 core MCPs**:

| Priority | MCP | Why |
|----------|-----|-----|
| **1 (required)** | **pantheon-memory** | All agents need persistent memory. Zero external dependencies. |
| **2 (required)** | **pantheon-resources** | Framework agents, skills, routing — core Pantheon infra. |
| **3 (recommended)** | **context7** | 11 agents benefit from library docs. Free, no API key. **Highest benchmark score (89).** |

Then add based on your workflow:

| If you... | Add |
|-----------|-----|
| Do frontend visual review | **Playwright MCP** (required by Aphrodite review pipeline) |
| Need web research (Apollo) | **websearch** tool (built-in) |
| Run infrastructure tasks | **GitHub MCP** + **Cloudflare MCP** |
| Hit databases directly | **Postgres MCP** (read-only) or **Supabase MCP** |
| Need fast browser scraping | **Lightpanda** or **Pandabridge** (11-23x RAM savings) |

---

## Per-Agent Internet Access

Not all agents need continuous internet. Here's the breakdown:

| Agent | Internet Needed? | Why |
|-------|----------------|------|
| **gaia** | ✅ **Yes** | Satellite imagery (Copernicus, USGS), remote sensing data APIs |
| **apollo** | ✅ **Yes** | Web search, external research, codebase discovery |
| **hermes** | ⚠️ Optional | Library docs via context7 (cached), not continuous |
| **aphrodite** | ⚠️ Optional | Library docs via context7, CDN resource fetching |
| **demeter** | ⚠️ Optional | Library docs via context7, migration references |
| **zeus** | ⚠️ Optional | Orchestration patterns, reference lookups |
| **athena** | ⚠️ Optional | Planning references, architecture patterns |
| **themis** | ⚠️ Optional | Code review references, security pattern lookups |
| **prometheus** | ⚠️ Optional | Docker registries, package repositories |
| **hephaestus** | ⚠️ Optional | AI model docs, research papers |
| **nyx** | ❌ **Not needed** | All local operations (logs, traces, metrics) |
| **iris** | ❌ **Not needed** | GitHub operations via GitHub MCP (token-based, not web) |
| **mnemosyne** | ❌ **Not needed** | Memory bank operations — all local |
| **talos** | ❌ **Not needed** | Hotfix patches — all local code changes |

**Key insight:** Only **gaia** and **apollo** require continuous internet. The rest work offline with context7 for cached docs.

---

## The 3-7 Rule

Every MCP server adds tools to the agent's context window. Beyond 7 servers, tool selection accuracy degrades significantly.

| MCP Count | Tool Selection Accuracy | Notes |
|-----------|------------------------|-------|
| 1-3 | Excellent | Zero overhead, fast tool discovery |
| 4-5 | Good | Manageable, small prompt overhead |
| 6-7 | Acceptable | Push the limit — works with disciplined scoping |
| 8+ | **Degraded** | Tool call failures, wrong tool selection, context waste |

### Guidelines

1. **Start with 2-3** — memory + resources + one domain MCP (e.g., context7)
2. **Never exceed 7** — beyond this, agents start picking the wrong tool
3. **Scoped per-agent** — not every agent needs every MCP. Use frontmatter binding (see below)
4. **Review quarterly** — remove unused MCPs, add ones you actually use

Pantheon enforces **max 5 MCPs per agent** via frontmatter constraints (see below).

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
| @zeus | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @athena | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @apollo | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @hermes | context7, playwright, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @aphrodite | context7, playwright, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @demeter | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @themis | context7, playwright, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @prometheus | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @hephaestus | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @nyx | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @iris | pantheon-resources, pantheon-memory |
| @talos | context7, pantheon-resources, pantheon-code-mode, pantheon-memory |
| @gaia | context7, pantheon-resources, pantheon-memory |
| @mnemosyne | pantheon-resources, pantheon-code-mode, pantheon-memory |

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
- **Playwright** runs headless Chromium locally — ensure it's used in a controlled environment.

---

## Security Hardening

See `skill: mcp-security` for complete MCP security rules.

### Constraint Types

| Constraint | Purpose | Example |
|-----------|---------|----------|
| `readOnly` | Prevent write operations | `true` for read-only agents |
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
| "Authentication failed" | Missing env var | Check provider credentials |
| "Command not found: npx" | Node.js not installed | Install Node.js 18+ from nodejs.org |
| "Browser not found" | Playwright browsers not installed | Run `npx playwright install chromium` |
| "pantheon-memory not connecting" | Missing Python deps | Run `pip install chromadb sentence-transformers fastmcp` |
| "memory_recall returns empty" | No entries stored | First call `memory_store` to seed the database |
| "Code-mode script not found" | Wrong directory | Scripts must live in `.pantheon/code-mode/` |
| "ChromaDB import error" | out-of-date package | Run `pip install --upgrade chromadb` |

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