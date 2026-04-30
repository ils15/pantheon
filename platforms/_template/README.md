# Platform Template

Copy this directory to create a new platform. Then edit `adapter.json`:

1. **`name`** — Short platform identifier (e.g., `cursor`, `claude`)
2. **`displayName`** — Human-readable name
3. **`frontmatter.include`** — Fields from canonical agent to keep
4. **`frontmatter.exclude`** — Fields to strip (e.g., VS Code-specific)
5. **`frontmatter.transform`** — Field transformations (omit → remove, comma-separated → join array)
6. **`toolMap`** — Map canonical tool names to your platform's names
7. **`bodyFilters`** — Filters applied to the markdown body

After editing, run:

```bash
npm run sync
```

This generates `platforms/<name>/agents/` from the canonical `agents/` sources.
