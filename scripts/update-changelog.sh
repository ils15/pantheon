#!/usr/bin/env bash
# =============================================================================
# update-changelog.sh — Auto-generate CHANGELOG.md from git history
#
# Usage:
#   ./scripts/update-changelog.sh              # Unreleased section (since last tag)
#   ./scripts/update-changelog.sh --release    # Create new release section with version
#   ./scripts/update-changelog.sh --version 3.4.0  # Explicit version
#
# Conventional Commit types mapped to Keep a Changelog sections:
#   feat:     → Added
#   fix:      → Fixed
#   docs:     → Documentation
#   refactor: → Changed
#   perf:     → Performance
#   test:     → Testing
#   chore:    → Internal (omitted from CHANGELOG unless --verbose)
#   ci:       → CI/CD
#   style:    → Style
#   revert:   → Reverted
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CHANGELOG="$ROOT_DIR/CHANGELOG.md"

# ── Flags ─────────────────────────────────────────────────────────────────────
VERBOSE=false
RELEASE=false
VERSION=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --verbose) VERBOSE=true; shift ;;
        --release) RELEASE=true; shift ;;
        --version) VERSION="$2"; shift 2 ;;
        --help|-h)
            echo "Usage: $0 [--release] [--version X.Y.Z] [--verbose]"
            exit 0
            ;;
        *) echo "Unknown flag: $1"; exit 1 ;;
    esac
done

# ── Determine range ──────────────────────────────────────────────────────────
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [[ -n "$LAST_TAG" ]]; then
    RANGE="${LAST_TAG}..HEAD"
else
    RANGE="HEAD"
fi

# ── Collect commits by type ──────────────────────────────────────────────────
declare -a ADDED=()
declare -a CHANGED=()
declare -a DEPRECATED=()
declare -a REMOVED=()
declare -a FIXED=()
declare -a SECURITY=()
declare -a DOCUMENTATION=()
declare -a PERFORMANCE=()
declare -a TESTING=()
declare -a CICD=()
declare -a STYLE=()
declare -a REVERTED=()
declare -a OTHER=()

while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    # Extract scope and message
    if [[ "$line" =~ ^([a-z]+)(\([a-zA-Z0-9_-]+\))?:\ (.+)$ ]]; then
        type="${BASH_REMATCH[1]}"
        scope="${BASH_REMATCH[2]}"
        msg="${BASH_REMATCH[3]}"

        # Capitalize first letter
        msg="$(echo "${msg:0:1}" | tr '[:lower:]' '[:upper:]')${msg:1}"

        # Include scope if present
        if [[ -n "$scope" ]]; then
            scope="${scope:1:-1}"  # strip parens
            entry="- **${scope}**: ${msg}"
        else
            entry="- ${msg}"
        fi

        case "$type" in
            feat)     ADDED+=("$entry") ;;
            fix)      FIXED+=("$entry") ;;
            docs)     DOCUMENTATION+=("$entry") ;;
            refactor) CHANGED+=("$entry") ;;
            perf)     PERFORMANCE+=("$entry") ;;
            test)     TESTING+=("$entry") ;;
            ci)       CICD+=("$entry") ;;
            style)    STYLE+=("$entry") ;;
            revert)   REVERTED+=("$entry") ;;
            chore)    [[ "$VERBOSE" == true ]] && OTHER+=("- [chore] ${msg}") ;;
            *)        OTHER+=("- ${msg}") ;;
        esac
    else
        # Non-conventional commit — include in Other if verbose
        [[ "$VERBOSE" == true ]] && OTHER+=("- ${line}")
    fi
done < <(git log "$RANGE" --pretty=format:"%s" --no-merges)

# ── Check if there are any changes ───────────────────────────────────────────
has_changes() {
    local -n arr=$1
    [[ ${#arr[@]} -gt 0 ]]
}

if ! has_changes ADDED && ! has_changes CHANGED && ! has_changes DEPRECATED && \
   ! has_changes REMOVED && ! has_changes FIXED && ! has_changes SECURITY && \
   ! has_changes DOCUMENTATION && ! has_changes PERFORMANCE && \
   ! has_changes TESTING && ! has_changes CICD && ! has_changes STYLE && \
   ! has_changes REVERTED && ! has_changes OTHER; then
    echo "✅ No new conventional commits since $LAST_TAG"
    exit 0
fi

# ── Generate section ─────────────────────────────────────────────────────────
generate_section() {
    local title="$1"
    shift
    local -a items=("$@")

    if [[ ${#items[@]} -gt 0 ]]; then
        echo "### $title"
        echo ""
        for item in "${items[@]}"; do
            echo "$item"
        done
        echo ""
    fi
}

SECTION=""

SECTION+="$(generate_section "Added" "${ADDED[@]+"${ADDED[@]}"}")"
SECTION+="$(generate_section "Changed" "${CHANGED[@]+"${CHANGED[@]}"}")"
SECTION+="$(generate_section "Deprecated" "${DEPRECATED[@]+"${DEPRECATED[@]}"}")"
SECTION+="$(generate_section "Removed" "${REMOVED[@]+"${REMOVED[@]}"}")"
SECTION+="$(generate_section "Fixed" "${FIXED[@]+"${FIXED[@]}"}")"
SECTION+="$(generate_section "Security" "${SECURITY[@]+"${SECURITY[@]}"}")"
SECTION+="$(generate_section "Documentation" "${DOCUMENTATION[@]+"${DOCUMENTATION[@]}"}")"
SECTION+="$(generate_section "Performance" "${PERFORMANCE[@]+"${PERFORMANCE[@]}"}")"
SECTION+="$(generate_section "Testing" "${TESTING[@]+"${TESTING[@]}"}")"
SECTION+="$(generate_section "CI/CD" "${CICD[@]+"${CICD[@]}"}")"
SECTION+="$(generate_section "Style" "${STYLE[@]+"${STYLE[@]}"}")"
SECTION+="$(generate_section "Reverted" "${REVERTED[@]+"${REVERTED[@]}"}")"
SECTION+="$(generate_section "Other" "${OTHER[@]+"${OTHER[@]}"}")"

# ── Update CHANGELOG ─────────────────────────────────────────────────────────
if [[ "$RELEASE" == true ]]; then
    # Create a new release section
    if [[ -z "$VERSION" ]]; then
        # Auto-increment from last tag
        if [[ -n "$LAST_TAG" ]]; then
            LAST_VER="${LAST_TAG#v}"
            IFS='.' read -r MAJOR MINOR PATCH <<< "$LAST_VER"
            PATCH=$((PATCH + 1))
            VERSION="${MAJOR}.${MINOR}.${PATCH}"
        else
            VERSION="1.0.0"
        fi
    fi

    TODAY=$(date +%Y-%m-%d)
    NEW_SECTION="## [v${VERSION}] - ${TODAY}\n\n${SECTION}"

    # Insert after the "## [Unreleased]" section
    if grep -q "## \[Unreleased\]" "$CHANGELOG"; then
        # Add content under Unreleased header, then create new release
        sed -i "s/## \[Unreleased\]/## [Unreleased]\n\n${NEW_SECTION}/" "$CHANGELOG"
    else
        # Prepend after the header
        HEADER=$(head -n 6 "$CHANGELOG")
        echo "$HEADER" > "$CHANGELOG.tmp"
        echo "" >> "$CHANGELOG.tmp"
        echo -e "$NEW_SECTION" >> "$CHANGELOG.tmp"
        tail -n +7 "$CHANGELOG" >> "$CHANGELOG.tmp"
        mv "$CHANGELOG.tmp" "$CHANGELOG"
    fi

    echo "✅ Release v${VERSION} added to CHANGELOG.md"
else
    # Update Unreleased section only
    if grep -q "## \[Unreleased\]" "$CHANGELOG"; then
        # Replace everything between [Unreleased] and next ## or EOF
        awk -v section="$SECTION" '
            /## \[Unreleased\]/ { found=1; print; next }
            /^## \[/ && found { found=0 }
            !found { print }
            found && /^$/ && !printed { print "\n" section "\n"; printed=1 }
        ' "$CHANGELOG" > "$CHANGELOG.tmp"

        # If section wasn't inserted (no blank line after Unreleased), append
        if ! grep -q "^### " "$CHANGELOG.tmp"; then
            sed -i "/## \[Unreleased\]/a\\
\\
${SECTION}" "$CHANGELOG"
            rm -f "$CHANGELOG.tmp"
        else
            mv "$CHANGELOG.tmp" "$CHANGELOG"
        fi
    else
        # Add Unreleased section after header
        HEADER=$(head -n 6 "$CHANGELOG")
        echo "$HEADER" > "$CHANGELOG.tmp"
        echo "" >> "$CHANGELOG.tmp"
        echo "## [Unreleased]" >> "$CHANGELOG.tmp"
        echo "" >> "$CHANGELOG.tmp"
        echo "$SECTION" >> "$CHANGELOG.tmp"
        tail -n +7 "$CHANGELOG" >> "$CHANGELOG.tmp"
        mv "$CHANGELOG.tmp" "$CHANGELOG"
    fi

    echo "✅ Unreleased section updated in CHANGELOG.md"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "Commits processed:"
[[ ${#ADDED[@]} -gt 0 ]] && echo "  Added:     ${#ADDED[@]}"
[[ ${#CHANGED[@]} -gt 0 ]] && echo "  Changed:   ${#CHANGED[@]}"
[[ ${#FIXED[@]} -gt 0 ]] && echo "  Fixed:     ${#FIXED[@]}"
[[ ${#DOCUMENTATION[@]} -gt 0 ]] && echo "  Docs:      ${#DOCUMENTATION[@]}"
[[ ${#PERFORMANCE[@]} -gt 0 ]] && echo "  Perf:      ${#PERFORMANCE[@]}"
[[ ${#TESTING[@]} -gt 0 ]] && echo "  Testing:   ${#TESTING[@]}"
[[ ${#CICD[@]} -gt 0 ]] && echo "  CI/CD:     ${#CICD[@]}"
[[ ${#OTHER[@]} -gt 0 ]] && echo "  Other:     ${#OTHER[@]}"
