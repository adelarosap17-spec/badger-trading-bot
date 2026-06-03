import type { MarketSymbolSummary } from "../types/market-data.types";

export const marketSymbolSummaries: MarketSymbolSummary[] = [
  {
    symbol: "BTC/USDT",
    timeframe: "15m",
    lastPrice: "104,250.20 USDT",
    spread: "0.012%",
    lastCandleClose: "104,180.50 USDT",
    status: "synced",
  },
  {
    symbol: "BTC/USDT",
    timeframe: "1h",
    lastPrice: "104,250.20 USDT",
    spread: "0.012%",
    lastCandleClose: "103,980.10 USDT",
    status: "synced",
  },
  {
    symbol: "ETH/USDT",
    timeframe: "15m",
    lastPrice: "3,860.44 USDT",
    spread: "0.018%",
    lastCandleClose: "3,855.80 USDT",
    status: "pending",
  },
  {
    symbol: "ETH/USDT",
    timeframe: "1h",
    lastPrice: "3,860.44 USDT",
    spread: "0.018%",
    lastCandleClose: "3,842.15 USDT",
    status: "synced",
  },
];
