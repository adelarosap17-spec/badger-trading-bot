export type ExchangeRiskMarketBuyRequest = {
  symbol: string;
  quoteOrderQty: string;
};

export type ExchangeRiskDecision = 'approved' | 'rejected';

export type ExchangeRiskMarketBuyResponse = {
  decision: ExchangeRiskDecision;
  symbol: string;
  quoteOrderQty: string;
  reasons: string[];
  checks: {
    symbolValid: boolean;
    quoteOrderQtyValid: boolean;
    quoteOrderQtyWithinLimit: boolean;
    hasEnoughBalance: boolean;
    duplicateOpenPositionAllowed: boolean;
    dailyBuyLimitAllowed: boolean;
  };
  limits: {
    maxQuoteOrderQty: string;
    maxDailyBuyOrders: number;
  };
  currentState: {
    availableUsdt: string;
    openPositionExists: boolean;
    todayBuyOrders: number;
  };
};