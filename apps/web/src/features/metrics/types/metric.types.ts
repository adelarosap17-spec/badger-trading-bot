export type MetricTrend = "positive" | "negative" | "neutral";

export type MetricSummary = {
   id: string;
   label: string;
   value: string;
   change: string;
   trend: MetricTrend;
};

export type StrategyMetricSummary = {
   id: string;
   strategyName: string;
   symbol: string;
   timeframe: string;
   totalTrades: number;
   winRate: string;
   profitFactor: string;
   maxDrawdown: string;
   netPnl: string;
   expectancy: string;
};

export type MetricsResponse = {
   summaries: MetricSummary[];
   strategies: StrategyMetricSummary[];
};