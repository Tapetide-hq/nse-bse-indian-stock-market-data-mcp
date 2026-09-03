<p align="center">
  <a href="https://tapetide.com/mcp">
    <img src="https://assets.tapetide.com/logo-filled-tight.svg" alt="Tapetide — Indian Stock Market MCP Server" width="80" />
  </a>
</p>

<h1 align="center">NSE & BSE Indian Stock Market Data MCP Server</h1>

<p align="center">
  <strong>The Model Context Protocol server for Indian stock markets — 52 tools to search, screen & analyze all 8,200+ NSE and BSE stocks from Claude, ChatGPT, Cursor & any AI assistant</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tapetide-mcp"><img src="https://img.shields.io/npm/v/tapetide-mcp" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/tapetide-mcp"><img src="https://img.shields.io/npm/dm/tapetide-mcp" alt="npm downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-blue" alt="MCP compatible" /></a>
  <a href="https://glama.ai/mcp/servers/Tapetide-hq/nse-bse-indian-stock-market-data-mcp"><img src="https://glama.ai/mcp/servers/Tapetide-hq/nse-bse-indian-stock-market-data-mcp/badges/score.svg" alt="nse-bse-indian-stock-market-data-mcp MCP server" /></a>
</p>

<p align="center">
  <a href="https://tapetide.com/mcp">Documentation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#tools">52 Tools</a> •
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
      "args": ["-y", "tapetide-mcp"],
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

The npm package is a lightweight stdio bridge with zero runtime dependencies. It:

- Reads JSON-RPC from stdin, forwards to the remote Tapetide MCP server, writes responses to stdout
- Auto-detects framing: Content-Length (VS Code, Claude Desktop) or newline-delimited JSON (Kiro, Claude Code)
- Exchanges your refresh token for a 1-hour HMAC access token, auto-refreshes before expiry
- Handles SSE responses from the remote server
- Identifies your MCP client to the remote via `User-Agent`, and echoes the negotiated protocol version
- Warns on stderr when the server rate-limits a call, naming the retry delay

All 52 tools and their logic run on the remote server — the npm package is just the transport layer.
Because it forwards JSON-RPC verbatim, tools shipped on the remote are available immediately without
upgrading this package.

## Authentication

| Method | How it works | Best for |
|--------|-------------|----------|
| **Google OAuth** | Browser sign-in, automatic token refresh | AI chat apps (Claude.ai, ChatGPT, Grok, Gemini) |
| **Personal Token (remote)** | `Authorization: Bearer tpt_rt_...` header | Code editors with URL-based MCP (VS Code, Kiro, Zed) |
| **Personal Token (local)** | `TAPETIDE_TOKEN` env var via npx | stdio MCP clients (Cursor, Windsurf, Claude Desktop, Codex) |

Generate a free personal token at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens). Works for both remote and local MCP.

## Tools

> Tip: ask your assistant to call `read_me` first. It returns the full in-session guide — every
> tool by category, usage patterns, and the rules the server expects clients to follow.

<!-- tools:start — mirrors the server's tool catalog. Checked against the live server's tools/list by
     scripts/check-catalog-parity.mjs (CI: .github/workflows/ci.yml). When the catalog changes,
     regenerate this block; do not hand-edit an individual count. -->

### 🔍 Discovery & Screening (5 tools)

| Tool | Description |
|------|-------------|
| `search_stocks` | Resolve a company to its symbol by name, symbol, BSE code, or ISIN — including brand names and post-rename aliases (`Zomato` → `ETERNAL`). Filter by sector/industry. |
| `screen_stocks` | Fundamental screener over 326 ratios — PE, ROCE, sales growth, debt/equity, Piotroski score. Plain-English query syntax with AND/OR logic and cross-field comparisons. |
| `screen_stocks_technical` | Real-time technical screener — RSI, MACD, SMA/EMA crossovers, Bollinger Bands, ADX, volume, momentum. Supports `crosses_above`/`crosses_below`. |
| `get_screener_ratios` | Search or browse the full 326-ratio catalog to get exact ratio names for a query. |
| `get_trending_stocks` | Today's top gainers, losers, and most-active stocks from the Nifty 500. |

### 📊 Company Analysis (9 tools)

| Tool | Description |
|------|-------------|
| `get_company_profile` | Full overview — sector, business summary, pros/cons, fundamentals, growth metrics, current quote. Optionally add technicals (20+ indicators), analyst ratings, and peers in the same call. |
| `get_stock_quote` | Live price — LTP, change %, volume, market cap, PE, PB, 52-week high/low. |
| `get_batch_quotes` | Up to 20 stock quotes in a single call. |
| `get_price_history` | Daily or weekly OHLCV with delivery %. Up to 2,000 sessions per call, pageable further back. |
| `get_financials` | Quarterly + annual P&L, balance sheet, cash flow, and ratios. Each period is stamped with when it was actually published, so backtests can avoid look-ahead bias. |
| `get_shareholding` | Promoter, FII, DII, and public holdings quarter by quarter. |
| `get_forecasts` | Analyst EPS, revenue, EBITDA, net income, ROA, and ROE estimates against actuals — for spotting earnings surprises. |
| `get_stock_events` | Sentiment-tagged news, corporate actions (dividends, splits, bonuses, AGMs), and filings (results, presentations, concall transcripts, annual reports). |
| `get_stock_ownership` | Dividend history with yields + which mutual fund schemes hold the stock and at what share of AUM. |

### 🏛️ Market-Wide Data (11 tools)

| Tool | Description |
|------|-------------|
| `get_market_pulse` | The at-a-glance daily snapshot — FII/DII net flows, Nifty 50 valuations, and India VIX in one call. |
| `get_fii_dii_detail` | 30 days of daily cash-market flows, F&O participant long/short OI, weekly/monthly/yearly aggregates, buy/sell streaks, cumulative net flows. |
| `get_fii_dii_flows` | Alias of `get_fii_dii_detail`. |
| `get_fpi_sectors` | FPI investment by sector — AUM share, fortnightly change, 1-year cumulative flow. |
| `get_market_news` | Market-wide news across categories with sentiment and related symbols. |
| `get_market_data` | One dispatcher for seven daily feeds via `dataset`: `deals`, `fno_ban`, `deliveries`, `ipo`, `mtf`, `slbm`, `signals`. |
| `market_heatmap` | Every constituent of an index with market cap, PE, PB, returns from 1d to 5y, volume, sector — 16 indices. |
| `market_valuations` | Index PE, PB, and dividend yield over time. Up to 20 years. |
| `get_india_vix` | The India VIX fear gauge — latest level, daily change, recent history. |
| `get_index_performance` | Rank ~140 NSE indices by return over completed weeks or months. Filter to sectoral, broad, thematic, or strategy families — the right answer to "which sector led last month". |
| `get_index_history` | OHLC level series plus PE/PB/dividend yield for a single index. The index counterpart of `get_price_history`. |

### 🎲 Derivatives & Risk (5 tools)

| Tool | Description |
|------|-------------|
| `get_option_chain` | Per-strike index option chain with IV, full Greeks, bid/ask, open interest, max pain, PCR. NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY — a stamped end-of-day snapshot. |
| `get_option_iv_history` | Session-by-session ATM IV, IV rank, IV percentile, realised vol, PCR, max pain, 25-delta skew for ~556 underlyings, individual stocks included. |
| `get_options_analytics` | Latest per-expiry aggregates — ATM IV, IV rank/percentile, realised vol, PCR by OI and volume, max pain, skew, call/put OI. |
| `get_promoter_pledge` | Promoter share-pledge percentage by quarter plus pledge/release events — a standard governance red-flag check. |
| `get_credit_ratings` | Credit-rating actions by agency with rating, action, and outlook over time. |

### 🔬 Research & Scoring (4 tools)

| Tool | Description |
|------|-------------|
| `get_stock_deals` | Bulk, block, insider, and substantial-acquisition (SAST) disclosures per stock, with counterparty, side, quantity, value. |
| `get_tapetide_score` | The deterministic 0-100 Tapetide Score for one stock with its six pillar sub-scores, band, percentile, data confidence, and any governance caps or red flags. |
| `screen_tapetide_scores` | Rank and filter the scored universe by band, size bucket, sector, score window, and confidence, with cursor pagination. |
| `get_earnings_call_summary` | Structured digest of recent earnings-call transcripts and investor presentations — highlights, risks, guidance, headline metrics. |

### ⏳ Point-in-Time & Backtest Safety (5 tools)

| Tool | Description |
|------|-------------|
| `get_adjustment_factors` | Split and bonus adjustment timeline for reconstructing raw prices — plus the rights and demerger events that carry no reliable factor at all. |
| `get_observation_status` | Per-calendar-day reason a price is present or missing: traded, weekend, holiday, pre-listing, delisted, or no print. A missing day is not a zero return. |
| `get_index_membership_asof` | Was a stock in an index on a given date? Answers `present`, `uncertain`, `absent`, or `out_of_coverage` — survivorship-bias-aware universe construction. |
| `resolve_identifier_asof` | Map a historical symbol or ISIN to the company that held it on a date, for old holdings files and recycled tickers. |
| `get_identifiers_asof` | The reverse lookup — which symbol and ISIN a company traded under at a point in time. |

### 💼 Portfolio (4 tools)

Requires a connected Tapetide account.

| Tool | Description |
|------|-------------|
| `get_user_portfolio` | Holdings with live prices, absolute and % P&L, invested value, weight, sector, market-cap class. |
| `add_portfolio_stocks` | Add holdings singly or in bulk, including rows parsed from a broker CSV or screenshot (Zerodha, Groww, Angel One, Dhan, Upstox, 5Paisa, ICICI Direct, Kotak, HDFC Sky, Motilal Oswal). Duplicates merge on a weighted-average price. |
| `update_portfolio_stock` | Update quantity and average price after a top-up or partial sell. |
| `remove_portfolio_stocks` | Remove holdings from the portfolio. |

### 👁️ Watchlist (3 tools)

Requires a connected Tapetide account.

| Tool | Description |
|------|-------------|
| `get_watchlist` | Every followed stock with sector and industry. |
| `add_to_watchlist` | Follow one or many stocks. Idempotent. |
| `remove_from_watchlist` | Unfollow one or many stocks. |

### 📖 Guide & Aliases (6 tools)

| Tool | Description |
|------|-------------|
| `read_me` | The full in-session guide — every tool by category, the SEBI disclaimer rule, portfolio-first behaviour, parallel-call patterns. Assistants should call it first. |
| `scan_movers` | Alias of `get_trending_stocks`. |
| `get_live_quote` | Alias of `get_stock_quote`. |
| `get_stock_news` | Alias of `get_stock_events` with `type: "news"`. |
| `get_corporate_actions` | Alias of `get_stock_events` with `type: "corporate_actions"`. |
| `run_preset_screen` | Redirect that points a preset-screen request at the screener tool that can actually answer it. |

<!-- tools:end -->

### Retired tool names

These names were removed. Calling one returns a message naming its replacement, so a client can
recover in the same turn — but new integrations should use the replacement directly.

| Retired | Replacement |
|---------|-------------|
| `market_deals` | `get_market_data` with `dataset: "deals"` |
| `market_fno_ban` | `get_market_data` with `dataset: "fno_ban"` |
| `market_deliveries` | `get_market_data` with `dataset: "deliveries"` |
| `market_ipo` | `get_market_data` with `dataset: "ipo"` |
| `market_mtf` | `get_market_data` with `dataset: "mtf"` |
| `market_slbm` | `get_market_data` with `dataset: "slbm"` |
| `market_signals` | `get_market_data` with `dataset: "signals"` |
| `get_quant_signal` | `get_tapetide_score` (a different measurement, not a rename) |
| `screen_by_quant_signal` | `screen_tapetide_scores` (a different measurement, not a rename) |

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

### Derivatives & Volatility

```
"Is RELIANCE implied volatility high right now? Show IV rank and percentile
 versus realised vol over the last year"

"Show the NIFTY option chain around ATM — open interest by strike, max pain,
 and the put-call ratio"

"Which sectors led the last 3 completed weeks? Rank the sectoral indices"
```

### Scoring & Risk Screens

```
"What's the Tapetide Score for TATASTEEL and why — break down the pillars"

"Show me Strong-band pharma stocks among large and mid caps"

"Any governance red flags on this stock? Check promoter pledge trend and
 recent credit rating actions"
```

### Backtest Safety

```
"Was IDEA in the Nifty 500 on 2019-03-31? I need point-in-time membership,
 not today's list"

"This stock shows a 60% single-day move in 2022 — was that a split or a real
 return? Check the adjustment factors"
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
| **Indices** | ~140 NSE indices — level history with PE/PB/DY, plus weekly/monthly return rankings by sector, broad, thematic, and strategy family |
| **Derivatives** | Index option chains with IV and full Greeks, OI, max pain, PCR; IV rank/percentile and realised-vol history for ~556 underlyings including single stocks; India VIX |
| **Analyst** | Buy/hold/sell consensus + EPS/revenue/EBITDA/ROE forecasts with actuals vs estimates |
| **Ownership** | Shareholding patterns (quarterly), dividend history, mutual fund scheme-level holdings |
| **Large trades** | Bulk, block, insider (designated-person), and SAST disclosures with counterparty and value |
| **Governance & risk** | Promoter share-pledge history and events, credit-rating actions by agency with outlook |
| **Scoring** | Tapetide Score — deterministic 0-100 rating with six pillar sub-scores, band, percentile, data confidence, governance caps |
| **Point-in-time** | Split/bonus adjustment factors, per-day observation status, as-of index membership, historical symbol/ISIN resolution — for survivorship-bias-aware backtests |
| **News & Events** | Sentiment-tagged news, corporate actions, filings (annual reports, concall transcripts), AI digests of earnings calls and investor presentations |
| **Portfolio** | Live P&L tracking, sector breakdown, broker CSV import (10+ Indian brokers) |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAPETIDE_TOKEN` | Yes (local) | — | Personal API token from [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| `TAPETIDE_MCP_URL` | No | `https://mcp.tapetide.com` | Override remote server URL |
| `TAPETIDE_DEBUG` | No | `0` | Set to `1` for debug logging to stderr |

## Rate Limits

Limits are per Tapetide account and identical across all three access methods (OAuth, remote token,
and this npm bridge) — they follow your plan, not your transport.

| Scope | Free plan | Paid plans |
|-------|-----------|------------|
| Per day | 50 tool calls | Per your plan |
| Per calendar month | 1,000 tool calls | Per your plan (unlimited on enterprise) |
| Burst | 60 tool calls per minute | 60 tool calls per minute |

Only **successful tool calls** consume quota. Protocol traffic (`initialize`, `tools/list`) and
burst-denied calls are free. Daily and monthly windows reset on IST boundaries.

When a limit is hit, the server replies with a normal JSON-RPC result carrying `isError: true` and a
message naming the binding cap and its reset time, so your assistant relays it instead of retrying.
Responses carry `X-RateLimit-Reset`, and denials add `Retry-After`. The numeric quota itself is not
exposed as a header — check current usage at
[tapetide.com/settings/tokens](https://tapetide.com/settings/tokens).

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
- **[GitHub](https://github.com/Tapetide-hq/nse-bse-indian-stock-market-data-mcp)** — Source code
- **[Glama](https://glama.ai/mcp/servers/Tapetide-hq/nse-bse-indian-stock-market-data-mcp)** — MCP directory listing

<a href="https://glama.ai/mcp/servers/Tapetide-hq/nse-bse-indian-stock-market-data-mcp"><img width="380" src="https://glama.ai/mcp/servers/Tapetide-hq/nse-bse-indian-stock-market-data-mcp/badges/card.svg" alt="nse-bse-indian-stock-market-data-mcp MCP server" /></a>

## Contributing

Issues and pull requests are welcome. For bugs, include the error message and your MCP client name/version.

## License

[MIT](./LICENSE) — free to use, modify, and distribute.

---

<p align="center">
  <sub>Built by <a href="https://tapetide.com">Tapetide</a> — India's AI-first stock research platform</sub>
</p>
