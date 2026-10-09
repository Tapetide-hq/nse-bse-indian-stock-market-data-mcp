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
 * Identity:
 *   Forwards the downstream client's name/version (from `initialize`), the
 *   negotiated protocol version, and the `Mcp-Session-Id` the remote minted at
 *   `initialize` on every request, so the remote's stateless transport can
 *   attribute calls to a client and a session instead of seeing an anonymous
 *   bridge.
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

import { createRequire } from "node:module";

const MCP_URL = process.env.TAPETIDE_MCP_URL || "https://mcp.tapetide.com";
const REFRESH_TOKEN = process.env.TAPETIDE_TOKEN;
const DEBUG = process.env.TAPETIDE_DEBUG === "1";

/**
 * Our own version, read from the package manifest rather than duplicated as a
 * literal — a hardcoded copy is exactly the kind of drift this bridge already
 * suffers from. npm always ships package.json in the tarball, and the compiled
 * entrypoint lives at dist/index.js, so `../package.json` resolves in both the
 * published package and a local build.
 */
const BRIDGE_VERSION: string = (() => {
  try {
    const pkg = createRequire(import.meta.url)("../package.json") as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
})();

const TOKEN_HELP = "Get a free token at https://tapetide.com/settings/tokens and set it as TAPETIDE_TOKEN.";

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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent(),
      },
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

/**
 * Why authentication is currently unavailable, or null when it is.
 *
 * Without a working token the bridge still starts, in DISCOVERY MODE, instead
 * of exiting. Clients and registries (Glama's build check, MCP inspectors, a
 * user who has not pasted a token yet) need `initialize` + `tools/list` to
 * work before any credential exists, and the remote already serves the
 * discovery methods anonymously. Exiting at startup turned all of those into
 * a dead process with nothing but a stderr line to explain it.
 */
let authUnavailable: string | null = null;

/** An access token, or null when none can be had (no token set, or refresh failed). */
async function tryGetAccessToken(): Promise<string | null> {
  if (!REFRESH_TOKEN) {
    authUnavailable = `TAPETIDE_TOKEN is not set. ${TOKEN_HELP}`;
    return null;
  }
  try {
    const token = await getAccessToken();
    authUnavailable = null;
    return token;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    authUnavailable = `${reason}. Check your TAPETIDE_TOKEN. ${TOKEN_HELP}`;
    return null;
  }
}

// ── Remote forwarding ─────────────────────────────────────────────────

const REMOTE_TIMEOUT = 30_000; // 30s per request

/**
 * The downstream MCP client, learned from the `initialize` request's
 * `clientInfo`, and the protocol version the remote picked in its `initialize`
 * response.
 *
 * WHY WE TRACK THESE
 * ------------------
 * The remote transport is stateless, so the only per-call identity it sees is
 * the `User-Agent`. Left to Node's default the bridge is anonymous, which means
 * every npm-bridge user collapses into one indistinguishable bucket and the
 * remote cannot tell a Claude Desktop call from a Cursor one. `clientInfo` is
 * already on the wire in `initialize`; forwarding it costs nothing.
 *
 * The protocol version is read from the RESPONSE, not the request, on purpose:
 * the remote rejects a version it does not support with a 400, so echoing back
 * the one it just chose can never introduce a failure the bridge did not have
 * before.
 */
let downstreamClient: string | null = null;
let negotiatedProtocolVersion: string | null = null;

/**
 * The `Mcp-Session-Id` the remote mints in its `initialize` response.
 *
 * The remote runs a stateless transport, so it does not REQUIRE this header
 * back — every request works without it. But it is the only thing that lets
 * the remote tie the `clientInfo` it learned at `initialize` to the tool calls
 * that follow: the SDK's per-session client identity is keyed on this id, and
 * the remote measured that clients which never replay it lose that attribution
 * on every call after the handshake. Replaying it is a header copy on our side
 * and costs nothing; a remote that stops minting it simply leaves this null.
 *
 * A fresh `initialize` replaces it, since the remote will mint a new one.
 */
let remoteSessionId: string | null = null;

/** RFC 7230 token chars only — a client name is untrusted input for a header. */
function sanitizeForHeader(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 64);
}

function userAgent(): string {
  const self = `tapetide-mcp/${BRIDGE_VERSION}`;
  return downstreamClient ? `${self} (${downstreamClient})` : self;
}

function remoteHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    "User-Agent": userAgent(),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (negotiatedProtocolVersion) {
    headers["MCP-Protocol-Version"] = negotiatedProtocolVersion;
  }
  if (remoteSessionId) {
    headers["Mcp-Session-Id"] = remoteSessionId;
  }
  return headers;
}

/**
 * Learn the session id from the remote's `initialize` response headers.
 *
 * Read from the RESPONSE only, never invented locally: the remote is the only
 * party that can mint an id it will recognise. Header values are ASCII by
 * construction, but the value is still copied through the same character
 * allow-list as the client name — the header is going straight back on the
 * wire, and a hostile remote (TAPETIDE_MCP_URL is user-configurable) must not
 * be able to inject a CR/LF through it.
 */
function captureSessionId(res: Response): void {
  const id = res.headers.get("Mcp-Session-Id");
  if (!id) return;
  const clean = id.replace(/[^A-Za-z0-9._~+/=-]/g, "");
  remoteSessionId = clean || null;
}

/** Learn the downstream client's name from the `initialize` request we forward. */
function captureClientInfo(body: string): void {
  try {
    const msg = JSON.parse(body) as {
      method?: string;
      params?: { clientInfo?: { name?: string; version?: string } };
    };
    if (msg.method !== "initialize") return;
    const info = msg.params?.clientInfo;
    if (!info?.name) return;
    const name = sanitizeForHeader(info.name);
    downstreamClient = info.version ? `${name}/${sanitizeForHeader(info.version)}` : name;
  } catch {
    /* not our concern — the remote validates the payload */
  }
}

/** Learn the negotiated protocol version from the remote's `initialize` result. */
function captureProtocolVersion(responseText: string): void {
  try {
    const msg = JSON.parse(responseText) as { result?: { protocolVersion?: string } };
    const version = msg.result?.protocolVersion;
    if (typeof version === "string" && version) negotiatedProtocolVersion = version;
  } catch {
    /* non-JSON or an error response — nothing to learn */
  }
}

/**
 * Surface rate limiting on stderr.
 *
 * The remote deliberately stopped sending `X-RateLimit-Remaining` (it declines
 * to expose the numeric quota), so the old "N requests remaining" warning keyed
 * on a header that no longer exists and could never fire. `Retry-After` is only
 * present when a call was actually denied — by the per-minute burst smoother or
 * by the daily/monthly plan quota — which makes its presence the signal.
 *
 * Note the denial itself arrives as HTTP 200 carrying a JSON-RPC result with
 * `isError: true`, by design, so the assistant relays the message instead of
 * retrying. This warning is for the human watching the logs.
 */
function warnOnRateLimit(res: Response): void {
  const retryAfter = res.headers.get("Retry-After");
  if (retryAfter === null) return;
  const seconds = parseInt(retryAfter, 10);
  const when = Number.isFinite(seconds) ? `${seconds}s` : "shortly";
  process.stderr.write(
    `Warning: Tapetide rate limit reached — request denied. Retry in ${when}. ` +
      `Check usage at https://tapetide.com/settings/tokens\n`,
  );
}

/**
 * Methods the remote serves without a token. Kept in step with the remote's
 * own allow-list: exact names, never a prefix, so nothing added later inherits
 * anonymous access by accident.
 */
function isPublicMethod(method: string | undefined): boolean {
  return (
    method === "tools/list" ||
    method === "ping" ||
    method === "resources/list" ||
    method === "resources/read" ||
    method?.startsWith("notifications/") === true
  );
}

const SUPPORTED_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

/**
 * Answer `initialize` locally while in discovery mode. The remote requires a
 * token for `initialize` (that 401 is what starts OAuth in chat apps), so the
 * bridge speaks for it, advertising the same capabilities the remote does.
 */
function localInitialize(body: string): string {
  const msg = JSON.parse(body) as { id?: unknown; params?: { protocolVersion?: string } };
  const requested = msg.params?.protocolVersion;
  const protocolVersion =
    requested && SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : "2025-06-18";
  negotiatedProtocolVersion = protocolVersion;
  return JSON.stringify({
    jsonrpc: "2.0",
    id: msg.id ?? null,
    result: {
      protocolVersion,
      capabilities: { tools: { listChanged: true }, resources: { listChanged: true } },
      serverInfo: { name: "tapetide", version: BRIDGE_VERSION },
      instructions:
        `Tapetide is running without authentication: tools can be listed but not called. ${authUnavailable}`,
    },
  });
}

async function forwardToRemote(body: string): Promise<string> {
  const start = Date.now();
  let method: string | undefined;
  try { method = (JSON.parse(body) as { method?: string }).method; } catch { /* ignore */ }

  const token = await tryGetAccessToken();
  if (!token) {
    if (method === "initialize") {
      captureClientInfo(body);
      return localInitialize(body);
    }
    if (!isPublicMethod(method)) throw new Error(authUnavailable ?? TOKEN_HELP);
  }

  // Must run BEFORE the request so the initialize call itself carries identity.
  // A new handshake also drops the previous session: the remote mints a fresh
  // id for it, and replaying a stale one would misattribute the new session.
  if (method === "initialize") {
    captureClientInfo(body);
    remoteSessionId = null;
  }

  let res = await fetchWithTimeout(`${MCP_URL}/mcp`, {
    method: "POST",
    headers: remoteHeaders(token),
    body,
  });

  // If 401, token may have expired between check and request. Retry once.
  if (res.status === 401 && token) {
    accessToken = null;
    const freshToken = await getAccessToken();
    res = await fetchWithTimeout(`${MCP_URL}/mcp`, {
      method: "POST",
      headers: remoteHeaders(freshToken),
      body,
    });
  }

  warnOnRateLimit(res);
  if (method === "initialize") captureSessionId(res);

  // Handle SSE responses — extract JSON-RPC messages from event stream.
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const result = extractJsonFromSSE(await res.text());
    if (method === "initialize") captureProtocolVersion(result);
    if (DEBUG) process.stderr.write(`[debug] ${method ?? "?"} → SSE ${res.status} (${Date.now() - start}ms)\n`);
    return result;
  }

  const text = await res.text();

  if (method === "initialize") captureProtocolVersion(text);

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

  // Pre-authenticate so first request is fast. Failure is not fatal: the
  // bridge falls back to discovery mode and retries on every later call.
  if (!(await tryGetAccessToken())) {
    process.stderr.write(
      `Warning: ${authUnavailable}\n` +
        "Starting in discovery mode: tools can be listed, but tool calls will return this error.\n",
    );
  }

  process.stderr.write(
    `Tapetide Stock Research MCP v${BRIDGE_VERSION} connected. Waiting for requests...\n`,
  );

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
