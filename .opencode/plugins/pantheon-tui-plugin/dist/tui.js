// tui.tsx
import { createMemo, createSignal, Show, For } from "solid-js";
import { jsxDEV } from "@opentui/solid/jsx-dev-runtime";
var PYTHON_VERSION = "3.12.3";
async function readPantheonVersion(api) {
  try {
    const result = await api.client.file.read({
      query: { path: "pyproject.toml" }
    });
    const match = result.content.match(/^version\s*=\s*"([^"]+)"/m);
    return match?.[1] ?? "dev";
  } catch {
    return "dev";
  }
}
var COMMANDS = [
  { name: "/pantheon", desc: "Council synthesis" },
  { name: "/pantheon-status", desc: "System status" },
  { name: "/audit", desc: "Full audit" },
  { name: "/cancel", desc: "Cancel task" },
  { name: "/deepwork", desc: "Deep work mode" },
  { name: "/focus", desc: "Focus on scope" },
  { name: "/forge", desc: "Forge ahead" },
  { name: "/metamorphosis", desc: "Code migration" },
  { name: "/mirrordeps", desc: "Mirror dependencies" },
  { name: "/optimize", desc: "Optimize code" },
  { name: "/ping", desc: "Health check" },
  { name: "/praxis", desc: "Practice mode" },
  { name: "/reflect", desc: "Reflect on state" },
  { name: "/sketch", desc: "Quick prototype" },
  { name: "/stop-continuation", desc: "Stop auto-continue" },
  { name: "/subtask", desc: "Lightweight task" }
];
var AGENTS = [
  { name: "zeus", tier: "default", role: "Orchestrator" },
  { name: "athena", tier: "premium", role: "Strategic planner" },
  { name: "apollo", tier: "fast", role: "Codebase discovery" },
  { name: "hermes", tier: "default", role: "Backend" },
  { name: "aphrodite", tier: "default", role: "Frontend" },
  { name: "demeter", tier: "default", role: "Database" },
  { name: "themis", tier: "premium", role: "Quality & security" },
  { name: "prometheus", tier: "default", role: "Infrastructure" },
  { name: "hephaestus", tier: "default", role: "AI pipelines" },
  { name: "nyx", tier: "fast", role: "Observability" },
  { name: "gaia", tier: "fast", role: "Remote sensing" },
  { name: "iris", tier: "fast", role: "GitHub operations" },
  { name: "mnemosyne", tier: "fast", role: "Memory bank" },
  { name: "talos", tier: "fast", role: "Hotfixes" }
];
var BAR_WIDTH = 20;
function fmt(v) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(v)));
}
function safeNum(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function msgTokens(m) {
  return safeNum(m?.tokens?.input) + safeNum(m?.tokens?.output) + safeNum(m?.tokens?.reasoning) + safeNum(m?.tokens?.cache?.read) + safeNum(m?.tokens?.cache?.write);
}
function buildBar(pct) {
  const c = Math.max(0, Math.min(100, pct));
  const f = Math.max(0, Math.min(BAR_WIDTH, Math.round(c / 100 * BAR_WIDTH)));
  return { bar: "█".repeat(f) + "░".repeat(BAR_WIDTH - f), clamped: c };
}
function handleCompress(api) {
  try {
    const cmdApi = api.command;
    if (cmdApi?.trigger) {
      cmdApi.trigger("compact");
    } else {
      api.ui?.toast?.({
        title: "Compression",
        message: "Auto-compaction enabled; manual trigger unavailable in this version"
      });
    }
  } catch {
    api.ui?.toast?.({ title: "Compression", message: "Manual compress unavailable" });
  }
}
function View(props) {
  const [showAgents, setShowAgents] = createSignal(true);
  const [showCommands, setShowCommands] = createSignal(true);
  const theme = () => props.api.theme.current;
  const branch = createMemo(() => props.api.state.vcs?.branch ? `⎇ ${props.api.state.vcs.branch}` : null);
  const usage = createMemo(() => {
    const msgs = props.api.state.session.messages(props.sessionID);
    if (!msgs?.length)
      return null;
    const last = [...msgs].reverse().find((m) => {
      const role = m?.role ?? m?.info?.role;
      return role === "assistant" && safeNum(m?.tokens?.output) > 0;
    });
    if (!last)
      return null;
    const tokens = msgTokens(last);
    const pid = last?.providerID ?? last?.info?.providerID;
    const mid = last?.modelID ?? last?.info?.modelID;
    const model = pid && mid ? props.api.state.provider?.find((p) => p.id === pid)?.models?.[mid] : null;
    const cw = safeNum(model?.limit?.context);
    return {
      tokens,
      contextWindow: cw,
      percent: cw > 0 ? Math.round(tokens / cw * 100) : 0
    };
  });
  const cost = createMemo(() => {
    const ss = props.api.state?.session;
    const fromState = safeNum(ss?.get?.(props.sessionID)?.cost);
    if (fromState > 0)
      return fromState;
    const msgs = props.api.state.session.messages(props.sessionID);
    return (msgs ?? []).filter((m) => (m?.role ?? m?.info?.role) === "assistant").reduce((s, m) => s + safeNum(m?.cost), 0);
  });
  const bar = createMemo(() => {
    const u = usage();
    if (!u || u.contextWindow === 0)
      return null;
    const b = buildBar(u.percent);
    const color = u.percent >= 90 ? theme().error : u.percent >= 70 ? theme().warning : theme().accent;
    return {
      bar: b.bar,
      pct: b.clamped,
      tokens: u.tokens,
      window: u.contextWindow,
      color
    };
  });
  return /* @__PURE__ */ jsxDEV("box", {
    flexDirection: "column",
    width: "100%",
    children: [
      /* @__PURE__ */ jsxDEV("box", {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        children: [
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().accent,
            attributes: { bold: true },
            children: "⚡ Pantheon"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().textMuted,
            children: [
              " ",
              props.version,
              " · Python ",
              PYTHON_VERSION
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(Show, {
        when: branch(),
        children: (b) => /* @__PURE__ */ jsxDEV("box", {
          marginTop: 1,
          children: /* @__PURE__ */ jsxDEV("text", {
            fg: theme().textMuted,
            children: b()
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Show, {
        when: bar(),
        children: (b) => /* @__PURE__ */ jsxDEV("box", {
          marginTop: 1,
          flexDirection: "column",
          children: [
            /* @__PURE__ */ jsxDEV("text", {
              fg: theme().text,
              attributes: { bold: true },
              children: "Context"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("box", {
              flexDirection: "row",
              gap: 1,
              children: [
                /* @__PURE__ */ jsxDEV("text", {
                  fg: b().color,
                  children: b().bar
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("text", {
                  fg: b().color,
                  children: [
                    b().pct,
                    "%"
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("text", {
              fg: theme().textMuted,
              children: [
                fmt(b().tokens),
                " / ",
                fmt(b().window),
                " / $",
                cost().toFixed(2)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("box", {
        marginTop: 1,
        onMouseDown: () => handleCompress(props.api),
        children: /* @__PURE__ */ jsxDEV("text", {
          fg: theme().textMuted,
          children: "[Compress]"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("box", {
        marginTop: 1,
        onMouseDown: () => setShowCommands((x) => !x),
        children: [
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().text,
            children: showCommands() ? "▼" : "▶"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().text,
            attributes: { bold: true },
            children: [
              " ",
              "Commands"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().textMuted,
            children: [
              " (",
              COMMANDS.length,
              ")"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(Show, {
        when: showCommands(),
        children: /* @__PURE__ */ jsxDEV(For, {
          each: COMMANDS,
          children: (cmd) => /* @__PURE__ */ jsxDEV("box", {
            marginLeft: 1,
            children: [
              /* @__PURE__ */ jsxDEV("text", {
                fg: cmd.name === "/pantheon" ? theme().accent : theme().textMuted,
                children: cmd.name
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("text", {
                fg: theme().textMuted,
                children: [
                  " — ",
                  cmd.desc
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("box", {
        marginTop: 1,
        onMouseDown: () => setShowAgents((x) => !x),
        children: [
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().text,
            children: showAgents() ? "▼" : "▶"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().text,
            attributes: { bold: true },
            children: [
              " ",
              "Agents"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV("text", {
            fg: theme().textMuted,
            children: [
              " (",
              AGENTS.length,
              ")"
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV(Show, {
        when: showAgents(),
        children: /* @__PURE__ */ jsxDEV(For, {
          each: AGENTS,
          children: (agent) => /* @__PURE__ */ jsxDEV("box", {
            marginLeft: 1,
            children: [
              /* @__PURE__ */ jsxDEV("text", {
                fg: agent.tier === "premium" ? theme().accent : theme().textMuted,
                children: [
                  agent.tier === "premium" ? "✦ " : "· ",
                  agent.name
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV("text", {
                fg: theme().textMuted,
                children: [
                  " — ",
                  agent.role
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
var tui = async (api, _options, _meta) => {
  const version = await readPantheonVersion(api);
  api.slots.register({
    order: 900,
    slots: {
      sidebar_content(_ctx, props) {
        return /* @__PURE__ */ jsxDEV(View, {
          api,
          sessionID: props.session_id,
          version
        }, undefined, false, undefined, this);
      }
    }
  });
};
var plugin = {
  id: "pantheon.tui",
  tui
};
var tui_default = plugin;
export {
  tui_default as default
};
