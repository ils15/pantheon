# Platform Template

> Use this template to add a new platform to Pantheon.

---

## Quick Start

```bash
cp -r platforms/_template platforms/<your-platform>
# Edit adapter.json with your platform's format rules
npm run sync  # Generates agents
```

---

## Anatomy of `adapter.json`

| Field | Description |
|---|---|
| `name` | Short platform identifier (e.g., `cursor`, `claude`) |
| `displayName` | Human-readable name |
| `strategy` | `"identity"` for pass-through, omit for transform |
| `outputDir` | Where generated files go (e.g., `agents`, `rules`) |
| `fileExtension` | Output file extension (`.agent.md`, `.md`, `.mdc`) |
| `frontmatter.include` | Frontmatter fields to keep from canonical |
| `frontmatter.exclude` | Fields to strip (VS Code-specific) |
| `frontmatter.transform` | Per-field transformations (`comma-separated`, `omit`, `identity`) |
| `toolMap` | Map canonical tool names → platform tool names |
| `bodyFilters` | Modify body (`omit-section`, `prepend`, `append`, `replace`) |

---

## After Creating

1. Create a `README.md` for your platform
2. Update `docs/PLATFORMS.md` comparison table
3. Add CI validation in `.github/workflows/validate-agents.yml`
4. Test with `npm run sync` + `npm run sync:check`
