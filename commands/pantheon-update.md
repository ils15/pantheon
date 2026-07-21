---
description: "Bump Pantheon version, update changelog, and create GitHub release"
agent: iris
---

# /pantheon-update — Create a New Pantheon Release

Creates a new version: bumps version files, updates changelog, commits, tags, and optionally creates a GitHub Release.

## Usage

```
/pantheon-update                          Auto-detect bump level (recommended)
/pantheon-update --patch                  Force patch bump (3.19.0 → 3.17.2)
/pantheon-update --minor                  Force minor bump (3.19.0 → 3.18.0)
/pantheon-update --major                  Force major bump (3.19.0 → 4.0.0)
/pantheon-update --dry-run                Preview only
```

## Examples

```
/pantheon-update                          "Create a new release with auto-detected version"
/pantheon-update --minor                  "New feature release — force minor bump"
/pantheon-update --dry-run                "What version would be created?"
```

## How It Works

1. **Version bump** — Reads latest git tag, analyzes commits since, and determines bump level (patch/minor/major). Respects conventional commits: `feat!:` or `BREAKING CHANGE` → major, `feat:` → minor, otherwise patch.
2. **Manifest update** — Writes the new version to `package.json`, `plugin.json`, `.github/plugin/plugin.json`, `pyproject.toml`, and `platform/forge.json`.
3. **Changelog** — Moves `[Unreleased]` entries to a new `[vX.Y.Z]` section. If Unreleased is empty, adds a minimal entry (edit `CHANGELOG.md` with details).
4. **Git commit + tag** — Creates a `vX.Y.Z` tag.
5. **GitHub Release** — Creates a release with changelog notes (omit with `--no-release`).

## Flags:

$ARGUMENTS
