#!/usr/bin/env node
/**
 * manifest.mjs — /pantheon-manifest command
 *
 * One-command pipeline: sync canonical agents → install to target → verify integrity
 *
 * Steps:
 *   1. SYNC:  Generate platform-specific agent files from canonical sources
 *   2. INSTALL: Copy generated files + config to target OpenCode directory
 *   3. VERIFY: Agent file count, MCP connectivity, config integrity, agent sources
 *   4. REPORT: Structured pass/fail output with colored status
 *
 * Usage:
 *   node scripts/manifest.mjs                             # default: ~/.config/opencode, opencode platform
 *   node scripts/manifest.mjs --check-only                # verify only, no sync/install
 *   node scripts/manifest.mjs --target ~/.config/opencode
 *   node scripts/manifest.mjs --platforms opencode,claude
 *   node scripts/manifest.mjs --skip-sync                 # sync already done, just install+verify
 *   node scripts/manifest.mjs --skip-install              # sync+verify, no install
 *   node scripts/manifest.mjs --verbose
 *   node scripts/manifest.mjs --help
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = warnings (non-blocking)
 *   2 = errors (blocking failures)
 */

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { execSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const counts = { pass: 0, warn: 0, error: 0, info: 0 };
const results = [];
let exitCode = 0;

// ---------------------------------------------------------------------------
// ANSI color helpers
// ---------------------------------------------------------------------------

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
};

function colored(text, color) {
  return `${color}${text}${C.reset}`;
}

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    target: null,
    platforms: ["opencode"],
    checkOnly: false,
    skipSync: false,
    skipInstall: false,
    verbose: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--target":
        args.target = argv[++i];
        break;
      case "--platforms":
        args.platforms = argv[++i]
          .split(",")
          .map((s) => s.trim().toLowerCase());
        break;
      case "--check-only":
        args.checkOnly = true;
        break;
      case "--skip-sync":
        args.skipSync = true;
        break;
      case "--skip-install":
        args.skipInstall = true;
        break;
      case "--verbose":
        args.verbose = true;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        console.warn(`⚠️  Unknown option: ${argv[i]}`);
        break;
    }
  }

  // Resolve target
  if (!args.target) {
    const xdgConfig = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
    args.target = join(xdgConfig, "opencode");
  }
  if (!args.target.startsWith("/")) {
    args.target = resolve(args.target);
  }

  // --check-only implies --skip-sync --skip-install
  if (args.checkOnly) {
    args.skipSync = true;
    args.skipInstall = true;
  }

  return args;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function emit(category, message) {
  counts[category]++;
  results.push({ category, message });
  const icon = {
    pass: colored("\u2713", C.green),
    warn: colored("\u26A0", C.yellow),
    error: colored("\u2717", C.red),
    info: colored("\u2139", C.cyan),
  }[category];
  const label = {
    pass: colored("PASS", C.green),
    warn: colored("WARN", C.yellow),
    error: colored("FAIL", C.red),
    info: colored("INFO", C.cyan),
  }[category];
  if (category === "pass" && !process.argv.includes("--verbose") && !process.argv.includes("-v")) {
    return; // quiet pass unless verbose
  }
  console.log(`  ${icon} ${label}  ${message}`);
}

function pass(msg) {
  emit("pass", msg);
}
function warn(msg) {
  emit("warn", msg);
  if (exitCode < 1) exitCode = 1;
}
function fail(msg) {
  emit("error", msg);
  exitCode = 2;
}
function info(msg) {
  emit("info", msg);
}

function showHelp() {
  console.log(`
${colored("/pantheon-manifest", C.bold)} — Sync, install, and verify Pantheon agents

${colored("USAGE", C.cyan)}
  node scripts/manifest.mjs                              default pipeline
  node scripts/manifest.mjs --check-only                 verify only
  node scripts/manifest.mjs --target PATH                custom target
  node scripts/manifest.mjs --platforms opencode,claude  multi-platform
  node scripts/manifest.mjs --skip-sync                  skip sync step
  node scripts/manifest.mjs --skip-install               skip install step
  node scripts/manifest.mjs --verbose                    show all output
  node scripts/manifest.mjs --help                       this help

${colored("PIPELINE", C.cyan)}
  1. SYNC    — Generate platform agent files via sync-platforms.mjs
  2. INSTALL — Deploy agents, config, skills to target directory
  3. VERIFY  — Check agent count, MCP servers, config integrity
  4. REPORT  — Structured pass/fail summary

${colored("DEFAULTS", C.cyan)}
  --target    ~/.config/opencode
  --platforms opencode

${colored("EXIT CODES", C.cyan)}
  0 = all checks pass
  1 = warnings (non-blocking)
  2 = errors   (blocking failures)
`);
}

// ---------------------------------------------------------------------------
// Step helpers
// ---------------------------------------------------------------------------

function section(title) {
  console.log(`\n${colored("=".repeat(60), C.dim)}`);
  console.log(`  ${colored(title, C.bold)}`);
  console.log(`${colored("=".repeat(60), C.dim)}`);
}

function step(label, fn) {
  console.log(`\n${colored(">>>", C.cyan)} ${colored(label, C.bold)}`);
  return fn();
}

// ---------------------------------------------------------------------------
// Step 1: Sync
// ---------------------------------------------------------------------------

function syncPlatforms(targetPlatforms) {
  const syncScript = join(ROOT, "scripts", "sync-platforms.mjs");
  if (!existsSync(syncScript)) {
    fail(`sync-platforms.mjs not found at ${syncScript}`);
    return false;
  }

  let allOk = true;
  for (const platform of targetPlatforms) {
    const label = platform.charAt(0).toUpperCase() + platform.slice(1);
    console.log(`  ${colored("Syncing", C.cyan)} ${colored(label, C.bold)}...`);
    try {
      const result = spawnSync(
        process.execPath,
        [syncScript, platform],
        {
          cwd: ROOT,
          stdio: "inherit",
          timeout: 60_000,
        },
      );
      if (result.status === 0) {
        pass(`${label} sync completed`);
      } else {
        fail(`${label} sync failed (exit ${result.status})`);
        allOk = false;
      }
    } catch (err) {
      fail(`Sync error: ${err.message}`);
      allOk = false;
    }
  }
  return allOk;
}

// ---------------------------------------------------------------------------
// Step 2: Install
// ---------------------------------------------------------------------------

function installManifest(target, targetPlatforms) {
  const installScript = join(ROOT, "scripts", "install.mjs");
  if (!existsSync(installScript)) {
    fail(`install.mjs not found at ${installScript}`);
    return false;
  }

  const platformArg = targetPlatforms.join(",");
  console.log(
    `  ${colored("Installing to", C.cyan)} ${colored(target, C.bold)} ${colored(`(platforms: ${platformArg})`, C.dim)}...`,
  );

  try {
    const result = spawnSync(
      process.execPath,
      [installScript, "--target", target, "--platforms", platformArg],
      {
        cwd: ROOT,
        stdio: "inherit",
        timeout: 120_000,
      },
    );
    if (result.status === 0) {
      pass(`Install completed`);
      return true;
    } else {
      fail(`Install failed (exit ${result.status})`);
      // Print stderr if available
      if (result.stderr && result.stderr.length > 0) {
        const lines = result.stderr.toString().split("\n").filter(Boolean);
        for (const line of lines.slice(-5)) {
          console.error(`  ${colored(line, C.red)}`);
        }
      }
      return false;
    }
  } catch (err) {
    fail(`Install error: ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Step 3: Verify
// ---------------------------------------------------------------------------

/**
 * Get canonical agent names from pantheon agents/ directory.
 */
function getCanonicalAgentNames() {
  const agentsDir = join(ROOT, "agents");
  if (!existsSync(agentsDir)) return [];
  return readdirSync(agentsDir)
    .filter((f) => f.endsWith(".agent.md"))
    .map((f) => f.replace(/\.agent\.md$/, ""))
    .sort();
}

/**
 * Get installed agent file names from target platform agents directory.
 */
function getInstalledAgentNames(target, platform) {
  // Global install: agents/ directory at target root
  // Project install: .opencode/agents/ at target root
  const candidates = [
    join(target, "agents"),
    join(target, ".opencode", "agents"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) {
      return readdirSync(dir)
        .filter((f) => f.endsWith(".md") && statSync(join(dir, f)).isFile())
        .map((f) => f.replace(/\.md$/, ""))
        .sort();
    }
  }
  return [];
}

/**
 * Count agents with mcp_tools in frontmatter.
 */
function countAgentsWithMcpTools(target) {
  const candidates = [join(target, "agents"), join(target, ".opencode", "agents")];
  let count = 0;
  for (const dir of candidates) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const f of files) {
      const content = readFileSync(join(dir, f), "utf8");
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch && fmMatch[1].includes("mcp_tools")) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Check MCP server connectivity via `opencode mcp list`.
 */
function checkMCPConnectivity() {
  try {
    const result = execSync("opencode mcp list", {
      encoding: "utf8",
      timeout: 15_000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const output = result.trim();

    // Count server lines: lines starting with "●" containing ✓ or ✗
    const serverLines = output.split("\n").filter((l) => l.includes("\u25CF"));
    const connectedLines = serverLines.filter((l) => l.includes("\u2713"));
    const failedLines = serverLines.filter((l) => l.includes("\u2717"));
    const totalServers = serverLines.length;
    const connectedCount = connectedLines.length;
    const failedCount = failedLines.length;

    if (failedCount === 0 && connectedCount > 0) {
      pass(`${connectedCount} MCP server(s) connected`);
      if (process.argv.includes("--verbose")) {
        console.log(`\n${output}\n`);
      }
    } else if (connectedCount > 0 && failedCount > 0) {
      warn(`${connectedCount} connected, ${failedCount} failed MCP server(s)`);
      if (process.argv.includes("--verbose")) {
        console.log(`\n${output}\n`);
      }
    } else if (totalServers === 0) {
      info("No MCP servers found in `opencode mcp list`");
    } else {
      warn(`0 of ${totalServers} MCP server(s) connected`);
      if (process.argv.includes("--verbose")) {
        console.log(`\n${output}\n`);
      }
    }
    return { connected: connectedCount, failed: failedCount, total: totalServers };
  } catch (err) {
    // opencode not installed or mcp list not available
    warn(`Could not check MCP connectivity: ${err.message}`);
    return { connected: 0, failed: 0, total: 0 };
  }
}

/**
 * Check target opencode.json config integrity.
 */
function checkConfigIntegrity(target) {
  const configPath = join(target, "opencode.json");
  if (!existsSync(configPath)) {
    fail(`opencode.json not found at ${configPath}`);
    return false;
  }

  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    let allOk = true;

    // Check default agent
    if (config.default_agent) {
      pass(`default_agent: ${config.default_agent}`);
    } else {
      warn("No default_agent set in opencode.json");
    }

    // Check MCP config
    if (config.mcp && typeof config.mcp === "object") {
      const mcpCount = Object.keys(config.mcp).length;
      const pantheonMcps = Object.keys(config.mcp).filter((k) =>
        k.startsWith("pantheon-"),
      );
      pass(`${mcpCount} MCP server(s) configured, ${pantheonMcps.length} pantheon-*`);
    } else {
      warn("No MCP section in opencode.json — run install");
    }

    // Check permission
    if (config.permission && config.permission.mcp) {
      const mcpPermCount = Object.keys(config.permission.mcp).length;
      pass(`${mcpPermCount} MCP permission(s) configured`);
    } else {
      warn("No permission.mcp section in opencode.json");
    }

    // Check instructions
    if (Array.isArray(config.instructions) && config.instructions.length > 0) {
      pass(`${config.instructions.length} instruction path(s) configured`);
    } else {
      warn("No instructions paths in opencode.json");
    }

    return allOk;
  } catch (err) {
    fail(`opencode.json parse error: ${err.message}`);
    return false;
  }
}

/**
 * Verify agent count consistency and mcp_tools coverage.
 */
function verifyAgentFiles(target) {
  const canonical = getCanonicalAgentNames();
  const installed = getInstalledAgentNames(target, "opencode");

  if (canonical.length === 0) {
    fail("No canonical agent files found in agents/");
    return false;
  }

  if (installed.length === 0) {
    fail(`No installed agent files found in ${target}/agents/`);
    return false;
  }

  // Count match
  if (installed.length === canonical.length) {
    pass(`${installed.length} of ${canonical.length} agent files installed`);
  } else {
    warn(`${installed.length} installed vs ${canonical.length} canonical agent files`);
  }

  // Check for missing agents
  const missing = canonical.filter((a) => !installed.includes(a));
  if (missing.length > 0) {
    fail(`${missing.length} agent(s) missing from install: ${missing.join(", ")}`);
  }

  // Check for phantom agents (in install but not canonical)
  const phantom = installed.filter((a) => !canonical.includes(a));
  if (phantom.length > 0) {
    warn(`${phantom.length} stale/phantom agent(s) in install: ${phantom.join(", ")}`);
  }

  // Verify each installed file has valid frontmatter
  let invalidCount = 0;
  const candidateDirs = [join(target, "agents"), join(target, ".opencode", "agents")];
  for (const dir of candidateDirs) {
    if (!existsSync(dir)) continue;
    for (const name of installed) {
      const filePath = join(dir, `${name}.md`);
      if (!existsSync(filePath)) continue;
      const content = readFileSync(filePath, "utf8");
      if (!content.startsWith("---")) {
        warn(`${name}.md: missing frontmatter`);
        invalidCount++;
      }
    }
  }
  if (invalidCount === 0 && installed.length > 0) {
    pass("All installed agents have valid frontmatter");
  }

  // mcp_tools coverage
  const mcpCount = countAgentsWithMcpTools(target);
  if (mcpCount > 0) {
    info(`${mcpCount} of ${installed.length} agent files have mcp_tools configured`);
  }

  return missing.length === 0;
}

// ---------------------------------------------------------------------------
// Step 4: Report
// ---------------------------------------------------------------------------

function printSummary() {
  console.log(`\n${colored("=".repeat(60), C.dim)}`);
  console.log(`  ${colored("MANIFEST SUMMARY", C.bold)}`);
  console.log(`${colored("=".repeat(60), C.dim)}`);
  console.log(`  ${colored("\u2713", C.green)} ${counts.pass} passed`);
  console.log(`  ${colored("\u26A0", C.yellow)} ${counts.warn} warnings`);
  console.log(`  ${colored("\u2717", C.red)} ${counts.error} errors`);
  console.log(`  ${colored("\u2139", C.cyan)} ${counts.info} info`);
  console.log("");

  if (exitCode === 0) {
    console.log(`  ${colored("\u2713", C.green)} ${colored("MANIFEST COMPLETE", C.bold)} — all checks passed`);
  } else if (exitCode === 1) {
    console.log(`  ${colored("\u26A0", C.yellow)} ${colored("MANIFEST COMPLETE WITH WARNINGS", C.bold)} — review above`);
  } else {
    console.log(`  ${colored("\u2717", C.red)} ${colored("MANIFEST FAILED", C.bold)} — errors must be resolved`);
  }
  console.log("");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Validate target directory exists
  if (!existsSync(args.target)) {
    console.error(`${colored("ERROR", C.red)}: Target directory does not exist: ${args.target}`);
    console.error(`  Run: mkdir -p ${args.target}`);
    process.exit(2);
  }

  // Validate we're in the Pantheon root
  if (!existsSync(join(ROOT, "AGENTS.md")) || !existsSync(join(ROOT, "agents"))) {
    console.error(
      `${colored("ERROR", C.red)}: Not in Pantheon repository root — AGENTS.md or agents/ not found`,
    );
    console.error(`  Expected root at: ${ROOT}`);
    process.exit(2);
  }

  const mode = args.checkOnly
    ? colored("CHECK-ONLY MODE", C.yellow)
    : colored("FULL PIPELINE", C.green);
  console.log(`\n${colored("Pantheon Manifest", C.bold)} ${colored("v3", C.dim)} — ${mode}`);
  console.log(`  ${colored("Target:", C.dim)} ${args.target}`);
  console.log(`  ${colored("Platforms:", C.dim)} ${args.platforms.join(", ")}`);

  // ── Step 1: Sync ──
  if (!args.skipSync) {
    section("STEP 1: SYNC");
    syncPlatforms(args.platforms);
  } else if (!args.checkOnly) {
    info("Sync step skipped (--skip-sync)");
  }

  // ── Step 2: Install ──
  if (!args.skipInstall) {
    section("STEP 2: INSTALL");
    installManifest(args.target, args.platforms);
  } else if (!args.checkOnly) {
    info("Install step skipped (--skip-install)");
  }

  // ── Step 3: Verify ──
  section("STEP 3: VERIFY");
  verifyAgentFiles(args.target);
  checkMCPConnectivity();
  checkConfigIntegrity(args.target);

  // ── Step 4: Report ──
  section("STEP 4: REPORT");
  printSummary();

  // ── Final status line ──
  if (exitCode === 0) {
    console.log(`  ${colored("\u2728", C.green)} Pantheon manifest is ${colored("UP TO DATE", C.bold + C.green)}`);
  } else if (exitCode === 1) {
    console.log(`  ${colored("\u26A0", C.yellow)} Pantheon manifest has warnings (review above)`);
  } else {
    console.log(`  ${colored("\u26D4", C.red)} Pantheon manifest has errors — run with --verbose for details`);
  }

  process.exit(exitCode);
}

main();
