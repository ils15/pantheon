#!/usr/bin/env node
/**
 * continue.mjs — Continue.dev platform installer
 */

import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { copyFiles, PLATFORM_DIR, sourceDirValid, summary, writeIfChanged } from './shared.mjs'

export function installContinue(target, dryRun, clean = false) {
  const stats = summary.continue

  // -----------------------------------------------------------------------
  // 1. Install rule files
  // -----------------------------------------------------------------------
  const srcDir = join(PLATFORM_DIR, 'continue', 'rules')
  if (!sourceDirValid(srcDir)) {
    console.warn(`  ⚠️  Rules source directory not found: ${srcDir}`)
    stats.errors++
  } else {
    const dstDir = join(target, '.continue', 'rules')
    if (!dryRun) mkdirSync(dstDir, { recursive: true })

    const { created, skipped } = copyFiles(srcDir, dstDir, dryRun, null, clean)
    stats.created += created
    stats.skipped += skipped
  }

  // -----------------------------------------------------------------------
  // 2. Install config.yaml (only if it doesn't exist)
  // -----------------------------------------------------------------------
  const configSrc = join(PLATFORM_DIR, 'continue', 'config.yaml')
  const configDst = join(target, '.continue', 'config.yaml')
  if (existsSync(configSrc)) {
    const content = readFileSync(configSrc, 'utf8')
    const status = writeIfChanged(configDst, content, dryRun)
    if (status === 'created') stats.created++
    else stats.skipped++
  }
}
