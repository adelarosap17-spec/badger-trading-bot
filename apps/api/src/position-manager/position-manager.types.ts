export type PositionManagerAction =
  | 'closed_take_profit'
  | 'closed_stop_loss'
  | 'kept_open'
  | 'skipped';

export type PositionManagerItemResponse = {
  positionId: string;
  symbol: string;
  side: string;
  action: PositionManagerAction;
  reason: string;
  entryPrice: string;
  latestClosePrice: string | null;
  exitPrice: string | null;
  quantity: string;
  grossPnl: string | null;
  netPnl: string | null;
  stopLossPrice: string | null;
  takeProfitPrice: string | null;
  orderId: string | null;
};

export type PositionManagerRunResponse = {
  startedAt: string;
  finishedAt: string;
  totalOpenPositions: number;
  closedPositions: number;
  keptOpenPositions: number;
  skippedPositions: number;
  items: PositionManagerItemResponse[];
};