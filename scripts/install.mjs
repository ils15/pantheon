#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { installOpenCode } from "./install/opencode.mjs";
import { detectPlatforms, printSummary, parseArgs, showHelp, ROOT, createBackup } from "./install/shared.mjs";

function main() {
  const args = parseArgs(process.argv);
  if (args.help) { showHelp(); process.exit(0); }
  const detected = detectPlatforms();
  let installed = [];
  for (const [name, info] of Object.entries(detected)) {
    if (name === "opencode" && info.found) {
      console.log();
      installOpenCode(ROOT, info);
      installed.push(name);
    }
  }
  printSummary(installed, []);
  console.log("Pantheon 5.0 (OMO-slim) installed for opencode.");
}
main();
