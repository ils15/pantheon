# Pantheon Installation Guide

> From zero to orchestrating with AI agents — step-by-step setup for every platform.

> 📖 **Platform-specific guides:** [VS Code](platforms/vscode.md) · [OpenCode](platforms/opencode.md) · [Claude Code](platforms/claude.md) · [Cursor](platforms/cursor.md) · [Windsurf](platforms/windsurf.md) · [Cline](platforms/cline.md) · [Continue.dev](platforms/continue.md)

---

## Before You Start

**What is Pantheon?** A framework of 14 specialized AI agents that plan, implement, review, and document code for you — like having a full engineering team in your editor.

**What you need:**
- A GitHub account
- Git installed on your machine
- A supported code editor (pick one below)
- An AI coding subscription (Copilot, Claude, OpenCode, or Cursor)

**Time to complete:** 5–15 minutes depending on platform

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Git** | Any recent version |
| **Node.js 18+** | Only needed for the sync engine and installer script |
| **Supported editor** | VS Code, OpenCode, Claude Code, Cursor, Windsurf, Cline, or Continue.dev |

---

## Quick Comparison

| Platform | Install Time | Method |
|---|---|---|
| **VS Code Copilot** | 1 min | Marketplace plugin or `npm run sync copilot` |
| **OpenCode** | 2 min | Config file + agents or `npm run sync opencode` |
| **Claude Code** | 1 min | `npm run sync claude` |
| **Cursor** | 1 min | `npm run sync cursor` |
| **Windsurf** | 1 min | `npm run sync windsurf` |
| **Cline** | 1 min | `npm run sync cline` |
| **Continue.dev** | 1 min | `npm run sync continue` |

---

## 🚀 Install Modes

Pantheon offers 3 install modes — choose based on your needs:

| Mode | Command | Installs | Time | Dependencies |
|------|---------|----------|------|-------------|
| **Lite** 🟢 | `npm run install:lite` | agents + skills + instructions | ~5s | None |
| **Full** 🔵 | `npm run install:full` | everything + MCP servers + venv | ~60s | Python 3.11+, pip |
| **Runtime** 🟡 | `npm run install:runtime` | only MCP servers + venv | ~30s | Python 3.11+, pip |

```bash
# Quick start — just the agents, no MCP infrastructure
npm run install:lite

# Full setup — agents + MCP servers (memory, persistence, resources)
npm run install:full

# Add MCP servers to an existing install
npm run install:runtime
```

> **Lite** is for users who just want the agent rules without Python dependencies.
> **Full** installs everything including `pantheon-memory` (vector search with ChromaDB) and `pantheon-persistence` (KV cache with SQLite FTS5).
> **Runtime** adds MCP infrastructure to an existing lite install.

> **Note for `install:full`:** The first install downloads ~1.5GB of ML dependencies (torch, chromadb, sentence-transformers). On slow connections, this can take 5-10 minutes. The installer handles this asynchronously and will not block.

---

## 🚀 Sync via `npm run sync`

**The recommended way to install and update Pantheon** across all platforms:

```bash
# Sync all platforms
npm run sync

# Sync a specific platform
npm run sync <platform>   # e.g., npm run sync claude

# Sync + verify
npm run sync && npm run sync:check
```

| Platform | Command | Destination |
|----------|---------|-------------|
| **VS Code** | `npm run sync copilot` | `.github/agents/`, `.github/copilot-instructions.md` |
| **OpenCode** | `npm run sync opencode` | `platform/opencode/` |
| **Claude Code** | `npm run sync claude` | `.claude/agents/` |
| **Cursor** | `npm run sync cursor` | `.cursor/rules/` |
| **Windsurf** | `npm run sync windsurf` | `.windsurf/rules/` |
| **Cline** | `npm run sync cline` | `.clinerules/` |
| **Continue.dev** | `npm run sync continue` | `.continue/rules/` |

The sync engine (`scripts/sync-platforms.mjs`) transforms canonical `.agent.md` files into every platform's native format — applying tool name mapping, frontmatter conversion, and platform-specific transformations.

**What it deploys per platform:**

| | Agents | Instructions | Skills | Commands |
|---|:---:|:---:|:---:|:---:|
| **VS Code** | ✅ | ✅ | ✅ | ✅ |
| **OpenCode** | ✅ | ✅ | ✅ | ✅ |
| **Claude Code** | ✅ | — | ✅ | ✅ |
| **Cursor** | ✅ | — | ✅ | ✅ |
| **Windsurf** | ✅ | — | ✅ | ✅ |
| **Cline** | ✅ | — | ✅ | ✅ |
| **Continue.dev** | ✅ | — | ✅ | ✅ |

### `npx @pantheon/cli init` (CLI v4.0)

> **Coming soon.** The Pantheon CLI (`@pantheon/cli`) provides a single-command setup:
> ```bash
> npx @pantheon/cli init
> ```

The CLI will auto-detect your platform, copy agent files, configure MCP servers, and verify the installation — no manual steps needed.

---

## 🚀 `/pantheon-install` — Sync + Install + Verify Pipeline

The **recommended installation path** for OpenCode users (also available on all platforms via `node scripts/pantheon-install.mjs`):

```bash
/pantheon-install                      # Default (opencode → ~/.config/opencode/)
/pantheon-install --platform all       # All 7 platforms
/pantheon-install --platform opencode,claude
/pantheon-install --dry-run            # Preview without writing
/pantheon-install --clean              # Fresh install (wipe + reinstall)
```

### `--tier` Flag: MCP Server Tiers

The `--tier` flag selects which MCP servers to deploy alongside agents:

| Tier | Servers included | When to use |
|------|-----------------|-------------|
| `none` | No MCP servers | Minimal install, no MCP |
| `essential` | pantheon-resources, pantheon-code-mode, pantheon-memory, context7, filesystem | **Default** — all Pantheon agents work |
| `recommended` | Essential + git, playwright, memory | Full development setup |
| `full` | All the above + sentry, slack, docker, notion, linear, postgresql | Enterprise / polyglot projects |

Usage:
```bash
/pantheon-install --tier essential          # Core Pantheon MCPs only
/pantheon-install --tier recommended        # Full dev experience
/pantheon-install --tier full               # Everything
/pantheon-install --tier none --platform all # Agents only, no MCPs
```

Tier definitions are stored in **`.pantheon/tiers.json`**:

```json
{
  "essential": ["pantheon-resources", "pantheon-code-mode", "pantheon-memory", "context7", "filesystem"],
  "recommended": ["pantheon-resources", "pantheon-code-mode", "pantheon-memory", "context7", "filesystem", "git", "playwright", "pantheon-memory"],
  "full": ["pantheon-resources", "pantheon-code-mode", "pantheon-memory", "context7", "filesystem", "git", "playwright", "sentry", "slack", "docker", "notion", "linear", "postgresql"]
}
```

### `--backup` Flag

Creates a timestamped backup of the target directory before writing:

```bash
/pantheon-install --backup                  # Backup before install
/pantheon-install --tier full --backup       # Full install with backup
```

Backups are stored alongside the target directory as `.pantheon-bak-{dirname}-{timestamp}` (e.g., `.pantheon-bak-opencode-2026-07-15T10-30-00`).

### `--detect` Flag

Detects installed platforms without installing:

```bash
/pantheon-install --detect                  # "Which platforms are configured?"
```

Output shows detected platform configs, versions, and agent counts — useful for debugging and inventory.

### VS Code `.vscode/mcp.json` Generation

When installing with `--tier`, the installer auto-generates `.vscode/mcp.json` (for VS Code Copilot / Cursor) with the selected MCP servers:

```json
// .vscode/mcp.json (auto-generated with --tier essential)
{
  "servers": {
    "pantheon-resources": {
      "type": "stdio",
      "command": "python3",
      "args": ["scripts/mcp_resources_server.py"]
    },
    "pantheon-code-mode": {
      "type": "stdio",
      "command": "python3",
      "args": ["scripts/code_mode_server.py"]
    },
    "pantheon-memory": {
      "type": "stdio",
      "command": ".venv/bin/python3",
      "args": ["scripts/memory_mcp_server.py"]
    }
  }
}
```

This file is written to `.vscode/mcp.json` (project-local) or `~/.config/opencode/mcp.json` (global) depending on your install mode.

### Platform Paths Table

| Platform | Config file | Global path | Project path |
|----------|-------------|-------------|--------------|
| **VS Code Copilot** | `.vscode/mcp.json` | `~/.vscode/` | `.vscode/mcp.json` |
| **OpenCode** | `opencode.json` | `~/.config/opencode/` | `./opencode.json` |
| **Claude Code** | `.mcp.json` | — | `.mcp.json` |
| **Cursor** | `.cursor/mcp.json` | — | `.cursor/mcp.json` |
| **Windsurf** | `mcp_config.json` | `~/.codeium/windsurf/` | *global only* |
| **Cline** | VS Code globalStorage | — | *global only* |
| **Continue.dev** | `config.json` | `~/.continue/` | — |

### MCP Agent Awareness

All 14 Pantheon agents now declare `mcp_tools:` in their YAML frontmatter, telling them which tools they can use. The agents also include a standardized `## 🧠 MCP Capabilities` section describing when to use each tool.

See [docs/mcp-tools.md](mcp-tools.md) for the canonical tool registry and [docs/mcp-user-guide.md](mcp-user-guide.md) for adding custom MCPs.

---

## 🚀 Quickest Path (VS Code)

If you use **VS Code with GitHub Copilot**, this is the fastest path.

### Step 1: Add the plugin

Open VS Code and add this to your `settings.json` (File → Preferences → Settings → click the `{}` icon top-right):

```json
{
  "chat.plugins.enabled": true,
  "chat.plugins.marketplaces": ["ils15/pantheon"]
}
```

### Step 2: Verify

Open Copilot Chat (`Ctrl+Shift+I` or `Cmd+Shift+I`) and type:

```
@zeus: What agents are available?
```

### Step 3: Run your first orchestration

```
@athena: Plan a simple Express.js API with one GET /hello endpoint
```

Approve the plan, then:

```
@zeus: Implement the API using the approved plan
```

---

## VS Code Copilot — Detailed Setup

### Prerequisites

- **VS Code** 1.87+ ([download](https://code.visualstudio.com/))
- **GitHub Copilot** subscription (Chat included in Pro, Pro+, Business, Enterprise)
- **Git** ([download](https://git-scm.com/))

### Option A: Plugin Marketplace (recommended — 30 seconds)

1. Open VS Code settings JSON: `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
2. Add these lines:
   ```json
   {
     "chat.plugins.enabled": true,
     "chat.plugins.marketplaces": ["ils15/pantheon"]
   }
   ```
3. Restart VS Code (`Ctrl+Shift+P` → "Developer: Reload Window")
4. All 14 agents appear automatically. No files to copy.

### Option B: Manual copy (for customization)

```bash
# Clone alongside your project
git clone https://github.com/ils15/pantheon.git

# Copy what you need
cp -r pantheon/agents      /path/to/your-project/agents
cp -r pantheon/skills      /path/to/your-project/skills
cp -r pantheon/instructions /path/to/your-project/instructions
cp -r pantheon/prompts     /path/to/your-project/prompts
```

---

## OpenCode

### Prerequisites

- **OpenCode** installed: `npm install -g @opencode/opencode` or `brew install opencode-ai`
- An LLM provider API key (Anthropic, OpenAI, Google, or OpenCode Zen)

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Copy agents into your project
cp -r platform/opencode/agents /path/to/your-project/.opencode/agents

# Copy the root opencode.json to your project root and edit it
cp platform/opencode/opencode.json /path/to/your-project/opencode.json
```

### Configure your API key

Create a `.env` file or set in your shell:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Start OpenCode

```bash
cd /path/to/your-project
opencode
```

Press **Tab** to cycle through agents, or `@`-mention any agent directly.

See [OpenCode setup guide](platforms/opencode.md) for full config options.

---

## Claude Code

### Prerequisites

- **Claude Code** installed (via npm or installer)
- Anthropic API key with Claude access

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Install agents
node scripts/install.mjs claude
```

This creates `.claude/agents/` with all 14 agents in Claude Code format.

### Verify

Open Claude Code in your project and type:

```
@zeus: What agents are available?
```

---

## Cursor

### Prerequisites

- **Cursor** IDE installed
- Cursor Pro subscription (for AI features)

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon
npm install

# Install Cursor rules
node scripts/install.mjs cursor
```

This creates `.cursor/rules/` with all 14 agents as `.mdc` rule files.

### Usage

In Cursor chat, use `@` to invoke any agent:

```
@zeus Implement a feature with full TDD
```

Cursor loads the agent as a rule — the agent's instructions guide Cursor's behavior.

### Customize rules (optional)

Edit `.cursor/rules/*.mdc` files to adjust agent behavior for your project.

---

## Windsurf

### Prerequisites

- **Windsurf** IDE installed
- Windsurf subscription (for AI features)

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Install Windsurf rules and workflows
npm run sync windsurf
```

This creates `.windsurf/rules/` with all agents and `.windsurf/workflows/` with commands.

### Usage

In Windsurf chat, use `@` to invoke any agent:

```
@zeus Implement a feature with full TDD
```

See [Windsurf setup guide](platforms/windsurf.md) for full configuration and troubleshooting.

---

## Cline

### Prerequisites

- **Cline** extension installed in VS Code
- An LLM provider API key

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Install Cline rules and commands
npm run sync cline
```

This creates `.clinerules/` with all agents and `.clinerules/commands/` with commands.

### Usage

In Cline chat, the agent rules are loaded automatically based on context.

See [Cline setup guide](platforms/cline.md) for full configuration and limitations.

---

## Continue.dev

### Prerequisites

- **Continue** extension installed in VS Code or JetBrains
- An LLM provider API key

### Setup

```bash
# Clone Pantheon
git clone https://github.com/ils15/pantheon.git
cd pantheon

# Install Continue rules and commands
npm run sync continue
```

This creates `.continue/rules/` with all agents and `.continue/commands/` with commands.

### Usage

In Continue chat, use `@` to invoke any agent:

```
@zeus Implement a feature with full TDD
```

See [Continue.dev setup guide](platforms/continue.md) for full configuration.

---

## Manual Copy (any platform)

```bash
# From the Pantheon root, copy generated platform configs
cp -r platform/<name>/agents/ /path/to/your-project/<target-dir>/
```

See [Platforms docs](PLATFORMS.md) for target directories per platform.

---

## After Installation: Select Your Model Plan

After installing the agents, agents declare abstract tiers (`fast`/`default`/`premium`). Configure your preferred models via your platform's own settings (e.g., `~/.config/opencode/opencode.json` for OpenCode, or your editor's model picker for Copilot/Cursor).

On OpenCode, use `/pantheon-forge` to apply named presets:
```bash
/pantheon-forge opencode-go     ← Apply a preset (12 available)
/pantheon-forge list            ← List all available presets
/pantheon-forge status          ← Show current model configuration
```

---

## Verification

After installing, open your editor and type:

```
@zeus: What agents are available?
```

You should see a response listing all Pantheon agents.

### Setup Verification Checklist

- [ ] `@zeus` responds in chat
- [ ] `@athena` can create plans
- [ ] `@hermes` or `@aphrodite` can implement code
- [ ] Tab cycles between agents (VS Code/OpenCode)
- [ ] Skills load
- [ ] Sync works: `npm run sync && npm run sync:check` passes

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `@zeus` not recognized | Plugin not loaded | Verify `chat.plugins.marketplaces` in settings.json |
| Agents show but don't respond | Copilot not connected | Check GitHub Copilot status icon in VS Code status bar |
| `npm run sync` fails | Missing dependencies | Run `npm install` first |
| `node scripts/install.mjs` fails | Wrong Node version | `node --version` must be 18+ |
| Agents seem outdated | Platforms stale | `npm run sync` to regenerate |
| OpenCode: no agents found | Config not linked | Check `opencode.json` exists in project root |
| Claude: agents not loading | Wrong directory | Verify `.claude/agents/` exists with `.md` files |
| Cursor: `@agent` not working | Rules not loaded | Verify `.cursor/rules/` exists with `.mdc` files |
| Skills not loading | Registry issue | Run `skill-registry` in your editor (OpenCode) |

---

## Next Steps

Once setup is complete:

1. **Read** [AGENTS.md](/AGENTS.md) — full agent reference
2. **Try** a feature: `@zeus: Implement JWT authentication`
3. **Explore** skills: `@hermes: Load skill agent-coordination`
4. **Customize** instructions in `instructions/` for your stack
5. **Add** your own agents by creating new `.agent.md` files in `agents/`

### v4.0 Highlights

- **14 commands** — all `/pantheon-*` commands (`/pantheon`, `/pantheon-status`, `/pantheon-audit`, `/pantheon-cancel`, `/pantheon-deepwork`, `/pantheon-focus`, `/pantheon-optimize`, `/pantheon-sketch`, `/pantheon-install`, `/pantheon-update`, `/pantheon-remember`, `/pantheon-search`, `/pantheon-consolidate`, `/pantheon-forget`)
- **Themis 2.0** — 3-layer review pipeline (heuristic scanner + deep review + verification planning)
- **YAGNI Ladder** — anti-overengineering built into every agent workflow
- **TUI Plugin** — live deepwork status, activity feed, toast notifications (OpenCode)

---

> **Need help?** Open an issue at [github.com/ils15/pantheon/issues](https://github.com/ils15/pantheon/issues)

## 🧩 MCP Server Configuration

Pantheon uses a **tiered MCP system** managed by `.pantheon/tiers.json`. Select the right tier for your project:

| Tier | Servers | Disk | RAM |
|------|---------|------|-----|
| **essential** | 3 native MCPs + context7 + filesystem | ~5MB | ~50MB |
| **recommended** | + git + playwright + memory | ~850MB | ~400MB |
| **full** | + sentry + slack + docker + notion + linear + postgresql | ~1.2GB | ~600MB |

```bash
# Quick automated setup with tier selection
/pantheon-install --tier essential          # Core MCPs only
/pantheon-install --tier recommended        # Full dev setup
```

For manual MCP setup in an existing project:

### 🚀 Automated (recommended)

```bash
bash /caminho/pantheon/scripts/init-pantheon-mcp.sh .
```

Este script faz tudo:
1. ✅ Copies the 3 MCP server scripts + tests
2. ✅ Creates virtualenv with dependencies
3. ✅ Creates `opencode.json` with MCP config
4. ✅ Verifies installation

---

### 1. Copy the scripts

```bash
# No diretório do novo projeto
mkdir -p scripts .pantheon/code-mode

# Copia os MCP servers
cp /caminho/pantheon/scripts/mcp_resources_server.py scripts/
cp /caminho/pantheon/scripts/code_mode_server.py scripts/  
cp /caminho/pantheon/scripts/memory_mcp_server.py scripts/

# Copia o script de exemplo do code-mode
cp /caminho/pantheon/.pantheon/code-mode/example-sync.sh .pantheon/code-mode/
chmod +x .pantheon/code-mode/example-sync.sh

# Copia os testes (opcional)
cp /caminho/pantheon/tests/test_mcp_resources_server.py tests/
cp /caminho/pantheon/tests/test_code_mode_server.py tests/
cp /caminho/pantheon/tests/test_memory_mcp_server.py tests/
cp /caminho/pantheon/tests/conftest.py tests/
```

### 2. Dependências

```bash
# Cria virtualenv e instala dependências
python3 -m venv .venv
source .venv/bin/activate
pip install chromadb>=0.6.0 sentence-transformers fastmcp>=3.4.0 pyyaml
```

### 3. Adicionar ao `opencode.json`

```json
{
  "mcp": {
    "pantheon-resources": {
      "type": "local",
      "cwd": ".",
      "command": ["python3", "scripts/mcp_resources_server.py"],
      "enabled": true
    },
    "pantheon-code-mode": {
      "type": "local",
      "cwd": ".",
      "command": ["python3", "scripts/code_mode_server.py"],
      "enabled": true
    },
    "pantheon-memory": {
      "type": "local",
      "cwd": ".",
      "command": [".venv/bin/python3", "scripts/memory_mcp_server.py"],
      "enabled": true
    }
  },
  "permission": {
    "mcp": {
      "pantheon-resources": "allow",
      "pantheon-code-mode": "ask",
      "pantheon-memory": "allow"
    }
  }
}
```

### 4. Verificar instalação

```bash
# Testa se os servidores importam sem erro
python3 -c "from scripts.mcp_resources_server import mcp; print('✅ resources OK')"
python3 -c "from scripts.code_mode_server import mcp; print('✅ code-mode OK')"
.venv/bin/python3 -c "from scripts.memory_mcp_server import mcp; print('✅ memory OK')"

# Roda os testes
.venv/bin/python3 -m pytest tests/test_mcp_resources_server.py \
  tests/test_code_mode_server.py \
  tests/test_memory_mcp_server.py -v
```

### ⚠️ Notas

- `pantheon-resources` e `pantheon-code-mode` usam `python3` (sistema)
- `pantheon-memory` usa `.venv/bin/python3` (chromadb + sentence-transformers)
- O modelo `all-MiniLM-L6-v2` (~80MB) baixa automático na primeira execução
- Depois de baixado, pode usar `HF_HUB_OFFLINE=1` pra evitar requests

Para detalhes sobre cada servidor, veja:
- `docs/MCP.md` — Visão geral dos 3 servidores
- `docs/MEMORY.md` — Guia do sistema de memória
- `docs/AGENT-MCP.md` — Capacidades MCP por agente
- `docs/mcp-tools.md` — Canonical MCP tool registry (all tools + agent usage)
- `docs/mcp-user-guide.md` — Adding custom MCP servers to agents
- `docs/mcp-recommendations.md` — Comparação com MCPs externos

---

## 🖥️ Config por Plataforma

Cada plataforma tem seu próprio arquivo de configuração MCP. Use `init-pantheon-mcp.sh` com a plataforma desejada:

```bash
# OpenCode (padrão)
bash scripts/init-pantheon-mcp.sh /meu/projeto opencode

# Claude Code
bash scripts/init-pantheon-mcp.sh /meu/projeto claude

# Cursor
bash scripts/init-pantheon-mcp.sh /meu/projeto cursor

# Windsurf (config global)
bash scripts/init-pantheon-mcp.sh /meu/projeto windsurf

# Copilot (VS Code)
bash scripts/init-pantheon-mcp.sh /meu/projeto copilot
```

| Plataforma | Arquivo de Config | Estrutura |
|-----------|-------------------|-----------|
| **OpenCode** | `opencode.json` (projeto) | `"mcp": { "nome": {...} }` (objeto) |
| **Claude Code** | `.mcp.json` (projeto) | `"mcpServers": { "nome": {...} }` (objeto) |
| **Cursor** | `.cursor/mcp.json` (projeto) | `"mcpServers": { "nome": {...} }` (objeto) |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` (global) | `"mcpServers": { "nome": {...} }` (objeto) |
| **Cline** | VS Code globalStorage (ver docs) | `"mcpServers": { "nome": {...} }` (objeto) |
| **Continue.dev** | `~/.continue/config.json` | `"mcpServers": [ {...}, {...} ]` **(array!)** |
| **Copilot** | `.vscode/mcp.json` (projeto) | `"servers": { "nome": {...} }` (objeto) |

Os templates para cada plataforma estão em `platform/<nome>/mcp-template.json`.
