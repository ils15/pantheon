/**
 * Pantheon TUI Plugin — Sidebar Status
 *
 * Renders a sidebar panel in the OpenCode TUI showing:
 *   - Pantheon version badge (reads plugin.json / package.json)
 *   - Model tier indicator (Pro / Free)
 *   - Full agent registry with role + tier
 *
 * Based on the OpenCode TUI Plugin API (@opencode-ai/plugin/tui).
 * Pattern adapted from oh-my-opencode-slim's tui.ts.
 *
 * Placement: .opencode/plugins/pantheon-tui.ts (auto-loaded by OpenCode)
 *
 * NOTE: @ts-nocheck is intentional — this plugin runs inside the OpenCode
 * runtime where @opencode-ai/plugin and @opentui/solid are installed.
 * The Pantheon repo itself is not a TypeScript project, so type checking
 * happens at install time (~/.config/opencode/), not in the source repo.
 */
// @ts-nocheck

import type { TuiPluginModule } from "@opencode-ai/plugin/tui"
import type { JSX } from "@opentui/solid"
import { createElement, insert, setProp } from "@opentui/solid"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const PLUGIN_NAME = "pantheon"
const BORDER = { type: "single" } as const

type Child = JSX.Element | string | number | null | undefined | false

// ─── Agent Registry (mirrors routing.yml) ───────────────────────────────────

interface AgentEntry {
  name: string
  role: string
  tier: "premium" | "default" | "fast"
}

const AGENTS: AgentEntry[] = [
  { name: "zeus", role: "Central orchestrator", tier: "default" },
  { name: "athena", role: "Strategic planner", tier: "premium" },
  { name: "apollo", role: "Codebase discovery", tier: "fast" },
  { name: "hermes", role: "Backend (FastAPI)", tier: "default" },
  { name: "aphrodite", role: "Frontend (React)", tier: "default" },
  { name: "demeter", role: "Database", tier: "default" },
  { name: "themis", role: "Quality & security", tier: "premium" },
  { name: "prometheus", role: "Infrastructure", tier: "default" },
  { name: "hephaestus", role: "AI pipelines", tier: "default" },
  { name: "chiron", role: "Model routing", tier: "default" },
  { name: "echo", role: "Conversational AI", tier: "default" },
  { name: "nyx", role: "Observability", tier: "fast" },
  { name: "gaia", role: "Remote sensing", tier: "fast" },
  { name: "iris", role: "GitHub operations", tier: "fast" },
  { name: "mnemosyne", role: "Memory bank", tier: "fast" },
  { name: "talos", role: "Hotfixes", tier: "fast" },
  { name: "argus", role: "Visual analysis", tier: "fast" },
]

// ─── Version Detection ──────────────────────────────────────────────────────

function readVersion(): string {
  // Try plugin.json first (Pantheon canonical), then package.json
  for (const file of ["plugin.json", "package.json"]) {
    try {
      // Walk up from this plugin file to find the repo root
      const here = dirname(fileURLToPath(import.meta.url))
      // .opencode/plugins/ -> .opencode/ -> platform/opencode/ -> repo root
      const root = dirname(dirname(dirname(here)))
      const raw = readFileSync(join(root, file), "utf-8")
      const parsed = JSON.parse(raw) as { version?: unknown }
      if (typeof parsed.version === "string") return parsed.version
    } catch {
      // try next file
    }
  }
  return "dev"
}

// ─── JSX Helpers (opentui/solid low-level API) ──────────────────────────────

function element(
  tag: string,
  props: Record<string, unknown>,
  children: Child[] = [],
): JSX.Element {
  const node = createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) setProp(node, key, value)
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue
    insert(node, child)
  }
  return node as JSX.Element
}

function text(props: Record<string, unknown>, children: Child[]): JSX.Element {
  return element("text", props, children)
}

function box(
  props: Record<string, unknown>,
  children: Child[] = [],
): JSX.Element {
  return element("box", props, children)
}

// ─── Render Functions ───────────────────────────────────────────────────────

function tierBadge(tier: string, theme: Theme): JSX.Element {
  const color =
    tier === "premium" ? theme.accent : tier === "default" ? theme.text : theme.textMuted
  return text({ fg: color }, [`[${tier}]`])
}

function agentRow(agent: AgentEntry, theme: Theme): JSX.Element {
  return box({ width: "100%", flexDirection: "row", paddingLeft: 1 }, [
    text({ fg: theme.text, width: 14 }, [`@${agent.name}`]),
    text({ fg: theme.textMuted, width: 24 }, [agent.role]),
    tierBadge(agent.tier, theme),
  ])
}

interface Theme {
  accent: unknown
  background: unknown
  borderActive: unknown
  text: unknown
  textMuted: unknown
}

function renderSidebar(version: string, theme: Theme): JSX.Element {
  const hasPremium = AGENTS.some((a) => a.tier === "premium")
  const tierLabel = hasPremium ? "Pro" : "Free"

  return box(
    {
      width: "100%",
      flexDirection: "column",
      border: BORDER,
      borderColor: theme.borderActive,
      paddingTop: 1,
      paddingBottom: 1,
      paddingLeft: 1,
      paddingRight: 1,
    },
    [
      // Header: badge + version
      box(
        {
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        [
          box(
            { paddingLeft: 1, paddingRight: 1, backgroundColor: theme.accent },
            [text({ fg: theme.background }, ["Pantheon"])],
          ),
          text({ fg: theme.textMuted }, [`v${version}`]),
        ],
      ),
      // Tier indicator
      box({ width: "100%", marginTop: 1 }, [
        text({ fg: theme.textMuted }, [`Tier: ${tierLabel} · ${AGENTS.length} agents`]),
      ]),
      // Agents header
      box({ width: "100%", marginTop: 1 }, [text({ fg: theme.text }, ["Agents"])]),
      // Agent rows
      ...AGENTS.map((a) => agentRow(a, theme)),
    ],
  )
}

// ─── Plugin Module ──────────────────────────────────────────────────────────

const plugin: TuiPluginModule & { id: string } = {
  id: `${PLUGIN_NAME}:tui`,
  tui: async (api, _options, meta) => {
    const version = meta.version ?? readVersion()

    api.slots.register({
      order: 900,
      slots: {
        sidebar_content() {
          return renderSidebar(version, api.theme.current as Theme)
        },
      },
    })
  },
}

export default plugin
