# Upgrading Pantheon


## Upgrading to v5.0 (OpenCode-only)

v5.0 removes all multi-platform support. Pantheon now runs exclusively on OpenCode.

### Breaking Changes
1. **No longer supports**: Claude Code, Cursor, Windsurf, Cline, Continue.dev, VS Code Copilot
2. **Installation changed**: Use `npx pantheon init` instead of per-platform scripts
3. **Background delegation**: Requires `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true`
4. **Commands reduced**: 14 → 11 (install, update, cancel, sketch, consolidate removed)

### Migration Steps
1. Uninstall old platform-specific configs
2. Run `npx pantheon init` to install agents globally
3. Run `npm run install` for MCP servers + skills + TUI
4. Add `export OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true` to your shell profile

### Rollback
Pantheon v4.x remains available on the v4.x branch if you need multi-platform support.


## Upgrading to v3.19.0

### Memory Persistence Protocol
Pantheon v3.19.0 introduces the Memory Persistence Protocol — a standardized system for how agents persist and recall memory.

Key changes:
- All 14 agent files now have a `## 🧠 Memory Protocol` section with mandatory rules
- Agents must call `memory_recall()` before work (top_k=3, skip if score <0.3)
- Agents must call `memory_store()` after work (2 lines max, importance 0.4-0.9)
- Zeus auto-stores on agent return — no extra work needed
- Session-end auto-save runs at session close
- Memory Bank is updated only at sprint close (importance ≥ 0.6 graduates)

**No manual migration needed.** The protocol is enforced at the agent instruction level.

### Previous Upgrades

For upgrading from versions before v3.19.0, see the CHANGELOG for version-specific changes.
