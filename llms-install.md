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

## Available Tools (34)

### Search & Discovery
- `search_stocks` — Fuzzy search by name, symbol, BSE code, or ISIN
- `screen_stocks` — Fundamental screener with 326 ratios
- `screen_stocks_technical` — Real-time technical screener (RSI, MACD, SMA/EMA crossovers, Bollinger, ADX)
- `get_screener_ratios` — Search/list all 326 available ratios
- `get_trending_stocks` — Top gainers, losers, high-volume stocks

### Company Data
- `get_company_profile` — Full overview with optional technicals, ratings, peers
- `get_stock_events` — News, corporate actions, filings
- `get_stock_ownership` — Dividend history + mutual fund holdings

### Quotes & Prices
- `get_stock_quote` — Live price, change, volume, market cap, 52-week range
- `get_batch_quotes` — Up to 20 quotes in one call
- `get_price_history` — Daily/weekly OHLCV (up to 2,000 days)

### Financials & Fundamentals
- `get_financials` — P&L, balance sheet, cash flow, ratios
- `get_shareholding` — Promoter, FII, DII, public holdings over time
- `get_forecasts` — Analyst EPS/revenue/EBITDA estimates vs actuals

### Market Data & Institutional Flows
- `get_market_pulse` — FII/DII flows, valuations, top signals
- `get_fii_dii_detail` — 30-day daily flows, F&O positioning, aggregates
- `get_fpi_sectors` — FPI sector-wise investment data
- `get_market_news` — Sentiment-tagged market news across categories
- `market_valuations` — Index PE/PB/DY over time (up to 20 years)

### Market Insights
- `market_deals` — Bulk and block deals
- `market_fno_ban` — F&O ban list and approaching-ban stocks
- `market_ipo` — Current and upcoming IPOs with subscription data
- `market_deliveries` — Highest delivery % stocks
- `market_mtf` — Margin trading facility data
- `market_slbm` — Stock lending and borrowing data
- `market_signals` — Technical breakouts, crossovers, RSI extremes
- `market_heatmap` — Index constituent heatmap with multi-timeframe changes

### Portfolio Management
- `get_user_portfolio` — Holdings with live P&L, sector breakdown
- `add_portfolio_stocks` — Add stocks (supports broker CSV import)
- `update_portfolio_stock` — Update quantity/avg price
- `remove_portfolio_stocks` — Remove stocks from portfolio

### Watchlist
- `get_watchlist` — All followed stocks
- `add_to_watchlist` — Follow stocks (idempotent)
- `remove_from_watchlist` — Unfollow stocks

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
