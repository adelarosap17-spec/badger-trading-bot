export type BinanceAccountBalance = {
   asset: string;
   free: string;
   locked: string;
};

export type BinanceTestnetBalanceResponse = {
   mode: "testnet";
   accountType: string;
   canTrade: boolean;
   balances: BinanceAccountBalance[];
};

export type ExchangeOrderSummaryResponse = {
   id: string;
   exchange: string;
   mode: string;
   symbol: string;
   side: string;
   type: string;
   status: string;
   quoteOrderQty: string | null;
   executedQty: string | null;
   cumulativeQuoteQty: string | null;
   averagePrice: string | null;
   externalOrderId: string;
   externalClientOrderId: string | null;
   createdAt: string;
};

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
   status: "open" | "closed";
};

export type ExchangeDashboardData = {
   balance: BinanceTestnetBalanceResponse;
   orders: ExchangeOrderSummaryResponse[];
   positions: ExchangePositionSummaryResponse[];
};