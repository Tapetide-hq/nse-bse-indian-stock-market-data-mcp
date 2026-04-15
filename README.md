<p align="center">
  <img src="https://assets.tapetide.com/logo.svg" alt="Tapetide" width="80" />
</p>

# Tapetide Stock Research MCP Server — Indian Stock Market Data for AI Assistants

> Tapetide Stock Research MCP Server for Claude, ChatGPT, Cursor, Kiro, and any MCP-compatible AI agent. Search, screen, and analyze all NSE and BSE stocks with 26 tools covering quotes, financials, technicals, analyst ratings, forecasts, FII/DII flows, screener, and market insights.

[![npm](https://img.shields.io/npm/v/tapetide-mcp)](https://www.npmjs.com/package/tapetide-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## What is this?

Tapetide Stock Research MCP Server is a [Model Context Protocol](https://modelcontextprotocol.io/) server that gives AI assistants direct access to Indian stock market data. Ask your AI to look up any NSE/BSE stock, run a screener with 100+ filters, pull financials, check technical indicators, or get the latest FII/DII activity — all through natural language.

Works with Claude Desktop, ChatGPT, Cursor, Windsurf, Kiro, and any client that supports MCP.

**[Learn more about Tapetide Stock Research MCP Server →](https://tapetide.com/mcp)**

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
        "TAPETIDE_TOKEN": "get your free token from https://tapetide.com/settings/tokens"
      }
    }
  }
}
```

## Authentication

Tapetide MCP supports three authentication methods:

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
- `search_stocks` — Fuzzy search across all NSE and BSE listed stocks by name, symbol, BSE code, or ISIN. Filter by sector or industry.

### Company Data
- `get_company_profile` — Company overview with sector, fundamentals (PE, PB, market cap, ROE, ROCE, debt/equity), growth metrics, and current quote. Optionally include technicals, analyst ratings, and peer comparisons in one call.
- `get_stock_events` — Company news (sentiment-tagged), corporate actions (dividends, splits, bonuses, AGMs), and filings (annual reports, concall transcripts, investor presentations).
- `get_stock_ownership` — Dividend history (ex-date, amount, type, yield) and mutual fund holdings (which schemes hold the stock, quantity, % of AUM).

### Quotes & Prices
- `get_stock_quote` — Current stock price with LTP, change, volume, market cap, PE, PB, 52-week high/low.
- `get_batch_quotes` — Batch quotes for up to 20 stocks at once.
- `get_price_history` — Daily or weekly OHLCV candlestick data with delivery %. Up to 2,000 days of history.

### Financials & Fundamentals
- `get_financials` — Quarterly and annual P&L, balance sheet, cash flow, and financial ratios. Fetch individual sections or all at once.
- `get_shareholding` — Promoter, FII, DII, and public shareholding patterns over time. Quarterly or annual.
- `get_forecasts` — Analyst forecasts for EPS, revenue, EBITDA, net income, ROA, ROE, and price targets. Actuals vs estimates comparison for spotting earnings surprises.

### Stock Screener
- `screen_stocks` — Custom screener with 100+ filters across fundamentals, technicals, candlestick patterns, shareholding, and industry comparisons. Supports cross-field comparisons (e.g., SMA50 > SMA200, PE < industry PE).
- `run_preset_screen` — 47 pre-built screener strategies: golden/death crossover, potential multibagger, undervalued near 52W high, bullish/bearish engulfing, overbought/oversold RSI, resistance/support breakouts, and more.
- `get_screener_presets` — List all preset screens with slugs, names, and categories.
- `get_trending_stocks` — Top gainers, losers, and high-volume stocks from Nifty 500.

### Market Data & Institutional Flows
- `get_market_pulse` — Quick market overview: FII/DII net flows, market valuations (Nifty 50 PE/PB/DY), and top technical signals.
- `get_fii_dii_detail` — Detailed FII/DII flows: 30-day daily cash market data, F&O participant positioning (FII/DII/Pro/Client long/short OI), weekly/monthly/yearly aggregates, buy/sell streaks, cumulative net flows, and optional chart data.
- `get_fpi_sectors` — FPI sector-wise investment: AUM share, fortnight change, 1-year cumulative flow per sector.
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

"Show me Bajaj Finance's balance sheet — total debt, debt-to-equity ratio trend,
 and how it compares to its peers in the NBFC space"
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

"Screen for IT sector stocks with revenue growth above 15%, ROCE above 20%,
 and promoter holding above 50%"

"Find potential multibaggers — small caps with high ROE, low debt, increasing
 institutional holding, and strong quarterly results"

"Which Bank Nifty stocks have RSI below 30 but positive analyst ratings?
 Could be oversold quality names"
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

"What's the 1-year cumulative FII flow trend? Compare it with DII flows to
 see who's been the dominant force"

"Track FPI sector allocation changes — which sectors have FPIs been
 consistently increasing allocation to over the last 6 months?"
```

### Technical + Fundamental Combos

```
"Find stocks that are technically oversold (RSI below 30) but have strong
 fundamentals — ROE above 18%, low debt, and positive analyst ratings"

"Show me Nifty IT stocks where MACD just crossed bullish, and compare their
 PE ratios to the sector average"

"Which stocks are near their Bollinger Band lower band with high delivery
 percentage today? Could be institutional accumulation"

"Find golden crossover stocks (SMA50 crossing above SMA200) that also have
 improving quarterly revenue growth and FII buying"

"Screen for stocks with Supertrend bullish signal, ADX above 25 (strong trend),
 and market cap above 10,000 crores"

"Which Nifty 500 stocks broke above resistance R1 today with above-average
 volume and positive analyst consensus?"
```

### Daily Market Briefing

```
"Give me a full market briefing — FII/DII flows, stocks in F&O ban, bulk deals
 above 50 crores, top delivery stocks, and any technical breakout signals"

"What happened in the market today? Biggest movers, new IPO subscriptions,
 and stocks that triggered technical signals"

"Are there any stocks approaching F&O ban (MWPL above 80%)? Cross-check with
 their recent bulk deal activity and MTF positions"

"Show me the Nifty 50 heatmap — which sectors dragged the index down today
 and which ones held up?"

"What's the MTF trend this week? Are traders adding leveraged positions or
 deleveraging? Show me the top stocks by MTF funded amount"

"Any stocks available for lending with high SLBM yield? That usually signals
 strong short-selling demand"
```

### Portfolio Review & Monitoring

```
"I hold RELIANCE, TCS, INFY, HDFCBANK, and ITC — give me current quotes,
 which ones are technically weak, and any recent negative news"

"Compare 6-month returns of my portfolio stocks against Nifty 50. Which ones
 are underperforming and what do analysts recommend?"

"Check if any of these stocks had recent corporate actions or filings I should
 know about: BAJFINANCE, TITAN, DMART, ASIANPAINT"

"For my watchlist — TATAMOTORS, MARUTI, M&M, HEROMOTOCO — show me PE
 comparison, quarterly sales growth, and who has the best technical setup"

"Which of my holdings have seen mutual fund buying increase in the last
 quarter? And which ones have MFs been reducing?"
```

### IPO & Event Research

```
"What IPOs are currently open? Show me subscription data — how many times
 subscribed in QIB, retail, and NII categories"

"Any upcoming IPOs this month? What's the price band and issue size?"

"Show me recent company filings for Tata Motors — any concall transcripts
 or investor presentations I should read?"

"What corporate actions are coming up for Nifty 50 stocks — dividends,
 stock splits, or bonus issues?"

"Find stocks that announced results this week with the biggest positive
 earnings surprise vs analyst estimates"
```

### Market Valuation & Timing

```
"Is the market overvalued right now? Show me Nifty 50 PE, PB, and dividend
 yield compared to 5-year and 10-year averages"

"Compare Bank Nifty valuation (PE/PB) over the last 3 years — are banking
 stocks cheap relative to history?"

"Show me Nifty Midcap 50 PE trend over 5 years. Where are we now vs the
 historical median?"

"Pull Nifty IT index valuation data for the last 2 years and overlay it
 with FPI sector flows into IT — any correlation?"
```

## Data Coverage

| Category | Coverage |
|----------|----------|
| Stocks | All NSE and BSE listed companies |
| Price data | Daily OHLCV (up to 2,000 days) + weekly aggregation |
| Financials | Quarterly + annual P&L, balance sheet, cash flow, ratios |
| Screener | 100+ filters, 47 preset strategies, cross-field comparisons |
| Technicals | 20+ indicators: RSI, SMA, EMA, MACD, Bollinger Bands, ADX, ATR, Supertrend, Stochastic, MFI, CCI, Williams %R, pivot points |
| Candlestick patterns | Bullish/bearish engulfing, hammer, shooting star, morning/evening star, three white soldiers, three black crows, and more |
| Institutional flows | FII/DII daily cash + F&O participant OI, FPI sector-wise, buy/sell streaks |
| Market insights | Bulk/block deals, F&O data, IPOs, top deliveries, MTF, SLBM, heatmaps, signals |
| Analyst data | Consensus ratings + EPS/revenue/EBITDA/ROE/ROA forecasts with actuals vs estimates |
| Ownership | Shareholding patterns, dividend history, mutual fund scheme-level holdings |
| Events | Sentiment-tagged news, corporate actions, company filings (annual reports, concalls, presentations) |

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
- [tapetide.com/mcp](https://tapetide.com/mcp) — MCP server documentation
- [mcp.tapetide.com](https://mcp.tapetide.com) — Remote MCP endpoint
- [npm: tapetide-mcp](https://www.npmjs.com/package/tapetide-mcp) — npm package
- [@tapetide_hq](https://x.com/tapetide_hq) — X (Twitter)

## License

[MIT](./LICENSE) — free to use, modify, and distribute.
