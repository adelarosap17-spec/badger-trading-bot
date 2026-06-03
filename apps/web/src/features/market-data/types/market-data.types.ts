export type MarketSyncStatus = "synced" | "pending" | "error";

export type MarketSymbolSummary = {
  symbol: string;
  timeframe: string;
  lastPrice: string;
  spread: string;
  lastCandleClose: string;
  status: MarketSyncStatus;
};
