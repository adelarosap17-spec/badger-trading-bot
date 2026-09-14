export type BotTradingMode = 'paper' | 'testnet';

export type BotCycleSignalItem = {
  symbol: string;
  timeframe: string;
  signalId: string | null;
  signalType: string | null;
  signalStatus: string | null;
  tradingMode: BotTradingMode;
  riskDecision: string | null;
  tradeExecuted: boolean;
  executionVenue: 'paper' | 'binance-testnet' | null;
  orderId: string | null;
  positionId: string | null;
  exchangeOrderId: string | null;
  errorMessage: string | null;
};

export type BotCycleResponse = {
  tradingMode: BotTradingMode;
  startedAt: string;
  finishedAt: string;
  marketDataSync: {
    totalPairs: number;
    syncedPairs: number;
    failedPairs: number;
  };
  strategyEvaluation: {
    totalEvaluations: number;
    successfulEvaluations: number;
    failedEvaluations: number;
  };
  risk: {
    approved: number;
    rejected: number;
    skipped: number;
  };
  paperTrading: {
    executedTrades: number;
    skippedTrades: number;
    failedTrades: number;
  };
  exchangeTrading: {
    executedOrders: number;
    skippedOrders: number;
    failedOrders: number;
  };
  positionManager: {
    totalOpenPositions: number;
    closedPositions: number;
    keptOpenPositions: number;
    skippedPositions: number;
  };
  items: BotCycleSignalItem[];
};

export type BotStatusResponse = {
  status: 'ready' | 'warning' | 'error';
  lastCycleAt: string | null;
  lastCycleMessage: string | null;
  lastCycleSummary: {
    tradingMode: BotTradingMode;
    syncedPairs: number;
    failedPairs: number;
    successfulEvaluations: number;
    failedEvaluations: number;
    approvedSignals: number;
    rejectedSignals: number;
    executedPaperTrades: number;
    executedExchangeOrders: number;
    closedPositions: number;
  } | null;
  counts: {
    openPositions: number;
    generatedSignals: number;
    approvedSignals: number;
    executedSignals: number;
    rejectedSignals: number;
    filledOrders: number;
  };
};

export type BotLogResponse = {
  id: string;
  level: string;
  source: string;
  message: string;
  metadata: unknown;
  createdAt: string;
};