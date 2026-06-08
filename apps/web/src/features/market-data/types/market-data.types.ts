export type MarketSyncStatus = "synced" | "pending" | "error";

export type MarketSymbolResponse = {
  id: string;
  symbol: string;
  displaySymbol: string;
  marketType: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  minNotional: string | null;
  isActive: boolean;
};

export type MarketTimeframeResponse = {
  id: string;
  code: string;
  label: string;
  durationSeconds: number;
  isActive: boolean;
};

export type MarketSymbolSummary = {
  symbol: string;
  timeframe: string;
  lastPrice: string;
  spread: string;
  lastCandleClose: string;
  status: MarketSyncStatus;
};
