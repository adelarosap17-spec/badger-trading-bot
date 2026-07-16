export type PaperTradeExecutionResponse = {
  signalId: string;
  orderId: string;
  positionId: string;
  symbol: string;
  timeframe: string;
  side: string;
  status: string;
  entryPrice: string;
  quantity: string;
  notionalValue: string;
  stopLossPrice: string;
  takeProfitPrice: string;
  paperAccount: {
    id: string;
    name: string;
    currentBalance: string;
    currency: string;
  };
  executedAt: string;
};