#!/usr/bin/env node
/**
 * cline.mjs — Cline platform installer
 *
 * Cline is an open-source VS Code AI coding agent.
 * It uses .clinerules/ directory with plain markdown files
 * (no frontmatter, no file extensions).
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { generateAgentsMd, readCanonicalAgents } from './agents-md.mjs'
import { PLATFORM_DIR, sourceDirValid, summary, syncDir, writeIfChanged } from './shared.mjs'

export function installCline(target, dryRun, clean = false) {
  const stats = summary.cline

  const srcClinerules = join(PLATFORM_DIR, 'cline', '.clinerules')
  const dstClinerules = join(target, '.clinerules')

  // -----------------------------------------------------------------------
  // 1. Install agent files (flat files in .clinerules/ root, no extension)
  // -----------------------------------------------------------------------
  if (!sourceDirValid(srcClinerules)) {
    console.warn(`  ⚠️  Source directory not found: ${srcClinerules}`)
    stats.errors++
  } else {
    if (!dryRun) mkdirSync(dstClinerules, { recursive: true })

    // Read all top-level entries; filter to files only (skip skills/, commands/ subdirs)
    const entries = readdirSync(srcClinerules)
    const agentSrcFiles = entries.filter((entry) => {
      const fullPath = join(srcClinerules, entry)
      return statSync(fullPath).isFile()
    })

    // Build set of expected filenames for clean mode
    const expectedNames = new Set(agentSrcFiles)

    // Copy each agent file with content comparison (same logic as copyFiles)
    for (const entry of agentSrcFiles) {
      const srcFile = join(srcClinerules, entry)
      const dstFile = join(dstClinerules, entry)

      const content = readFileSync(srcFile, 'utf8')
      const existing = existsSync(dstFile) ? readFileSync(dstFile, 'utf8') : null

      if (existing === content) {
        stats.skipped++
      } else {
        if (!dryRun) writeFileSync(dstFile, content, 'utf8')
        stats.created++
      }
    }

    // Clean mode: remove agent files in dst that don't exist in source
    if (clean && existsSync(dstClinerules)) {
      const dstEntries = readdirSync(dstClinerules)
      for (const entry of dstEntries) {
        if (expectedNames.has(entry)) continue // still in source
        const dstFile = join(dstClinerules, entry)
        if (!statSync(dstFile).isFile()) continue // skip subdirs
        // Safety: only remove files matching Cline agent naming convention
        // (lowercase with hyphens, no extension)
        if (!/^[a-z][a-z-]*$/.test(entry)) continue
        if (!dryRun) rmSync(dstFile, { force: true })
        stats.created++
      }
    }
  }

  // -----------------------------------------------------------------------
  // 2. Install skills
  // -----------------------------------------------------------------------
  const srcSkills = join(srcClinerules, 'skills')
  if (existsSync(srcSkills) && statSync(srcSkills).isDirectory()) {
    const dstSkills = join(dstClinerules, 'skills')
    const { created, skipped } = syncDir(srcSkills, dstSkills, dryRun, clean)
    stats.created += created
    stats.skipped += skipped
  }

  // -----------------------------------------------------------------------
  // 3. Install commands
  // -----------------------------------------------------------------------
  const srcCommands = join(srcClinerules, 'commands')
  if (existsSync(srcCommands) && statSync(srcCommands).isDirectory()) {
    const dstCommands = join(dstClinerules, 'commands')
    const { created, skipped } = syncDir(srcCommands, dstCommands, dryRun, clean)
    stats.created += created
    stats.skipped += skipped
  }

  // -----------------------------------------------------------------------
  // 4. Create/update AGENTS.md
  // -----------------------------------------------------------------------
  const agents = readCanonicalAgents()
  const agentsMdPath = join(target, 'AGENTS.md')
  const extraSections = `## Cline Setup

- Agent rules are in \`.clinerules/\` (no extension, plain markdown)
- Skills are in \`.clinerules/skills/\`
- Commands are in \`.clinerules/commands/\`
- Invoke agents with @agent-name in Cline chat`
  const agentsMdContent = generateAgentsMd(agents, 'Cline', extraSections)
  const agentsStatus = writeIfChanged(agentsMdPath, agentsMdContent, dryRun)
  if (agentsStatus === 'created') stats.created++
  else stats.skipped++
}
