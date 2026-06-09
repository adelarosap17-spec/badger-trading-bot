import { apiGet } from "../../../shared/lib/apiClient";
import type {
  IndicatorSummaryResponse,
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

export async function fetchIndicatorSummary(params: {
  symbol: string;
  timeframe: string;
}): Promise<IndicatorSummaryResponse> {
  const searchParams = new URLSearchParams({
    symbol: params.symbol,
    timeframe: params.timeframe,
  });

  return apiGet<IndicatorSummaryResponse>(
    `/indicators?${searchParams.toString()}`,
  );
}
