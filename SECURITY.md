# Security Policy

## Reporting a vulnerability

Please report security issues privately by email to **hello@tapetide.com** with "SECURITY" in the subject line. Do not open a public GitHub issue for a vulnerability.

Include what you found, steps to reproduce, and the affected component (this stdio bridge, the remote server at `mcp.tapetide.com`, or tapetide.com). We aim to acknowledge reports within 3 business days and will keep you updated until the issue is resolved.

## Scope

- This package (`tapetide-mcp` on npm) and its Python counterpart (`tapetide-mcp` on PyPI)
- The remote MCP server at `https://mcp.tapetide.com/mcp`, including its OAuth endpoints

## Supported versions

Only the latest published version of the package receives fixes. The bridge holds no data of its own; your `TAPETIDE_TOKEN` stays in your MCP client's configuration and is sent only to `mcp.tapetide.com`.
