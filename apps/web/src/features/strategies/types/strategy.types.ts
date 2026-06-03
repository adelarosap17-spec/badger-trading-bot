export type StrategyMode = "backtest" | "paper" | "live";

export type StrategyStatus = "running" | "paused" | "stopped" | "error";

export type StrategySummary = {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  mode: StrategyMode;
  status: StrategyStatus;
  capitalAllocated: string;
  riskPerTrade: string;
  dailyLossLimit: string;
  dailyProfitTarget: string;
  fastEmaPeriod: number;
  slowEmaPeriod: number;
  rsiPeriod: number;
};
