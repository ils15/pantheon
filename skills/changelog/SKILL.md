# Changelog Automation

Automate CHANGELOG.md updates from git history using Conventional Commits.

## When to Use

- After merging a PR or completing a feature
- Before creating a release tag
- When user asks to "update the changelog" or "what changed?"
- As part of release preparation workflow

## How It Works

The project uses **Conventional Commits** to categorize changes automatically. Every commit message should follow this format:

```
type(scope): description

type: feat | fix | docs | refactor | perf | test | chore | ci | style | revert
scope: optional component name (e.g., agents, platform, opencode)
```

### Commit Type → Changelog Section Mapping

| Commit Type | Changelog Section | Example |
|---|---|---|
| `feat:` | Added | `feat(agents): add Argus visual analysis agent` |
| `fix:` | Fixed | `fix(sync): handle missing frontmatter in Cline` |
| `docs:` | Documentation | `docs: update AGENTS.md with new agent` |
| `refactor:` | Changed | `refactor: rename Council Mode to Agora Mode` |
| `perf:` | Performance | `perf: optimize Apollo parallel search` |
| `test:` | Testing | `test: add unit tests for changelog script` |
| `ci:` | CI/CD | `ci: add changelog auto-update workflow` |
| `style:` | Style | `style: format agent files consistently` |
| `revert:` | Reverted | `revert: remove broken MCP server config` |
| `chore:` | (omitted by default) | `chore: update dependencies` |

## Commands

### Update Unreleased Section
```bash
./scripts/update-changelog.sh
```

### Create New Release
```bash
./scripts/update-changelog.sh --release
# or with explicit version:
./scripts/update-changelog.sh --release --version 3.4.0
```

### Include Chores and Non-Conventional Commits
```bash
./scripts/update-changelog.sh --verbose
```

## Agent Workflow

When asked to update the changelog:

1. **Check git log** since last tag:
   ```bash
   git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo "")..HEAD
   ```

2. **Verify commit messages** follow Conventional Commits format. If not, suggest rewording.

3. **Run the script**:
   ```bash
   ./scripts/update-changelog.sh
   ```

4. **Review the output** — check that entries are accurate and well-formatted.

5. **Commit the change**:
   ```bash
   git add CHANGELOG.md
   git commit -m "docs: update CHANGELOG.md with recent changes"
   ```

## Release Workflow

When preparing a release:

1. Ensure all PRs are merged and CHANGELOG unreleased section is current
2. Run: `./scripts/update-changelog.sh --release`
3. Review the generated version section
4. Create git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
5. Push: `git push && git push --tags`

## GitHub Actions

The `.github/workflows/changelog.yml` workflow automatically:
- Runs on PR merge to `main`
- Detects conventional commit types
- Updates the `[Unreleased]` section
- Commits the change (no PR needed)

## Best Practices

- **Write descriptive commit messages** — the changelog is only as good as your commits
- **Use scopes** for clarity: `feat(agents):` not just `feat:`
- **One logical change per commit** — don't bundle unrelated changes
- **Review before release** — auto-generated entries may need minor editing
- **Don't skip the changelog** — it's the primary reference for users
