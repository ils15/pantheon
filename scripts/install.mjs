#!/usr/bin/env node
/**
 * install.mjs — Pantheon v5.0 OpenCode installer
 * Simple delegator that installs agents + config to ~/.config/opencode/
 */
import { join } from "node:path";
import { existsSync } from "node:fs";
import { installOpenCode } from "./install/opencode.mjs";

const ROOT = new URL("..", import.meta.url).pathname;

function main() {
  const args = process.argv.slice(2);
  const positional = args.filter(a => !a.startsWith("--"));
  const target = positional[0] || join(process.env.HOME || "~", ".config", "opencode");
  const dryRun = args.includes("--dry-run");
  const clean = args.includes("--clean");

  console.log(`Pantheon v5.0 — OpenCode installer`);
  console.log(`Target: ${target}${dryRun ? " (DRY RUN)" : ""}`);

  installOpenCode(target, dryRun, clean);
  console.log("\n✅ Done. Run 'npx pantheon init' to verify.");
}

main();
