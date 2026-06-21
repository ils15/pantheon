# NOTE-008: Multi-Platform Release Gate Checklist

**Status:** Active
**Date:** 2026-05-22

## Purpose

Standardized release gate procedure for the Pantheon multi-platform project. Ensures that before any release is published, all 6 platforms (OpenCode, Claude, Cline, Continue, Cursor, Windsurf) meet quality, consistency, and synchronization requirements.

## Hard Blockers (must ALL pass)

A single failure in any hard blocker **prevents the release**. These are enforced by CI (`.github/workflows/release-gate.yml`) and must be verified locally before tagging.

- [ ] **Routing validation**: `node scripts/validate-routing.mjs` exits 0
  - Validates all 14 agents present, all handoffs valid, all skills referenced exist
- [ ] **Sync freshness**: `npm run sync:check` exits 0
  - Ensures all platform output directories match canonical `routing.yml`
- [ ] **Conformance matrix**: ALL 6 platforms pass (0 failures)
  - `node scripts/test-adapter-conformance.mjs` exits 0 for every platform
  - Run via `npm test` or CI conformance-matrix.yml
- [ ] **No critical regressions**: Compare conformance against baseline
  - Trend score >= 0.95 (see NOTE-007 scoring formula)
  - No new failures since last release
- [ ] **Version consistency**: `package.json` == `plugin.json` == `.github/plugin/plugin.json`
  - All three manifests must declare identical version strings
  - Checked in CI by release-gate.yml version consistency step
- [ ] **CHANGELOG updated**: Entry exists for release version
  - `CHANGELOG.md` contains `## [v<version>]` section
  - Checked in CI by release-gate.yml CHANGELOG step
- [ ] **All PR checks green**: CI, sync check, conformance matrix, release gate
  - No pending or failing status checks on the merge commit
  - Reviewed in GitHub UI before merge

### Hard Blocker Enforcement

```yaml
# CI enforcement (release-gate.yml)
# These jobs run on every PR to main and must all pass:
#
# job: validate-routing       → node scripts/validate-routing.mjs
# job: sync-check             → npm run sync:check
# job: conformance-matrix     → 6 parallel node scripts/test-adapter-conformance.mjs --platform
# job: version-consistency    → compares package.json, plugin.json, .github/plugin/plugin.json
# job: changelog-check        → grep for version entry in CHANGELOG.md
```

## Soft Checks (should pass, warn if not)

Soft checks produce warnings but do not block the release. They should be addressed before tagging.

- [ ] **Zero conformance warnings** (baseline: 36 — track reduction over time)
  - View current warnings: `node scripts/test-adapter-conformance.mjs --verbose | grep "⚠️" | wc -l`
  - Target: reduce warnings toward 0 with each release
- [ ] **All 14 agents on all 6 platforms** (verify agent count)
  - Each platform output dir should contain all 14 agent files
  - Check: `ls platform/<name>/agents/ | wc -l`
  - Known issue: some platforms may not support all agents (document in per-platform README)
- [ ] **README.md version updated** (if displayed)
  - Verify badge URLs and version references match the release version
- [ ] **Migration notes written** (if breaking changes)
  - Breaking changes require `MIGRATION-v<version>.md` in project root
  - Documented in CHANGELOG under "BREAKING CHANGES" subsection
- [ ] **Platform READMEs consistent** with current release
  - Each `platform/<name>/README.md` reflects the current adapter version and capabilities
  - Check for outdated feature tables or capability descriptions

### Soft Check Resolution

```
⚠️  Warning: 12 conformance warnings detected (baseline: 36)
   📝 Track reduction: view data/trends/ for per-run warning counts
   💡 Not a blocker, but aim to reduce warnings before GA release

⚠️  Platform 'cursor' only has 12/14 agents
   📝 Expected: '_template' agents may not be fully portable
   💡 Verify cursor supports all agent delegation patterns

⚠️  README.md still references v3.7.1
   📝 Update badge: "![Version](https://img.shields.io/badge/version-3.7.2-blue)"
```

## Release Procedure

### Pre-Release (24h before)

1. **Run full conformance matrix**
   ```bash
   node scripts/test-adapter-conformance.mjs --verbose
   node scripts/validate-routing.mjs --verbose
   npm run sync:check
   ```
   - Record results in a trend report
   - Verify no regressions from previous run

2. **Check trend report for regressions**
   ```bash
   node scripts/collect-trend.mjs --compare
   ```
   - Compare against last known good run
   - Score must be >= 0.95

3. **Verify CHANGELOG is complete**
   - Read `CHANGELOG.md` from the `## [v<version>]` section
   - Ensure all changes since last release are documented
   - Check: features, fixes, breaking changes, deprecations

4. **Tag candidate release**
   ```bash
   # After merging all PRs to main, create a release candidate tag
   git tag -a "v$(node -p "require('./package.json').version")-rc1" -m "Release candidate v$(node -p "require('./package.json').version")-rc1"
   git push origin "v$(node -p "require('./package.json').version")-rc1"
   ```
   - Wait for CI to pass on the tag
   - Run through hard blockers checklist again

### Release Day

1. **Sync all platforms**
   ```bash
   npm run sync
   ```
   - Ensures all platform output directories are up-to-date
   - Generates adapter files for all 6 platforms

2. **Validate routing**
   ```bash
   npm run validate
   ```
   - `node scripts/validate-routing.mjs` must exit 0

3. **Full conformance suite**
   ```bash
   node scripts/test-adapter-conformance.mjs --verbose
   ```
   - Run without `--platform` filter to check all 6 platforms
   - Exit code must be 0 (all checks pass)

4. **Create release bundle**
   ```bash
   npm run bundle
   ```
   - Generates release tarball at `dist/pantheon-v<version>.tar.gz`

5. **Verify bundle contents**
   ```bash
   tar -tzf dist/pantheon-v<version>.tar.gz | head -30
   ```
   - Check: agents/ directory, platform/ directories, routing.yml, package.json
   - Verify version in bundled `package.json`

6. **Create GitHub release with tag**
   ```bash
   # Create the release tag
   git tag -a "v$(node -p "require('./package.json').version")" -m "Pantheon v$(node -p "require('./package.json').version")"

   # Push the tag
   git push origin "v$(node -p "require('./package.json').version")"

   # Create the GitHub release (using gh CLI)
   gh release create "v$(node -p "require('./package.json').version")" \
     --title "Pantheon v$(node -p "require('./package.json').version")" \
     --notes-file <(node scripts/generate-release-notes.mjs) \
     dist/pantheon-v$(node -p "require('./package.json').version").tar.gz
   ```

### Post-Release

1. **Verify CI conformance matrix on release commit**
   - Go to GitHub Actions → conformance-matrix.yml
   - Confirm all 6 platforms pass on the release tag
   - Screenshot or link results for release notes

2. **Update active context to reflect new release**
   ```markdown
   # In docs/memory-bank/01-active-context.md:
   ## Current Release
   - **Version:** 3.7.2
   - **Release date:** 2026-05-22
   - **Status:** Released
   ```

3. **Archive release notes**
   ```bash
   mkdir -p docs/releases/
   node scripts/generate-release-notes.mjs > docs/releases/v$(node -p "require('./package.json').version").md
   git add docs/releases/
   git commit -m "docs: archive release notes for v$(node -p "require('./package.json').version")"
   ```

## Quick Reference Script

```bash
#!/usr/bin/env bash
# scripts/release-check.sh — Quick pre-release sanity check
# Exit code 0 if all hard blockers pass, non-zero otherwise.

set -e

echo "=== Pantheon Pre-Release Check ==="
echo ""

echo "1. Routing validation..."
node scripts/validate-routing.mjs || { echo "❌ Routing failed"; exit 1; }
echo "✅ Routing valid"

echo "2. Sync freshness..."
npm run sync:check || { echo "❌ Sync drift detected"; exit 1; }
echo "✅ Sync fresh"

echo "3. Conformance suite (all platforms)..."
node scripts/test-adapter-conformance.mjs || { echo "❌ Conformance failed"; exit 1; }
echo "✅ All platforms conformant"

echo "4. Version consistency..."
pkg_ver=$(node -p "require('./package.json').version")
plugin_ver=$(node -p "require('./plugin.json').version")
gh_ver=$(node -p "require('./.github/plugin/plugin.json').version")
if [ "$pkg_ver" != "$plugin_ver" ] || [ "$pkg_ver" != "$gh_ver" ]; then
  echo "❌ Version mismatch: package=$pkg_ver plugin=$plugin_ver gh=$gh_ver"
  exit 1
fi
echo "✅ Versions match: $pkg_ver"

echo "5. CHANGELOG check..."
grep -q "## \[v$pkg_ver\]" CHANGELOG.md || { echo "❌ CHANGELOG missing v$pkg_ver"; exit 1; }
echo "✅ CHANGELOG has entry for v$pkg_ver"

echo ""
echo "🎉 All hard blockers passed! Ready for release."
```

## Escalation

| Scenario | Action | Contact |
|----------|--------|---------|
| Hard blocker fails in CI | Fix issue, re-run CI | Wave lead |
| Conformance regression > 5% | Rollback release, investigate | @themis |
| Sync cannot be resolved | Manual platform file audit | @hermes |
| Version mismatch in manifests | Run `npm run version:patch` to reconcile | @iris |
| CHANGELOG merge conflict | Manual resolution, verify entries | @mnemosyne |

## Related Documents

- NOTE-006: Observability Dashboard Specification (visual readiness indicators)
- NOTE-007: Quality Trend Report (trend data consumed by release gate)
- NOTE-005: Failure Triage Runbook (recovery procedures for gate failures)
- `.github/workflows/release-gate.yml` — CI enforcement of hard blockers
- `CHANGELOG.md` — Release history and migration notes
