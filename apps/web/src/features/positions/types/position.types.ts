export type PositionSide = "long" | "short";

export type PositionStatus = "open" | "closed" | "cancelled";

export type PositionCloseReason =
  | "take_profit"
  | "stop_loss"
  | "strategy_signal"
  | "manual_close"
  | "risk_limit"
  | "cancelled";

export type PositionSummary = {
  id: string;
  symbol: string;
  timeframe: string;
  strategyName: string;
  side: PositionSide;
  status: PositionStatus;
  entryPrice: string;
  exitPrice: string | null;
  quantity: string;
  notionalValue: string;
  stopLossPrice: string;
  takeProfitPrice: string;
  netPnl: string;
  netPnlPercent: string;
  feesPaid: string;
  openedAt: string;
  closedAt: string | null;
  closeReason: PositionCloseReason | null;
};
