# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- /forge template now searches multiple locations for Pantheon dir + platform/plans/ and use select-plan.sh### Documentation

- Update Schema.png [skip ci]

## [v3.3.0] - 2026-05-16

### Added
- Argus agent (`agents/argus.agent.md`) — visual analysis specialist for screenshots, PDFs, diagrams, and UI mockups
- Argus documentation in Discovery Tier, Agent Selection Guide, and Health Check sections of `AGENTS.md`
- Background orchestration documentation for the opencode-pty plugin (async execution)
- Dynamic prompts documentation

### Changed
- `/forge` command rewritten to edit `opencode.json` directly instead of reading `plan-active.json`
- Model configuration flow: installation → no hardcoded models → user runs `/forge` → agent edits `opencode.json`
- `plan-active.json` now defaults to `"auto"` (no plan selected)
- OpenCode sync now preserves full agent orchestration graph (agents, handoffs, user-invocable)
- Cline adapter notes updated to reflect skipFrontmatter fix
- All 17 agents now present across all 7 platforms

### Removed
- Hardcoded `model` and `small_model` fields from `opencode.json` root
- Hardcoded model references from `/forge` command template
- All per-agent model overrides from default `opencode.json`
- Legacy `platform/windsurf/agents/` directory (conflicted with modern `rules/`)

### Fixed
- **OpenCode adapter**: Include `agents:`, `user-invocable`, and `handoffs` in frontmatter (were incorrectly excluded, breaking /pantheon and agent dispatch)
- **Claude Code adapter**: Include `agents:` in frontmatter for subagent whitelist
- **Windsurf adapter**: Remove `agents:` from exclude list
- **Cline**: Fix `--- {} ---` frontmatter wrapper bug — added `skipFrontmatter: true` to sync engine
- **install.mjs**: Add missing `argus` agent to AGENT_NAMES (was 16, now 17)
- **Windsurf**: Delete legacy `platform/windsurf/agents/` directory (conflicted with modern `rules/`)
- **Continue.dev**: Add missing `argus` rule to config.yaml
- **sync-platforms.mjs**: Fix `omitSection()` to be code-block aware (no longer strips content inside fenced code blocks)
- **Versioning**: Clean up 9 fragmented tags (v3.2 → v3.5.6), create single v3.3.0 tag
- **Manifests**: Bump version from 3.4.0 → 3.3.0 across package.json, plugin.json, README badge
- CI/CD failure caused by Argus missing from `AGENTS.md` references
- `/forge` command not working (was reading `plan-active.json` which OpenCode ignores)
- Expensive model usage caused by hardcoded defaults in `opencode.json`

### Platforms
- ✅ OpenCode — full multi-agent orchestration
- ✅ VS Code Copilot — canonical agents
- ✅ Claude Code — comma-separated tools
- ✅ Cursor — .mdc rules
- ✅ Windsurf — Cascade rules
- ✅ Cline — .clinerules (skipFrontmatter fixed)
- ✅ Continue.dev — system prompt rules
