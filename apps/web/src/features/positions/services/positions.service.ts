import { apiGet } from "../../../shared/lib/apiClient";
import type { PositionSummary } from "../types/position.types";

export async function fetchPositions(): Promise<PositionSummary[]> {
   return apiGet<PositionSummary[]>("/positions");
}