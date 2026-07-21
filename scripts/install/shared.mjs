/**
 * shared.mjs — Shared utilities for Pantheon platform installers
 */

import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

export const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..");
export const AGENTS_DIR = join(ROOT, "agents");
export const PLATFORM_DIR = join(ROOT, "platform");

// Auto-detect agent names from agents/ directory
export function getAgentNames() {
	if (!existsSync(AGENTS_DIR)) return [];
	return readdirSync(AGENTS_DIR)
		.filter((f) => f.endsWith(".agent.md"))
		.map((f) => f.replace(/\.agent\.md$/, ""))
		.sort();
}

// Cached constant for backward compatibility
export const AGENT_NAMES = getAgentNames();

export const PLATFORM_DETECTORS = {
	opencode: (target) =>
		existsSync(join(target, "opencode.json")) ||
		existsSync(join(target, "platform", "opencode", "opencode.json")),
	claude: (target) =>
		existsSync(join(target, ".claude")) ||
		existsSync(join(target, "CLAUDE.md")),
	cursor: (target) =>
		existsSync(join(target, ".cursor")) ||
		existsSync(join(target, ".cursorrules")),
	windsurf: (target) =>
		existsSync(join(target, ".windsurf")) ||
		existsSync(join(target, ".windsurfrules")),
	copilot: (target) =>
		existsSync(join(target, ".github", "copilot-instructions.md")) ||
		existsSync(join(target, ".vscode")),
	continue: (target) =>
		existsSync(join(target, ".continue", "config.yaml")) ||
		existsSync(join(target, ".continue")),
	cline: (target) => existsSync(join(target, ".clinerules")),
};

export const summary = {
	opencode: { created: 0, skipped: 0, errors: 0 },
	claude: { created: 0, skipped: 0, errors: 0 },
	cursor: { created: 0, skipped: 0, errors: 0 },
	windsurf: { created: 0, skipped: 0, errors: 0 },
	copilot: { created: 0, skipped: 0, errors: 0 },
	continue: { created: 0, skipped: 0, errors: 0 },
	cline: { created: 0, skipped: 0, errors: 0 },
};

export function showHelp() {
	console.log(`
install.mjs — Multi-platform Pantheon agent installer

Usage:
  node scripts/install.mjs                                     auto-detect, cwd
  node scripts/install.mjs --target /path/to/project           auto-detect, target
  node scripts/install.mjs --platforms opencode,claude         specific platforms, cwd
  node scripts/install.mjs --target /path --platforms all      all platforms
  node scripts/install.mjs --detect                            detect platforms without installing
  node scripts/install.mjs --dry-run                           preview without writing
  node scripts/install.mjs --backup                            create timestamped backup before writing
  node scripts/install.mjs --clean                             wipe + fresh install (all components)
  node scripts/install.mjs --clean --components agents,skills  wipe only agents+skills, reinstall
  node scripts/install.mjs --components agents                 install only agents (no skills/instructions)
  node scripts/install.mjs --help                              show this help

Components (--components):
  Comma-separated list of what to install. Default: agents,skills,instructions,commands,plugins
    agents        → agent .md files
    skills        → skill definitions (.opencode/skills/)
    instructions  → AGENTS.md + instructions/*.instructions.md
    prompts       → prompts/*.prompt.md (optional)
    commands      → .opencode/commands/*.md (OpenCode command shortcuts)

Clean mode (--clean):
  Deletes ALL existing Pantheon files for selected components, then
  re-installs fresh from source. Useful after removing/renaming agents or skills.
  OFF by default — without --clean only copies new/changed files (never deletes).

Platforms:
  opencode    → .opencode/agents/ + opencode.json
  claude       → .claude/agents/ + CLAUDE.md + settings.json
  cursor       → .cursor/rules/ (renamed .mdc files)
  windsurf     → .windsurf/agents/ + .windsurfrules
  copilot      → .github/agents/ symlinks + .vscode/settings.json check
  continue     → .continue/rules/ + .continue/config.yaml
  cline        → .clinerules/ (no extension, plain markdown)
  all          → install every platform

When --platforms is omitted, the script auto-detects which platforms
the target project already supports (based on config files present).
If none are detected, ALL platforms are installed.
`);
}

export function parseArgs(argv) {
	const args = {
		target: null,
		platforms: null,
		components: null,
		dryRun: false,
		clean: false,
		backup: false,
		help: false,
		detect: false,
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
			case "--components":
				args.components = argv[++i]
					.split(",")
					.map((s) => s.trim().toLowerCase());
				break;
			case "--detect":
				args.detect = true;
				break;
			case "--dry-run":
				args.dryRun = true;
				break;
			case "--clean":
				args.clean = true;
				break;
			case "--backup":
				args.backup = true;
				break;
			case "--help":
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

	// Resolve to absolute path
	args.target = resolveTarget(args.target);

	return args;
}

export function resolveTarget(target) {
	// If it's already absolute, use it
	if (target.startsWith("/")) return target;
	// If it's relative, resolve from cwd
	return join(process.cwd(), target);
}

export function createBackup(target) {
	const timestamp = new Date()
		.toISOString()
		.replace(/[:.]/g, "-")
		.slice(0, 19);
	const backupDir = join(
		target,
		"..",
		`.pantheon-bak-${basename(target)}-${timestamp}`,
	);

	console.log(`\n  💾 Creating backup: ${backupDir}`);
	mkdirSync(backupDir, { recursive: true });

	// Copy only relevant Pantheon directories/files
	const items = [
		"agents",
		"skills",
		"commands",
		"instructions",
		"opencode.json",
		"tui.json",
	];
	let count = 0;
	for (const item of items) {
		const src = join(target, item);
		try {
			cpSync(src, join(backupDir, item), {
				recursive: true,
				errorOnExist: false,
			});
			count++;
		} catch {
			// File or directory doesn't exist in target — skip silently
		}
	}

	console.log(`  ✅ Backed up ${count} items to: ${backupDir}`);
	return backupDir;
}

export function detectAndReport(target) {
	const PLATFORM_LABELS = {
		opencode: "OpenCode",
		claude: "Claude Code",
		cursor: "Cursor",
		windsurf: "Windsurf",
		copilot: "VS Code / Copilot",
		continue: "Continue.dev",
		cline: "Cline",
	};

	const CONFIG_FILES = {
		opencode: () => "opencode.json",
		claude: () => ".claude/ or CLAUDE.md",
		cursor: () => ".cursor/ or .cursorrules",
		windsurf: () => ".windsurf/ or .windsurfrules",
		copilot: () => ".github/copilot-instructions.md or .vscode/",
		continue: () => ".continue/config.yaml or .continue/",
		cline: () => ".clinerules",
	};

	console.log(`\n  🔍 Pantheon Platform Detection`);
	console.log(`     Target: ${target}\n`);

	const results = [];
	for (const [platform, detector] of Object.entries(PLATFORM_DETECTORS)) {
		const found = detector(target);
		results.push({ platform, found });
	}

	// Table header
	console.log(`  ${"Platform".padEnd(12)} ${"Detected?".padEnd(12)} Config file`);
	console.log(`  ${"─".repeat(55)}`);

	const detected = results.filter((r) => r.found);
	for (const r of results) {
		const status = r.found ? "✅ YES" : "❌ no";
		const configFile = r.found ? CONFIG_FILES[r.platform]() : "(not found)";
		console.log(
			`  ${PLATFORM_LABELS[r.platform].padEnd(12)} ${status.padEnd(12)} ${configFile}`,
		);
	}

	console.log(`\n  📊 ${detected.length} of ${results.length} platforms detected.`);
	if (detected.length > 0) {
		const names = detected.map((r) => r.platform).join(",");
		console.log(`  → Install with: node scripts/install.mjs --platforms ${names}`);
	}

	return detected.map((r) => r.platform);
}

export function detectPlatforms(target) {
	const detected = [];
	for (const [platform, detector] of Object.entries(PLATFORM_DETECTORS)) {
		if (detector(target)) {
			detected.push(platform);
		}
	}
	return detected;
}

export function sourceDirValid(dir) {
	if (!existsSync(dir)) return false;
	const entries = readdirSync(dir);
	return entries.length > 0;
}

export function copyFiles(
	srcDir,
	dstDir,
	dryRun,
	renameMap = null,
	clean = false,
) {
	const entries = readdirSync(srcDir);
	let created = 0;
	let skipped = 0;

	// Build set of expected destination filenames (after rename)
	const dstNames = new Set();
	for (const entry of entries) {
		const srcFile = join(srcDir, entry);
		if (!existsSync(srcFile)) continue;
		const dstName = renameMap ? (renameMap(entry) ?? entry) : entry;
		dstNames.add(dstName);

		const dstFile = join(dstDir, dstName);

		const content = readFileSync(srcFile, "utf8");
		const existing = existsSync(dstFile) ? readFileSync(dstFile, "utf8") : null;

		if (existing !== null) {
			if (existing === content) {
				skipped++;
				continue;
			}
			if (!dryRun) {
				writeFileSync(dstFile, content, "utf8");
			}
			created++;
		} else {
			if (!dryRun) {
				writeFileSync(dstFile, content, "utf8");
			}
			created++;
		}
	}

	// Remove stale Pantheon agent files from dst (opt-in via clean flag)
	// Safety: ONLY removes files whose name matches the agent file pattern
	// (lowercase name + .md/.mdc extension), regardless of AGENT_NAMES membership.
	// This handles deleted canonical agents (e.g., agora) whose source file is gone.
	if (clean && existsSync(dstDir)) {
		const dstEntries = readdirSync(dstDir);
		const agentPattern = /^[a-z-]+\.(md|mdc)$/;
		for (const entry of dstEntries) {
			if (dstNames.has(entry)) continue; // still in source
			const dstFile = join(dstDir, entry);
			if (!statSync(dstFile).isFile()) continue;
			// Safety: only remove files that match agent file naming pattern
			// (user custom files with different naming patterns are untouched)
			if (!agentPattern.test(entry)) continue;
			if (!dryRun) {
				rmSync(dstFile, { force: true });
			}
			created++;
		}
	}

	return { created, skipped };
}

export function writeIfChanged(filePath, content, dryRun) {
	const existing = existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
	if (existing === content) {
		return "skipped";
	}
	if (!dryRun) {
		writeFileSync(filePath, content, "utf8");
	}
	return "created";
}

export function collectSkillNames() {
	const skillsDir = join(ROOT, "skills");
	if (!existsSync(skillsDir)) return [];
	return readdirSync(skillsDir)
		.filter((entry) => {
			const entryPath = join(skillsDir, entry);
			return (
				statSync(entryPath).isDirectory() &&
				existsSync(join(entryPath, "SKILL.md"))
			);
		})
		.sort();
}

// ---------------------------------------------------------------------------
// YAML / frontmatter helpers
// ---------------------------------------------------------------------------

/**
 * Parse ---frontmatter--- + body from a markdown file.
 * Returns { fm: object, body: string } or null if no frontmatter.
 */
export function parseFrontmatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) return null;
	return {
		fm: yaml.load(match[1]) ?? {},
		body: match[2],
	};
}

/**
 * Serialize a frontmatter object back to YAML.
 * Uses long-line mode and avoids unnecessary quoting.
 */
export function serializeFm(fm) {
	return yaml.dump(fm, {
		lineWidth: -1,
		quotingType: '"',
		forceQuotes: false,
		noRefs: true,
	});
}

export function installSkills(skills, target, dryRun, subDir = ".opencode") {
	const srcSkillsDir = join(ROOT, "skills");
	const dstSkillsDir = join(target, subDir, "skills");

	let created = 0;
	let skipped = 0;

	for (const skill of skills) {
		const src = join(srcSkillsDir, skill);
		const dst = join(dstSkillsDir, skill);

		if (!dryRun) mkdirSync(dst, { recursive: true });

		function copyDirRecursive(from, to) {
			const entries = readdirSync(from);
			for (const entry of entries) {
				const srcPath = join(from, entry);
				const dstPath = join(to, entry);
				if (statSync(srcPath).isDirectory()) {
					if (!dryRun) mkdirSync(dstPath, { recursive: true });
					copyDirRecursive(srcPath, dstPath);
				} else {
					const content = readFileSync(srcPath, "utf8");
					const existing = existsSync(dstPath)
						? readFileSync(dstPath, "utf8")
						: null;
					if (existing === content) {
						skipped++;
					} else {
						if (!dryRun) writeFileSync(dstPath, content, "utf8");
						created++;
					}
				}
			}
		}

		copyDirRecursive(src, dst);
	}

	return { created, skipped };
}

export function syncDir(src, dst, dryRun, clean = false, filter = null) {
	if (!existsSync(src)) return { created: 0, skipped: 0 };
	let created = 0;
	let skipped = 0;

	if (clean && existsSync(dst)) {
		if (!dryRun) {
			rmSync(dst, { recursive: true, force: true });
		}
	}

	if (!dryRun) mkdirSync(dst, { recursive: true });

	const entries = readdirSync(src);
	for (const entry of entries) {
		if (filter && !filter(entry)) continue;
		const srcPath = join(src, entry);
		const dstPath = join(dst, entry);
		if (statSync(srcPath).isDirectory()) {
			const sub = syncDir(srcPath, dstPath, dryRun, false, filter);
			created += sub.created;
			skipped += sub.skipped;
		} else {
			const content = readFileSync(srcPath, "utf8");
			const existing = existsSync(dstPath)
				? readFileSync(dstPath, "utf8")
				: null;
			if (existing === content) {
				skipped++;
			} else {
				if (!dryRun) writeFileSync(dstPath, content, "utf8");
				created++;
			}
		}
	}
	return { created, skipped };
}

// ---------------------------------------------------------------------------
// MCP Servers schema validation
// ---------------------------------------------------------------------------

/**
 * Schema definition for mcpServers frontmatter field.
 * Max 5 MCPs per agent, tools must reference tools in agent's tools: array.
 */
export const MCP_SERVERS_SCHEMA = {
  type: 'array',
  maxItems: 5,
  items: {
    type: 'object',
    required: ['name', 'tools', 'when'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'MCP server identifier'
      },
      tools: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'string',
          minLength: 1
        },
        description: 'Tools this MCP provides (must exist in agent tools: array)'
      },
      when: {
        type: 'string',
        minLength: 1,
        description: 'Activation condition (e.g., "always", "on-demand")'
      }
    },
    additionalProperties: false
  }
};

/**
 * Validate mcpServers against schema constraints.
 * @param {Array} mcpServers - The mcpServers array from agent frontmatter
 * @param {string[]} agentTools - The agent's tools: array for cross-reference validation (unused, MCP tools are external)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMcpServers(mcpServers, agentTools = []) {
  const errors = [];

  if (!Array.isArray(mcpServers)) {
    errors.push('mcpServers must be an array');
    return { valid: false, errors };
  }

  if (mcpServers.length > 5) {
    errors.push(`mcpServers exceeds maximum of 5 (got ${mcpServers.length})`);
  }

  for (let i = 0; i < mcpServers.length; i++) {
    const mcp = mcpServers[i];
    const prefix = `mcpServers[${i}]`;

    if (!mcp || typeof mcp !== 'object') {
      errors.push(`${prefix}: must be an object`);
      continue;
    }

    // Required fields
    if (!mcp.name || typeof mcp.name !== 'string' || mcp.name.trim() === '') {
      errors.push(`${prefix}.name: required and must be non-empty string`);
    }

    if (!Array.isArray(mcp.tools) || mcp.tools.length === 0) {
      errors.push(`${prefix}.tools: required and must be non-empty array`);
    }

    if (!mcp.when || typeof mcp.when !== 'string' || mcp.when.trim() === '') {
      errors.push(`${prefix}.when: required and must be non-empty string`);
    }

    // Disallow additional properties
    const allowedKeys = ['name', 'tools', 'when'];
    for (const key of Object.keys(mcp)) {
      if (!allowedKeys.includes(key)) {
        errors.push(`${prefix}: unexpected property "${key}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export function printSummary(target, platforms) {
	const PLATFORM_LABELS = {
		opencode: "OpenCode",
		claude: "Claude Code",
		cursor: "Cursor",
		windsurf: "Windsurf",
		copilot: "VS Code / Copilot",
		continue: "Continue.dev",
		cline: "Cline",
	};

	console.log("");
	console.log("=".repeat(60));
	console.log("📋 Installation Summary");
	console.log(`   Target: ${target}`);
	console.log("=".repeat(60));

	let totalCreated = 0;
	let totalSkipped = 0;
	let totalErrors = 0;

	for (const platform of platforms) {
		const label = PLATFORM_LABELS[platform] ?? platform;
		const stats = summary[platform];
		totalCreated += stats.created;
		totalSkipped += stats.skipped;
		totalErrors += stats.errors;

		const status = stats.errors > 0 ? "⚠️" : "✅";
		console.log(
			` ${status} ${label}: ${stats.created} created, ${stats.skipped} skipped${stats.errors > 0 ? `, ${stats.errors} errors` : ""}`,
		);
	}

	console.log("-".repeat(60));
	console.log(
		`   Total: ${totalCreated} files created, ${totalSkipped} files skipped, ${totalErrors} errors`,
	);

	if (totalErrors > 0) {
		console.log("   ⚠️  Some platforms had errors — review warnings above.");
	}

	console.log("");
	console.log("📖 Next Steps:");
	console.log("");

	if (platforms.includes("opencode")) {
		console.log("  OpenCode:");
		console.log(`    - Run \`opencode\` in ${target}`);
		console.log("    - Invoke agents with @agent-name in chat");
		console.log("    - To customize models: edit opencode.json");
		console.log("    - Skills are in .opencode/skills/ (auto-loaded)");
		console.log("");
	}

	if (platforms.includes("claude")) {
		console.log("  Claude Code:");
		console.log(`    - Run \`claude\` in ${target}`);
		console.log("    - Agents in .claude/agents/");
		console.log("    - Skills in .claude/skills/");
		console.log("    - Settings in .claude/settings.json");
		console.log("");
	}

	if (platforms.includes("cursor")) {
		console.log("  Cursor:");
		console.log(`    - Rules in .cursor/rules/ (.mdc format)`);
		console.log("    - Skills in .cursor/skills/");
		console.log("    - AGENTS.md in project root");
		console.log("    - Use @agent-name in Agent mode");
		console.log("");
	}

	if (platforms.includes("windsurf")) {
		console.log("  Windsurf (Cascade):");
		console.log(`    - Rules in .windsurf/rules/`);
		console.log("    - Skills in .windsurf/skills/");
		console.log(
			"    - Workflows in .windsurf/workflows/ (/orchestrate, /code-review)",
		);
		console.log("    - AGENTS.md in project root");
		console.log("");
	}

	if (platforms.includes("copilot")) {
		console.log("  VS Code / Copilot:");
		console.log(`    - Agents in .github/agents/`);
		console.log("    - Ensure .vscode/settings.json has plugin config");
		console.log("    - Use @agent-name in VS Code Copilot Chat");
		console.log("    - Plugin manifest in plugin.json");
		console.log("");
	}

	if (platforms.includes("continue")) {
		console.log("  Continue.dev:");
		console.log(`    - Rules in .continue/rules/`);
		console.log("    - Config in .continue/config.yaml");
		console.log(
			"    - Rules are injected into system prompts (no @name invocation)",
		);
		console.log("    - Edit config.yaml to set API keys and models");
		console.log("    - Use /reload to apply config changes");
		console.log("");
	}

	if (platforms.includes("cline")) {
		console.log("  Cline:");
		console.log(`    - Agent rules in .clinerules/ (no extension, plain markdown)`);
		console.log("    - Skills in .clinerules/skills/");
		console.log("    - Commands in .clinerules/commands/");
		console.log("    - AGENTS.md in project root");
		console.log("    - Invoke agents with @agent-name in Cline chat");
		console.log("");
	}

	console.log("  📚 Full documentation: https://github.com/ils15/pantheon");
	console.log("  🐛 Report issues: https://github.com/ils15/pantheon/issues");
}
