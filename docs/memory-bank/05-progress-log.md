# 📋 Progress Log

> **Append-only.** Never edit previous entries. Add new entries at the top.  
> Format: `## [YYYY-MM-DD] — [Milestone Title]`

---

## How to add an entry

Via agent:
```
@mnemosyne Close sprint: [summary of what was delivered]
```

Or manually:
```markdown
## [YYYY-MM-DD] — [Milestone Title]

**Agents involved:** @hermes, @aphrodite, @maat  
**Status:** ✅ Delivered

### What was done
- [Item 1]
- [Item 2]

### Key decisions made
- [Relevant decision, if any]

### Main files changed
- `path/to/file.py` — [what changed]
```

---

<!-- Project entries below this line. Most recent at the top. -->

## [2026-03-08] — Release And Push Verification Automation

**Agents involved:** GitHub Copilot
**Status:** ✅ Delivered

### What was done
- Updated release trigger to run on version tags using `v*` pattern.
- Added `.github/workflows/verify.yml` to validate agent frontmatter on push/PR to `main`.
- Added plugin manifest validation (`npm run plugin:validate`) to the verification workflow.

### Key decisions made
- Preserved existing release workflow logic and improved only the tag trigger compatibility.
- Kept verification checks explicit and non-interactive for CI reliability.

### Main files changed
- `.github/workflows/release.yml` — fixed tag trigger and kept release generation flow.
- `.github/workflows/verify.yml` — added new CI workflow for push/PR verification.
