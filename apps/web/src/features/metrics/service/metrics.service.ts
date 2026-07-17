import { apiGet } from "../../../shared/lib/apiClient";
import type { MetricsResponse } from "../types/metric.types";

export async function fetchMetrics(): Promise<MetricsResponse> {
   return apiGet<MetricsResponse>("/metrics");
}