export type BotCycleSignalItem = {
  symbol: string;
  timeframe: string;
  signalId: string | null;
  signalType: string | null;
  signalStatus: string | null;
  riskDecision: string | null;
  tradeExecuted: boolean;
  orderId: string | null;
  positionId: string | null;
  errorMessage: string | null;
};

export type BotCycleResponse = {
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
    syncedPairs: number;
    failedPairs: number;
    successfulEvaluations: number;
    failedEvaluations: number;
    approvedSignals: number;
    rejectedSignals: number;
    executedTrades: number;
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