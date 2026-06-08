import { apiGet } from "../../../shared/lib/apiClient";
import type {
  MarketSymbolResponse,
  MarketTimeframeResponse,
} from "../types/market-data.types";

export async function fetchMarketSymbols(): Promise<MarketSymbolResponse[]> {
  return apiGet<MarketSymbolResponse[]>("/market-data/symbols");
}

export async function fetchMarketTimeframes(): Promise<
  MarketTimeframeResponse[]
> {
  return apiGet<MarketTimeframeResponse[]>("/market-data/timeframes");
}
