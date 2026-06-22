#!/usr/bin/env node
/**
 * uninstall.mjs — Multi-platform Pantheon agent uninstaller
 *
 * Removes Pantheon agent files and config from a project directory.
 * The reverse of install.mjs.
 *
 * Usage:
 *   node scripts/uninstall.mjs                                  auto-detect, cwd
 *   node scripts/uninstall.mjs --target /path/to/project        auto-detect, target
 *   node scripts/uninstall.mjs --platforms opencode,claude      specific platforms
 *   node scripts/uninstall.mjs --target /path --platforms all   all platforms
 *   node scripts/uninstall.mjs --dry-run                        preview without deleting
 *   node scripts/uninstall.mjs --force                          skip confirmation
 *   node scripts/uninstall.mjs --help                           show this help
 */

import { createInterface } from "node:readline";
import { isatty } from "node:tty";
import {
	existsSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
	statSync,
} from "node:fs";
import { join } from "node:path";
import { resolveTarget, detectPlatforms } from "./install/shared.mjs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANTHEON_AGENT_NAMES = [
	"zeus",
	"athena",
	"apollo",
	"hermes",
	"aphrodite",
	"demeter",
	"themis",
	"prometheus",
	"hephaestus",
	"chiron",
	"echo",
	"nyx",
	"gaia",
	"iris",
	"mnemosyne",
	"talos",
	"agora",
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

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS);

// ---------------------------------------------------------------------------
// Summary tracker
// ---------------------------------------------------------------------------

const stats = {
	opencode: { removed: 0, skipped: 0, errors: 0 },
	claude: { removed: 0, skipped: 0, errors: 0 },
	cursor: { removed: 0, skipped: 0, errors: 0 },
	windsurf: { removed: 0, skipped: 0, errors: 0 },
	copilot: { removed: 0, skipped: 0, errors: 0 },
	continue: { removed: 0, skipped: 0, errors: 0 },
	cline: { removed: 0, skipped: 0, errors: 0 },
};

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function showHelp() {
	console.log(`
uninstall.mjs — Multi-platform Pantheon agent uninstaller

Usage:
  node scripts/uninstall.mjs                                     auto-detect, cwd
  node scripts/uninstall.mjs --target /path/to/project           auto-detect, target
  node scripts/uninstall.mjs --platforms opencode,claude         specific platforms, cwd
  node scripts/uninstall.mjs --target /path --platforms all      all platforms
  node scripts/uninstall.mjs --dry-run                           preview without deleting
  node scripts/uninstall.mjs --force                             skip confirmation prompt
  node scripts/uninstall.mjs --help                              show this help

Flags:
  --target /path     Project to uninstall from (default: cwd)
  --platforms list   Comma-separated platforms (default: auto-detect or all)
  --dry-run          Preview what would be removed without deleting
  --force            Skip confirmation prompt
  --help             Show this help

Platforms:
  opencode    → .opencode/agents/ + opencode.json Pantheon entries
  claude      → .claude/agents/ + CLAUDE.md (if Pantheon content)
  cursor      → .cursor/rules/*.mdc (only Pantheon rules)
  windsurf    → .windsurf/rules/ + .windsurf/workflows/ (if empty)
  copilot     → .github/agents/ + .vscode/settings.json Pantheon keys
  continue    → .continue/rules/ + check .continue/config.yaml
  cline       → .clinerules/ (only agent rules, not commands/skills)
  all         → uninstall every platform

When --platforms is omitted, auto-detects which platforms are configured.
If none detected, all platforms are uninstalled.
`);
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
	const args = {
		target: null,
		platforms: null,
		dryRun: false,
		force: false,
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
			case "--dry-run":
				args.dryRun = true;
				break;
			case "--force":
				args.force = true;
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
	args.target = resolveTarget(args.target);

	return args;
}

// ---------------------------------------------------------------------------
// Confirmation prompt
// ---------------------------------------------------------------------------

async function confirmPrompt(message) {
	if (!isatty(process.stdin.fd)) {
		// Non-interactive — skip prompt (caller must use --force if desired)
		return true;
	}
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) => {
		rl.question(message, (answer) => {
			rl.close();
			resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
		});
	});
}

// ---------------------------------------------------------------------------
// Safety checks
// ---------------------------------------------------------------------------

/** Check if a filename matches a Pantheon agent file pattern. */
function isPantheonAgentFile(filename) {
	const basename = filename.replace(/\.(md|mdc)$/, "");
	return PANTHEON_AGENT_NAMES.includes(basename);
}

/** Check if a string is a Pantheon skill directory name. */
function isPantheonSkillEntry(dirname) {
	// Skill directories are dynamically fetched from ROOT/skills/
	// We use a dynamic check via readdirSync when needed, but for safety
	// we check against a known set of patterns.
	return /^[a-z-]+$/.test(dirname) && dirname.length > 1;
}

/** Check if a file contains Pantheon content. */
function fileContainsPantheonContent(filePath) {
	try {
		if (!existsSync(filePath)) return false;
		const content = readFileSync(filePath, "utf8");
		return (
			content.includes("Pantheon Agent System") ||
			content.includes("# Pantheon Agent System") ||
			content.includes("Pantheon multi-agent framework")
		);
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------------------
// Platform uninstallers
// ---------------------------------------------------------------------------

/**
 * OpenCode — remove .opencode/agents/, restore opencode.json
 */
function uninstallOpenCode(target, dryRun) {
	const s = stats.opencode;

	// 1. Remove .opencode/agents/ (entire directory — Pantheon-created)
	const agentsDir = join(target, ".opencode", "agents");
	if (existsSync(agentsDir)) {
		if (!dryRun) {
			try {
				rmSync(agentsDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${agentsDir}: ${err.message}`);
				s.errors++;
			}
		} else {
			const count = readdirSync(agentsDir).length;
			s.removed++;
			console.log(`  ~ Would remove .opencode/agents/ (${count} files)`);
		}
	} else {
		s.skipped++;
	}

	// 2. Remove .opencode/skills/ (entire directory — Pantheon-created)
	const skillsDir = join(target, ".opencode", "skills");
	if (existsSync(skillsDir)) {
		if (!dryRun) {
			try {
				rmSync(skillsDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${skillsDir}: ${err.message}`);
				s.errors++;
			}
		} else {
			s.removed++;
			console.log("  ~ Would remove .opencode/skills/");
		}
	} else {
		s.skipped++;
	}

	// 3. Remove .opencode/commands/ (entire directory — Pantheon-created)
	const cmdsDir = join(target, ".opencode", "commands");
	if (existsSync(cmdsDir)) {
		if (!dryRun) {
			try {
				rmSync(cmdsDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${cmdsDir}: ${err.message}`);
				s.errors++;
			}
		} else {
			s.removed++;
			console.log("  ~ Would remove .opencode/commands/");
		}
	} else {
		s.skipped++;
	}

	// 4. Remove .opencode/plugins/ (Pantheon TUI plugin)
	const pluginsDir = join(target, ".opencode", "plugins");
	if (existsSync(pluginsDir)) {
		let isPluginEmpty = true;
		try {
			isPluginEmpty = readdirSync(pluginsDir).length === 0;
		} catch {
			/* ignore */
		}
		if (!dryRun) {
			try {
				rmSync(pluginsDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${pluginsDir}: ${err.message}`);
				s.errors++;
			}
		} else if (!isPluginEmpty) {
			s.removed++;
			console.log("  ~ Would remove .opencode/plugins/ (Pantheon TUI plugin)");
		} else {
			s.skipped++;
		}
	} else {
		s.skipped++;
	}

	// 5. Remove .opencode/package.json and .opencode/tsconfig.json (Pantheon-created)
	for (const f of ["package.json", "tsconfig.json"]) {
		const fp = join(target, ".opencode", f);
		if (existsSync(fp)) {
			if (!dryRun) {
				try {
					rmSync(fp, { force: true });
					s.removed++;
				} catch (err) {
					console.error(`  ⚠️  Failed to remove ${fp}: ${err.message}`);
					s.errors++;
				}
			} else {
				s.removed++;
				console.log(`  ~ Would remove .opencode/${f}`);
			}
		} else {
			s.skipped++;
		}
	}

	// 6. Clean up empty .opencode/ directory
	const opencodeDir = join(target, ".opencode");
	if (existsSync(opencodeDir)) {
		let isEmpty = true;
		try {
			isEmpty = readdirSync(opencodeDir).length === 0;
		} catch {
			/* ignore */
		}
		if (isEmpty) {
			if (!dryRun) {
				try {
					rmSync(opencodeDir, { recursive: true, force: true });
					s.removed++;
				} catch (err) {
					/* ignore */
				}
			} else {
				s.removed++;
				console.log("  ~ Would remove empty .opencode/ directory");
			}
		}
	}

	// 7. Restore opencode.json — remove Pantheon agent config entries
	const configPath = join(target, "opencode.json");
	if (existsSync(configPath)) {
		try {
			const raw = readFileSync(configPath, "utf8");
			const config = JSON.parse(raw);
			let changed = false;

			// Remove Pantheon-managed agent entries
			if (config.agent && typeof config.agent === "object") {
				for (const [name, cfg] of Object.entries(config.agent)) {
					const source = cfg?.source || "";
					if (
						source.startsWith(".opencode/agents/") ||
						source.startsWith("agents/") ||
						(PANTHEON_AGENT_NAMES.includes(name) && source === "")
					) {
						delete config.agent[name];
						changed = true;
					}
				}
				if (Object.keys(config.agent).length === 0) {
					delete config.agent;
				}
			}

			// Remove Pantheon-specific instructions
			if (Array.isArray(config.instructions)) {
				const filtered = config.instructions.filter(
					(i) => i !== "AGENTS.md" && i !== "instructions/*.instructions.md",
				);
				if (filtered.length !== config.instructions.length) {
					changed = true;
				}
				if (filtered.length === 0) {
					delete config.instructions;
				} else {
					config.instructions = filtered;
				}
			}

			// Remove Pantheon plugin entry (stub — reserved for future plugin cleanup)
			if (Array.isArray(config.plugin) && config.plugin.length === 0) {
				delete config.plugin;
			}

			// Remove default_agent if it points to zeus
			if (config.default_agent === "zeus") {
				delete config.default_agent;
				changed = true;
			}

			if (changed) {
				if (!dryRun) {
					writeFileSync(
						configPath,
						`${JSON.stringify(config, null, 2)}\n`,
						"utf8",
					);
					s.removed++;
				} else {
					s.removed++;
					console.log(
						"  ~ Would restore opencode.json (remove Pantheon agent config entries)",
					);
				}
			} else {
				s.skipped++;
			}
		} catch (err) {
			console.error(
				`  ⚠️  Failed to process opencode.json: ${err.message}`,
			);
			s.errors++;
		}
	} else {
		s.skipped++;
	}

	// 8. Remove Pantheon-installed instructions/ directory
	const instrDir = join(target, "instructions");
	if (existsSync(instrDir)) {
		// Only remove if it was Pantheon-installed (heuristic: contains .instructions.md files)
		try {
			const entries = readdirSync(instrDir);
			const hasInstructions = entries.some((e) =>
				e.endsWith(".instructions.md"),
			);
			if (hasInstructions) {
				if (!dryRun) {
					rmSync(instrDir, { recursive: true, force: true });
					s.removed++;
				} else {
					s.removed++;
					console.log("  ~ Would remove instructions/ (Pantheon-installed)");
				}
			} else {
				s.skipped++;
			}
		} catch {
			s.skipped++;
		}
	} else {
		s.skipped++;
	}

	// 9. Remove Pantheon-installed prompts/ directory
	const promptsDir = join(target, "prompts");
	if (existsSync(promptsDir)) {
		try {
			const entries = readdirSync(promptsDir);
			const hasPromptMds = entries.some((e) => e.endsWith(".prompt.md"));
			if (hasPromptMds) {
				if (!dryRun) {
					rmSync(promptsDir, { recursive: true, force: true });
					s.removed++;
				} else {
					s.removed++;
					console.log("  ~ Would remove prompts/ (Pantheon-installed)");
				}
			} else {
				s.skipped++;
			}
		} catch {
			s.skipped++;
		}
	} else {
		s.skipped++;
	}

	// 10. Remove AGENTS.md if it has Pantheon content
	const agentsMd = join(target, "AGENTS.md");
	if (fileContainsPantheonContent(agentsMd)) {
		if (!dryRun) {
			try {
				rmSync(agentsMd, { force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove AGENTS.md: ${err.message}`);
				s.errors++;
			}
		} else {
			s.removed++;
			console.log("  ~ Would remove AGENTS.md (Pantheon content)");
		}
	} else {
		s.skipped++;
	}
}

/**
 * Claude Code — remove .claude/agents/, remove CLAUDE.md if Pantheon content
 */
function uninstallClaude(target, dryRun) {
	const s = stats.claude;

	// 1. Remove .claude/agents/
	const agentsDir = join(target, ".claude", "agents");
	if (existsSync(agentsDir)) {
		if (!dryRun) {
			try {
				rmSync(agentsDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${agentsDir}: ${err.message}`);
				s.errors++;
			}
		} else {
			const count = existsSync(agentsDir)
				? readdirSync(agentsDir).length
				: 0;
			s.removed++;
			console.log(`  ~ Would remove .claude/agents/ (${count} files)`);
		}
	} else {
		s.skipped++;
	}

	// 2. Remove .claude/settings.json Pantheon section (or entire file if Pantheon-only)
	const settingsPath = join(target, ".claude", "settings.json");
	if (existsSync(settingsPath)) {
		try {
			const raw = readFileSync(settingsPath, "utf8");
			const settings = JSON.parse(raw);
			// The installer creates settings with only permissions.allow
			// If the file only has permissions, it's Pantheon-created
			if (
				settings.permissions &&
				Object.keys(settings).length === 1 &&
				!dryRun
			) {
				rmSync(settingsPath, { force: true });
				s.removed++;
			} else if (settings.permissions && !dryRun) {
				// User had other settings — just remove the permissions key
				delete settings.permissions;
				writeFileSync(
					settingsPath,
					`${JSON.stringify(settings, null, 2)}\n`,
					"utf8",
				);
				s.removed++;
			} else if (settings.permissions) {
				s.removed++;
				console.log(
					"  ~ Would remove Pantheon permissions from .claude/settings.json",
				);
			} else {
				s.skipped++;
			}
		} catch {
			s.skipped++;
		}
	} else {
		s.skipped++;
	}

	// 3. Remove CLAUDE.md if it has Pantheon content
	const claudeMdPath = join(target, "CLAUDE.md");
	if (fileContainsPantheonContent(claudeMdPath)) {
		if (!dryRun) {
			try {
				rmSync(claudeMdPath, { force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove CLAUDE.md: ${err.message}`);
				s.errors++;
			}
		} else {
			s.removed++;
			console.log("  ~ Would remove CLAUDE.md (Pantheon content)");
		}
	} else {
		s.skipped++;
	}

	// 4. Remove .claude/ (if empty after cleanup)
	const claudeDir = join(target, ".claude");
	if (existsSync(claudeDir)) {
		try {
			const entries = readdirSync(claudeDir);
			if (entries.length === 0) {
				if (!dryRun) {
					rmSync(claudeDir, { recursive: true, force: true });
				}
				// No need to count this — it's a cleanup step
			}
		} catch {
			/* ignore */
		}
	}
	// Note: AGENTS.md is handled by opencode uninstaller
}

/**
 * Cursor — remove .cursor/rules/*.mdc (only Pantheon rules)
 */
function uninstallCursor(target, dryRun) {
	const s = stats.cursor;

	const rulesDir = join(target, ".cursor", "rules");
	if (!existsSync(rulesDir)) {
		s.skipped++;
		return;
	}

	try {
		const entries = readdirSync(rulesDir);
		const pantheonFiles = entries.filter(
			(f) => f.endsWith(".mdc") && isPantheonAgentFile(f),
		);

		if (pantheonFiles.length === 0) {
			s.skipped++;
			return;
		}

		for (const f of pantheonFiles) {
			const fp = join(rulesDir, f);
			if (!dryRun) {
				try {
					rmSync(fp, { force: true });
					s.removed++;
				} catch (err) {
					console.error(`  ⚠️  Failed to remove ${fp}: ${err.message}`);
					s.errors++;
				}
			} else {
				s.removed++;
				console.log(`  ~ Would remove .cursor/rules/${f}`);
			}
		}

		// Remove rules/ directory if empty
		if (!dryRun && readdirSync(rulesDir).length === 0) {
			try {
				rmSync(rulesDir, { recursive: true, force: true });
			} catch {
				/* ignore */
			}
		}
	} catch (err) {
		console.error(`  ⚠️  Failed to read ${rulesDir}: ${err.message}`);
		s.errors++;
	}

	// Note: AGENTS.md is handled by opencode uninstaller
}

/**
 * Windsurf — remove .windsurf/rules/, remove .windsurf/workflows/ if empty
 */
function uninstallWindsurf(target, dryRun) {
	const s = stats.windsurf;

	// 1. Remove .windsurf/rules/
	const rulesDir = join(target, ".windsurf", "rules");
	if (existsSync(rulesDir)) {
		if (!dryRun) {
			try {
				rmSync(rulesDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${rulesDir}: ${err.message}`);
				s.errors++;
			}
		} else {
			const count = readdirSync(rulesDir).length;
			s.removed++;
			console.log(`  ~ Would remove .windsurf/rules/ (${count} files)`);
		}
	} else {
		s.skipped++;
	}

	// 2. Remove workflows that match Pantheon workflow names
	const wfDir = join(target, ".windsurf", "workflows");
	if (existsSync(wfDir)) {
		try {
			const entries = readdirSync(wfDir);
			const pantheonWorkflows = entries.filter(
				(f) =>
					f.endsWith(".md") &&
					[
						"orchestrate.md",
						"code-review.md",
						"audit.md",
						"cancel.md",
						"deepwork.md",
						"focus.md",
						"forge.md",
						"metamorphosis.md",
						"mirrordeps.md",
						"optimize.md",
						"pantheon-status.md",
						"pantheon.md",
						"ping.md",
						"praxis.md",
						"reflect.md",
						"sketch.md",
						"stop-continuation.md",
						"subtask.md",
					].includes(f),
			);

			for (const f of pantheonWorkflows) {
				const fp = join(wfDir, f);
				if (!dryRun) {
					try {
						rmSync(fp, { force: true });
						s.removed++;
					} catch (err) {
						console.error(`  ⚠️  Failed to remove ${fp}: ${err.message}`);
						s.errors++;
					}
				} else {
					s.removed++;
					console.log(`  ~ Would remove .windsurf/workflows/${f}`);
				}
			}

			// Remove workflows/ directory if empty
			if (
				!dryRun &&
				existsSync(wfDir) &&
				readdirSync(wfDir).length === 0
			) {
				try {
					rmSync(wfDir, { recursive: true, force: true });
				} catch {
					/* ignore */
				}
			}
		} catch (err) {
			console.error(`  ⚠️  Failed to read ${wfDir}: ${err.message}`);
			s.errors++;
		}
	} else {
		s.skipped++;
	}

	// Note: AGENTS.md is handled by opencode uninstaller
}

/**
 * VS Code / Copilot — remove .github/agents/, restore .vscode/settings.json
 */
function uninstallCopilot(target, dryRun) {
	const s = stats.copilot;

	// 1. Remove .github/agents/ (entire directory — Pantheon-created)
	const agentsDir = join(target, ".github", "agents");
	if (existsSync(agentsDir)) {
		if (!dryRun) {
			try {
				rmSync(agentsDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${agentsDir}: ${err.message}`);
				s.errors++;
			}
		} else {
			const count = existsSync(agentsDir)
				? readdirSync(agentsDir).length
				: 0;
			s.removed++;
			console.log(`  ~ Would remove .github/agents/ (${count} files)`);
		}
	} else {
		s.skipped++;
	}

	// 2. Restore .vscode/settings.json — remove Pantheon-added keys
	const settingsPath = join(target, ".vscode", "settings.json");
	if (existsSync(settingsPath)) {
		try {
			const raw = readFileSync(settingsPath, "utf8");
			const settings = JSON.parse(raw);
			let changed = false;

			// Remove the Pantheon-specific settings that the installer added
			const pantheonKeys = [
				"chat.subagents.allowInvocationsFromSubagents",
				"chat.plugins.enabled",
			];

			for (const key of pantheonKeys) {
				if (key in settings) {
					delete settings[key];
					changed = true;
				}
			}

			if (changed) {
				if (!dryRun) {
					writeFileSync(
						settingsPath,
						`${JSON.stringify(settings, null, 2)}\n`,
						"utf8",
					);
					s.removed++;
				} else {
					s.removed++;
					console.log(
						"  ~ Would restore .vscode/settings.json (remove Pantheon keys)",
					);
				}
			} else {
				s.skipped++;
			}
		} catch (err) {
			console.error(
				`  ⚠️  Failed to process .vscode/settings.json: ${err.message}`,
			);
			s.errors++;
		}
	} else {
		s.skipped++;
	}

	// Note: AGENTS.md is handled by opencode uninstaller
}

/**
 * Continue.dev — remove .continue/rules/, check .continue/config.yaml
 */
function uninstallContinue(target, dryRun) {
	const s = stats.continue;

	// 1. Remove .continue/rules/ (entire directory — Pantheon-created)
	const rulesDir = join(target, ".continue", "rules");
	if (existsSync(rulesDir)) {
		if (!dryRun) {
			try {
				rmSync(rulesDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				console.error(`  ⚠️  Failed to remove ${rulesDir}: ${err.message}`);
				s.errors++;
			}
		} else {
			const count = readdirSync(rulesDir).length;
			s.removed++;
			console.log(`  ~ Would remove .continue/rules/ (${count} files)`);
		}
	} else {
		s.skipped++;
	}

	// 2. Check .continue/config.yaml for Pantheon references
	const configPath = join(target, ".continue", "config.yaml");
	if (existsSync(configPath)) {
		try {
			const content = readFileSync(configPath, "utf8");
			if (
				content.includes("Pantheon") ||
				content.includes("pantheon") ||
				/rules\/\w+\.md/.test(content)
			) {
				if (!dryRun) {
					// Note: We don't auto-edit yaml (too risky with formatting),
					// but we inform the user
					console.log(
						"  ℹ️  .continue/config.yaml references Pantheon rules — manual cleanup may be needed",
					);
				} else {
					console.log(
						"  ~ Would check .continue/config.yaml for Pantheon references",
					);
				}
				s.removed++;
			} else {
				s.skipped++;
			}
		} catch {
			s.skipped++;
		}
	} else {
		s.skipped++;
	}

	// 3. Remove .continue/.opencode/ if present (from sync)
	const opencodeDir = join(target, ".continue", ".opencode");
	if (existsSync(opencodeDir)) {
		if (!dryRun) {
			try {
				rmSync(opencodeDir, { recursive: true, force: true });
				s.removed++;
			} catch (err) {
				/* ignore */
			}
		} else {
			s.removed++;
			console.log("  ~ Would remove .continue/.opencode/ shared config");
		}
	}
}

/**
 * Cline — remove .clinerules/ (only agent rules, not commands/skills if shared)
 */
function uninstallCline(target, dryRun) {
	const s = stats.cline;

	const clineDir = join(target, ".clinerules");
	if (!existsSync(clineDir)) {
		s.skipped++;
		return;
	}

	try {
		const entries = readdirSync(clineDir);
		const agentFiles = entries.filter(
			(f) => statSync(join(clineDir, f)).isFile() && isPantheonAgentFile(f),
		);

		if (agentFiles.length === 0) {
			s.skipped++;
			return;
		}

		for (const f of agentFiles) {
			const fp = join(clineDir, f);
			if (!dryRun) {
				try {
					rmSync(fp, { force: true });
					s.removed++;
				} catch (err) {
					console.error(`  ⚠️  Failed to remove ${fp}: ${err.message}`);
					s.errors++;
				}
			} else {
				s.removed++;
				console.log(`  ~ Would remove .clinerules/${f}`);
			}
		}

		// Remove .clinerules/ directory if empty (no shared commands/skills remain)
		if (!dryRun && readdirSync(clineDir).length === 0) {
			try {
				rmSync(clineDir, { recursive: true, force: true });
			} catch {
				/* ignore */
			}
		}
	} catch (err) {
		console.error(`  ⚠️  Failed to read ${clineDir}: ${err.message}`);
		s.errors++;
	}
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printUninstallSummary(target, platforms) {
	console.log("");
	console.log("=".repeat(60));
	console.log("🗑️  Uninstall Summary");
	console.log(`   Target: ${target}`);
	console.log("=".repeat(60));

	let totalRemoved = 0;
	let totalSkipped = 0;
	let totalErrors = 0;

	for (const platform of platforms) {
		const label = PLATFORM_LABELS[platform] ?? platform;
		const pStats = stats[platform];
		totalRemoved += pStats.removed;
		totalSkipped += pStats.skipped;
		totalErrors += pStats.errors;

		const status = pStats.errors > 0 ? "⚠️" : "✅";
		console.log(
			` ${status} ${label}: ${pStats.removed} removed, ${pStats.skipped} skipped${pStats.errors > 0 ? `, ${pStats.errors} errors` : ""}`,
		);
	}

	console.log("-".repeat(60));
	console.log(
		`   Total: ${totalRemoved} items removed, ${totalSkipped} items skipped, ${totalErrors} errors`,
	);

	if (totalErrors > 0) {
		console.log("   ⚠️  Some platforms had errors — review warnings above.");
	}

	if (totalRemoved === 0 && totalSkipped > 0) {
		console.log("   ℹ️  No Pantheon files found for the selected platforms.");
	}

	console.log("");
	if (totalRemoved > 0) {
		console.log("   📖 To verify, check the target directory for remaining Pantheon files.");
		console.log("   📚 Reinstall: node scripts/install.mjs --target " + target);
	}
	console.log("");
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

	const target = args.target;

	if (!existsSync(target)) {
		console.error(`❌ Target directory does not exist: ${target}`);
		process.exit(1);
	}

	let platforms = args.platforms;

	if (platforms && platforms.includes("all")) {
		platforms = [...ALL_PLATFORMS];
	} else if (!platforms) {
		const detected = detectPlatforms(target);
		if (detected.length === 0) {
			console.log(
				`🔍 No Pantheon platform config detected in ${target}`,
			);
			console.log("   Uninstalling all platforms.\n");
			platforms = [...ALL_PLATFORMS];
		} else {
			console.log(
				`🔍 Detected platforms in ${target}: ${detected.join(", ")}\n`,
			);
			platforms = detected;
		}
	}

	console.log(
		args.dryRun
			? "🔍 Dry-run mode — no files will be deleted\n"
			: "",
	);
	console.log(`📦 Pantheon Uninstaller`);
	console.log(`   Target: ${target}`);
	console.log(`   Platforms: ${platforms.join(", ")}\n`);

	// Confirmation (skip in dry-run mode, unless --force)
	if (!args.dryRun && !args.force) {
		const ok = await confirmPrompt(
			`⚠️  This will remove Pantheon agent files from ${target}\n   Proceed? [y/N] `,
		);
		if (!ok) {
			console.log("❌ Uninstall cancelled.");
			process.exit(0);
		}
		console.log("");
	}

	for (const platform of platforms) {
		const label = PLATFORM_LABELS[platform] ?? platform;
		console.log(`🗑️  ${label}`);

		switch (platform) {
			case "opencode":
				uninstallOpenCode(target, args.dryRun);
				break;
			case "claude":
				uninstallClaude(target, args.dryRun);
				break;
			case "cursor":
				uninstallCursor(target, args.dryRun);
				break;
			case "windsurf":
				uninstallWindsurf(target, args.dryRun);
				break;
			case "copilot":
				uninstallCopilot(target, args.dryRun);
				break;
			case "continue":
				uninstallContinue(target, args.dryRun);
				break;
			case "cline":
				uninstallCline(target, args.dryRun);
				break;
			default:
				console.warn(`  ⚠️  Unknown platform: ${platform} — skipping`);
				break;
		}
	}

	printUninstallSummary(target, platforms);
	process.exit(0);
}

main().catch((err) => {
	console.error(`❌ Uninstall failed: ${err.message}`);
	process.exit(1);
});
