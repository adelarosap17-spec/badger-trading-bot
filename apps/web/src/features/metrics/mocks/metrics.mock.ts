import type {
  MetricSummary,
  StrategyMetricSummary,
} from "../types/metric.types";

export const metricSummaries: MetricSummary[] = [
  {
    id: "net-pnl",
    label: "Net PnL",
    value: "+0.61 USDT",
    change: "+0.61%",
    trend: "positive",
  },
  {
    id: "win-rate",
    label: "Win Rate",
    value: "66.7%",
    change: "+2 wins",
    trend: "positive",
  },
  {
    id: "profit-factor",
    label: "Profit Factor",
    value: "2.95",
    change: "Healthy",
    trend: "positive",
  },
  {
    id: "max-drawdown",
    label: "Max Drawdown",
    value: "-1.00%",
    change: "Controlled",
    trend: "neutral",
  },
];

export const strategyMetricSummaries: StrategyMetricSummary[] = [
  {
    id: "btc-15m-ema-rsi",
    strategyName: "EMA RSI Crossover",
    symbol: "BTC/USDT",
    timeframe: "15m",
    totalTrades: 12,
    winRate: "66.7%",
    profitFactor: "2.95",
    maxDrawdown: "-1.00%",
    netPnl: "+0.61 USDT",
    expectancy: "+0.05 USDT",
  },
  {
    id: "btc-1h-ema-rsi",
    strategyName: "EMA RSI Crossover",
    symbol: "BTC/USDT",
    timeframe: "1h",
    totalTrades: 5,
    winRate: "40.0%",
    profitFactor: "1.20",
    maxDrawdown: "-1.80%",
    netPnl: "+0.08 USDT",
    expectancy: "+0.01 USDT",
  },
  {
    id: "eth-15m-ema-rsi",
    strategyName: "EMA RSI Crossover",
    symbol: "ETH/USDT",
    timeframe: "15m",
    totalTrades: 8,
    winRate: "62.5%",
    profitFactor: "1.85",
    maxDrawdown: "-1.30%",
    netPnl: "+0.32 USDT",
    expectancy: "+0.04 USDT",
  },
];
