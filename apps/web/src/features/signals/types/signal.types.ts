export type SignalType = "buy" | "sell" | "close_long" | "hold";

export type SignalStatus =
  | "generated"
  | "approved"
  | "rejected"
  | "executed"
  | "ignored"
  | "expired";

export type SignalSummary = {
  id: string;
  symbol: string;
  timeframe: string;
  strategyName: string;
  type: SignalType;
  status: SignalStatus;
  price: string;
  rsi: number;
  emaFast: string;
  emaSlow: string;
  spread: string;
  reason: string;
  createdAt: string;
};
