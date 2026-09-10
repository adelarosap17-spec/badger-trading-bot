export type ExchangePositionSummaryResponse = {
  exchange: string;
  mode: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  boughtQuantity: string;
  soldQuantity: string;
  netQuantity: string;
  totalBuyQuote: string;
  totalSellQuote: string;
  averageBuyPrice: string | null;
  lastPrice: string | null;
  estimatedValue: string | null;
  estimatedPnl: string | null;
  estimatedPnlPercent: string | null;
  status: 'open' | 'closed';
};