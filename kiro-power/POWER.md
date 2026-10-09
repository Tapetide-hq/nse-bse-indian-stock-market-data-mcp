---
name: "tapetide-indian-stock-market"
displayName: "Tapetide — Indian Stock Market (NSE & BSE)"
description: "Research any of ~8,200 NSE and BSE listed stocks: live quotes, financials, technicals, a 326-ratio screener, analyst ratings, FII/DII flows, option chains with IV, parsed annual reports and concall transcripts, IPOs and portfolio tracking."
version: "1.0.0"
author: "Tapetide"
keywords:
  - "stocks"
  - "indian stock market"
  - "nse"
  - "bse"
  - "nifty"
  - "sensex"
  - "stock screener"
  - "fundamental analysis"
  - "technical analysis"
  - "fii dii"
  - "option chain"
  - "financial data"
  - "market data"
  - "mcp"
---

# Tapetide — Indian Stock Market (NSE & BSE)

This power connects Kiro to Indian stock market data through the Tapetide MCP server: 55 tools covering every NSE and BSE listed company, from Nifty 50 large caps to SME stocks.

## Setup

1. Get a free token at https://tapetide.com/settings/tokens (it starts with `tpt_rt_`).
2. Set it in your environment as `TAPETIDE_TOKEN`.

The free plan includes 50 tool calls a day, up to 1,000 a month. Without a token the server still starts and lists its tools, but every tool call returns a message explaining how to add one.

## Start every session with `read_me`

Call `read_me` first. It returns the in-session guide: every tool by category, how to chain them, and the rules the server expects clients to follow.

## Which tool for which question

| Question | Tool |
|---|---|
| "What's the symbol for Zomato?" | `search_stocks` (handles brand names and renames) |
| "Live price of HDFC Bank" | `get_stock_quote`, or `get_batch_quotes` for up to 20 |
| "Full picture of a company" | `get_company_profile` (can include technicals, ratings and peers) |
| "Quarterly results, margins, cash flow" | `get_financials` |
| "Find stocks with PE < 20 and ROCE > 18%" | `get_screener_ratios` for exact ratio names, then `screen_stocks` |
| "RSI below 30, price above 200 DMA" | `screen_stocks_technical` |
| "What are FIIs doing?" | `get_market_pulse` for today, `get_fii_dii_detail` for 30 days |
| "Which sector led last month?" | `get_index_performance` |
| "NIFTY option chain, max pain, PCR" | `get_option_chain`; `get_option_iv_history` for IV rank |
| "What did management guide on the last call?" | `get_earnings_call_summary`; `list_company_documents` then `read_document` for the source text |
| "Bulk deals, F&O ban, IPOs today" | `get_market_data` with `dataset` set |

## Working rules

- Resolve names to symbols with `search_stocks` before calling per-stock tools.
- Prefer one `get_company_profile` call over several narrow calls when the user wants an overview.
- Screens take plain-English query syntax with AND/OR; check ratio names with `get_screener_ratios` rather than guessing them.
- For backtests, use the point-in-time tools (`get_index_membership_asof`, `get_adjustment_factors`, `get_observation_status`) so results stay free of survivorship and look-ahead bias.
- Data is for research. Present it as information, not investment advice.

## Privacy and support

- Privacy policy: https://tapetide.com/privacy
- Terms: https://tapetide.com/terms
- Support: hello@tapetide.com · https://tapetide.com/mcp
