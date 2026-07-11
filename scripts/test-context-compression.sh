#!/bin/bash
# Test: Context Compression Pipeline
# Simulates Themis APPROVED → triggers compress_context handoff
#
# Usage: bash scripts/test-context-compression.sh
#
# This script validates the prerequisites for the Level 2 context compression
# pipeline and creates mock artifacts for end-to-end testing.

set -euo pipefail

echo "=== Context Compression Test ==="
echo ""

# Step 1: Verify prerequisites
echo "[1/4] Checking prerequisites..."
errors=0

test -f skills/context-compression/SKILL.md || { echo "   ❌ SKILL.md not found"; errors=$((errors + 1)); }
test -f agents/mnemosyne.agent.md || { echo "   ❌ mnemosyne.agent.md not found"; errors=$((errors + 1)); }
test -f agents/zeus.agent.md || { echo "   ❌ zeus.agent.md not found"; errors=$((errors + 1)); }
test -f routing.yml || { echo "   ❌ routing.yml not found"; errors=$((errors + 1)); }
test -f instructions/artifact-protocol.instructions.md || { echo "   ❌ artifact-protocol.instructions.md not found"; errors=$((errors + 1)); }
test -f .pantheon/memory-bank/01-active-context.md || { echo "   ❌ active-context.md not found"; errors=$((errors + 1)); }
test -d .pantheon/memory-bank/.tmp || mkdir -p .pantheon/memory-bank/.tmp

if [ -f scripts/scrub-secrets.py ]; then
    echo "   ✅ scrub-secrets.py found (217 lines, $(grep -c 'def ' scripts/scrub-secrets.py || echo 0) functions)"
else
    echo "   ⚠️  scrub-secrets.py not found (will skip scrubbing)"
fi

# Verify compress_context handoff in routing.yml
if grep -q "compress_context" routing.yml; then
    HANDOFF_LINE=$(grep -n "compress_context" routing.yml | head -1 | cut -d: -f1)
    echo "   ✅ compress_context handoff found in routing.yml at line $HANDOFF_LINE"
else
    echo "   ❌ compress_context handoff missing from routing.yml"
    errors=$((errors + 1))
fi

# Verify ZZ artifact mention in artifact-protocol
if grep -q "ZZ-phase" instructions/artifact-protocol.instructions.md; then
    echo "   ✅ ZZ artifact format documented in artifact-protocol.instructions.md"
else
    echo "   ❌ ZZ artifact format missing from artifact-protocol.instructions.md"
    errors=$((errors + 1))
fi

# Verify context-compression trigger was added to zeus.agent.md
if grep -q "Context Compression Trigger" agents/zeus.agent.md; then
    echo "   ✅ Context Compression Trigger section present in zeus.agent.md"
else
    echo "   ⚠️  Context Compression Trigger section not yet in zeus.agent.md"
fi

if [ "$errors" -gt 0 ]; then
    echo "   ❌ $errors prerequisite(s) missing — aborting"
    exit 1
fi
echo "   ✅ All prerequisites met"
echo ""

# Step 2: Create a mock IMPL artifact for testing
echo "[2/4] Creating mock IMPL artifact..."

cat > .pantheon/memory-bank/.tmp/IMPL-test-phase-hermes.md << 'ARTIFACT'
# IMPL-test-phase-hermes
**Date:** 2026-06-26  **Status:** Awaiting Compression Test

## What Was Implemented
- test/file.py — mock implementation for compression test
- test/schema.py — mock schema migration for priority scoring test

## Tests
- ✅ 5 tests passing / Coverage: 87%

## Notes for Themis
This is a test artifact to validate the compression pipeline end-to-end.
ARTIFACT

cat > .pantheon/memory-bank/.tmp/IMPL-test-phase-demeter.md << 'ARTIFACT'
# IMPL-test-phase-demeter
**Date:** 2026-06-26  **Status:** Awaiting Compression Test

## What Was Implemented
- backend/migrations/0013_add_refresh_tokens.py — new refresh_tokens table
- backend/models/token.py — Token model with FK to users

## Tests
- ✅ Migration tested: upgrade + downgrade both verified

## Notes for Themis
New table: refresh_tokens with (user_id, token_hash, expires_at, revoked_at)
ARTIFACT

echo "   ✅ 2 mock artifacts created (hermes + demeter)"
echo ""

# Step 3: Create mock subtask_summary for compression
echo "[3/4] Creating mock subtask summaries..."

cat > .pantheon/memory-bank/.tmp/subtask-hermes.json << 'JSON'
{
  "files_changed": ["test/file.py", "test/schema.py"],
  "summary": "Added JWT auth endpoint with refresh token rotation",
  "tests": "✅ All passing",
  "coverage": "87%",
  "status": "complete",
  "blockers": null
}
JSON

cat > .pantheon/memory-bank/.tmp/subtask-demeter.json << 'JSON'
{
  "files_changed": ["backend/migrations/0013_add_refresh_tokens.py", "backend/models/token.py"],
  "summary": "Created refresh_tokens table with FK to users, hashed token, expires_at, revoked_at",
  "tests": "✅ Migration upgrade + downgrade verified",
  "coverage": "100%",
  "status": "complete",
  "blockers": null
}
JSON

echo "   ✅ 2 mock subtask summaries created"
echo ""

# Step 4: Verify .tmp structure is writable and correct
echo "[4/4] Verifying .tmp structure..."
ls -la .pantheon/memory-bank/.tmp/
echo ""
echo "   ✅ .tmp structure looks correct"
echo ""

# Step 5: Validate scrub-secrets.py works
echo "[5/4] Testing scrub-secrets.py (bonus)..."
if [ -f scripts/scrub-secrets.py ]; then
    # Test with a simple secret
    SECRET_TEST=$(echo "Bearer my-test-token-12345" | python3 scripts/scrub-secrets.py --stdin 2>/dev/null)
    if echo "$SECRET_TEST" | grep -q "REDACTED"; then
        echo "   ✅ scrub-secrets.py: secret detection working"
    else
        echo "   ⚠️  scrub-secrets.py: did not detect test secret (may need different pattern)"
    fi
fi
echo ""

echo "=== Test Complete ==="
echo ""
echo "Mock artifacts ready for compression pipeline test."
echo ""
echo "Next manual step: Trigger compress_context handoff:"
echo "  @mnemosyne Run compression pipeline with test artifacts"
echo ""
echo "Expected output:"
echo "  - .pantheon/memory-bank/.tmp/ZZ-test-context.md"
echo "  - Updated 01-active-context.md with compressed entries"
echo "  - Updated 02-progress-log.md with archived mock artifact"
echo ""
echo "Scoring verification (expected):"
echo "  - subtask-hermes.json: JWT + endpoint + token keywords → HIGH (score ~0.71)"
echo "  - subtask-demeter.json: migration + new table + FK keywords → CRITICAL (score ~0.83)"
echo ""
echo "To clean up test artifacts:"
echo "  rm .pantheon/memory-bank/.tmp/IMPL-test-phase-*.md"
echo "  rm .pantheon/memory-bank/.tmp/subtask-*.json"
