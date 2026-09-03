#!/usr/bin/env node
/**
 * Fail if README's tool catalog disagrees with the live server's `tools/list`.
 *
 * WHY THIS EXISTS
 * ---------------
 * This package is a transport-only bridge: it forwards JSON-RPC verbatim, so the
 * remote can add, rename and retire tools without a single line here changing.
 * That is the whole point of the design — and it is also why the README silently
 * went stale. It advertised 34 tools while 52 were live, and 7 of the 34 had been
 * consolidated away, so documented calls simply failed. Nothing tied the prose to
 * the server, so nothing caught it.
 *
 * `tools/list` needs no authentication, so this runs on any PR with no secrets.
 *
 * Usage: node scripts/check-catalog-parity.mjs
 *   MCP_URL   override the server (default https://mcp.tapetide.com)
 */

import { readFile } from "node:fs/promises";

const MCP_URL = process.env.MCP_URL || "https://mcp.tapetide.com";
const README = new URL("../README.md", import.meta.url);
const START = "<!-- tools:start";
const END = "<!-- tools:end";

/** Names documented in the fenced catalog block — first table cell only. */
async function documentedTools() {
  const md = await readFile(README, "utf-8");
  const from = md.indexOf(START);
  const to = md.indexOf(END);
  if (from === -1 || to === -1) {
    throw new Error(
      `README is missing the ${START} ... ${END} markers that fence the tool catalog.`,
    );
  }
  const names = new Set();
  for (const line of md.slice(from, to).split("\n")) {
    // `| \`tool_name\` | description |` — anchored so backticked names inside a
    // description (e.g. "Alias of `get_stock_quote`.") are not counted.
    const m = /^\|\s*`([a-z_][a-z0-9_]*)`\s*\|/.exec(line);
    if (m) names.add(m[1]);
  }
  return names;
}

/** Names the live server registers. Handles both JSON and SSE framing. */
async function liveTools() {
  const res = await fetch(`${MCP_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "User-Agent": "tapetide-mcp-catalog-parity",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`tools/list failed: HTTP ${res.status}`);

  const text = await res.text();
  const payload = (res.headers.get("content-type") || "").includes("text/event-stream")
    ? lastSseData(text)
    : text;

  const parsed = JSON.parse(payload);
  const tools = parsed?.result?.tools;
  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error("tools/list returned no tools — refusing to compare against an empty catalog.");
  }
  return new Set(tools.map((t) => t.name));
}

function lastSseData(sse) {
  let last = "";
  for (const line of sse.split("\n")) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data) continue;
    try {
      JSON.parse(data);
      last = data;
    } catch {
      /* keep-alive or partial event */
    }
  }
  if (!last) throw new Error("Could not extract a JSON-RPC payload from the SSE response.");
  return last;
}

async function main() {
  const [documented, live] = await Promise.all([documentedTools(), liveTools()]);

  const missing = [...live].filter((n) => !documented.has(n)).sort();
  const stale = [...documented].filter((n) => !live.has(n)).sort();

  console.log(`Documented in README: ${documented.size}`);
  console.log(`Live on ${MCP_URL}: ${live.size}`);

  if (missing.length === 0 && stale.length === 0) {
    console.log("\nCatalog parity OK.");
    return 0;
  }

  if (missing.length) {
    console.error(`\nLive but NOT documented (${missing.length}):`);
    for (const n of missing) console.error(`  + ${n}`);
  }
  if (stale.length) {
    console.error(`\nDocumented but NOT live (${stale.length}) — removed or renamed upstream:`);
    for (const n of stale) console.error(`  - ${n}`);
  }
  console.error(
    "\nUpdate the catalog between the tools:start / tools:end markers in README.md, " +
      "and move any removed name into the 'Retired tool names' table.",
  );
  return 1;
}

// A stack trace tells a reviewer nothing useful here; the message does.
process.exit(
  await main().catch((err) => {
    console.error(`\nCatalog parity check could not run: ${err instanceof Error ? err.message : err}`);
    return 1;
  }),
);
