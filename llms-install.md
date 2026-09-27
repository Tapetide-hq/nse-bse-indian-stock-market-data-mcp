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

The local server is a stdio bridge (~450 lines, zero runtime dependencies). It reads JSON-RPC from stdin, forwards requests to the remote Tapetide API at `https://mcp.tapetide.com/mcp` with token-based auth, and writes responses to stdout. All tool logic runs on the remote server.

## Available Tools (55)

The bridge forwards JSON-RPC verbatim, so the live list is always `tools/list` on the server. Ask the
assistant to call `read_me` first — it returns the full in-session guide.

### Discovery & Screening
- `search_stocks` — Resolve a company to its symbol by name, symbol, BSE code, or ISIN (brand names and post-rename aliases included)
- `screen_stocks` — Fundamental screener over 326 ratios with AND/OR logic and cross-field comparisons
- `screen_stocks_technical` — Real-time technical screener (RSI, MACD, SMA/EMA crossovers, Bollinger, ADX, volume)
- `get_screener_ratios` — Search or list the 326-ratio catalog for exact ratio names
- `get_trending_stocks` — Today's top gainers, losers, most-active from the Nifty 500

### Company Analysis
- `get_company_profile` — Overview, fundamentals, growth; optional technicals, analyst ratings, peers
- `get_stock_quote` — Live price, change, volume, market cap, PE, PB, 52-week range
- `get_batch_quotes` — Up to 20 quotes in one call
- `get_price_history` — Daily/weekly OHLCV with delivery % (up to 2,000 days per call, pageable)
- `get_financials` — Quarterly + annual P&L, balance sheet, cash flow, ratios, each period stamped with its publication date
- `get_shareholding` — Promoter, FII, DII, public holdings by quarter
- `get_forecasts` — Analyst EPS/revenue/EBITDA/ROE estimates vs actuals
- `get_stock_events` — Sentiment-tagged news, corporate actions, filings
- `get_stock_ownership` — Dividend history + mutual fund scheme-level holdings

### Market-Wide Data
- `get_market_pulse` — FII/DII flows, Nifty 50 valuations, India VIX in one call
- `get_fii_dii_detail` — 30-day flows, F&O positioning, aggregates, streaks
- `get_fii_dii_flows` — Alias of `get_fii_dii_detail`
- `get_fpi_sectors` — FPI sector-wise investment
- `get_market_news` — Sentiment-tagged market-wide news
- `get_market_data` — One dispatcher for seven daily feeds via `dataset`: `deals`, `fno_ban`, `deliveries`, `ipo`, `mtf`, `slbm`, `signals`
- `market_heatmap` — Index constituent heatmap with multi-timeframe changes (16 indices)
- `market_valuations` — Index PE/PB/DY over time (up to 20 years)
- `get_india_vix` — India VIX latest level, change, history
- `get_index_performance` — Rank ~140 NSE indices by return over completed weeks or months
- `get_index_history` — OHLC level series plus PE/PB/DY for one index

### Derivatives & Risk
- `get_option_chain` — Per-strike index option chain with IV, Greeks, OI, max pain, PCR (NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY)
- `get_option_iv_history` — ATM IV, IV rank/percentile, realised vol, PCR history for ~556 underlyings
- `get_options_analytics` — Latest per-expiry aggregates for a stock
- `get_promoter_pledge` — Promoter share-pledge history and events
- `get_credit_ratings` — Credit-rating actions by agency

### Research & Scoring
- `get_stock_deals` — Bulk, block, insider, SAST disclosures per stock
- `get_tapetide_score` — Deterministic 0-100 Tapetide Score with pillar sub-scores
- `screen_tapetide_scores` — Rank and filter the scored universe
- `get_earnings_call_summary` — Digest of recent earnings-call transcripts and presentations

### Filing Text
- `list_company_documents` — Index of a company's parsed filings with `doc_id`, page counts and download links; call first
- `get_document_summary` — Investor digest of one filing by `doc_id`
- `read_document` — Markdown text of a filing by `doc_id` and page range, with page markers to cite

### Point-in-Time & Backtest Safety
- `get_adjustment_factors` — Split/bonus adjustment timeline
- `get_observation_status` — Per-day reason a price is present or missing
- `get_index_membership_asof` — Was a stock in an index on a date (present / uncertain / absent / out_of_coverage)
- `resolve_identifier_asof` — Historical symbol or ISIN to the company that held it on a date
- `get_identifiers_asof` — Which symbol and ISIN a company traded under on a date

### Portfolio (needs a connected account)
- `get_user_portfolio` — Holdings with live P&L, sector breakdown, weight %
- `add_portfolio_stocks` — Add stocks (broker CSV rows supported)
- `update_portfolio_stock` — Update quantity/avg price
- `remove_portfolio_stocks` — Remove stocks

### Watchlist (needs a connected account)
- `get_watchlist` — All followed stocks
- `add_to_watchlist` — Follow stocks (idempotent)
- `remove_from_watchlist` — Unfollow stocks

### Guide & Aliases
- `read_me` — The full in-session guide; call it first
- `scan_movers` — Alias of `get_trending_stocks`
- `get_live_quote` — Alias of `get_stock_quote`
- `get_stock_news` — Alias of `get_stock_events` with `type: "news"`
- `get_corporate_actions` — Alias of `get_stock_events` with `type: "corporate_actions"`
- `run_preset_screen` — Redirect to the screener tool that can answer a preset request

### Retired names
`market_deals`, `market_fno_ban`, `market_deliveries`, `market_ipo`, `market_mtf`, `market_slbm` and
`market_signals` are now `get_market_data` with the matching `dataset`. `get_quant_signal` and
`screen_by_quant_signal` were replaced by `get_tapetide_score` and `screen_tapetide_scores` (a different
measurement, not a rename). Calling a retired name returns a message pointing at the replacement.

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
