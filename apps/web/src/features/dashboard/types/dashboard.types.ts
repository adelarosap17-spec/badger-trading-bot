export type BotStatus = "ready" | "warning" | "error";

export type BotStatusResponse = {
   status: BotStatus;
   lastCycleAt: string | null;
   lastCycleMessage: string | null;
   lastCycleSummary: {
      tradingMode?: "paper" | "testnet";
      syncedPairs: number;
      failedPairs: number;
      successfulEvaluations: number;
      failedEvaluations: number;
      approvedSignals: number;
      rejectedSignals: number;
      executedTrades?: number;
      executedPaperTrades?: number;
      executedExchangeOrders?: number;
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

export type BotSchedulerStatusResponse = {
   enabled: boolean;
   intervalMinutes: number;
   isRunning: boolean;
   lastRunAt: string | null;
   lastRunStatus: "success" | "failed" | null;
   lastRunError: string | null;
};