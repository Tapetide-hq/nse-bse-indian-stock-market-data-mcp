<p align="center">
  <a href="https://tapetide.com/mcp">
    <img src="https://assets.tapetide.com/logo.svg" alt="Tapetide — Indian Stock Market MCP Server" width="80" />
  </a>
</p>

<h1 align="center">Tapetide Stock Research MCP Server</h1>

<p align="center">
  <strong>Indian stock market data for AI assistants — 34 tools for NSE & BSE stock analysis</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tapetide-mcp"><img src="https://img.shields.io/npm/v/tapetide-mcp" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/tapetide-mcp"><img src="https://img.shields.io/npm/dm/tapetide-mcp" alt="npm downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-blue" alt="MCP compatible" /></a>
</p>

<p align="center">
  <a href="https://tapetide.com/mcp">Documentation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tools">34 Tools</a> •
  <a href="#example-prompts">Example Prompts</a> •
  <a href="https://www.npmjs.com/package/tapetide-mcp">npm</a>
</p>

---

## What is this?

Tapetide MCP Server is a [Model Context Protocol](https://modelcontextprotocol.io/) server that connects AI assistants to real-time Indian stock market data. It covers all ~8,200 stocks listed on NSE and BSE — from large-cap Nifty 50 to SME stocks.

Ask your AI to look up any stock, run a screener with 326 fundamental filters or real-time technical indicators, pull quarterly financials, check analyst consensus ratings, track your portfolio P&L, monitor FII/DII institutional flows, or get today's bulk deals — all through natural language.

**Compatible with:** Claude Desktop, Claude Code, ChatGPT, Cursor, Windsurf, Kiro, VS Code, Codex, Zed, Gemini, Grok, OpenCode, Antigravity, and any MCP-compatible client.

## Quick Start

### Option 1: Remote MCP (No install — claude.ai, chatgpt.com, Grok, Gemini)

Add this URL directly in your AI chat app:

```
https://mcp.tapetide.com/mcp
```

Authentication happens automatically via Google OAuth. No token needed.

### Option 2: Remote MCP with Token (Claude Code, VS Code, Kiro, Zed)

For code editors that support URL-based MCP servers with custom headers:

1. Get a free token at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens)
2. Add to your MCP config:

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

### Option 3: Local MCP via npm (Claude Code, Codex, Cursor, Windsurf, VS Code, Gemini CLI, Kiro, OpenCode)

For stdio-based MCP clients. No cloning or building required — runs via `npx`:

1. Get a free token at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens)
2. Add to your MCP config:

```json
{
  "mcpServers": {
    "tapetide": {
      "command": "npx",
      "args": ["-y", "tapetide-mcp@latest"],
      "env": {
        "TAPETIDE_TOKEN": "your_token_here"
      }
    }
  }
}
```

> **Node.js 18+** required for the local option. Run `node --version` to check.

## How It Works

```
┌─────────────────┐     stdio (JSON-RPC)     ┌──────────────────┐     HTTPS      ┌─────────────────────┐
│  AI Assistant   │ ◄──────────────────────► │  tapetide-mcp    │ ◄────────────► │  mcp.tapetide.com   │
│  (Claude, etc.) │                           │  (npm package)   │                │  (Cloudflare Worker) │
└─────────────────┘                           └──────────────────┘                └─────────────────────┘
```

The npm package is a lightweight stdio bridge (~300 lines, zero runtime dependencies). It:

- Reads JSON-RPC from stdin, forwards to the remote Tapetide MCP server, writes responses to stdout
- Auto-detects framing: Content-Length (VS Code, Claude Desktop) or newline-delimited JSON (Kiro, Claude Code)
- Exchanges your refresh token for a 1-hour HMAC access token, auto-refreshes before expiry
- Handles SSE responses from the remote server
- Warns on stderr when approaching rate limits

All 34 tools and their logic run on the remote server — the npm package is just the transport layer.

## Authentication

| Method | How it works | Best for |
|--------|-------------|----------|
| **Google OAuth** | Browser sign-in, automatic token refresh | AI chat apps (Claude.ai, ChatGPT, Grok, Gemini) |
| **Personal Token (remote)** | `Authorization: Bearer tpt_rt_...` header | Code editors with URL-based MCP (VS Code, Kiro, Zed) |
| **Personal Token (local)** | `TAPETIDE_TOKEN` env var via npx | stdio MCP clients (Cursor, Windsurf, Claude Desktop, Codex) |

Generate a free personal token at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens). Works for both remote and local MCP.

## Tools

### 🔍 Search & Discovery (5 tools)

| Tool | Description |
|------|-------------|
| `search_stocks` | Fuzzy search all NSE/BSE stocks by name, symbol, BSE code, or ISIN. Filter by sector/industry. |
| `screen_stocks` | Fundamental screener with 326 ratios — PE, ROCE, sales growth, debt/equity, Piotroski score, and more. Plain-English query syntax. |
| `screen_stocks_technical` | Real-time technical screener — RSI, MACD, SMA/EMA crossovers, Bollinger Bands, ADX, volume. Supports `crosses_above`/`crosses_below`. |
| `get_screener_ratios` | Search or browse all 326 available fundamental ratios. |
| `get_trending_stocks` | Today's top gainers, losers, and high-volume stocks from Nifty 500. |

### 📊 Company Analysis (3 tools)

| Tool | Description |
|------|-------------|
| `get_company_profile` | Full overview — sector, fundamentals, growth metrics, pros/cons. Optionally include technicals (20+ indicators), analyst ratings, and peer comparison in one call. |
| `get_stock_events` | News (sentiment-tagged), corporate actions (dividends, splits, bonuses), and filings (annual reports, concall transcripts, investor presentations). |
| `get_stock_ownership` | Dividend history with yield calculations + mutual fund scheme-level holdings. |

### 💰 Quotes & Prices (3 tools)

| Tool | Description |
|------|-------------|
| `get_stock_quote` | Live price — LTP, change %, volume, market cap, PE, PB, 52-week high/low. |
| `get_batch_quotes` | Up to 20 stock quotes in a single call. |
| `get_price_history` | Daily or weekly OHLCV with delivery %. Up to 2,000 days of history. |

### 📈 Financials & Fundamentals (3 tools)

| Tool | Description |
|------|-------------|
| `get_financials` | Quarterly + annual P&L, balance sheet, cash flow, and ratios. Fetch individual sections or all at once. |
| `get_shareholding` | Promoter, FII, DII, and public shareholding patterns over time. |
| `get_forecasts` | Analyst forecasts — EPS, revenue, EBITDA, net income, ROA, ROE, and price targets. Actuals vs estimates for spotting earnings surprises. |

### 🏛️ Market Data & Institutional Flows (5 tools)

| Tool | Description |
|------|-------------|
| `get_market_pulse` | Quick overview — FII/DII net flows, Nifty 50 PE/PB/DY, top technical signals. |
| `get_fii_dii_detail` | 30-day daily cash market flows, F&O participant positioning (long/short OI), weekly/monthly/yearly aggregates, buy/sell streaks, cumulative chart data. |
| `get_fpi_sectors` | FPI sector-wise investment — AUM share, fortnight change, 1-year cumulative flow. |
| `get_market_news` | Sentiment-tagged market news across categories (companies, global, IPO, policy, tech). |
| `market_valuations` | Index PE, PB, dividend yield over time — Nifty 50, Bank Nifty, Nifty IT, Midcap 50. Up to 20 years. |

### 📡 Market Insights (8 tools)

| Tool | Description |
|------|-------------|
| `market_deals` | Today's bulk and block deals — client name, buy/sell, quantity, price, value. |
| `market_fno_ban` | F&O ban list (MWPL ≥ 95%) and stocks approaching ban (80-95%). |
| `market_ipo` | Current and upcoming IPOs with subscription data (QIB, retail, NII, total). |
| `market_deliveries` | Stocks with highest delivery % today — genuine buying vs speculative trading. |
| `market_mtf` | Margin Trading Facility — consolidated figures, per-stock funded positions, trends. |
| `market_slbm` | Stock Lending & Borrowing — available stocks, bid prices, yield (short-selling demand). |
| `market_signals` | Technical signals — breakouts, MA crossovers, volume spikes, RSI extremes. |
| `market_heatmap` | Index heatmap (Nifty 50, Bank Nifty, IT, Pharma, etc.) with multi-timeframe price changes. |

### 💼 Portfolio Management (4 tools)

| Tool | Description |
|------|-------------|
| `get_user_portfolio` | Holdings with live prices, P&L (absolute + %), sector breakdown, weight %. |
| `add_portfolio_stocks` | Add stocks — supports bulk add and broker CSV import (Zerodha, Groww, Angel One, Dhan, Upstox, 5Paisa, ICICI Direct, Kotak, HDFC Sky, Motilal Oswal). |
| `update_portfolio_stock` | Update quantity or average price for additional purchases or partial sells. |
| `remove_portfolio_stocks` | Remove stocks from portfolio. |

### 👁️ Watchlist (3 tools)

| Tool | Description |
|------|-------------|
| `get_watchlist` | All followed stocks with symbol, name, sector, industry. |
| `add_to_watchlist` | Follow one or more stocks (idempotent). |
| `remove_from_watchlist` | Unfollow stocks. |

## Example Prompts

### Stock Research

```
"Give me a complete analysis of Reliance Industries — financials, debt trend,
 analyst target price, and what mutual funds are holding it"

"Compare HDFC Bank and ICICI Bank — quarterly profit growth, ROE, shareholding
 changes, and analyst consensus"

"Pull the last 4 quarters of TCS financials — revenue growth, margin trend,
 and cash flow. How does it compare to Infosys?"
```

### Stock Screening

```
"Find mid-cap stocks where FII holding increased last quarter, ROE > 15%,
 and RSI below 40 — accumulation candidates"

"Screen for stocks with MACD bullish crossover, volume 2x average, and
 within 10% of 52-week high"

"Which small-caps have debt-to-equity below 0.5, operating margin above 20%,
 and PE below 15?"
```

### Institutional Flows

```
"FIIs have been selling for 5 days — show me daily numbers and which sectors
 they're pulling out of"

"Compare FII vs DII flows for the last month with Nifty 50 PE — are we near
 a historical bottom?"

"Show F&O participant-wise open interest — are FIIs net long or short in
 index futures?"
```

### Portfolio & Watchlist

```
"Add these to my portfolio: 10 RELIANCE at ₹1350, 50 TCS at ₹3800,
 25 HDFCBANK at ₹1650"

"I bought 10 more RELIANCE at ₹1400 — update my portfolio and show
 my new average cost"

"Which of my holdings are technically weak? Show RSI and MACD for each"

"Watch TATAMOTORS, MARUTI, M&M — compare their PE ratios and quarterly
 sales growth"
```

### Daily Market Briefing

```
"Full market briefing — FII/DII flows, F&O ban stocks, bulk deals above
 50 crores, top delivery stocks, and breakout signals"

"Is the market overvalued? Show Nifty 50 PE vs 5-year and 10-year averages"

"Show the Nifty 50 heatmap — which sectors dragged the index today?"
```

## Data Coverage

| Category | What's included |
|----------|----------------|
| **Stocks** | All NSE + BSE listed companies (~8,200 including SME) |
| **Price data** | Daily OHLCV up to 2,000 days + weekly aggregation + delivery % |
| **Financials** | Quarterly + annual P&L, balance sheet, cash flow, 50+ ratios |
| **Screener** | 326 fundamental ratios + real-time technical indicators + cross-field comparisons |
| **Technicals** | RSI, SMA, EMA, MACD, Bollinger Bands, ADX, ATR, Supertrend, Stochastic, CCI, pivot points, 8 candlestick patterns |
| **Institutional** | FII/DII daily cash flows, F&O participant OI, FPI sector-wise allocation, buy/sell streaks |
| **Market data** | Bulk/block deals, F&O ban, IPOs, delivery %, MTF, SLBM, heatmaps, signals |
| **Analyst** | Buy/hold/sell consensus + EPS/revenue/EBITDA/ROE forecasts with actuals vs estimates |
| **Ownership** | Shareholding patterns (quarterly), dividend history, mutual fund scheme-level holdings |
| **News & Events** | Sentiment-tagged news, corporate actions, filings (annual reports, concall transcripts) |
| **Portfolio** | Live P&L tracking, sector breakdown, broker CSV import (10+ Indian brokers) |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAPETIDE_TOKEN` | Yes (local) | — | Personal API token from [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| `TAPETIDE_MCP_URL` | No | `https://mcp.tapetide.com` | Override remote server URL |
| `TAPETIDE_DEBUG` | No | `0` | Set to `1` for debug logging to stderr |

## Rate Limits

| Plan | Hourly | Daily |
|------|--------|-------|
| Remote MCP (OAuth) | 100 requests | 1,000 requests |
| Remote MCP (token) | 1,000 requests | 4,000 requests |
| Local MCP (npm) | 1,000 requests | 4,000 requests |

Rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Limit`, `X-RateLimit-Reset`) are included in every response.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `TAPETIDE_TOKEN environment variable is required` | Add your token to the `env` section of your MCP config |
| `Token refresh failed (401)` | Token expired. Generate a new one at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| `Rate limit exceeded` | Wait for reset (shown in error) or check usage at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| Server not responding | Ensure Node.js 18+ is installed (`node --version`) |
| Slow first request | Normal — pre-authenticates on startup. Subsequent requests are fast |
| Network errors | Check internet. The bridge needs to reach `mcp.tapetide.com` |

Set `TAPETIDE_DEBUG=1` for detailed logging to stderr.

## Links

- **[tapetide.com](https://tapetide.com)** — Web platform
- **[tapetide.com/mcp](https://tapetide.com/mcp)** — MCP documentation & setup guide
- **[mcp.tapetide.com](https://mcp.tapetide.com)** — Remote MCP endpoint
- **[npm: tapetide-mcp](https://www.npmjs.com/package/tapetide-mcp)** — npm package
- **[@tapetide_hq](https://x.com/tapetide_hq)** — X (Twitter)
- **[GitHub](https://github.com/Tapetide-hq/tapetide-stock-research-mcp)** — Source code

## Contributing

Issues and pull requests are welcome. For bugs, include the error message and your MCP client name/version.

## License

[MIT](./LICENSE) — free to use, modify, and distribute.

---

<p align="center">
  <sub>Built by <a href="https://tapetide.com">Tapetide</a> — India's AI-first stock research platform</sub>
</p>
