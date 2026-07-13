import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RiskDecision, RiskEvaluationResponse } from './risk.types';

type SignalRiskRow = {
  id: string;
  type: string;
  status: string;
  price: unknown;
  strategyInstanceId: string;
  symbolId: string;
  timeframeId: string;
  symbol: string;
  timeframe: string;
};

type PaperAccountRow = {
  id: string;
  name: string;
  currentBalance: unknown;
  currency: string;
};

type OpenPositionRow = {
  id: string;
};

const RISK_PERCENT = 1;
const STOP_LOSS_PERCENT = 1;
const TAKE_PROFIT_PERCENT = 2;
const REWARD_RISK_RATIO = 2;

@Injectable()
export class RiskService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateSignal(signalId: string | undefined): Promise<RiskEvaluationResponse> {
    if (!signalId) {
      throw new BadRequestException('signalId query param is required.');
    }

    const signal = await this.findSignal(signalId);

    if (!signal) {
      throw new BadRequestException(`Signal ${signalId} was not found.`);
    }

    if (signal.status !== 'generated') {
      return this.rejectWithoutUpdate({
        signal,
        reason: `Signal is not generated. Current status is ${signal.status}.`,
      });
    }

    if (signal.type === 'hold') {
      return this.rejectAndUpdate({
        signal,
        reason: 'Hold signals are informational and cannot become paper orders.',
      });
    }

    if (signal.type !== 'buy') {
      return this.rejectAndUpdate({
        signal,
        reason: `Risk Manager V1 only supports buy signals. Received ${signal.type}.`,
      });
    }

    const entryPrice = this.toNumber(signal.price);

    if (entryPrice === null || entryPrice <= 0) {
      return this.rejectAndUpdate({
        signal,
        reason: 'Signal does not have a valid entry price.',
      });
    }

    const paperAccount = await this.findActivePaperAccount();

    if (!paperAccount) {
      return this.rejectAndUpdate({
        signal,
        reason: 'No active paper account was found.',
      });
    }

    const currentBalance = this.toNumber(paperAccount.currentBalance);

    if (currentBalance === null || currentBalance <= 0) {
      return this.rejectAndUpdate({
        signal,
        paperAccount,
        reason: 'Paper account does not have available balance.',
      });
    }

    const openPosition = await this.findOpenPosition({
      strategyInstanceId: signal.strategyInstanceId,
      symbolId: signal.symbolId,
    });

    if (openPosition) {
      return this.rejectAndUpdate({
        signal,
        paperAccount,
        reason:
          'There is already an open position for this strategy and symbol.',
      });
    }

    const riskAmount = currentBalance * (RISK_PERCENT / 100);
    const stopLossPrice = entryPrice * (1 - STOP_LOSS_PERCENT / 100);
    const takeProfitPrice = entryPrice * (1 + TAKE_PROFIT_PERCENT / 100);
    const riskPerUnit = entryPrice - stopLossPrice;
    const quantity = riskAmount / riskPerUnit;
    const notionalValue = quantity * entryPrice;

    if (notionalValue > currentBalance) {
      return this.rejectAndUpdate({
        signal,
        paperAccount,
        reason:
          'Calculated position notional is greater than the paper account balance.',
      });
    }

    await this.approveSignal(signal.id);

    return {
      signalId: signal.id,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      signalType: signal.type,
      previousSignalStatus: signal.status,
      decision: 'approved',
      newSignalStatus: 'approved',
      reason:
        'Signal approved by Risk Manager V1 using 1% account risk, 1% stop loss and 1:2 reward/risk.',
      paperAccount: {
        id: paperAccount.id,
        name: paperAccount.name,
        currentBalance: this.formatMoney(currentBalance),
        currency: paperAccount.currency,
      },
      risk: {
        entryPrice: this.formatNumber(entryPrice, 8),
        stopLossPrice: this.formatNumber(stopLossPrice, 8),
        takeProfitPrice: this.formatNumber(takeProfitPrice, 8),
        riskAmount: this.formatMoney(riskAmount),
        riskPercent: `${RISK_PERCENT}%`,
        rewardRiskRatio: `1:${REWARD_RISK_RATIO}`,
        quantity: this.formatNumber(quantity, 12),
        notionalValue: this.formatMoney(notionalValue),
      },
      evaluatedAt: new Date().toISOString(),
    };
  }

  private async findSignal(signalId: string): Promise<SignalRiskRow | null> {
    const rows = await this.prisma.$queryRaw<SignalRiskRow[]>`
      select
        sig.id,
        sig.type,
        sig.status,
        sig.price,
        sig.strategy_instance_id as "strategyInstanceId",
        sig.symbol_id as "symbolId",
        sig.timeframe_id as "timeframeId",
        sym.display_symbol as "symbol",
        tf.code as "timeframe"
      from signals sig
      join symbols sym on sym.id = sig.symbol_id
      join timeframes tf on tf.id = sig.timeframe_id
      where sig.id = ${signalId}::uuid
      limit 1
    `;

    return rows[0] ?? null;
  }

  private async findActivePaperAccount(): Promise<PaperAccountRow | null> {
    const rows = await this.prisma.$queryRaw<PaperAccountRow[]>`
      select
        id,
        name,
        current_balance as "currentBalance",
        currency
      from paper_accounts
      where status = 'active'
      order by created_at asc
      limit 1
    `;

    return rows[0] ?? null;
  }

  private async findOpenPosition(params: {
    strategyInstanceId: string;
    symbolId: string;
  }): Promise<OpenPositionRow | null> {
    const rows = await this.prisma.$queryRaw<OpenPositionRow[]>`
      select id
      from positions
      where strategy_instance_id = ${params.strategyInstanceId}::uuid
        and symbol_id = ${params.symbolId}::uuid
        and status = 'open'
      limit 1
    `;

    return rows[0] ?? null;
  }

  private async approveSignal(signalId: string): Promise<void> {
    await this.prisma.$executeRaw`
      update signals
      set status = 'approved',
          ignored_reason = null
      where id = ${signalId}::uuid
    `;
  }

  private async rejectSignal(signalId: string, reason: string): Promise<void> {
    await this.prisma.$executeRaw`
      update signals
      set status = 'rejected',
          ignored_reason = ${reason}
      where id = ${signalId}::uuid
    `;
  }

  private async rejectAndUpdate(params: {
    signal: SignalRiskRow;
    paperAccount?: PaperAccountRow | null;
    reason: string;
  }): Promise<RiskEvaluationResponse> {
    await this.rejectSignal(params.signal.id, params.reason);

    return this.buildRejectedResponse({
      signal: params.signal,
      paperAccount: params.paperAccount ?? null,
      reason: params.reason,
      shouldUseNewRejectedStatus: true,
    });
  }

  private rejectWithoutUpdate(params: {
    signal: SignalRiskRow;
    paperAccount?: PaperAccountRow | null;
    reason: string;
  }): RiskEvaluationResponse {
    return this.buildRejectedResponse({
      signal: params.signal,
      paperAccount: params.paperAccount ?? null,
      reason: params.reason,
      shouldUseNewRejectedStatus: false,
    });
  }

  private buildRejectedResponse(params: {
    signal: SignalRiskRow;
    paperAccount: PaperAccountRow | null;
    reason: string;
    shouldUseNewRejectedStatus: boolean;
  }): RiskEvaluationResponse {
    const currentBalance = params.paperAccount
      ? this.toNumber(params.paperAccount.currentBalance)
      : null;

    return {
      signalId: params.signal.id,
      symbol: params.signal.symbol,
      timeframe: params.signal.timeframe,
      signalType: params.signal.type,
      previousSignalStatus: params.signal.status,
      decision: 'rejected',
      newSignalStatus: params.shouldUseNewRejectedStatus
        ? 'rejected'
        : params.signal.status,
      reason: params.reason,
      paperAccount: {
        id: params.paperAccount?.id ?? null,
        name: params.paperAccount?.name ?? null,
        currentBalance:
          currentBalance !== null ? this.formatMoney(currentBalance) : null,
        currency: params.paperAccount?.currency ?? null,
      },
      risk: {
        entryPrice: null,
        stopLossPrice: null,
        takeProfitPrice: null,
        riskAmount: null,
        riskPercent: `${RISK_PERCENT}%`,
        rewardRiskRatio: `1:${REWARD_RISK_RATIO}`,
        quantity: null,
        notionalValue: null,
      },
      evaluatedAt: new Date().toISOString(),
    };
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numericValue = Number(value.toString());

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return numericValue;
  }

  private formatMoney(value: number): string {
    return `${this.formatNumber(value, 2)} USDT`;
  }

  private formatNumber(value: number, fractionDigits: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
}