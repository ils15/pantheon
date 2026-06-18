#!/usr/bin/env bash
# Pantheon Token Optimizer — audit and compress AI context files
# Usage: ./platform/optimize-context.sh [repo-root]

set -euo pipefail

REPO="${1:-.}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Pantheon Token Context Optimizer       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo

# Step 1: Discover context files
echo -e "${YELLOW}📂 Scanning for AI context files...${NC}"
echo

declare -a AUTO_LOADED=()
declare -a ON_DEMAND=()
declare -a SKILLS=()
declare -a AGENTS=()

# Auto-loaded files
for f in "$REPO/AGENTS.md" "$REPO/CLAUDE.md" "$REPO/.gemini/AGENTS.md" \
         "$REPO/.github/copilot-instructions.md" "$REPO/.claude/CLAUDE.md" \
         "$REPO/.windsurfrules" "$REPO/.clinerules"; do
  [ -f "$f" ] && AUTO_LOADED+=("$f")
done

# Instructions
while IFS= read -r -d '' f; do
  AUTO_LOADED+=("$f")
done < <(find "$REPO/.github/instructions" "$REPO/.claude/instructions" -name "*.md" -print0 2>/dev/null || true)

# Rules (Cursor, KiloCode, etc.)
while IFS= read -r -d '' f; do
  AUTO_LOADED+=("$f")
done < <(find "$REPO/.cursor/rules" "$REPO/.kilocode/rules" -name "*.mdc" -o -name "*.md" -print0 2>/dev/null || true)

# Memory bank (exclude .tmp, _tasks, decisions — these are gitignored/historical)
while IFS= read -r -d '' f; do
  case "$f" in
    */.tmp/*|*/_tasks/*|*/decisions/*) continue ;;
  esac
  ON_DEMAND+=("$f")
done < <(find "$REPO/docs/memory-bank" -name "*.md" -print0 2>/dev/null || true)

# Skills
while IFS= read -r -d '' f; do
  SKILLS+=("$f")
done < <(find "$REPO/.github/skills" "$REPO/.claude/skills" "$REPO/.opencode/skills" "$REPO/skills" -name "SKILL.md" -print0 2>/dev/null || true)

# Agents
while IFS= read -r -d '' f; do
  AGENTS+=("$f")
done < <(find "$REPO/.github/agents" "$REPO/.claude/agents" "$REPO/.opencode/agents" "$REPO/agents" -name "*.agent.md" -o -name "*.md" -print0 2>/dev/null || true)

# Step 2: Measure baseline
echo -e "${GREEN}📊 Baseline Measurement${NC}"
echo "─────────────────────────────────────────────"

AUTO_LINES=0
for f in "${AUTO_LOADED[@]}"; do
  lines=$(wc -l < "$f")
  AUTO_LINES=$((AUTO_LINES + lines))
  printf "  %-55s %4d lines\n" "$(echo "$f" | sed "s|$REPO/||")" "$lines"
done
echo -e "  ${BLUE}─────────────────────────────────────────────${NC}"
echo -e "  ${YELLOW}Auto-loaded total: $AUTO_LINES lines (~$(( AUTO_LINES * 4 )) tokens)${NC}"
echo

ON_DEMAND_LINES=0
for f in "${ON_DEMAND[@]}"; do
  lines=$(wc -l < "$f")
  ON_DEMAND_LINES=$((ON_DEMAND_LINES + lines))
  printf "  %-55s %4d lines\n" "$(echo "$f" | sed "s|$REPO/||")" "$lines"
done
if [ ${#ON_DEMAND[@]} -gt 0 ]; then
  echo -e "  ${BLUE}─────────────────────────────────────────────${NC}"
  echo -e "  ${YELLOW}On-demand total: $ON_DEMAND_LINES lines (~$(( ON_DEMAND_LINES * 4 )) tokens)${NC}"
fi
echo

SKILL_COUNT=${#SKILLS[@]}
SKILL_LINES=0
for f in "${SKILLS[@]}"; do
  lines=$(wc -l < "$f")
  SKILL_LINES=$((SKILL_LINES + lines))
done
echo -e "  ${YELLOW}Skills: $SKILL_COUNT files, $SKILL_LINES lines total (lazy-load, NOT auto-loaded)${NC}"

AGENT_COUNT=${#AGENTS[@]}
AGENT_LINES=0
for f in "${AGENTS[@]}"; do
  lines=$(wc -l < "$f")
  AGENT_LINES=$((AGENT_LINES + lines))
done
echo -e "  ${YELLOW}Agents: $AGENT_COUNT files, $AGENT_LINES lines total (on-demand, NOT auto-loaded)${NC}"
echo

# Real baseline is ONLY auto-loaded files
AUTO_TOKENS=$((AUTO_LINES * 4))
echo -e "  ${RED}═════════════════════════════════════════${NC}"
echo -e "  ${RED}AUTO-LOADED BASELINE: ~$AUTO_TOKENS tokens (every invocation)${NC}"
echo -e "  ${YELLOW}+ On-demand (when read): ~$(( ON_DEMAND_LINES * 4 )) tokens${NC}"
echo -e "  ${GREEN}+ Skills (lazy-load): ~$(( SKILL_LINES * 4 )) tokens (only when invoked)${NC}"
echo -e "  ${GREEN}+ Agents (on-demand): ~$(( AGENT_LINES * 4 )) tokens (only when selected)${NC}"
echo -e "  ${RED}═════════════════════════════════════════${NC}"

# Step 3: Check for red flags
echo -e "${YELLOW}🚩 Checking for red flags...${NC}"
echo "─────────────────────────────────────────────"

RED_FLAGS=0

# Check for historical content — use specific patterns, not generic keywords
# Each pattern targets actual waste, not legitimate uses of common words

# Wave-by-wave delivery tables (not "DAG Waves" architectural pattern)
for f in "${ON_DEMAND[@]}" "${AUTO_LOADED[@]}"; do
  bn=$(basename "$f")
  # Skip files where "wave" is part of the name (progress-log is expected to reference waves)
  if echo "$bn" | grep -qi "progress\|active-context"; then
    continue
  fi
  # Match actual wave tables: "Wave 1:", "Wave 2:", "## Wave", "wave-by-wave"
  if grep -qiE "(^|## )Wave [0-9]|wave-by-wave" "$f" 2>/dev/null; then
    echo -e "  ${RED}✗${NC} Wave delivery table in $(echo "$f" | sed "s|$REPO/||")"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

# Delivery history logs (not instruction templates)
for f in "${ON_DEMAND[@]}" "${AUTO_LOADED[@]}"; do
  # Match actual delivery tables: "## Delivered", "Delivered: X features", etc.
  # Skip instruction templates like "what was delivered" in prompt examples
  if grep -qiE "^Delivered:|## Delivered|delivery log:|delivery history:" "$f" 2>/dev/null; then
    echo -e "  ${RED}✗${NC} Delivery history in $(echo "$f" | sed "s|$REPO/||")"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

# Progress percentages and commit counts (not "progress" as a word)
for f in "${ON_DEMAND[@]}" "${AUTO_LOADED[@]}"; do
  bn=$(basename "$f")
  if echo "$bn" | grep -qi "progress-log"; then
    continue
  fi
  if grep -qiE "[0-9]+% (complete|done|covered)|commit count|commits: [0-9]" "$f" 2>/dev/null; then
    echo -e "  ${RED}✗${NC} Progress metrics in $(echo "$f" | sed "s|$REPO/||")"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

# "Last updated" dates on every file (git has this)
for f in "${ON_DEMAND[@]}" "${AUTO_LOADED[@]}"; do
  if grep -qiE "^\*\*Last [Uu]pdated\*\*:|<!-- last.updated:|last updated:" "$f" 2>/dev/null; then
    echo -e "  ${RED}✗${NC} Last-updated date in $(echo "$f" | sed "s|$REPO/||") (use git instead)"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

# Cleanup logs
for f in "${ON_DEMAND[@]}" "${AUTO_LOADED[@]}"; do
  if grep -qiE "deleted [0-9]+ lines of dead code|legacy cleanup|cleaned up [0-9]+" "$f" 2>/dev/null; then
    echo -e "  ${RED}✗${NC} Cleanup log in $(echo "$f" | sed "s|$REPO/||")"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

# Check for duplicated content — only flag if >3 files share the SAME phrase
# Use longer phrases to avoid false positives on common tech terms
for term in "Python 3.12" "React 19" "SQLAlchemy 2.0" "PostgreSQL.*Alembic"; do
  files_with_term=()
  for f in "${AUTO_LOADED[@]}" "${ON_DEMAND[@]}"; do
    if grep -qE "$term" "$f" 2>/dev/null; then
      files_with_term+=("$(echo "$f" | sed "s|$REPO/||")")
    fi
  done
  if [ ${#files_with_term[@]} -gt 3 ]; then
    echo -e "  ${RED}✗${NC} Duplicated: '$term' appears in ${#files_with_term[@]} files"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

# Check for files exceeding line limits
for f in "${AUTO_LOADED[@]}"; do
  lines=$(wc -l < "$f")
  basename=$(echo "$f" | sed "s|$REPO/||")
  if [[ "$basename" == "AGENTS.md" ]] && [ "$lines" -gt 80 ]; then
    echo -e "  ${RED}✗${NC} $basename exceeds 80-line limit ($lines lines)"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

for f in "${ON_DEMAND[@]}"; do
  lines=$(wc -l < "$f")
  basename=$(echo "$f" | sed "s|$REPO/||")
  if [ "$lines" -gt 100 ]; then
    echo -e "  ${RED}✗${NC} $basename exceeds 100-line limit ($lines lines)"
    RED_FLAGS=$((RED_FLAGS + 1))
  fi
done

# Check for missing memory bank structure
if [ ! -f "$REPO/docs/memory-bank/00-project.md" ] && [ ! -f "$REPO/docs/memory-bank/00-overview.md" ]; then
  echo -e "  ${RED}✗${NC} No memory bank project file found"
  RED_FLAGS=$((RED_FLAGS + 1))
fi

if [ "$RED_FLAGS" -eq 0 ]; then
  echo -e "  ${GREEN}✓ No red flags found!${NC}"
fi
echo

# Step 4: Recommendations
echo -e "${GREEN}💡 Recommendations${NC}"
echo "─────────────────────────────────────────────"

if [ "$RED_FLAGS" -gt 0 ]; then
  echo "  Run: /optimize --dry-run to apply optimizations"
  echo "  Or:  @athena Run a token audit on this repository"
else
  echo "  Repository is already well-optimized!"
fi
echo

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  Estimated after optimization: ~$(( AUTO_TOKENS * 35 / 100 )) tokens auto-loaded (-65%)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
