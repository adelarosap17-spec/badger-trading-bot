export type BinanceAccountBalance = {
  asset: string;
  free: string;
  locked: string;
};

export type BinanceAccountInfoResponse = {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: BinanceAccountBalance[];
};

export type BinanceTestnetBalanceResponse = {
  mode: 'testnet';
  accountType: string;
  canTrade: boolean;
  balances: BinanceAccountBalance[];
};