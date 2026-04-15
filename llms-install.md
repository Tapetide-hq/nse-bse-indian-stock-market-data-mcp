# Tapetide Stock Research MCP Server — Installation Guide for AI Agents

## Prerequisites

- Node.js 18 or later
- A free Tapetide API token from https://tapetide.com/settings/tokens

## Option 1: Remote MCP (URL-based, no npm needed)

If your MCP client supports URL-based servers with custom headers, use the remote server directly:

```json
{
  "mcpServers": {
    "tapetide": {
      "type": "url",
      "url": "https://mcp.tapetide.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Replace `YOUR_TOKEN_HERE` with your token from https://tapetide.com/settings/tokens

## Option 2: Local MCP (stdio bridge via npm)

This server is published on npm as `tapetide-mcp`. No cloning or building required.

Add the following to your MCP configuration file (e.g., `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "tapetide": {
      "command": "npx",
      "args": ["-y", "tapetide-mcp"],
      "env": {
        "TAPETIDE_TOKEN": "get your free token from https://tapetide.com/settings/tokens"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAPETIDE_TOKEN` | Yes (local) | — | API token from https://tapetide.com/settings/tokens (starts with `tpt_rt_`) |
| `TAPETIDE_MCP_URL` | No | `https://mcp.tapetide.com` | Override remote server URL |
| `TAPETIDE_DEBUG` | No | `0` | Set to `1` for debug logging to stderr |

## How It Works

The local server runs as a stdio bridge. It reads JSON-RPC from stdin, forwards requests to the remote Tapetide API at `https://mcp.tapetide.com/mcp` with token-based auth, and writes responses to stdout.

No additional dependencies, database setup, or API keys from third parties are needed.

## Verification

After installation, try calling the `search_stocks` tool with query `"Reliance"` to confirm the server is working. You should get back a list of matching stocks.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Token refresh failed (401)` | Token expired or invalid. Generate a new one at https://tapetide.com/settings/tokens |
| `TAPETIDE_TOKEN environment variable is required` | Add your token to the `env` section of your MCP config |
| Network errors | Check internet connection. Server needs to reach `mcp.tapetide.com` |
| Slow first request | Normal — pre-authenticates on startup. Subsequent requests are fast |

For debug output, set `TAPETIDE_DEBUG=1` in your env config.
