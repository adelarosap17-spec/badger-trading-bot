export type BotStatus = "ready" | "warning" | "error";

export type BotStatusResponse = {
   status: BotStatus;
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