#!/usr/bin/env node
/**
 * Tapetide Stock Research MCP Server — Local stdio bridge to the remote MCP server.
 *
 * Reads JSON-RPC from stdin, forwards to https://mcp.tapetide.com/mcp
 * with HMAC access token auth, writes responses to stdout.
 *
 * Auto-detects framing:
 *   - Content-Length framed (VS Code, Claude Desktop, spec-compliant)
 *   - Newline-delimited JSON (Kiro, Claude Code, some clients)
 *
 * Authentication:
 *   1. Uses TAPETIDE_TOKEN (refresh token) from env
 *   2. Exchanges for 1hr HMAC access token via POST /token
 *   3. Auto-refreshes when access token expires
 *
 * Get a token at https://tapetide.com/settings/tokens
 *
 * Design Log #035
 */

const MCP_URL = process.env.TAPETIDE_MCP_URL || "https://mcp.tapetide.com";
const REFRESH_TOKEN = process.env.TAPETIDE_TOKEN;
const DEBUG = process.env.TAPETIDE_DEBUG === "1";

if (!REFRESH_TOKEN) {
  process.stderr.write(
    "Error: TAPETIDE_TOKEN environment variable is required.\n" +
      "Get one at https://tapetide.com/settings/tokens\n",
  );
  process.exit(1);
}

// ── Auth ──────────────────────────────────────────────────────────────

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  // Prevent concurrent refresh calls — share a single in-flight promise.
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await fetch(`${MCP_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: REFRESH_TOKEN!,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Token refresh failed (${res.status}): ${body}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    accessToken = data.access_token;
    // Refresh 5 min before expiry to avoid edge cases. Guard against very short TTLs.
    tokenExpiresAt = Date.now() + Math.max(data.expires_in - 300, 0) * 1000;
  })();
  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function getAccessToken(): Promise<string> {
  if (!accessToken || Date.now() >= tokenExpiresAt) await refreshAccessToken();
  return accessToken!;
}

// ── Remote forwarding ─────────────────────────────────────────────────

const MCP_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
};

const REMOTE_TIMEOUT = 30_000; // 30s per request

async function forwardToRemote(body: string): Promise<string> {
  const token = await getAccessToken();
  const start = Date.now();
  let method: string | undefined;
  try { method = (JSON.parse(body) as { method?: string }).method; } catch { /* ignore */ }

  let res = await fetchWithTimeout(`${MCP_URL}/mcp`, {
    method: "POST",
    headers: { ...MCP_HEADERS, Authorization: `Bearer ${token}` },
    body,
  });

  // If 401, token may have expired between check and request. Retry once.
  if (res.status === 401) {
    accessToken = null;
    const freshToken = await getAccessToken();
    res = await fetchWithTimeout(`${MCP_URL}/mcp`, {
      method: "POST",
      headers: { ...MCP_HEADERS, Authorization: `Bearer ${freshToken}` },
      body,
    });
  }

  // Warn when approaching rate limits.
  const remaining = res.headers.get("X-RateLimit-Remaining");
  if (remaining !== null) {
    const rem = parseInt(remaining, 10);
    if (rem === 0) {
      const resetAt = res.headers.get("X-RateLimit-Reset");
      process.stderr.write(`Warning: Rate limit exhausted. Resets at ${resetAt ? new Date(parseInt(resetAt, 10) * 1000).toISOString() : "unknown"}.\n`);
    } else if (rem <= 10) {
      process.stderr.write(`Warning: ${rem} requests remaining before rate limit.\n`);
    }
  }

  // Handle SSE responses — extract JSON-RPC messages from event stream.
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const result = extractJsonFromSSE(await res.text());
    if (DEBUG) process.stderr.write(`[debug] ${method ?? "?"} → SSE ${res.status} (${Date.now() - start}ms)\n`);
    return result;
  }

  const text = await res.text();

  if (DEBUG) process.stderr.write(`[debug] ${method ?? "?"} → ${res.status} (${Date.now() - start}ms)\n`);

  // If the remote returned an HTTP error, wrap it as a JSON-RPC error
  // so the client can parse it properly.
  if (res.status >= 400) {
    let id: unknown = null;
    try { id = (JSON.parse(body) as { id?: unknown }).id ?? null; } catch { /* ignore */ }

    // Try to extract a human-readable message from the error body.
    let message = `Remote error (${res.status})`;
    try {
      const errBody = JSON.parse(text) as { error?: string; error_description?: string; message?: string };
      message = errBody.error_description || errBody.message || errBody.error || message;
    } catch {
      if (text) message = text.slice(0, 200);
    }

    return JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message },
    });
  }

  return text;
}

function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(REMOTE_TIMEOUT) });
}

/**
 * Extract JSON-RPC message from an SSE stream.
 * SSE format: `event: message\ndata: {...}\n\n`
 * We collect all `data:` lines and return the last one that parses as valid JSON,
 * which is the actual JSON-RPC response.
 */
function extractJsonFromSSE(sse: string): string {
  const lines = sse.split("\n");
  let lastValidJson = "";
  for (const line of lines) {
    const data = line.startsWith("data: ") ? line.slice(6) : line.startsWith("data:") ? line.slice(5) : null;
    if (data === null) continue;
    const trimmed = data.trim();
    if (!trimmed) continue;
    // Verify it's valid JSON before accepting it.
    try {
      JSON.parse(trimmed);
      lastValidJson = trimmed;
    } catch {
      // Not JSON — skip (could be a keep-alive or partial event).
    }
  }
  return lastValidJson || sse;
}

// ── Response writing ──────────────────────────────────────────────────

function writeFramed(json: string): void {
  const buf = Buffer.from(json, "utf-8");
  process.stdout.write(`Content-Length: ${buf.length}\r\n\r\n`);
  process.stdout.write(buf);
}

function writeNewline(json: string): void {
  process.stdout.write(json + "\n");
}

function makeError(id: unknown, message: string): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    error: { code: -32603, message },
  });
}

type WriteFn = (json: string) => void;

// ── Message handling ──────────────────────────────────────────────────

/**
 * Check if a JSON-RPC message is a notification (no `id` field).
 * Per JSON-RPC 2.0 spec, notifications MUST NOT receive a response.
 */
function isNotification(json: string): boolean {
  try {
    const msg = JSON.parse(json) as { id?: unknown; method?: string };
    // A notification has a method but no id (or id is undefined).
    return msg.method !== undefined && msg.id === undefined;
  } catch {
    return false;
  }
}

async function handleMessage(line: string, write: WriteFn): Promise<void> {
  // Forward notifications to remote but don't write a response back.
  if (isNotification(line)) {
    try {
      await forwardToRemote(line);
    } catch {
      // Notifications are fire-and-forget — errors are silently ignored.
    }
    return;
  }

  try {
    const response = await forwardToRemote(line);
    write(response);
  } catch (err) {
    let id: unknown = null;
    try {
      id = (JSON.parse(line) as { id?: unknown }).id ?? null;
    } catch {
      /* malformed JSON */
    }
    const message = err instanceof Error ? err.message : "Internal error";
    write(makeError(id, message));
  }
}

// ── Main loop ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Graceful shutdown.
  const shutdown = () => {
    process.stderr.write("Tapetide Stock Research MCP shutting down.\n");
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Pre-authenticate so first request is fast.
  try {
    await refreshAccessToken();
  } catch (err) {
    process.stderr.write(
      `Error: Failed to authenticate. Check your TAPETIDE_TOKEN.\n${err}\n`,
    );
    process.exit(1);
  }

  process.stderr.write("Tapetide Stock Research MCP connected. Waiting for requests...\n");

  // Auto-detect framing from first chunk.
  // Content-Length framed starts with "Content-Length:", newline-delimited starts with "{".
  let mode: "framed" | "newline" | null = null;
  let buffer = Buffer.alloc(0);

  for await (const chunk of process.stdin) {
    buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

    // Detect mode from first data received.
    if (mode === null) {
      const start = buffer.toString("utf-8", 0, Math.min(buffer.length, 20)).trimStart();
      mode = start.startsWith("{") ? "newline" : "framed";
    }

    if (mode === "newline") {
      let str = buffer.toString("utf-8");
      let idx: number;
      while ((idx = str.indexOf("\n")) !== -1) {
        const line = str.slice(0, idx).trim();
        str = str.slice(idx + 1);
        if (line) await handleMessage(line, writeNewline);
      }
      buffer = Buffer.from(str, "utf-8");
    } else {
      // Content-Length framed.
      while (true) {
        let headerEnd = buffer.indexOf("\r\n\r\n");
        let sepLen = 4;
        if (headerEnd === -1) {
          headerEnd = buffer.indexOf("\n\n");
          sepLen = 2;
        }
        if (headerEnd === -1) break;

        const headerStr = buffer.subarray(0, headerEnd).toString("utf-8");
        const match = headerStr.match(/Content-Length:\s*(\d+)/i);
        if (!match) {
          buffer = buffer.subarray(headerEnd + sepLen);
          continue;
        }

        const contentLength = parseInt(match[1], 10);
        const bodyStart = headerEnd + sepLen;
        if (buffer.length < bodyStart + contentLength) break;

        const body = buffer.subarray(bodyStart, bodyStart + contentLength).toString("utf-8");
        buffer = buffer.subarray(bodyStart + contentLength);
        await handleMessage(body, writeFramed);
      }
    }
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
