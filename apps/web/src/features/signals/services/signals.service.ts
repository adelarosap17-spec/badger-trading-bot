import { apiGet } from "../../../shared/lib/apiClient";
import type { SignalSummary } from "../types/signal.types";

export async function fetchSignals(): Promise<SignalSummary[]> {
   return apiGet<SignalSummary[]>("/signals");
}