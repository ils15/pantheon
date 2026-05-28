# Pantheon Release Process

> How versioning, releases, and packaging work.

---

## Versioning Policy

Pantheon follows **Semantic Versioning** based on [Conventional Commits](https://www.conventionalcommits.org/):

| Commit pattern | Version bump |
|---|---|
| `BREAKING CHANGE` or `type!:` in scope | **MAJOR** (x.0.0) |
| `feat:` | **MINOR** (x.y.0) |
| `fix:`, `chore:`, `docs:`, `refactor:`, etc. | **PATCH** (x.y.z) |

Current version: **v3.8.4**

---

## Version Commands

```bash
# See recommended bump based on commits since last tag
npm run version:recommend

# Auto-apply recommended bump
npm run version:auto

# Manual override
npm run version:patch   # 2.9.0 → 2.9.1
npm run version:minor   # 2.9.0 → 2.10.0
npm run version:major   # 2.9.0 → 3.0.0
```

These update all 3 manifest files: `package.json`, `plugin.json`, `.github/plugin/plugin.json`.

---

## Changelogen

Pantheon uses [changelogen](https://github.com/unjs/changelogen) for automatic changelog generation and version bumping.

### First Time Setup

If this is the first time using changelogen:

```bash
npx changelogen --init
```

### Usage

```bash
# Generate changelog and bump version automatically
npm run changelog

# Create release with changelog + commit + tag
npm run release

# Create GitHub Release (manual trigger)
npx changelogen gh release
```

### How It Works

1. **Analyzes commits** — Uses Conventional Commits format (feat:, fix:, docs:)
2. **Determines bump** — BREAKING→MAJOR, feat→MINOR, fix→PATCH
3. **Generates CHANGELOG.md** — Structured release notes
4. **Creates git tag** — Tags the release for GitHub

### Prerequisites

- Project must use Conventional Commits (commitlint + husky already configured)
- First tag: Creates baseline for future changelogs
- After first tag: Only generates changelog from last tag (faster, cleaner)

---

## Git-Cliff

Pantheon uses [git-cliff](https://git-cliff.org/) for generating professional changelogs with rich formatting.

### Installation

```bash
# Via cargo (Rust)
cargo install git-cliff

# Via npm (via changelogen integration)
npm run changelog:gitcliff
```

### Usage

```bash
# Generate full changelog
npm run changelog:gitcliff

# Preview without writing (dry-run)
npm run release:preview

# Generate release notes for specific version
npm run release:notes v3.8.5
```

### Configuration

The configuration is in `cliff.toml` at the project root. Key features:

- **Conventional Commits** — Parses feat:/fix:/BREAKING automatically
- **Grouped sections** — Features, Bug Fixes, Documentation, etc.
- **Emoji indicators** — Visual categorization (✨ 🐛 📚 ⚡ 🔧 🎨 🧪)
- **GitHub links** — Auto-links issues and commit hashes
- **Breaking change markers** — Clear [BREAKING] tags

### Template Customization

Edit `cliff.toml` to customize:

```toml
[changelog]
body = """
{% for group, commits in commits | group_by(attribute="group") %}
    ### {{ group | upper_first }}
    {% for commit in commits %}
        - {{ commit.message | upper_first }}
    {% endfor %}
{% endfor %}
"""
```

### Release Workflow

```bash
# 1. Generate changelog
npm run changelog:gitcliff

# 2. Review changes
git diff CHANGELOG.md

# 3. Generate release notes
npm run release:notes v3.8.5

# 4. Create GitHub Release
gh release create v3.8.5 --notes-file release_notes.md
```

### Comparison: Changelogen vs Git-Cliff

| Feature | Changelogen | Git-Cliff |
|---------|-------------|-----------|
| Auto version bump | ✅ | ❌ (manual) |
| Rich formatting | Basic | Advanced (emoji, links) |
| Template engine | Simple | Tera (Jinja-like) |
| GitHub integration | Limited | Full (PRs, issues) |
| Breaking changes | ✅ | ✅ (with markers) |
| Speed | Fast | Fast |

**Recommendation:** Use `changelogen` for version bumping and `git-cliff` for changelog generation.

---

## Release Workflow

### 🚀 Automatic (recommended)

**No manual steps needed.** Just merge your PR to `main`:

1. [auto-release.yml](../.github/workflows/auto-release.yml) detects the merge
2. Analyzes conventional commits since the last tag → determines bump (`major`/`minor`/`patch`)
3. Updates version in `package.json`, `plugin.json`, `.github/plugin/plugin.json`
4. Regenerates all platform configs (`npm run sync`)
5. Commits the bump with `[skip ci]` and creates a git tag `vX.Y.Z`
6. Tag push triggers [release.yml](../.github/workflows/release.yml) which creates the **GitHub Release**

### 🖐️ Manual (if needed)

```bash
# 1. Ensure platforms are in sync
npm run sync && npm run sync:check

# 2. Check recommended version
npm run version:recommend

# 3. Apply version bump
npm run version:auto

# 4. Update CHANGELOG.md with release notes

# 5. Commit and tag
git add -A
git commit -m "chore(release): v$(node -p "require('./package.json').version")"
git tag v$(node -p "require('./package.json').version")

# 6. Push — CI creates the release automatically
git push && git push --tags
```

### What CI does

| Workflow | Trigger | Action |
|---|---|---|
| [auto-release.yml](../.github/workflows/auto-release.yml) | CI success on `main` | Bumps version, regenerates platforms, creates tag + GitHub Release |
| [release-gate.yml](../.github/workflows/release-gate.yml) | PR to `main` | Validates version consistency and CHANGELOG entry |
| [release-drafter.yml](../.github/workflows/release-drafter.yml) | Push to `main` | Drafts release notes from PR labels |

---

## Consumption Options

Users can consume Pantheon in several ways:

| Method | Best for | How |
|---|---|---|
| **GitHub Template** | New projects | Click "Use this template" on GitHub — creates a fresh repo with full Pantheon copy |
| **GitHub Release** | Downloads/CI | Download `Source code (tar.gz)` from [Releases page](https://github.com/ils15/pantheon/releases) |
| **VS Code Plugin** | Existing projects | Add `ils15/pantheon` to `chat.plugins.marketplaces` |
| **Git clone + copy** | Selective setup | `git clone` and copy only what you need |
| **npm package** (future) | Dev workflow | `npm install @ils15/pantheon` |

---

## Release Assets

Each release includes:

| Asset | Description |
|---|---|
| `Source code (zip)` | GitHub auto-generated |
| `Source code (tar.gz)` | GitHub auto-generated |
| `pantheon-vX.Y.Z.tar.gz` (planned) | Bundled release: agents + platforms + scripts + docs |

---

## Release Drafter

Pantheon uses [Release Drafter](https://github.com/release-drafter/release-drafter) to auto-collect PRs:

- Configured in [`.github/release-drafter.yml`](../.github/release-drafter.yml)
- PR labels (`feature`, `fix`, `chore`, `docs`) determine categories
- Runs on every push to `main`

---

## Pre-Release Checklist

Before cutting a release, verify:

- [ ] `npm run sync:check` passes (platforms in sync)
- [ ] `npm run plugin:validate` passes
- [ ] All workflows green on latest `main`
- [ ] `CHANGELOG.md` has entry for the new version
- [ ] Version manifests match: `package.json` == `plugin.json` == `.github/plugin/plugin.json`
- [ ] `npm run version:recommend` shows expected bump
- [ ] Platform READMEs are up to date
