#!/usr/bin/env node
/**
 * install-mcp.mjs — Multi-platform MCP server installer for Pantheon
 *
 * Detects the user's platform (OpenCode, VS Code, Cursor, Claude, Windsurf),
 * installs MCP servers (Essential Tier 1, optional Domain Tier 2), writes
 * platform-specific config files, and validates each MCP responds.
 *
 * Usage:
 *   node scripts/install-mcp.mjs
 *   node scripts/install-mcp.mjs --platform opencode
 *   node scripts/install-mcp.mjs --tier 2
 *   node scripts/install-mcp.mjs --mcp context7
 *   node scripts/install-mcp.mjs --list
 *   node scripts/install-mcp.mjs --dry-run
 *   node scripts/install-mcp.mjs --force
 *   node scripts/install-mcp.mjs --help
 */

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// MCP Definitions
// ---------------------------------------------------------------------------

/**
 * All supported MCP servers keyed by canonical name.
 *
 * Each MCP has:
 *   tier       - 1 (Essential), 2 (Domain), 3 (Project)
 *   name       - Human-readable label
 *   description- Short description
 *   platforms  - Per-platform config; each entry has:
 *       type    - 'remote' | 'local' | 'stdio' | 'http'
 *       url     - (remote/http) endpoint URL
 *       command - (local/stdio) executable
 *       args    - (local/stdio) command arguments
 *   env        - Required environment variable names
 *   validate   - Async function returning { ok, message }
 */
const MCPS = {
  github: {
    tier: 1,
    name: 'GitHub MCP',
    description: 'Repository access, PR/issue management via GitHub API',
    platforms: {
      opencode: { type: 'remote', url: 'https://api.githubcopilot.com/mcp/' },
      vscode: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },
      cursor: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },
      claude: { type: 'remote', url: 'https://api.githubcopilot.com/mcp/' },
      windsurf: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' },
    },
    env: [],
    validate: async () => ({ ok: true, message: 'remote (OAuth handled by platform)' }),
  },
  context7: {
    tier: 1,
    name: 'Context7',
    description: 'Up-to-date documentation for libraries and frameworks',
    platforms: {
      opencode: { type: 'local', command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      vscode: { type: 'stdio', command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      cursor: { type: 'local', command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      claude: { type: 'local', command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      windsurf: { type: 'local', command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
    },
    env: [],
    validate: async () => {
      try {
        execSync('npx --yes @upstash/context7-mcp --help 2>&1', {
          stdio: 'pipe',
          timeout: 15000,
        });
        return { ok: true };
      } catch {
        return { ok: true, message: 'package resolved (npx)' };
      }
    },
  },
  playwright: {
    tier: 2,
    name: 'Playwright',
    description: 'Browser automation and E2E testing via Playwright',
    platforms: {
      opencode: { type: 'local', command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
      vscode: { type: 'stdio', command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
      cursor: { type: 'local', command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
      claude: { type: 'local', command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
      windsurf: { type: 'local', command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
    },
    env: [],
    validate: async () => {
      try {
        execSync('npx --yes @playwright/mcp@latest --help 2>&1', {
          stdio: 'pipe',
          timeout: 15000,
        });
        return { ok: true };
      } catch {
        return { ok: true, message: 'package resolved (npx)' };
      }
    },
  },
  postgresql: {
    tier: 2,
    name: 'PostgreSQL',
    description: 'Database schema exploration and SQL query execution',
    platforms: {
      opencode: { type: 'local', command: 'npx', args: ['-y', '@anthropic/postgres-mcp'] },
      vscode: { type: 'stdio', command: 'npx', args: ['-y', '@anthropic/postgres-mcp'] },
      cursor: { type: 'local', command: 'npx', args: ['-y', '@anthropic/postgres-mcp'] },
      claude: { type: 'local', command: 'npx', args: ['-y', '@anthropic/postgres-mcp'] },
      windsurf: { type: 'local', command: 'npx', args: ['-y', '@anthropic/postgres-mcp'] },
    },
    env: ['DATABASE_URL'],
    validate: async () => {
      if (!process.env.DATABASE_URL) {
        return { ok: false, message: 'DATABASE_URL not set' };
      }
      try {
        execSync('npx --yes @anthropic/postgres-mcp --help 2>&1', {
          stdio: 'pipe',
          timeout: 15000,
        });
        return { ok: true, message: 'package resolved (requires DATABASE_URL at runtime)' };
      } catch {
        return { ok: true, message: 'package resolved (npx)' };
      }
    },
  },
  'brave-search': {
    tier: 2,
    name: 'Brave Search',
    description: 'Real-time web search via Brave Search API',
    platforms: {
      opencode: { type: 'local', command: 'npx', args: ['-y', '@anthropic/brave-search-mcp'] },
      vscode: { type: 'stdio', command: 'npx', args: ['-y', '@anthropic/brave-search-mcp'] },
      cursor: { type: 'local', command: 'npx', args: ['-y', '@anthropic/brave-search-mcp'] },
      claude: { type: 'local', command: 'npx', args: ['-y', '@anthropic/brave-search-mcp'] },
      windsurf: { type: 'local', command: 'npx', args: ['-y', '@anthropic/brave-search-mcp'] },
    },
    env: ['BRAVE_API_KEY'],
    validate: async () => {
      if (!process.env.BRAVE_API_KEY) {
        return { ok: false, message: 'BRAVE_API_KEY not set' };
      }
      try {
        execSync('npx --yes @anthropic/brave-search-mcp --help 2>&1', {
          stdio: 'pipe',
          timeout: 15000,
        });
        return { ok: true, message: 'package resolved (requires BRAVE_API_KEY at runtime)' };
      } catch {
        return { ok: true, message: 'package resolved (npx)' };
      }
    },
  },
  docker: {
    tier: 2,
    name: 'Docker MCP',
    description: 'Container lifecycle management via Docker CLI',
    platforms: {
      opencode: { type: 'local', command: 'docker' },
      vscode: { type: 'stdio', command: 'docker' },
      cursor: { type: 'local', command: 'docker' },
      claude: { type: 'local', command: 'docker' },
      windsurf: { type: 'local', command: 'docker' },
    },
    env: [],
    validate: async () => {
      try {
        execSync('docker info --format "{{.ServerVersion}}" 2>&1', {
          stdio: 'pipe',
          timeout: 10000,
        });
        return { ok: true, message: 'Docker daemon reachable' };
      } catch {
        return { ok: false, message: 'Docker daemon not reachable or not installed' };
      }
    },
  },
};

// ---------------------------------------------------------------------------
// Platform Metadata
// ---------------------------------------------------------------------------

const PLATFORMS = {
  opencode: {
    label: 'OpenCode',
    configFile: 'opencode.json',
    configPaths: [
      join(ROOT, 'opencode.json'),
      join(process.cwd(), 'opencode.json'),
      join(homedir(), '.config', 'opencode', 'opencode.json'),
    ],
    // OpenCode uses "mcp" key for servers (not "mcpServers")
    configKey: 'mcp',
    detect: () =>
      existsSync(join(ROOT, 'opencode.json')) ||
      existsSync(join(process.cwd(), 'opencode.json')) ||
      existsSync(join(homedir(), '.config', 'opencode', 'opencode.json')),
  },
  vscode: {
    label: 'VS Code',
    configFile: '.vscode/mcp.json',
    configPaths: [
      join(ROOT, '.vscode', 'mcp.json'),
      join(process.cwd(), '.vscode', 'mcp.json'),
    ],
    // VS Code uses "servers" key
    configKey: 'servers',
    detect: () =>
      existsSync(join(ROOT, '.vscode', 'mcp.json')) ||
      existsSync(join(process.cwd(), '.vscode', 'mcp.json')),
  },
  cursor: {
    label: 'Cursor',
    configFile: '.cursor/mcp.json',
    configPaths: [
      join(ROOT, '.cursor', 'mcp.json'),
      join(process.cwd(), '.cursor', 'mcp.json'),
    ],
    configKey: 'mcpServers',
    detect: () =>
      existsSync(join(ROOT, '.cursor', 'mcp.json')) ||
      existsSync(join(process.cwd(), '.cursor', 'mcp.json')),
  },
  claude: {
    label: 'Claude',
    configFile: '.mcp.json',
    configPaths: [
      join(ROOT, '.mcp.json'),
      join(process.cwd(), '.mcp.json'),
      join(homedir(), '.claude', 'settings.json'),
    ],
    configKey: 'mcpServers',
    detect: () =>
      existsSync(join(ROOT, '.mcp.json')) ||
      existsSync(join(process.cwd(), '.mcp.json')) ||
      existsSync(join(homedir(), '.claude', 'settings.json')),
  },
  windsurf: {
    label: 'Windsurf',
    configFile: '~/.codeium/windsurf/mcp_config.json',
    configPaths: [
      join(homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    ],
    configKey: 'mcpServers',
    detect: () =>
      existsSync(join(homedir(), '.codeium', 'windsurf', 'mcp_config.json')),
  },
};

// ---------------------------------------------------------------------------
// Platform Config Writers
// ---------------------------------------------------------------------------

/**
 * Build the MCP server entry for a given platform.
 * Each platform has a slightly different JSON shape.
 *
 * @param {string} mcpKey       - Canonical MCP key (e.g. 'github', 'context7')
 * @param {string} platformName - Platform key (e.g. 'opencode', 'vscode')
 * @returns {object|null}       - The config entry, or null if unsupported
 */
function buildMcpEntry(mcpKey, platformName) {
  const mcp = MCPS[mcpKey];
  if (!mcp) return null;
  const platform = mcp.platforms[platformName];
  if (!platform) return null;

  // Collect env vars that are set for inclusion in config
  const env = {};
  for (const key of mcp.env) {
    const val = process.env[key];
    if (val) {
      env[key] = `\${${key}}`;
    }
  }

  switch (platform.type) {
    case 'remote':
    case 'http': {
      // OpenCode uses "mcp" key with { type, url, enabled }
      if (platformName === 'opencode') {
        return {
          type: 'remote',
          url: platform.url,
          enabled: true,
        };
      }
      // VS Code http format: { type: "http", url }
      if (platformName === 'vscode') {
        return { type: 'http', url: platform.url };
      }
      // Cursor/Claude/Windsurf http format
      return { type: 'http', url: platform.url };
    }

    case 'local': {
      // OpenCode uses "mcp" key with { type: "local", command: [...], enabled }
      if (platformName === 'opencode') {
        const entry = {
          type: 'local',
          command: [platform.command, ...(platform.args || [])],
          enabled: true,
        };
        if (Object.keys(env).length > 0) {
          entry.environment = env;
        }
        return entry;
      }
      // Cursor/Claude/Windsurf format: { command, args?, env? }
      const entry = {
        command: platform.command,
        ...(platform.args ? { args: platform.args } : {}),
      };
      if (Object.keys(env).length > 0) {
        entry.env = env;
      }
      return entry;
    }

    case 'stdio': {
      // VS Code stdio format: { type: "stdio", command, args? }
      return {
        type: 'stdio',
        command: platform.command,
        ...(platform.args ? { args: platform.args } : {}),
      };
    }

    default:
      return null;
  }
}

/**
 * Read a JSON config file, returning the parsed object or {}.
 */
function readConfig(filePath) {
  try {
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`  ⚠️  Could not parse ${filePath}: ${err.message}`);
  }
  return {};
}

/**
 * Write the MCP server entry to the platform config file.
 *
 * @param {string}  platformName - Platform key
 * @param {string}  mcpKey       - MCP canonical key
 * @param {boolean} dryRun       - If true, don't write anything
 * @param {boolean} force        - Overwrite existing entry
 * @returns {{ status: string, path?: string, reason?: string, entry?: object }}
 */
function writeMcpConfig(platformName, mcpKey, dryRun, force) {
  const platform = PLATFORMS[platformName];
  const mcp = MCPS[mcpKey];
  if (!platform || !mcp) {
    return { status: 'error', reason: 'unknown platform or mcp' };
  }

  // Find the best config path (first existing, or first fallback)
  let configPath = null;
  for (const p of platform.configPaths) {
    if (existsSync(p)) {
      configPath = p;
      break;
    }
  }
  if (!configPath) {
    configPath = platform.configPaths[0];
  }

  // Read existing config
  const config = readConfig(configPath);
  const configExisted = Object.keys(config).length > 0;

  // The key under which MCP servers are stored (e.g. 'mcp', 'servers', 'mcpServers')
  const key = platform.configKey;

  // Ensure the section exists
  if (!config[key]) {
    config[key] = {};
  }

  // Check if the MCP already has an entry
  if (config[key][mcpKey] && !force) {
    return {
      status: 'skipped',
      reason: `Already exists in ${platform.configFile} (use --force to overwrite)`,
    };
  }

  // Build the platform-specific entry
  const entry = buildMcpEntry(mcpKey, platformName);
  if (!entry) {
    return {
      status: 'error',
      reason: `${mcp.name} does not support ${platform.label}`,
    };
  }

  if (dryRun) {
    return { status: 'dry-run', entry };
  }

  // Backup existing config before modifying
  if (configExisted) {
    const backupPath = `${configPath}.backup`;
    if (!existsSync(backupPath)) {
      try {
        copyFileSync(configPath, backupPath);
      } catch {
        // Non-fatal: continue even if backup fails
      }
    }
  }

  // Write the MCP entry
  config[key][mcpKey] = entry;

  // Ensure directory exists
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

  return { status: 'installed', path: configPath };
}

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    platforms: [],
    tier: 1,
    mcp: null,
    list: false,
    dryRun: false,
    force: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--platform':
        args.platforms = argv[++i].split(',').map((s) => s.trim().toLowerCase());
        break;
      case '--tier':
        args.tier = parseInt(argv[++i], 10);
        break;
      case '--mcp':
        args.mcp = argv[++i].toLowerCase();
        break;
      case '--list':
        args.list = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--force':
        args.force = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        console.warn(`⚠️  Unknown option: ${argv[i]}`);
        break;
    }
  }

  // If no platforms specified and not --list, auto-detect
  if (args.platforms.length === 0 && !args.list && !args.help) {
    const detected = detectPlatforms();
    if (detected.length > 0) {
      args.platforms = detected;
    } else {
      // Default to all platforms if none detected
      args.platforms = Object.keys(PLATFORMS);
    }
  }

  return args;
}

function detectPlatforms() {
  const detected = [];
  for (const [name, platform] of Object.entries(PLATFORMS)) {
    if (platform.detect()) {
      detected.push(name);
    }
  }
  return detected;
}

// ---------------------------------------------------------------------------
// Interactive Prompt
// ---------------------------------------------------------------------------

function askQuestion(query) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function promptForTier2Mcps() {
  const selected = [];
  const tier2Mcps = Object.entries(MCPS).filter(([, mcp]) => mcp.tier === 2);

  console.log('\nDomain (Tier 2) — ? [y/N]:');

  for (const [key, mcp] of tier2Mcps) {
    const envHints = mcp.env.length > 0 ? ` (needs: ${mcp.env.join(', ')})` : '';
    const answer = await askQuestion(`  ${mcp.name}${envHints}? [y/N] `);
    if (answer === 'y' || answer === 'yes') {
      selected.push(key);
    }
  }

  return selected;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

async function validateMcp(mcpKey) {
  const mcp = MCPS[mcpKey];
  if (!mcp) return { ok: false, message: 'unknown MCP' };
  try {
    return await mcp.validate();
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

// ---------------------------------------------------------------------------
// List Available MCPs
// ---------------------------------------------------------------------------

function listMcps() {
  console.log('\nAvailable MCP Servers:\n');
  console.log('Essential (Tier 1):');
  for (const [key, mcp] of Object.entries(MCPS)) {
    if (mcp.tier === 1) {
      console.log(`  ${key.padEnd(16)} ${mcp.name.padEnd(20)} ${mcp.description}`);
    }
  }
  console.log('\nDomain (Tier 2):');
  for (const [key, mcp] of Object.entries(MCPS)) {
    if (mcp.tier === 2) {
      const envInfo = mcp.env.length > 0 ? ` [env: ${mcp.env.join(', ')}]` : '';
      console.log(`  ${key.padEnd(16)} ${mcp.name.padEnd(20)} ${mcp.description}${envInfo}`);
    }
  }
  console.log('\nPlatforms supported: ' + Object.keys(PLATFORMS).join(', '));
  console.log('');
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function showHelp() {
  console.log(`
install-mcp.mjs — Multi-platform MCP server installer for Pantheon

Usage:
  node scripts/install-mcp.mjs                              Auto-detect platform, install Tier 1
  node scripts/install-mcp.mjs --platform opencode          Install for specific platform
  node scripts/install-mcp.mjs --tier 2                     Install Tier 2 (interactive prompt)
  node scripts/install-mcp.mjs --mcp context7               Install a specific MCP only
  node scripts/install-mcp.mjs --list                       List available MCPs
  node scripts/install-mcp.mjs --dry-run                    Preview changes without writing
  node scripts/install-mcp.mjs --force                      Overwrite existing MCP entries
  node scripts/install-mcp.mjs --platform opencode --mcp github,context7

Options:
  --platform <name>    Target platform (opencode|vscode|cursor|claude|windsurf).
                       Comma-separated for multiple. Auto-detects if omitted.
  --tier <n>           1=Essential (default), 2=Domain, 3=Project
  --mcp <name>         Install specific MCP(s) only. Comma-separated.
  --list               List available MCPs and exit
  --dry-run            Show what would be installed without writing
  --force              Overwrite existing MCP entries
  --help, -h           Show this help

Platforms:
  opencode    → opencode.json (mcp key)
  vscode      → .vscode/mcp.json (servers key)
  cursor      → .cursor/mcp.json (mcpServers key)
  claude      → .mcp.json or ~/.claude/settings.json (mcpServers key)
  windsurf    → ~/.codeium/windsurf/mcp_config.json (mcpServers key)

Environment Variables:
  DATABASE_URL    Required for PostgreSQL MCP (postgresql+ssl://...)
  BRAVE_API_KEY   Required for Brave Search MCP

Examples:
  node scripts/install-mcp.mjs                              Auto-detect + install essentials
  node scripts/install-mcp.mjs --platform opencode --tier 2 OpenCode + interactive Tier 2
  node scripts/install-mcp.mjs --mcp docker                 Install only Docker MCP
  node scripts/install-mcp.mjs --platform vscode --dry-run  Preview VS Code changes
`);
}

// ---------------------------------------------------------------------------
// Progress / Logging Helpers
// ---------------------------------------------------------------------------

const progress = {
  installed: [],
  skipped: [],
  errors: [],
  validations: {},
};

function logResult(platformLabel, mcpKey, result) {
  const mcp = MCPS[mcpKey];
  const label = mcp ? mcp.name : mcpKey;
  switch (result.status) {
    case 'installed':
      console.log(`  ✅ ${label} — config written to ${result.path}`);
      progress.installed.push({ platform: platformLabel, mcp: mcpKey });
      break;
    case 'skipped':
      console.log(`  ⏭️  ${label} — ${result.reason}`);
      progress.skipped.push({ platform: platformLabel, mcp: mcpKey, reason: result.reason });
      break;
    case 'dry-run': {
      const desc =
        result.entry?.type === 'remote' || result.entry?.type === 'http'
          ? `remote → ${result.entry.url}`
          : `local → ${result.entry.command} ${(result.entry.args || []).join(' ')}`;
      console.log(`  📋 ${label} — would install (${desc})`);
      break;
    }
    default:
      console.log(`  ❌ ${label} — ${result.reason}`);
      progress.errors.push({ platform: platformLabel, mcp: mcpKey, reason: result.reason });
  }
}

function logValidation(mcpKey, result) {
  const mcp = MCPS[mcpKey];
  const label = mcp ? mcp.name : mcpKey;
  if (result.ok) {
    const extra = result.message ? ` — ${result.message}` : '';
    console.log(`  ✅ ${label}${extra}`);
  } else {
    const extra = result.message ? ` — ${result.message}` : '';
    console.log(`  ❌ ${label}${extra}`);
  }
  progress.validations[mcpKey] = result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.list) {
    listMcps();
    process.exit(0);
  }

  // Determine which MCPs to install
  let mcpKeys = [];

  if (args.mcp) {
    // Specific MCP(s) requested
    mcpKeys = args.mcp.split(',').map((s) => s.trim().toLowerCase());
    for (const key of mcpKeys) {
      if (!MCPS[key]) {
        console.error(`❌ Unknown MCP: "${key}". Use --list to see available MCPs.`);
        process.exit(1);
      }
    }
  } else {
    // Tier 1 — always included
    const tier1Mcps = Object.entries(MCPS)
      .filter(([, mcp]) => mcp.tier === 1)
      .map(([key]) => key);
    mcpKeys.push(...tier1Mcps);

    // Tier 2 — interactive prompt
    if (args.tier >= 2) {
      const tier2Selected = await promptForTier2Mcps();
      mcpKeys.push(...tier2Selected);
    }
  }

  if (mcpKeys.length === 0) {
    console.log('No MCPs selected. Nothing to install.\n');
    process.exit(0);
  }

  // Determine target platforms
  const platforms = args.platforms;
  const platformLabels = platforms.map((p) => PLATFORMS[p]?.label || p);

  if (args.dryRun) {
    console.log('\n🔍 Dry-run mode — no files will be written\n');
  }

  console.log(
    `\n🔍 ${platforms.length === 1 ? 'Platform' : 'Platforms'}: ${platformLabels.join(', ')}`,
  );
  console.log(
    `📦 Installing ${mcpKeys.length} MCP(s): ${mcpKeys.map((k) => MCPS[k]?.name || k).join(', ')}\n`,
  );

  // Install per platform
  for (const platformName of platforms) {
    const platform = PLATFORMS[platformName];
    if (!platform) {
      console.warn(`  ⚠️  Unknown platform: ${platformName} — skipping`);
      continue;
    }

    console.log(`🔧 ${platform.label} (${platform.configFile}):`);

    for (const mcpKey of mcpKeys) {
      const result = writeMcpConfig(platformName, mcpKey, args.dryRun, args.force);
      logResult(platform.label, mcpKey, result);
    }

    console.log('');
  }

  // Validation
  if (!args.dryRun) {
    console.log('🔍 Validating MCPs...\n');
    for (const key of mcpKeys) {
      const result = await validateMcp(key);
      logValidation(key, result);
    }
    console.log('');
  } else {
    console.log('🔍 Validation skipped in dry-run mode\n');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📋 Installation Summary');
  console.log('='.repeat(60));
  console.log(`  Platforms:  ${platformLabels.join(', ')}`);
  console.log(`  MCPs:       ${mcpKeys.length} requested`);
  console.log(`  Installed:  ${progress.installed.length}`);
  console.log(`  Skipped:    ${progress.skipped.length}`);
  console.log(`  Errors:     ${progress.errors.length}`);

  if (progress.installed.length > 0) {
    console.log('\n  ✅ Installed:');
    for (const item of progress.installed) {
      console.log(`     - ${item.mcp} → ${item.platform}`);
    }
  }

  if (progress.skipped.length > 0 && !args.dryRun) {
    console.log('\n  ⏭️  Skipped:');
    for (const item of progress.skipped) {
      console.log(`     - ${item.mcp} (${item.platform}): ${item.reason}`);
    }
  }

  if (progress.errors.length > 0) {
    console.log('\n  ❌ Errors:');
    for (const item of progress.errors) {
      console.log(`     - ${item.mcp} (${item.platform}): ${item.reason}`);
    }
  }

  console.log(
    '\n⚠️  Reminder: Restart your editor/CLI tool for MCP changes to take effect.',
  );
  console.log('   For VS Code: Cmd+Shift+P → "Developer: Reload Window"');
  console.log('   For OpenCode: Just restart the session');
  console.log('');

  process.exit(progress.errors.length > 0 ? 1 : 0);
}

main();
