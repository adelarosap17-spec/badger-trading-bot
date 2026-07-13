export type RiskDecision = 'approved' | 'rejected';

export type RiskEvaluationResponse = {
  signalId: string;
  symbol: string;
  timeframe: string;
  signalType: string;
  previousSignalStatus: string;
  decision: RiskDecision;
  newSignalStatus: string;
  reason: string;
  paperAccount: {
    id: string | null;
    name: string | null;
    currentBalance: string | null;
    currency: string | null;
  };
  risk: {
    entryPrice: string | null;
    stopLossPrice: string | null;
    takeProfitPrice: string | null;
    riskAmount: string | null;
    riskPercent: string;
    rewardRiskRatio: string;
    quantity: string | null;
    notionalValue: string | null;
  };
  evaluatedAt: string;
};