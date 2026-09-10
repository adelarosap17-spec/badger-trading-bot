export type BinanceTestnetMarketBuyRequest = {
  symbol: string;
  quoteOrderQty: string;
};

export type BinanceTestnetMarketSellRequest = {
  symbol: string;
  quantity: string;
};

export type BinanceOrderFill = {
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
};

export type BinanceOrderResponse = {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  transactTime: number;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  workingTime?: number;
  fills?: BinanceOrderFill[];
};

export type BinanceTestnetMarketBuyResponse = {
  mode: 'testnet';
  symbol: string;
  quoteOrderQty: string;
  exchangeOrderId: string;
  order: BinanceOrderResponse;
};

export type BinanceTestnetMarketSellResponse = {
  mode: 'testnet';
  symbol: string;
  quantity: string;
  exchangeOrderId: string;
  order: BinanceOrderResponse;
};

export type ExchangeOrderSummaryResponse = {
  id: string;
  exchange: string;
  mode: string;
  symbol: string;
  side: string;
  type: string;
  status: string;
  quoteOrderQty: string | null;
  executedQty: string | null;
  cumulativeQuoteQty: string | null;
  averagePrice: string | null;
  externalOrderId: string;
  externalClientOrderId: string | null;
  createdAt: string;
};