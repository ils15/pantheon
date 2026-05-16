# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Argus agent (`agents/argus.agent.md`) — visual analysis specialist for screenshots, PDFs, diagrams, and UI mockups
- Argus documentation in Discovery Tier, Agent Selection Guide, and Health Check sections of `AGENTS.md`
- Background orchestration documentation for the opencode-pty plugin (async execution)
- Dynamic prompts documentation

### Changed
- `/forge` command rewritten to edit `opencode.json` directly instead of reading `plan-active.json`
- Model configuration flow: installation → no hardcoded models → user runs `/forge` → agent edits `opencode.json`
- `plan-active.json` now defaults to `"auto"` (no plan selected)

### Removed
- Hardcoded `model` and `small_model` fields from `opencode.json` root
- Hardcoded model references from `/forge` command template
- All per-agent model overrides from default `opencode.json`

### Fixed
- CI/CD failure caused by Argus missing from `AGENTS.md` references
- `/forge` command not working (was reading `plan-active.json` which OpenCode ignores)
- Expensive model usage caused by hardcoded defaults in `opencode.json`
