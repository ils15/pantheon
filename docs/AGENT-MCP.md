# Per-Agent MCP Reference

How each Pantheon agent uses the 3 built-in MCP servers (pantheon-resources,
pantheon-code-mode, pantheon-memory) plus the optional third-party servers.

---

## Overview Matrix

| Agent | Resources | Code-Mode | Memory | context7 | playwright |
|-------|-----------|-----------|--------|----------|------------|
| **zeus** | ✅ routing, deepwork | ✅ orchestration | ✅ recall | — | — |
| **athena** | ✅ agents, routing | ✅ research | ✅ recall | ✅ | — |
| **apollo** | ✅ agents, skills | ✅ — | ✅ search | ✅ | — |
| **hermes** | ✅ agents, skills | ✅ build/test | ✅ store, recall | ✅ | ✅ |
| **aphrodite** | ✅ memory-bank | ✅ build | ✅ store, recall | ✅ | ✅ |
| **demeter** | ✅ agents, routing | ✅ — | ✅ store, recall | ✅ | — |
| **themis** | ✅ agents | ✅ lint checks | ✅ search | ✅ | ✅ |
| **prometheus** | ✅ agents, routing | ✅ deploy scripts | ✅ store, recall | ✅ | — |
| **hephaestus** | ✅ agents, skills | ✅ — | ✅ search, link | ✅ | — |
| **nyx** | ✅ routing | ✅ — | ✅ sessions | ✅ | — |
| **gaia** | ✅ agents | — | minimal | ✅ | — |
| **iris** | ✅ agents | — | minimal | — | — |
| **mnemosyne** | ✅ memory-bank | ✅ — | ✅ full (store, recall, export) | — | — |
| **talos** | ✅ agents, skills | ✅ hotfix scripts | ✅ recall | ✅ | — |

---

## pantheon-resources Usage by Agent

| Agent | Resources Used | When | Purpose |
|-------|---------------|------|---------|
| **zeus** | `pantheon://routing`, `pantheon://deepwork/{slug}`, `pantheon://agents` | Orchestration | Read routing rules, check deepwork plan/status |
| **athena** | `pantheon://routing`, `pantheon://agents`, `pantheon://skills/{name}` | Planning | Understand delegation rules, load agent roles |
| **apollo** | `pantheon://agents`, `pantheon://skills` | Discovery | Identify agents to search for, load domain skills |
| **hermes** | `pantheon://agents`, `pantheon://skills` | Implementation | Read backend skill instructions |
| **aphrodite** | `pantheon://memory-bank/{path}` | Frontend work | Read memory bank for architecture context |
| **demeter** | `pantheon://agents`, `pantheon://routing` | Database work | Understand delegation flow for handoffs |
| **themis** | `pantheon://agents` | Review | Verify agent capabilities match reviewed code |
| **prometheus** | `pantheon://agents`, `pantheon://routing` | Infrastructure | Check deployment routing constraints |
| **hephaestus** | `pantheon://agents`, `pantheon://skills` | AI pipelines | Load RAG pipeline skill instructions |
| **nyx** | `pantheon://routing` | Monitoring | Read routing rules for anomaly detection |
| **gaia** | `pantheon://agents` | Remote sensing | Verify agent capabilities |
| **iris** | `pantheon://agents` | GitHub ops | Reference agent names for PR/issue |
| **mnemosyne** | `pantheon://memory-bank/{path}` | Documentation | Read and write memory bank files |
| **talos** | `pantheon://agents`, `pantheon://skills` | Hotfixes | Quick reference to agent files |

---

## pantheon-code-mode Usage by Agent

| Agent | Use Case | When |
|-------|----------|------|
| **zeus** | Run orchestration sequences — build, test, deploy automation | Multi-phase orchestration |
| **athena** | Run research automation scripts | During planning phase |
| **apollo** | Execute automated codebase scanners | Discovery phase |
| **hermes** | Run `pytest`, `ruff check`, `ruff format` | After implementation, before handoff to Themis |
| **aphrodite** | Run `npm test`, `biome check` | After implementation, before handoff |
| **demeter** | Run `pytest` on migration tests | After migration implementation |
| **themis** | Run lint/quality check scripts during review | Code review phase |
| **prometheus** | Deploy scripts, Docker builds, CI triggers | Infrastructure phase |
| **hephaestus** | Run evaluation scripts for AI pipelines | Post-implementation |
| **talos** | Automated hotfix sequences, batch fixes | Rapid repair |

Agents not listed (**gaia**, **iris**, **nyx**, **mnemosyne**) typically do not
need script execution for their core workflows.

---

## pantheon-memory Usage by Agent

| Agent | Key Tools | When | Why |
|-------|-----------|------|-----|
| **zeus** | `memory_recall` | Session start | Recall context about active sprint and decisions |
| **athena** | `memory_recall` | Planning | Recall past architecture decisions and plans |
| **apollo** | `memory_search` | Discovery | Search for existing patterns and related files |
| **hermes** | `memory_store`, `memory_recall`, `memory_search` | Throughout | Store implementation decisions, recall backend patterns |
| **aphrodite** | `memory_store`, `memory_recall`, `memory_search` | Throughout | Store UI decisions, recall component patterns |
| **demeter** | `memory_store`, `memory_recall` | Throughout | Store schema decisions, recall migration patterns |
| **themis** | `memory_search` | Review | Search for past review findings |
| **prometheus** | `memory_store`, `memory_recall` | Throughout | Store infra decisions, recall deployment patterns |
| **hephaestus** | `memory_search`, `memory_link` | Throughout | Search for relevant RAG patterns, link AI pipeline decisions |
| **nyx** | `memory_sessions` | Monitoring | List sessions for observability analysis |
| **gaia** | `memory_recall` | Session start | Recall analysis context from previous sessions |
| **iris** | `memory_recall` | Session start | Recall PR/release context |
| **mnemosyne** | All 14 tools | Documentation | Full memory management — store, recall, export, consolidate |
| **talos** | `memory_recall` | Session start | Recall hotfix context for rapid fixes |

### Recommended Tool Sequences by Agent

**Zeus** (orchestration):
```
memory_recall(context="current sprint context") → start orchestration
memory_recall(context="planning user auth feature") → delegate to Athena
```

**Hermes** (backend implementation):
```
memory_recall(context="implementing JWT authentication") → recall prior decisions
...implement...
memory_store(content="JWT uses refresh token rotation", category="decision", importance=0.9)
```

**Mnemosyne** (memory steward — deepest integration):
```
memory_recall(context="documenting sprint close") → check active context
memory_export(session_id="sprint-17") → export for archival
memory_consolidate() → deduplicate before close
memory_compress(session_id="sprint-17") → compress old entries
```

---

## Third-Party MCP Usage

### context7 (Library Documentation)

Used by **11 agents** for up-to-date library docs:

| Agent | Libraries |
|-------|-----------|
| **hermes** | FastAPI, Pydantic, SQLAlchemy |
| **aphrodite** | React, Next.js, Tailwind |
| **demeter** | SQLAlchemy, Alembic |
| **hephaestus** | LangChain, LangGraph |
| **themis** | Pydantic, FastAPI (security review context) |
| **athena** | General (any framework during planning) |
| **prometheus** | Docker, Docker Compose |
| **gaia** | Scientific Python (rasterio, xarray, numpy) |
| **nyx** | OpenTelemetry |
| **apollo** | General (any library during discovery) |
| **zeus** | General (any library during orchestration) |

> **Note:** Exa MCP was removed in v3.15.0. Use the built-in `websearch` tool instead.

### playwright (Browser Automation)

Used by **3 agents**:

| Agent | Use Case |
|-------|----------|
| **aphrodite** | Visual review pipeline — screenshots, accessibility snapshots |
| **themis** | Visual regression checking during review |
| **hermes** | API response verification via browser (edge cases) |

---

## MCP Config in Agent Frontmatter

Each agent template (`agents/*.agent.md`) declares its MCP bindings in YAML
frontmatter:

```yaml
---
mcpServers:
  - name: pantheon-resources
    tools:
      - read_mcp_resource
    when: "reading agent/skills/routing info"
  - name: pantheon-memory
    tools:
      - memory_recall
      - memory_store
      - memory_search
    when: "persistent memory access"
  - name: context7
    tools:
      - context7_resolve-library-id
      - context7_query-docs
    when: "resolving library documentation"
---
```

### Rules

- Maximum 5 MCPs per agent
- `tools` lists the specific MCP tools the agent can access
- `when` describes the activation condition
- Third-party MCPs require explicit `env` config with `${VAR}` interpolation

---

## Security Notes

| Server | Risk Level | Notes |
|--------|-----------|-------|
| **pantheon-resources** | Low | Read-only. Same trust boundary as repository |
| **pantheon-code-mode** | Medium | Executes scripts. Permission: `ask` (user confirms each execution) |
| **pantheon-memory** | Low | Read/write within agent sandbox. No system access |
| **context7** | Low | Read-only library documentation. No auth needed |
| ~~exa~~ | *Removed in v3.15.0* | Use `websearch` tool instead |
| **playwright** | Medium | Runs headless Chromium. Permission: `ask` recommended |

See `instructions/mcp-security.instructions.md` for complete MCP security rules.
