#!/usr/bin/env node
/**
 * health-check.mjs — Post-installation validation checks
 *
 * Usage:
 *   node scripts/install/health-check.mjs --target ~/.config/opencode
 *   node scripts/install/health-check.mjs --target ~/.config/opencode --dry-run
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Run health checks against a Pantheon installation target.
 * Reports results as { passed, failed, warnings } arrays.
 * NON-FATAL — all checks are reported, none throw.
 *
 * @param {string} target - Installation directory
 * @param {{ dryRun?: boolean }} [options]
 * @returns {{ passed: Array<{check: string, detail: string}>, failed: Array<{check: string, detail: string}>, warnings: Array<{check: string, detail: string}> }}
 */
export function healthCheck(target, { dryRun = false } = {}) {
	const results = { passed: [], failed: [], warnings: [] };
	const python = findPython(target);

	// Check 1: Critical runtime scripts exist
	const scripts = ["mcp_persistence_server.py", "_pantheon_paths.py"];
	for (const script of scripts) {
		const path = join(target, "scripts", script);
		if (existsSync(path)) {
			results.passed.push({ check: `scripts/${script}`, detail: "exists" });
		} else {
			results.failed.push({
				check: `scripts/${script}`,
				detail: "NOT FOUND",
			});
		}
	}

	if (dryRun) return results;

	// Check 2: Syntax check on each MCP server script
	const mcpScripts = [
		"mcp_persistence_server.py",
		"mcp_resources_server.py",
		"code_mode_server.py",
		"memory_mcp_server.py",
	];
	for (const script of mcpScripts) {
		const path = join(target, "scripts", script);
		if (existsSync(path) && python) {
			const result = spawnSync(python, ["-m", "py_compile", path], {
				stdio: "pipe",
			});
			if (result.status === 0) {
				results.passed.push({
					check: `syntax:${script}`,
					detail: "valid",
				});
			} else {
				results.failed.push({
					check: `syntax:${script}`,
					detail: result.stderr.toString().trim().split("\n").slice(-1)[0],
				});
			}
		}
	}

	// Check 3: _pantheon_paths import works
	if (python) {
		const importCmd = [
			"-c",
			"import sys; sys.path.insert(0, '" +
				join(target, "scripts") +
				"'); " +
				"from _pantheon_paths import pantheon_home; print(pantheon_home())",
		];
		const result = spawnSync(python, importCmd, { stdio: "pipe" });
		if (result.status === 0) {
			results.passed.push({
				check: "_pantheon_paths import",
				detail: result.stdout.toString().trim(),
			});
		} else {
			results.failed.push({
				check: "_pantheon_paths import",
				detail: result.stderr.toString().trim().split("\n").slice(-1)[0],
			});
		}
	}

	// Check 3.5: mcp SDK importable (required by ALL MCP servers)
	if (python) {
		const mcpResult = spawnSync(python, ["-c", "from mcp.server.fastmcp import FastMCP; print(FastMCP.__module__)"], { stdio: "pipe" });
		if (mcpResult.status === 0) {
			results.passed.push({ check: "mcp-sdk", detail: mcpResult.stdout.toString().trim() });
		} else {
			results.failed.push({ check: "mcp-sdk", detail: "NOT INSTALLED — all MCP servers will fail" });
		}
	}
	// Check 4: chromadb importable
	if (python) {
		const result = spawnSync(python, [
			"-c",
			"from fastembed import TextEmbedding; print(TextEmbedding.__module__)",
		], { stdio: "pipe" });
		if (result.status === 0) {
			results.passed.push({
				check: "chromadb",
				detail: result.stdout.toString().trim(),
			});
		} else {
			results.warnings.push({
				check: "chromadb",
				detail: "NOT INSTALLED — semantic search will fail"
			});
		}
	}

	// Check 5: SQLite FTS5 available
	if (python) {
		const fts5Cmd = [
			"-c",
			"import sqlite3; " +
				"row = sqlite3.connect(':memory:').execute('PRAGMA compile_options').fetchall(); " +
				"fts5 = any('ENABLE_FTS5' in str(r[0]) for r in row); " +
				"print(f'SQLite {sqlite3.sqlite_version} FTS5={fts5}')",
		];
		const result = spawnSync(python, fts5Cmd, { stdio: "pipe" });
		if (result.status === 0) {
			results.passed.push({
				check: "sqlite-fts5",
				detail: result.stdout.toString().trim(),
			});
		} else {
			results.failed.push({
				check: "sqlite-fts5",
				detail: result.stderr.toString().trim().split("\n").slice(-1)[0],
			});
		}
	}

	return results;
}

/**
 * Find the target's venv python, falling back to system python3.
 * @param {string} target
 * @returns {string|null}
 */
function findPython(target) {
	const candidates = [
		join(target, ".venv", "bin", "python3"),
		join(target, ".venv", "bin", "python"),
	];
	for (const c of candidates) {
		if (existsSync(c)) return c;
	}
	// Check if python3 is even available
	const probe = spawnSync("which", ["python3"], { stdio: "pipe" });
	return probe.status === 0 ? "python3" : null;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
function main() {
	const args = process.argv.slice(2);
	const targetIdx = args.indexOf("--target");
	const target = targetIdx !== -1 ? args[targetIdx + 1] : process.cwd();
	const dryRun = args.includes("--dry-run");

	const results = healthCheck(target, { dryRun });

	console.log("\n  📊 Health Check:");
	for (const p of results.passed)
		console.log(`    ✅ ${p.check}: ${p.detail}`);
	for (const w of results.warnings)
		console.log(`    ⚠️  ${w.check}: ${w.detail}`);
	for (const f of results.failed)
		console.log(`    ❌ ${f.check}: ${f.detail}`);

	console.log(
		`\n  Summary: ${results.passed.length} passed, ${results.warnings.length} warnings, ${results.failed.length} failed`,
	);

	if (results.failed.length > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
	main();
}
