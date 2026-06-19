#!/usr/bin/env node
/**
 * agents-md.mjs — Dynamic AGENTS.md generator from canonical agent frontmatter
 *
 * Reads all agents/*.agent.md files, extracts name + description from frontmatter,
 * and generates AGENTS.md content dynamically. Eliminates hardcoded agent tables
 * in platform installers (claude.mjs, cursor.mjs, windsurf.mjs, cline.mjs, etc.).
 *
 * Usage (CLI):
 *   node agents-md.mjs                      # write AGENTS.md to cwd
 *   node agents-md.mjs /target/dir          # write AGENTS.md to target dir
 *   node agents-md.mjs /target/dir "Claude" # with platform name
 *
 * Usage (import):
 *   import { readCanonicalAgents, generateAgentsMd } from './agents-md.mjs';
 *   const agents = readCanonicalAgents();
 *   const md = generateAgentsMd(agents, 'Claude Code', extraSections);
 *   writeFileSync('/path/AGENTS.md', md);
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..");
export const AGENTS_DIR = join(ROOT, "agents");

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from an agent markdown file content.
 *
 * @param {string} content - Raw content of a .agent.md file
 * @returns {{ name: string, description: string, color?: string } | null}
 *   Parsed agent metadata, or null if no valid frontmatter with a `name` field.
 */
function parseAgentFrontmatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;

	try {
		const fm = yaml.load(match[1]);
		if (!fm || typeof fm !== "object" || !fm.name) return null;
		return {
			name: String(fm.name),
			description: fm.description ? String(fm.description) : "",
			color: fm.color ? String(fm.color) : undefined,
		};
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Exported API
// ---------------------------------------------------------------------------

/**
 * Read all canonical agents/*.agent.md files, parse frontmatter,
 * and return an array of agent metadata objects sorted alphabetically by name.
 *
 * Skips files that don't match the `*.agent.md` pattern, files without
 * valid YAML frontmatter, and entries without a `name` field.
 *
 * @returns {Array<{ name: string, description: string, color?: string }>}
 */
export function readCanonicalAgents() {
	if (!existsSync(AGENTS_DIR)) return [];

	const files = readdirSync(AGENTS_DIR)
		.filter((f) => f.endsWith(".agent.md"))
		.sort();

	const agents = [];
	for (const file of files) {
		const filePath = join(AGENTS_DIR, file);
		let content;
		try {
			content = readFileSync(filePath, "utf8");
		} catch {
			continue; // skip unreadable files
		}

		const parsed = parseAgentFrontmatter(content);
		if (parsed) {
			agents.push(parsed);
		}
	}

	return agents.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generate a markdown table from an agents array.
 *
 * @param {Array<{ name: string, description: string }>} agents
 * @returns {string} Markdown table string.
 *
 * @example
 *   | Agent | Role |
 *   |-------|------|
 *   | @zeus | Central orchestrator |
 *   | @hermes | Backend (FastAPI) |
 */
export function generateAgentsTable(agents) {
	const rows = ["| Agent | Role |", "|-------|------|"];
	for (const agent of agents) {
		const role = (agent.description || "").replace(/\n/g, " ");
		rows.push(`| @${agent.name} | ${role} |`);
	}
	return rows.join("\n");
}

/**
 * Generate complete AGENTS.md content.
 *
 * @param {Array<{ name: string, description: string }>} agents
 *   Agent list from `readCanonicalAgents()`.
 * @param {string} [platformName='']
 *   Optional platform name appended to the title (e.g., 'Cursor', 'Cline').
 * @param {string} [extraSections='']
 *   Optional extra markdown content inserted between the agent table and
 *   the Commands section. Pass platform-specific notes, workflow references,
 *   setup instructions, etc.
 * @returns {string} Complete AGENTS.md content.
 *
 * @example
 *   const md = generateAgentsMd(agents, 'Cline', '## Cline Setup\n...');
 *   writeFileSync('AGENTS.md', md);
 */
export function generateAgentsMd(
	agents,
	platformName = "",
	extraSections = "",
) {
	const agentCount = agents.length;
	const title = platformName
		? `# Pantheon Agent System — ${platformName}`
		: "# Pantheon Agent System";
	const agentTable = generateAgentsTable(agents);

	const sections = [
		title,
		"",
		`This project uses the Pantheon multi-agent framework with ${agentCount} specialized agents.`,
		"",
		"## Available Agents",
		"",
		agentTable,
	];

	if (extraSections) {
		sections.push("", extraSections.trimEnd());
	}

	sections.push(
		"",
		"## Commands",
		"",
		"- Build: `npm run build`",
		"- Test: `npm test`",
		"- Lint: `npm run lint`",
		"",
		"## Conventions",
		"",
		"- TDD: Write failing test first, then implement",
		"- Coverage minimum: 80%",
		"- Async/await on all I/O",
		"- Type hints on all functions",
		"",
	);

	return sections.join("\n");
}

/**
 * High-level convenience function that reads canonical agents, generates
 * AGENTS.md content, and writes it to the target directory.
 *
 * @param {string} targetDir - Directory to write AGENTS.md into.
 * @param {string} [platformName=''] - Optional platform name for the title.
 * @param {string} [extraSections=''] - Optional extra sections to include.
 * @returns {string} The generated content (also written to disk).
 */
export function generateAgentsMdForPlatform(
	targetDir,
	platformName = "",
	extraSections = "",
) {
	const agents = readCanonicalAgents();
	const content = generateAgentsMd(agents, platformName, extraSections);
	const outputPath = join(targetDir, "AGENTS.md");
	writeFileSync(outputPath, content, "utf8");
	return content;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	const targetDir = process.argv[2] || process.cwd();
	const platformName = process.argv[3] || "";
	const extraSections = process.argv[4] || "";

	try {
		const content = generateAgentsMdForPlatform(
			targetDir,
			platformName,
			extraSections,
		);
		const agentCount = (content.match(/^\| @/gm) || []).length;
		console.log(
			`✅ Generated AGENTS.md in ${targetDir} (${agentCount} agents)`,
		);
	} catch (err) {
		console.error(`❌ Failed to generate AGENTS.md: ${err.message}`);
		process.exit(1);
	}
}
