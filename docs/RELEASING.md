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

Current version: **v2.9.0**

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

## Release Workflow

### Step-by-step

```bash
# 1. Ensure platforms are in sync
npm run sync
npm run sync:check

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

The [release.yml](../.github/workflows/release.yml) workflow:
1. Runs `npm run sync` to regenerate platform configs
2. Extracts release notes from `CHANGELOG.md` for the tagged version
3. Creates a **GitHub Release** with notes and source code

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

Starting from v2.10.0, each release includes:

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
