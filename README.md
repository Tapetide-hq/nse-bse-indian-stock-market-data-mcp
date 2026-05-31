<p align="center">
  <img src="https://assets.tapetide.com/logo.svg" alt="Tapetide" width="80" />
</p>

# Tapetide Stock Research MCP Server

> Indian stock market data for AI assistants — search, screen, and analyze all NSE/BSE stocks with 34 tools covering quotes, financials, technicals, analyst ratings, forecasts, FII/DII flows, screener, portfolio tracking, watchlist, and market insights.

[![npm](https://img.shields.io/npm/v/tapetide-mcp)](https://www.npmjs.com/package/tapetide-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## What is this?

A [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI assistants direct access to Indian stock market data. Ask your AI to look up any NSE/BSE stock, run a screener with 326+ fundamental filters or real-time technical indicators, pull financials, check analyst ratings, track your portfolio, or get the latest FII/DII activity — all through natural language.

Works with Claude Desktop, ChatGPT, Cursor, Windsurf, Kiro, Claude Code, Codex, VS Code, Zed, Gemini, and any client that supports MCP.

**[Learn more →](https://tapetide.com/mcp)**

## Quick Start

### Remote MCP (claude.ai, chatgpt.com, Grok, Gemini)

Add this URL directly in your AI chat app — no install needed:

```
https://mcp.tapetide.com/mcp
```

Authentication happens automatically via Google OAuth.

### Remote MCP with Token (Claude Code, VS Code, Kiro, Zed)

Use a personal token instead of OAuth — no browser sign-in needed:

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

### Local MCP (Claude Code, Codex, Cursor, Windsurf, VS Code, Gemini CLI, Antigravity, Kiro, OpenCode, or any stdio client)

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

## How It Works

The local npm package (`tapetide-mcp`) is a lightweight stdio bridge — ~300 lines of TypeScript with zero runtime dependencies beyond Node.js 18+. It reads JSON-RPC from stdin, forwards requests to the remote Tapetide MCP server at `mcp.tapetide.com/mcp` with token-based auth, and writes responses to stdout.

- Auto-detects framing: Content-Length (VS Code, Claude Desktop) or newline-delimited JSON (Kiro, Claude Code)
- Exchanges your refresh token for a 1-hour access token, auto-refreshes before expiry
- Handles SSE responses from the remote server
- Warns on stderr when approaching rate limits
- Wraps HTTP errors as proper JSON-RPC errors

No database, no API keys from third parties, no additional dependencies.

## Authentication

| Method | How it works | Best for |
|--------|-------------|----------|
| **Google OAuth** | Browser sign-in, automatic token refresh | AI chat apps (Claude.ai, ChatGPT, Grok) |
| **Personal Token (remote)** | `Authorization: Bearer tpt_rt_...` header | Code editors with URL support (VS Code, Kiro, Claude Code) |
| **Personal Token (local)** | `TAPETIDE_TOKEN` env var | Local stdio MCP clients (Cursor, Windsurf, Claude Desktop) |

Personal tokens work for both remote and local MCP. Generate one at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens).

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAPETIDE_TOKEN` | Yes (local) | — | Personal API token (starts with `tpt_rt_`) |
| `TAPETIDE_MCP_URL` | No | `https://mcp.tapetide.com` | Override remote server URL |
| `TAPETIDE_DEBUG` | No | `0` | Set to `1` to enable debug logging to stderr |

## Tools

### Search & Discovery
- `search_stocks` — Fuzzy search across all NSE/BSE stocks by name, symbol, BSE code, or ISIN. Filter by sector or industry.
- `screen_stocks` — Fundamental screener with 326 financial ratios: valuation, profitability, growth, balance sheet, cash flow, shareholding, and historical depth (3Y/5Y/10Y). Plain-English query syntax with cross-field comparisons.
- `screen_stocks_technical` — Technical screener with real-time data: RSI, MACD, SMA/EMA crossovers, Bollinger Bands, ADX, volume, momentum. Supports `crosses_above`/`crosses_below` for crossover detection.
- `get_screener_ratios` — Search or list all 326 available ratios for building `screen_stocks` queries.
- `get_trending_stocks` — Top gainers, losers, and high-volume stocks from Nifty 500.

### Company Data
- `get_company_profile` — Company overview with sector, fundamentals (PE, PB, market cap, ROE, ROCE, debt/equity), growth metrics, pros/cons, and current quote. Optionally include technicals, analyst ratings, and peer comparisons in one call.
- `get_stock_events` — Company news (sentiment-tagged), corporate actions (dividends, splits, bonuses, AGMs), and filings (annual reports, concall transcripts, investor presentations, credit ratings).
- `get_stock_ownership` — Dividend history (ex-date, amount, type, yield) and mutual fund holdings (which schemes hold the stock, quantity, % of AUM).

### Quotes & Prices
- `get_stock_quote` — Current stock price with LTP, change, volume, market cap, PE, PB, 52-week high/low.
- `get_batch_quotes` — Batch quotes for up to 20 stocks at once.
- `get_price_history` — Daily or weekly OHLCV candlestick data with delivery %. Up to 2,000 days of history.

### Financials & Fundamentals
- `get_financials` — Quarterly and annual P&L, balance sheet, cash flow, and financial ratios. Fetch individual sections or all at once.
- `get_shareholding` — Promoter, FII, DII, and public shareholding patterns over time. Quarterly or annual.
- `get_forecasts` — Analyst forecasts for EPS, revenue, EBITDA, net income, ROA, ROE, and price targets. Actuals vs estimates comparison for spotting earnings surprises.

### Market Data & Institutional Flows
- `get_market_pulse` — Quick market overview: FII/DII net flows, market valuations (Nifty 50 PE/PB/DY), and top technical signals.
- `get_fii_dii_detail` — Detailed FII/DII flows: 30-day daily cash market data, F&O participant positioning (FII/DII/Pro/Client long/short OI), weekly/monthly/yearly aggregates, buy/sell streaks, cumulative net flows, and optional chart data.
- `get_fpi_sectors` — FPI sector-wise investment: AUM share, fortnight change, 1-year cumulative flow per sector.
- `get_market_news` — Latest market-wide news across all categories with sentiment tagging (positive/negative/neutral), source URLs, and related stock symbols.
- `market_valuations` — Index PE, PB, and dividend yield over time. Nifty 50, Nifty 500, Bank Nifty, Nifty IT, Nifty Midcap 50, Nifty Next 50. Up to 20 years of history.

### Market Insights
- `market_deals` — Today's bulk and block deals: client name, buy/sell, quantity, average price, value.
- `market_fno_ban` — F&O ban list with MWPL utilization %. Stocks at 95%+ are in ban; 80-95% approaching ban.
- `market_ipo` — Current and upcoming IPO listings with subscription data (QIB, retail, NII, total times subscribed).
- `market_deliveries` — Stocks with highest delivery percentage today (genuine buying interest vs speculative trading).
- `market_mtf` — Margin Trading Facility data: consolidated MTF figures, per-stock funded positions, weekly/monthly trends.
- `market_slbm` — Stock Lending and Borrowing data: available stocks, bid prices, yield calculations.
- `market_signals` — Technical trading signals: breakouts, moving average crossovers, volume spikes, RSI extremes.
- `market_heatmap` — Stock heatmap for any index (Nifty 50, Bank Nifty, Nifty IT, etc.) with market cap, PE, PB, and multi-timeframe price changes.

### Portfolio Management
- `get_user_portfolio` — Current holdings with live prices, P&L (absolute + %), invested value, portfolio weight %, sector breakdown, and company classification.
- `add_portfolio_stocks` — Add one or more stocks. Auto-merges duplicates with weighted average price. Supports bulk add from broker CSV (Zerodha, Groww, Angel One, Dhan, Upstox, 5Paisa, ICICI Direct, Kotak, HDFC Sky, Motilal Oswal).
- `update_portfolio_stock` — Update quantity and/or average price for an existing holding.
- `remove_portfolio_stocks` — Remove one or more stocks from portfolio.

### Watchlist
- `get_watchlist` — All followed stocks with symbol, name, sector, industry.
- `add_to_watchlist` — Follow one or more stocks (idempotent).
- `remove_from_watchlist` — Unfollow one or more stocks.

## Example Prompts

### Deep Company Research

```
"Give me a complete analysis of Reliance Industries — financials, debt trend,
 analyst target price, upcoming corporate actions, and what mutual funds are
 holding it"

"Compare HDFC Bank and ICICI Bank side by side — quarterly profit growth, ROE,
 NPA ratios, shareholding changes, and what analysts are saying about each"

"Has promoter holding in Adani Enterprises been declining? Show me the quarterly
 trend along with FII and DII holding changes"

"Pull the last 4 quarters of TCS financials — revenue growth, operating margin
 trend, and cash flow from operations. How does it compare to Infosys?"

"What's the dividend history of ITC over the last 5 years? Calculate the
 average dividend yield and compare it to the sector"
```

### Advanced Stock Screening

```
"Find mid-cap stocks where FII holding increased last quarter, ROE is above 15%,
 and RSI is below 40 — these could be accumulation plays"

"Screen for Nifty 500 stocks trading below their industry PE with positive
 quarterly profit growth and a golden crossover (SMA50 > SMA200)"

"Which small-caps have debt-to-equity below 0.5, operating margin above 20%,
 and showed a bullish engulfing pattern today?"

"Find stocks with PE below 12, dividend yield above 3%, and market cap between
 5,000 and 50,000 crores — classic value picks"

"Show me stocks where MACD just crossed bullish, volume is 2x the 20-day
 average, and the stock is within 10% of its 52-week high"
```

### Institutional Flow Analysis

```
"FIIs have been selling for 5 days straight — show me the exact daily numbers
 and which sectors they're pulling out of via FPI data"

"Compare FII vs DII net flows for the last month and overlay it with Nifty 50
 PE valuation — are we near a historical bottom?"

"Which sectors saw the biggest FPI inflow this fortnight? Find stocks in those
 sectors that are also hitting 52-week highs"

"Show me the F&O participant-wise open interest — are FIIs net long or short
 in index futures right now?"
```

### Portfolio & Watchlist

```
"I hold RELIANCE, TCS, INFY, HDFCBANK, and ITC — give me current quotes,
 which ones are technically weak, and any recent negative news"

"Add these to my portfolio: 10 RELIANCE at ₹1350, 50 TCS at ₹3800,
 25 HDFCBANK at ₹1650"

"I just bought 10 more RELIANCE at ₹1400 — update my portfolio"

"Compare 6-month returns of my portfolio stocks against Nifty 50. Which ones
 are underperforming and what do analysts recommend?"

"Watch TATAMOTORS, MARUTI, M&M — and give me a quick technical setup
 comparison for each"
```

### Daily Market Briefing

```
"Give me a full market briefing — FII/DII flows, stocks in F&O ban, bulk deals
 above 50 crores, top delivery stocks, and any technical breakout signals"

"What happened in the market today? Biggest movers, new IPO subscriptions,
 and stocks that triggered technical signals"

"Is the market overvalued right now? Show me Nifty 50 PE, PB, and dividend
 yield compared to 5-year and 10-year averages"

"Show me the Nifty 50 heatmap — which sectors dragged the index down today
 and which ones held up?"
```

## Data Coverage

| Category | Coverage |
|----------|----------|
| Stocks | All NSE and BSE listed companies (~8,200) |
| Price data | Daily OHLCV (up to 2,000 days) + weekly aggregation + delivery % |
| Financials | Quarterly + annual P&L, balance sheet, cash flow, ratios |
| Screener | 326 fundamental ratios + real-time technical indicators, cross-field comparisons |
| Technicals | 20+ indicators: RSI, SMA, EMA, MACD, Bollinger Bands, ADX, ATR, Supertrend, Stochastic, MFI, CCI, Williams %R, pivot points |
| Candlestick patterns | Bullish/bearish engulfing, hammer, shooting star, morning/evening star, three white soldiers, three black crows, dark cloud cover, piercing |
| Institutional flows | FII/DII daily cash + F&O participant OI, FPI sector-wise, buy/sell streaks |
| Market insights | Bulk/block deals, F&O ban, IPOs, top deliveries, MTF, SLBM, heatmaps, signals |
| Analyst data | Consensus ratings + EPS/revenue/EBITDA/ROE/ROA forecasts with actuals vs estimates |
| Ownership | Shareholding patterns, dividend history, mutual fund scheme-level holdings |
| Events | Sentiment-tagged news, corporate actions, company filings (annual reports, concalls, presentations) |
| Portfolio | Live P&L tracking, sector breakdown, broker CSV import (10+ brokers supported) |

## Rate Limits

- **Remote MCP (OAuth)**: 100 requests/hour, 1,000 requests/day
- **Remote MCP (token)**: 1,000 requests/hour, 4,000 requests/day
- **Local MCP (npm)**: 1,000 requests/hour, 4,000 requests/day
- Rate limit headers included in every response: `X-RateLimit-Remaining`, `X-RateLimit-Limit`, `X-RateLimit-Reset`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Token refresh failed (401)` | Token is invalid or expired. Generate a new one at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| `Token refresh failed (network error)` | Check your internet connection. The server needs to reach `mcp.tapetide.com` |
| `Rate limit exceeded` | You've hit the free tier limit. Wait for the reset (shown in error message) or check usage at [tapetide.com/settings/tokens](https://tapetide.com/settings/tokens) |
| Server not responding | Ensure Node.js 18+ is installed. Run `node --version` to check |
| `TAPETIDE_TOKEN environment variable is required` | Add your token to the `env` section of your MCP config |
| Slow first request | Normal — the server pre-authenticates on startup. Subsequent requests are fast |

Enable debug logging for more details: set `TAPETIDE_DEBUG=1` in your env config.

## Links

- [tapetide.com](https://tapetide.com) — Web platform
- [tapetide.com/mcp](https://tapetide.com/mcp) — MCP documentation
- [mcp.tapetide.com](https://mcp.tapetide.com) — Remote MCP endpoint
- [npm: tapetide-mcp](https://www.npmjs.com/package/tapetide-mcp) — npm package
- [@tapetide_hq](https://x.com/tapetide_hq) — X (Twitter)

## License

[MIT](./LICENSE) — free to use, modify, and distribute.
