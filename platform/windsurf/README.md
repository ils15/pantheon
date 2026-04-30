# Windsurf Platform

> **Status**: 🧪 Preview — platform adapter exists, full support planned

---

## Current State

A Windsurf adapter has been created at `platform/windsurf/adapter.json` with:

- Tool name mapping (e.g., `search/codebase` → `search`)
- Body filter stripping VS Code-specific sections
- Canonical frontmatter filtered to `name`, `description`, `tools`

However, **Windsurf Cascade agent format is not yet finalized**. The generated agents in `platform/windsurf/agents/` are a best-effort conversion and may require format adjustments once Windsurf publishes its official agent schema.

---

## What's Blocking Full Support

| Issue | Status |
|---|---|
| Adapter with tool mapping | ✅ Done |
| Windsurf Cascade agent docs reviewed | 🔄 In progress |
| CI validation for Windsurf agents | ✅ Done (in verify.yml) |
| Plugin manifest inclusion | ✅ Done (platforms field) |
| End-to-end testing with Windsurf | ⏳ Waiting on platform spec |
| Installer support | ⏳ Blocked on spec |

---

## Timeline

- **Full support target**: v2.11.0 (next major after adapter feedback)
- **Want to help?** Open an issue or PR updating `platform/windsurf/adapter.json`
