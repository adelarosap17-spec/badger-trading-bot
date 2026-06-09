export type StrategyDecision = 'buy' | 'sell' | 'hold' | 'close_long';

export type StrategyEvaluationResponse = {
  symbol: string;
  timeframe: string;
  strategyName: string;
  candleCount: number;
  latestClose: string;
  ema9: string | null;
  ema21: string | null;
  rsi14: string | null;
  decision: StrategyDecision;
  reason: string;
  evaluatedAt: string;
};
