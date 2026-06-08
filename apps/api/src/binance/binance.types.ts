export type BinanceInterval = '5m' | '15m' | '1h';

export type BinanceKlineTuple = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export type BinanceKline = {
  openTime: Date;
  closeTime: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteAssetVolume: string;
  tradeCount: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
};

export type BinanceKlineResponse = {
  symbol: string;
  interval: BinanceInterval;
  total: number;
  klines: BinanceKline[];
};

export type SyncBinanceCandlesResponse = {
  symbol: string;
  timeframe: string;
  requestedLimit: number;
  receivedFromBinance: number;
  closedCandles: number;
  insertedOrSkipped: number;
};
