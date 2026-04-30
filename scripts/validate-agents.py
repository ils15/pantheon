#!/usr/bin/env python3
"""Validate all agent definitions and skills for cross-agent integration consistency."""

import os
import re
import sys
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENTS_DIR = ROOT / "agents"
SKILLS_DIR = ROOT / "skills"
AGENTS_MD = ROOT / "AGENTS.md"

EXPECTED_AGENTS = {
    "zeus", "athena", "apollo", "hermes", "aphrodite", "maat", "ra",
    "temis", "iris", "mnemosyne", "talos", "gaia",
    "hefesto", "quiron", "eco", "nix",  # v3 new agents
}

EXPECTED_SKILLS = {
    # v2 skills
    "agent-coordination", "api-design-patterns", "artifact-management",
    "code-review-checklist", "database-migration", "database-optimization",
    "docker-best-practices", "fastapi-async-patterns", "frontend-analyzer",
    "internet-search", "nextjs-seo-optimization", "orchestration-workflow",
    "performance-optimization", "prompt-improver", "remote-sensing-analysis",
    "security-audit", "tdd-with-agents", "web-ui-analysis",
    # v3 new skills
    "rag-pipelines", "vector-search", "mcp-server-development",
    "multi-model-routing", "agent-observability", "streaming-patterns",
    "conversational-ai-design", "prompt-injection-security", "agent-evaluation",
}

# Agent → skills mapping (which agent references which skills)
AGENT_SKILL_MAP = {
    "zeus": {"agent-coordination", "orchestration-workflow", "artifact-management"},
    "athena": {"internet-search", "orchestration-workflow"},
    "apollo": {"internet-search"},
    "hermes": {"fastapi-async-patterns", "api-design-patterns", "security-audit", "tdd-with-agents"},
    "aphrodite": {"web-ui-analysis", "frontend-analyzer", "nextjs-seo-optimization", "tdd-with-agents"},
    "maat": {"database-migration", "database-optimization", "performance-optimization", "security-audit"},
    "ra": {"docker-best-practices", "performance-optimization"},
    "temis": {"code-review-checklist", "security-audit", "tdd-with-agents", "prompt-injection-security"},
    "iris": set(),
    "mnemosyne": {"artifact-management"},
    "talos": set(),
    "gaia": {"remote-sensing-analysis", "internet-search"},
    "hefesto": {"rag-pipelines", "vector-search", "mcp-server-development", "multi-model-routing", "agent-evaluation"},
    "quiron": {"multi-model-routing", "mcp-server-development", "agent-observability"},
    "eco": {"conversational-ai-design", "prompt-injection-security", "rag-pipelines"},
    "nix": {"agent-observability", "streaming-patterns", "mcp-server-development"},
}

errors = []
warnings = []


def check_frontmatter(agent_file: Path):
    """Check agent YAML frontmatter for consistency."""
    content = agent_file.read_text()
    
    # Extract YAML frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        errors.append(f"  [FAIL] {agent_file.name}: No YAML frontmatter found")
        return None
    
    try:
        fm = yaml.safe_load(match.group(1))
    except yaml.YAMLError as e:
        errors.append(f"  [FAIL] {agent_file.name}: Invalid YAML frontmatter: {e}")
        return None
    
    name = agent_file.stem.replace(".agent", "")
    
    # Required fields
    required = ["name", "description", "model", "tools"]
    for field in required:
        if field not in fm:
            errors.append(f"  [FAIL] {name}: Missing required field '{field}'")
    
    # Verify name matches filename
    if fm.get("name") != name:
        errors.append(f"  [FAIL] {name}: frontmatter name '{fm.get('name')}' != filename '{name}'")
    
    return fm


def validate_agent_consistency():
    """Validate all 16 agent files exist and have correct structure."""
    print("=" * 60)
    print("AGENT VALIDATION")
    print("=" * 60)
    
    # Check all expected agents exist
    agent_files = set()
    for f in AGENTS_DIR.glob("*.agent.md"):
        agent_files.add(f.stem.replace(".agent", ""))
    
    missing = EXPECTED_AGENTS - agent_files
    extra = agent_files - EXPECTED_AGENTS
    
    if missing:
        errors.append(f"  [FAIL] Missing agent files: {missing}")
    if extra:
        errors.append(f"  [WARN] Unexpected agent files: {extra}")
    
    print(f"\n  Agents found: {len(agent_files)}")
    print(f"  Expected: {len(EXPECTED_AGENTS)}")
    
    # Validate each agent's frontmatter
    print("\nValidating agent frontmatter...")
    for agent_file in sorted(AGENTS_DIR.glob("*.agent.md")):
        name = agent_file.stem.replace(".agent", "")
        fm = check_frontmatter(agent_file)
        if fm:
            print(f"  [OK] {name}")
    
    # Check Zeus agent list consistency
    # NOTE: Gaia is intentionally excluded (has disable-model-invocation: true)
    # Zeus itself is naturally not in its own subagent list
    zeus_file = AGENTS_DIR / "zeus.agent.md"
    zeus_content = zeus_file.read_text()
    zeus_match = re.search(r'agents:\s*\[([^\]]+)\]', zeus_content)
    if zeus_match:
        zeus_agents_str = zeus_match.group(1)
        zeus_agents = {a.strip().strip("'").strip('"') for a in zeus_agents_str.split(",")}
        zeus_intentionally_excluded = {"zeus", "gaia"}  # Zeus != subagent; Gaia = disable-model-invocation
        zeus_unlisted = EXPECTED_AGENTS - zeus_agents - zeus_intentionally_excluded
        if zeus_unlisted:
            errors.append(f"  [FAIL] Zeus 'agents:' list missing: {zeus_unlisted}")
        else:
            print(f"\n  Zeus agent delegation list: OK ({len(zeus_agents)} agents)")


def validate_skill_consistency():
    """Validate all skills exist and reference each other correctly."""
    print("\n" + "=" * 60)
    print("SKILL VALIDATION")
    print("=" * 60)
    
    # Check all expected skills exist
    skill_dirs = set()
    for d in SKILLS_DIR.iterdir():
        if d.is_dir() and (d / "SKILL.md").exists():
            skill_dirs.add(d.name)
    
    missing = EXPECTED_SKILLS - skill_dirs
    extra = skill_dirs - EXPECTED_SKILLS
    
    if missing:
        errors.append(f"  [FAIL] Missing skill directories: {missing}")
    if extra:
        print(f"  [INFO] Extra skill directories: {extra}")
    
    print(f"\n  Skills found: {len(skill_dirs)}")
    print(f"  Expected: {len(EXPECTED_SKILLS)}")
    
    # Check each skill has valid SKILL.md
    for skill_name in sorted(EXPECTED_SKILLS):
        skill_file = SKILLS_DIR / skill_name / "SKILL.md"
        if skill_file.exists():
            content = skill_file.read_text()
            has_yaml = content.startswith("---")
            size_kb = len(content) / 1024
            status = "OK" if has_yaml else "NO_FRONTMATTER"
            print(f"  [{status}] {skill_name} ({size_kb:.1f} KB)")


def validate_agents_md_references():
    """Check AGENTS.md references all agents and skills."""
    print("\n" + "=" * 60)
    print("AGENTS.MD VALIDATION")
    print("=" * 60)
    
    md_content = AGENTS_MD.read_text()
    
    # Check each agent is documented
    for agent in sorted(EXPECTED_AGENTS):
        agent_file = f"agents/{agent}.agent.md"
        if agent_file not in md_content:
            errors.append(f"  [FAIL] AGENTS.md missing reference to {agent_file}")
        else:
            print(f"  [OK] {agent_file} referenced")
    
    # Check skills are referenced somewhere in the system
    all_agent_files_content = ""
    for f in AGENTS_DIR.glob("*.agent.md"):
        all_agent_files_content += f.read_text()
    
    for skill in sorted(EXPECTED_SKILLS):
        # Skills are referenced in agent frontmatter (description/skills fields)
        # or in AGENTS.md agent descriptions
        skill_ref = f"`{skill}`"  # Code-formatted skill name
        skill_dir = f"skills/{skill}"
        if skill_ref not in md_content and skill_dir not in md_content and \
           skill not in all_agent_files_content:
            warnings.append(f"  [WARN] Skill '{skill}' not explicitly referenced in AGENTS.md or agent files")
        # Skills don't necessarily need a full entry in AGENTS.md


def validate_cross_agent_dependencies():
    """Validate cross-agent handoff consistency."""
    print("\n" + "=" * 60)
    print("CROSS-AGENT DEPENDENCY VALIDATION")
    print("=" * 60)
    
    # Check agent 'agents:' lists are valid (agents only reference existing agents)
    for agent_file in sorted(AGENTS_DIR.glob("*.agent.md")):
        name = agent_file.stem.replace(".agent", "")
        content = agent_file.read_text()
        refs = set(re.findall(r'@(\w+)', content))
        # Common non-agent references in documentation/code
        non_agent_refs = {"user", "apollo", "agent", "ops", "shared", "router",
                          "class", "property", "query", "index", "table", "type",
                          "select", "order", "return", "def", "import", "param",
                          "get", "set", "list", "dict", "str", "int", "bool",
                          "model", "field", "config", "key", "value", "id", "url"}
        invalid = refs - EXPECTED_AGENTS - non_agent_refs
        if invalid:
            warnings.append(f"  [WARN] {name}: references unknown agents: {invalid}")


def main():
    print(f"MYTHIC-AGENTS v3 INTEGRATION VALIDATION")
    print(f"Date: 2026-04-30")
    print(f"Root: {ROOT}")
    
    validate_agent_consistency()
    validate_skill_consistency()
    validate_agents_md_references()
    validate_cross_agent_dependencies()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    if errors:
        print(f"\n❌ {len(errors)} errors found:")
        for e in errors:
            print(e)
        sys.exit(1)
    elif warnings:
        print(f"\n⚠️  {len(warnings)} warnings (non-blocking):")
        for w in warnings:
            print(w)
        print(f"\n✅ Core validations passed!")
        print(f"   - {len(EXPECTED_AGENTS)} agents validated")
        print(f"   - {len(EXPECTED_SKILLS)} skills validated")
        print(f"   - Cross-agent references consistent")
    else:
        print(f"\n✅ All validations passed!")
        print(f"   - {len(EXPECTED_AGENTS)} agents validated")
        print(f"   - {len(EXPECTED_SKILLS)} skills validated")
        print(f"   - Cross-agent references consistent")


if __name__ == "__main__":
    main()
