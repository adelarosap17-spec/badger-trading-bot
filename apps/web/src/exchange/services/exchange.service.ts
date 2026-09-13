import { apiGet } from "../../shared/lib/apiClient";
import type {
   BinanceTestnetBalanceResponse,
   ExchangeDashboardData,
   ExchangeOrderSummaryResponse,
   ExchangePositionSummaryResponse,
} from "../types/exchange.types";

export async function fetchBinanceTestnetBalance(): Promise<BinanceTestnetBalanceResponse> {
   return apiGet<BinanceTestnetBalanceResponse>("/binance-account/testnet/balance");
}

export async function fetchExchangeOrders(): Promise<ExchangeOrderSummaryResponse[]> {
   return apiGet<ExchangeOrderSummaryResponse[]>("/binance-orders/testnet/recent");
}

export async function fetchExchangePositions(): Promise<ExchangePositionSummaryResponse[]> {
   return apiGet<ExchangePositionSummaryResponse[]>("/exchange-positions/testnet");
}

export async function fetchExchangeDashboardData(): Promise<ExchangeDashboardData> {
   const [balance, orders, positions] = await Promise.all([
      fetchBinanceTestnetBalance(),
      fetchExchangeOrders(),
      fetchExchangePositions(),
   ]);

   return {
      balance,
      orders,
      positions,
   };
}