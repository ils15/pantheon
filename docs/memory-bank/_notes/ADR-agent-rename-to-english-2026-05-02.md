# ADR: Rename Agents to English Names

**Date:** 2026-05-02
**Status:** Accepted

## Context

The Pantheon multi-agent system was using a mix of Portuguese and Greek/Egyptian names for its agents. This created inconsistency in technical identifiers (`@eco`, `@hefesto`, `@quiron`, `@nix`, `@temis`, `@prometeu`) and made the system harder to understand for international contributors.

## Decision

Standardise all agent names to English spellings of their Greek mythological references:

| Old Name | New Name | Figure |
|----------|----------|--------|
| maat | demeter | Demeter - goddess of harvest |
| ra | prometheus | Prometheus - Titan of fire |
| eco | echo | Echo - nymph |
| hefesto | hephaestus | Hephaestus - god of forge |
| quiron | chiron | Chiron - centaur/teacher |
| nix | nyx | Nyx - goddess of night |
| temis | themis | Themis - goddess of justice |

## Changes

- **48 file renames** across 8 platform directories (agents/, opencode, windsurf, claude, cursor, cline, continue) for 6 agents
- **~2000 content substitutions** across 174 files: agent definitions, docs, prompts, skills, instructions, plan files, configs
- **Display names** updated accordingly (e.g. Deméter → Demeter, Prometeu → Prometheus)
- **Handoff model mappings** updated in plan files (e.g. `eco__temis` → `echo__themis`)
- **Mythology reference** in AGENTS.md consolidated to Greek only

## Rationale

1. **Consistency**: All names now follow English convention matching their mythological origin
2. **Internationalisation**: English names are recognisable to the widest audience
3. **Accuracy**: Names now correctly match Greek (not Egyptian) mythology
4. **Searchability**: Standard English spellings improve findability

## Consequences

- All `@` mentions and configuration keys changed — any external references need updating
- Git history shows the rename as file moves + content changes
- Changelog entries prior to this date reference the old names historically
