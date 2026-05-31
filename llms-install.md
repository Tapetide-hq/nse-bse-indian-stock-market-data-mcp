# Tapetide Stock Research MCP Server — Installation Guide for AI Agents

## Prerequisites

- Node.js 18 or later
- A free Tapetide API token from https://tapetide.com/settings/tokens

## Option 1: Remote MCP (URL-based, no npm needed)

If your MCP client supports URL-based servers, use the remote server directly:

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

For AI chat apps (Claude.ai, ChatGPT, Grok, Gemini), just add the URL `https://mcp.tapetide.com/mcp` — authentication happens via Google OAuth automatically.

## Option 2: Local MCP (stdio bridge via npm)

Published on npm as `tapetide-mcp`. No cloning or building required.

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

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAPETIDE_TOKEN` | Yes (local) | — | API token from https://tapetide.com/settings/tokens (starts with `tpt_rt_`) |
| `TAPETIDE_MCP_URL` | No | `https://mcp.tapetide.com` | Override remote server URL |
| `TAPETIDE_DEBUG` | No | `0` | Set to `1` for debug logging to stderr |

## How It Works

The local server is a stdio bridge (~300 lines, zero runtime dependencies). It reads JSON-RPC from stdin, forwards requests to the remote Tapetide API at `https://mcp.tapetide.com/mcp` with token-based auth, and writes responses to stdout. All tool logic runs on the remote server.

## Available Tools (34)

### Search & Discovery
- `search_stocks` — Fuzzy search by name, symbol, BSE code, or ISIN
- `screen_stocks` — Fundamental screener with 326 ratios (PE, ROCE, growth, debt, shareholding)
- `screen_stocks_technical` — Real-time technical screener (RSI, MACD, SMA/EMA crossovers, Bollinger, ADX)
- `get_screener_ratios` — Search/list all 326 available fundamental ratios
- `get_trending_stocks` — Top gainers, losers, high-volume stocks from Nifty 500

### Company Analysis
- `get_company_profile` — Full overview with optional technicals, analyst ratings, peer comparison
- `get_stock_events` — News (sentiment-tagged), corporate actions, filings (concalls, annual reports)
- `get_stock_ownership` — Dividend history + mutual fund scheme-level holdings

### Quotes & Prices
- `get_stock_quote` — Live price, change, volume, market cap, PE, PB, 52-week range
- `get_batch_quotes` — Up to 20 quotes in one call
- `get_price_history` — Daily/weekly OHLCV with delivery % (up to 2,000 days)

### Financials & Fundamentals
- `get_financials` — P&L, balance sheet, cash flow, ratios (quarterly + annual)
- `get_shareholding` — Promoter, FII, DII, public holdings over time
- `get_forecasts` — Analyst EPS/revenue/EBITDA estimates vs actuals

### Market Data & Institutional Flows
- `get_market_pulse` — FII/DII flows, Nifty 50 valuations, top signals
- `get_fii_dii_detail` — 30-day daily flows, F&O positioning, aggregates, streaks
- `get_fpi_sectors` — FPI sector-wise investment (AUM, fortnight change, 1Y flow)
- `get_market_news` — Sentiment-tagged market news across categories
- `market_valuations` — Index PE/PB/DY over time (up to 20 years, 6 indices)

### Market Insights
- `market_deals` — Bulk and block deals (client, qty, price, value)
- `market_fno_ban` — F&O ban list and approaching-ban stocks (MWPL %)
- `market_ipo` — Current and upcoming IPOs with subscription data
- `market_deliveries` — Highest delivery % stocks (genuine buying interest)
- `market_mtf` — Margin trading facility data (funded positions, trends)
- `market_slbm` — Stock lending and borrowing (yield, short-selling demand)
- `market_signals` — Technical breakouts, crossovers, RSI extremes
- `market_heatmap` — Index constituent heatmap with multi-timeframe changes

### Portfolio Management
- `get_user_portfolio` — Holdings with live P&L, sector breakdown, weight %
- `add_portfolio_stocks` — Add stocks (supports broker CSV: Zerodha, Groww, Angel One, Dhan, Upstox, etc.)
- `update_portfolio_stock` — Update quantity/avg price for buys or sells
- `remove_portfolio_stocks` — Remove stocks from portfolio

### Watchlist
- `get_watchlist` — All followed stocks
- `add_to_watchlist` — Follow stocks (idempotent)
- `remove_from_watchlist` — Unfollow stocks

## Verification

After installation, call `search_stocks` with query `"Reliance"` to confirm the server is working.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `TAPETIDE_TOKEN environment variable is required` | Add your token to the `env` section of your MCP config |
| `Token refresh failed (401)` | Token expired. Generate a new one at https://tapetide.com/settings/tokens |
| `Rate limit exceeded` | Wait for reset or check usage at https://tapetide.com/settings/tokens |
| Network errors | Check internet. Bridge needs to reach `mcp.tapetide.com` |
| Slow first request | Normal — pre-authenticates on startup. Subsequent requests are fast |

Set `TAPETIDE_DEBUG=1` for detailed logging.
