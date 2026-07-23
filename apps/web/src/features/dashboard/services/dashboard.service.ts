import { apiGet } from "../../../shared/lib/apiClient";
import type { BotLogResponse, BotStatusResponse } from "../types/dashboard.types";

export async function fetchBotStatus(): Promise<BotStatusResponse> {
   return apiGet<BotStatusResponse>("/bot/status");
}

export async function fetchBotLogs(): Promise<BotLogResponse[]> {
   return apiGet<BotLogResponse[]>("/bot/logs");
}