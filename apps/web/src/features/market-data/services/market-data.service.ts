import { apiGet } from "../../../shared/lib/apiClient";
import type {
  MarketSymbolResponse,
  MarketSymbolSummary,
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

export async function fetchMarketDataSummaries(): Promise<
  MarketSymbolSummary[]
> {
  return apiGet<MarketSymbolSummary[]>("/market-data/summaries");
}
