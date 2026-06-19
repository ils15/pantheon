#!/usr/bin/env node
/**
 * doctor.mjs — Pantheon health check CLI tool
 *
 * Validates that a Pantheon installation is working correctly:
 *   - Agent file presence across canonical → platform
 *   - MCP configuration (gh_grep, Context7, etc.)
 *   - Permission/frontmatter mismatches
 *   - Sync freshness
 *   - Git status
 *
 * Usage:
 *   node scripts/doctor.mjs                          # auto-detect, cwd
 *   node scripts/doctor.mjs --target /path/to/project
 *   node scripts/doctor.mjs --platform opencode
 *   node scripts/doctor.mjs --fix                    # attempt auto-fixes
 *   node scripts/doctor.mjs --verbose
 *   node scripts/doctor.mjs --help
 *
 * Exit codes:
 *   0 = all green
 *   1 = warnings only
 *   2 = errors (needs attention)
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const AGENTS_DIR = join(ROOT, "agents");
const PLATFORM_DIR = join(ROOT, "platform");

// All known platforms (must match platform/ subdirectories with adapter.json)
const ALL_PLATFORMS = [
  "opencode",
  "claude",
  "cursor",
  "windsurf",
  "copilot",
  "continue",
  "cline",
];

const PLATFORM_LABELS = {
  opencode: "OpenCode",
  claude: "Claude Code",
  cursor: "Cursor",
  windsurf: "Windsurf",
  copilot: "VS Code / Copilot",
  continue: "Continue.dev",
  cline: "Cline",
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** @type {{ pass: number; warn: number; error: number; info: number }} */
const counts = { pass: 0, warn: 0, error: 0, info: 0 };

const results = [];
let exitCode = 0;

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    target: null,
    platform: null,
    fix: false,
    verbose: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--target":
        args.target = argv[++i];
        break;
      case "--platform":
        args.platform = argv[++i];
        break;
      case "--fix":
        args.fix = true;
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

  if (!args.target) {
    args.target = process.cwd();
  }

  // Resolve to absolute
  if (!args.target.startsWith("/")) {
    args.target = join(process.cwd(), args.target);
  }

  return args;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

const ICON = {
  pass: "\u2705", // ✅
  warn: "\u26A0\uFE0F", // ⚠️
  error: "\u274C", // ❌
  info: "\u2139\uFE0F", // ℹ️
};

function emit(category, message) {
  counts[category]++;
  results.push({ category, message });
  if (category === "pass" && !process.argv.includes("--verbose")) return;
  const prefix = ICON[category] ?? category;
  console.log(`  ${prefix} ${message}`);
}

function pass(msg) {
  emit("pass", msg);
}
function warn(msg) {
  emit("warn", msg);
  if (exitCode < 1) exitCode = 1;
}
function error(msg) {
  emit("error", msg);
  exitCode = 2;
}
function info(msg) {
  emit("info", msg);
}

function section(title) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

function showHelp() {
  console.log(`
 Pantheon Doctor — Health Check CLI

 Usage:
   node scripts/doctor.mjs                              auto-detect, cwd
   node scripts/doctor.mjs --target /path/to/project     target project
   node scripts/doctor.mjs --platform opencode           specific platform
   node scripts/doctor.mjs --fix                         attempt auto-fixes
   node scripts/doctor.mjs --verbose                     detailed output
   node scripts/doctor.mjs --help                        show this help

 Checks:
   A. Agent Files          — canonical vs platform sync
   B. MCP Configuration    — opencode.json MCP settings
   C. Permission Checks    — frontmatter validation
   D. Sync Status          — npm run sync freshness
   E. Git Status           — uncommitted changes

 Exit codes:
   0  — all checks pass
   1  — warnings
   2  — errors

 Report bugs: https://github.com/ils15/pantheon/issues
`);
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Collect canonical agent names from agents/*.agent.md
 * @returns {string[]} sorted list of agent names (without extension)
 */
function getCanonicalAgentNames() {
  if (!existsSync(AGENTS_DIR)) return [];
  return readdirSync(AGENTS_DIR)
    .filter((f) => f.endsWith(".agent.md"))
    .map((f) => f.replace(/\.agent\.md$/, ""))
    .sort();
}

/**
 * Read JSON from a file, returning null on failure.
 * @param {string} filePath
 * @returns {object|null}
 */
function readJson(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    const raw = readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Spawn a process and return { status, stdout, stderr }.
 */
function spawn(prog, args, cwd = null) {
  const result = spawnSync(prog, args, {
    cwd: cwd ?? ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

// ---------------------------------------------------------------------------
// Check A: Agent Files
// ---------------------------------------------------------------------------

function checkAgentFiles(args) {
  section("A. Agent Files");

  const canonical = getCanonicalAgentNames();
  if (canonical.length === 0) {
    error("No canonical agent files found in agents/");
    return;
  }
  pass(`${canonical.length} canonical agents found in agents/`);

  // Determine which platforms to check
  const platformDirs = readdirSync(PLATFORM_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        d.name !== "_template" &&
        d.name !== "plans",
    )
    .map((d) => d.name)
    .filter((name) => !args.platform || name === args.platform);

  if (platformDirs.length === 0) {
    warn(`No platform directories found in platform/`);
    return;
  }

  for (const platform of platformDirs) {
    const adapterPath = join(PLATFORM_DIR, platform, "adapter.json");
    if (!existsSync(adapterPath)) {
      info(`${platform}: no adapter.json — skipping`);
      continue;
    }

    const adapter = readJson(adapterPath);
    if (!adapter) {
      warn(`${platform}: adapter.json parse error — skipping`);
      continue;
    }

    const label = PLATFORM_LABELS[platform] ?? platform;
    const outputDir = adapter.outputDir ?? "agents";
    const ext = adapter.fileExtension ?? ".md";
    const agentDir = join(PLATFORM_DIR, platform, outputDir);

    if (!existsSync(agentDir)) {
      if (adapter.skipAgentSync) {
        info(`${label}: agent sync skipped (skipAgentSync) — n/a`);
        continue;
      }
      warn(`${label}: output directory missing: ${agentDir}`);
      continue;
    }

    if (adapter.skipAgentSync) {
      info(`${label}: agent sync skipped (skipAgentSync) — skipping agent check`);
      continue;
    }

    const platformFiles = readdirSync(agentDir)
      .filter((f) => statSync(join(agentDir, f)).isFile() && f.endsWith(ext))
      .map((f) => f.replace(new RegExp(`${ext}$`), ""));

    // Check every canonical agent exists in platform output
    let allPresent = true;
    const missing = [];
    for (const agent of canonical) {
      if (!platformFiles.includes(agent)) {
        missing.push(agent);
        allPresent = false;
      }
    }

    // Detect phantom agents (in platform but not canonical — stale)
    const phantom = platformFiles.filter((f) => !canonical.includes(f));

    if (allPresent && phantom.length === 0) {
      pass(`${label}: all ${canonical.length} agents present`);
    } else {
      if (missing.length > 0) {
        error(`${label}: ${missing.length} canonical agent(s) missing: ${missing.join(", ")}`);
      }
      if (phantom.length > 0) {
        warn(`${label}: ${phantom.length} stale agent(s) in output: ${phantom.join(", ")}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check B: MCP Configuration
// ---------------------------------------------------------------------------

function checkMcpConfig(args) {
  section("B. MCP Configuration");

  // Determine which opencode.json to check:
  // 1. Target project's opencode.json
  // 2. Pantheon ROOT opencode.json
  const candidates = [
    { label: "project root", path: join(args.target, "opencode.json") },
    { label: "repository root", path: join(ROOT, "opencode.json") },
  ];

  // Also check user config if target matches Pantheon ROOT
  if (args.target === ROOT) {
    candidates.push({
      label: "user config",
      path: join(ROOT, ".opencode", "opencode.json"),
    });
  } else {
    const homeConfig = join(process.env.HOME ?? "~", ".config", "opencode", "opencode.json");
    candidates.push({ label: "user config", path: homeConfig });
  }

  /** @type {{label:string, data:object}[]} */
  const configs = [];
  for (const c of candidates) {
    const data = readJson(c.path);
    if (data) {
      configs.push({ label: c.label, data, path: c.path });
    }
  }

  if (configs.length === 0) {
    warn("No opencode.json found in target or user config");
    return;
  }

  for (const cfg of configs) {
    info(`Checking ${cfg.label} opencode.json`);

    const mcp = cfg.data.mcp;
    if (!mcp || typeof mcp !== "object") {
      warn(`${cfg.label}: no "mcp" section`);
      continue;
    }

    // 1. gh_grep MCP check
    const ghGrep = mcp.gh_grep;
    if (ghGrep) {
      if (ghGrep.type === "remote" && ghGrep.url === "https://mcp.grep.app") {
        pass(`${cfg.label}: gh_grep MCP configured correctly`);
      } else {
        const gotUrl = ghGrep.url ?? "<missing>";
        const detail =
          ghGrep.type !== "remote"
            ? `type is "${ghGrep.type}" instead of "remote"`
            : `url is "${gotUrl}"`;
        warn(`${cfg.label}: gh_grep MCP may need review — ${detail}`);
      }
    } else {
      warn(`${cfg.label}: gh_grep MCP not configured`);
    }

    // 2. Context7 MCP check
    const context7 = mcp.context7;
    if (context7) {
      const isLocal = context7.type === "local";
      const hasCommand =
        Array.isArray(context7.command) &&
        context7.command.length > 0 &&
        context7.command.some((s) => s.includes("context7-mcp") || s.includes("context7"));
      const enabled = context7.enabled !== false;

      if (isLocal && hasCommand && enabled) {
        pass(`${cfg.label}: Context7 MCP configured correctly`);
      } else {
        const details = [];
        if (!isLocal) details.push(`type should be "local"`);
        if (!hasCommand) details.push("command missing or doesn't mention context7-mcp");
        if (!enabled) details.push("not enabled");
        warn(`${cfg.label}: Context7 MCP issues — ${details.join(", ")}`);
      }
    } else {
      warn(`${cfg.label}: Context7 MCP not configured`);
    }

    // 3. Check for deprecated "tools" field format
    // In opencode.json, tools was deprecated in favor of "permission" field
    if (cfg.data.tools && !cfg.data.permission) {
      warn(`${cfg.label}: uses deprecated top-level "tools" field — migrate to "permission"`);
    } else if (cfg.data.tools && cfg.data.permission) {
      info(`${cfg.label}: has both "tools" and "permission" — verify "tools" is intentional`);
    }

    // 4. Check MCP servers list — verify tool references
    // Look at agent files for mcpServers and cross-reference with opencode.json MCP config
    if (args.verbose) {
      checkAgentMcpReferences(cfg);
    }
  }
}

/**
 * Cross-reference agent mcpServers references with opencode.json MCP config entries.
 */
function checkAgentMcpReferences(cfg) {
  const agentFiles = readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".agent.md"));
  const mcpNames = new Set(Object.keys(cfg.data.mcp ?? {}));
  const referencedNames = new Set();

  for (const file of agentFiles) {
    const content = readFileSync(join(AGENTS_DIR, file), "utf8");
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;

    try {
      // Minimal YAML parse for mcpServers field
      const fmRaw = match[1];
      const mcpMatch = fmRaw.match(/mcpServers:\s*\n([\s\S]*?)(?=\n\w|\n---|$)/);
      if (!mcpMatch) continue;

      const listRaw = mcpMatch[1];
      const nameMatches = listRaw.matchAll(/^\s+-\s+name:\s*['"]?([\w-]+)['"]?\s*$/gm);
      for (const nm of nameMatches) {
        referencedNames.add(nm[1]);
      }
    } catch {
      // skip unparseable
    }
  }

  for (const ref of referencedNames) {
    if (!mcpNames.has(ref)) {
      warn(`${cfg.label}: agent references MCP "${ref}" but it's not in opencode.json mcp config`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check C: Permission Mismatches
// ---------------------------------------------------------------------------

function checkPermissionMismatches(args) {
  section("C. Permission Mismatches");

  // Locate the validation script
  const validator = join(ROOT, "scripts", "validate-agent-frontmatter.py");
  if (!existsSync(validator)) {
    warn("validate-agent-frontmatter.py not found — cannot check permissions");
    return;
  }

  // Determine which agent directories to check
  // Validation script checks ~/.config/opencode/agents and platform/opencode/agents
  // Let's run it regardless
  info("Running validate-agent-frontmatter.py...");

  const result = spawn("python3", [validator]);

  if (result.status === 0) {
    pass("Frontmatter validation passed");
    if (result.stdout && args.verbose) {
      console.log(`    ${result.stdout}`);
    }
  } else {
    // Parse output for errors and warnings
    const lines = (result.stderr || "").split("\n").filter(Boolean);
    const errLines = lines.filter((l) => l.startsWith("\u274C")); // ❌
    const warnLines = lines.filter((l) => l.includes("\u26A0")); // ⚠️

    if (errLines.length > 0) {
      error(`${errLines.length} frontmatter error(s) found`);
      if (args.verbose) {
        for (const line of errLines) {
          console.log(`    ${line}`);
        }
      }
    }

    if (warnLines.length > 0) {
      warn(`${warnLines.length} frontmatter warning(s) found`);
      if (args.verbose) {
        for (const line of warnLines) {
          console.log(`    ${line}`);
        }
      }
    }

    // If there were only warnings but no errors, the script exits 0
    // If it exited non-zero, there are real errors
    if (errLines.length === 0 && result.status !== 0) {
      error("Frontmatter validation script failed");
      if (result.stderr && args.verbose) {
        console.log(`    ${result.stderr}`);
      }
    }
  }

  // Also do a quick inline check for agents with bash: deny missing the ⛔ section
  info("Checking permission.body consistency...");
  const canonical = getCanonicalAgentNames();
  let bodyIssues = 0;

  for (const agent of canonical) {
    const filePath = join(AGENTS_DIR, `${agent}.agent.md`);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, "utf8");

    // Quick frontmatter parse
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!fmMatch) continue;

    const rawFm = fmMatch[1];
    const body = fmMatch[2];

    // Check bash: deny → must have ⛔ TOOLS NOT AVAILABLE
    const bashDeny = /permission:[\s\S]*?bash:\s*deny/.test(rawFm);
    if (bashDeny && !body.includes("\u26D4 TOOLS NOT AVAILABLE".normalize())) {
      warn(`${agent}: permission.bash is deny but body missing "⛔ TOOLS NOT AVAILABLE"`);
      bodyIssues++;
    }

    // Check edit: deny → should not reference "edit" in body
    const editDeny = /permission:[\s\S]*?edit:\s*deny/.test(rawFm);
    if (editDeny) {
      const editCount = (body.match(/\bedit\b/gi) || []).length;
      if (editCount > 0) {
        warn(`${agent}: permission.edit is deny but "edit" appears ${editCount} time(s) in body`);
        bodyIssues++;
      }
    }
  }

  if (bodyIssues === 0) {
    pass("All permission.body consistency checks passed");
  }
}

// ---------------------------------------------------------------------------
// Check D: Sync Status
// ---------------------------------------------------------------------------

function checkSyncStatus(args) {
  section("D. Sync Status");

  const syncScript = join(ROOT, "scripts", "sync-platforms.mjs");
  if (!existsSync(syncScript)) {
    warn("sync-platforms.mjs not found");
    return;
  }

  // Use the validate-sync approach: dry-run with clean
  const result = spawn(process.execPath, [syncScript, "--dry-run", "--clean"]);
  // sync-platforms exits 1 when there are changes in dry-run mode

  if (result.status === 0) {
    pass("All platforms are in sync with canonical agents");
  } else if (result.status === 1) {
    // Parse output to determine what would change
    const lines = (result.stdout || "").split("\n").filter(Boolean);
    const updateLines = lines.filter(
      (l) => l.includes("would update") || l.includes("~"),
    );
    const staleLines = lines.filter((l) => l.includes("stale"));

    const updateCount = updateLines.length;
    const staleCount = staleLines.length;

    warn(
      `Platforms are out of sync (${updateCount} file(s) would change${staleCount > 0 ? `, ${staleCount} stale` : ""})`,
    );
    if (args.verbose || updateCount + staleCount < 20) {
      for (const line of updateLines) {
        console.log(`    ${line}`);
      }
      for (const line of staleLines) {
        console.log(`    ${line}`);
      }
    }

    if (args.fix) {
      info("Attempting --fix: running npm run sync...");
      const syncResult = spawn("npm", ["run", "sync"]);
      if (syncResult.status === 0) {
        pass("Sync completed successfully");
      } else {
        error(`Sync failed (exit ${syncResult.status})`);
        if (syncResult.stderr) {
          console.log(`    ${syncResult.stderr}`);
        }
      }
    } else {
      info('Use --fix to run "npm run sync" automatically');
    }
  } else {
    error(`Sync dry-run failed (exit ${result.status})`);
    if (result.stderr) {
      console.log(`    ${result.stderr}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check E: Git Status
// ---------------------------------------------------------------------------

function checkGitStatus(args) {
  section("E. Git Status");

  // Check if the target is a git repo
  const gitRoot = spawn("git", ["rev-parse", "--show-toplevel"]);
  if (gitRoot.status !== 0) {
    info("Not a git repository — skipping");
    return;
  }

  // Check for uncommitted changes in agents/ and platform/
  const gitStatus = spawn("git", [
    "status",
    "--porcelain",
    "--",
    "agents/",
    "platform/",
  ]);

  if (gitStatus.status !== 0) {
    warn("Could not check git status");
    return;
  }

  const lines = gitStatus.stdout
    ? gitStatus.stdout.split("\n").filter(Boolean)
    : [];

  if (lines.length === 0) {
    pass("No uncommitted changes in agents/ or platform/");
    return;
  }

  // Categorize by type
  const modified = [];
  const added = [];
  const deleted = [];
  const untracked = [];

  for (const line of lines) {
    const statusCode = line.substring(0, 2).trim();
    const filePath = line.substring(3);
    if (statusCode === "M" || statusCode === "MM") modified.push(filePath);
    else if (statusCode === "A") added.push(filePath);
    else if (statusCode === "D") deleted.push(filePath);
    else if (statusCode === "?" || statusCode === "??") untracked.push(filePath);
    else modified.push(filePath);
  }

  const total = lines.length;
  const details = [];
  if (modified.length > 0) details.push(`${modified.length} modified`);
  if (added.length > 0) details.push(`${added.length} staged`);
  if (deleted.length > 0) details.push(`${deleted.length} deleted`);
  if (untracked.length > 0) details.push(`${untracked.length} untracked`);

  warn(`${total} uncommitted change(s) in agents/ or platform/ (${details.join(", ")})`);
  if (args.verbose) {
    for (const f of modified.slice(0, 10)) {
      console.log(`    M  ${f}`);
    }
    for (const f of added.slice(0, 5)) {
      console.log(`    A  ${f}`);
    }
    for (const f of deleted.slice(0, 5)) {
      console.log(`    D  ${f}`);
    }
    for (const f of untracked.slice(0, 5)) {
      console.log(`    ?? ${f}`);
    }
    if (lines.length > 20) {
      console.log(`    ... and ${lines.length - 20} more`);
    }
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printSummary(targetPath) {
  console.log(`\n${"=".repeat(60)}`);
  console.log("  Summary");
  console.log(`${"=".repeat(60)}`);
  console.log(`  ${ICON.pass} ${counts.pass} passed`);
  console.log(`  ${ICON.warn} ${counts.warn} warnings`);
  console.log(`  ${ICON.error} ${counts.error} errors`);
  console.log(`  ${ICON.info} ${counts.info} info`);
  console.log("");

  if (exitCode === 0) {
    console.log("  ✅ All checks passed!");
  } else if (exitCode === 1) {
    console.log("  ⚠️  Warnings found — review above (some may be auto-fixable with --fix)");
  } else {
    console.log("  ❌ Errors found — needs attention");
  }

  console.log(`\n  Target: ${process.argv.includes("--target") ? targetPath : "current directory"}`);
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

  if (!existsSync(args.target)) {
    console.error(`❌ Target directory does not exist: ${args.target}`);
    process.exit(2);
  }

  // Verify it looks like a Pantheon project (has agents/ and platform/)
  const agentsOk = existsSync(join(args.target, "agents"));
  const platformOk = existsSync(join(args.target, "platform"));

  if (!agentsOk && !platformOk) {
    // Maybe they pointed at a project root that isn't Pantheon
    // Check if this is a Pantheon install target (has opencode.json with mcp)
    const opencodeJson = readJson(join(args.target, "opencode.json"));
    if (!opencodeJson) {
      warn(
        `Target does not appear to be a Pantheon project (no agents/ or platform/ directory)`,
      );
    }
  }

  const isPantheonRoot = join(args.target, "scripts", "doctor.mjs") ===
    join(ROOT, "scripts", "doctor.mjs") ||
    existsSync(join(args.target, "scripts", "doctor.mjs")) === false;

  // Run checks
  checkAgentFiles(args);
  checkMcpConfig(args);
  checkPermissionMismatches(args);
  checkSyncStatus(args);
  checkGitStatus(args);

  printSummary(args.target);

  process.exit(exitCode);
}

main();
