import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaperTradeExecutionResponse } from './paper-trading.types';

type ApprovedSignalRow = {
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

type CreatedPositionRow = {
  id: string;
};

type CreatedOrderRow = {
  id: string;
};

const RISK_PERCENT = 1;
const STOP_LOSS_PERCENT = 1;
const TAKE_PROFIT_PERCENT = 2;

@Injectable()
export class PaperTradingService {
  constructor(private readonly prisma: PrismaService) {}

  async executeSignal(
    signalId: string | undefined,
  ): Promise<PaperTradeExecutionResponse> {
    if (!signalId) {
      throw new BadRequestException('signalId query param is required.');
    }

    const signal = await this.findApprovedSignal(signalId);

    if (!signal) {
      throw new BadRequestException(`Signal ${signalId} was not found.`);
    }

    if (signal.status !== 'approved') {
      throw new BadRequestException(
        `Signal must be approved before execution. Current status is ${signal.status}.`,
      );
    }

    if (signal.type !== 'buy') {
      throw new BadRequestException(
        `Paper Trading V1 only supports buy signals. Received ${signal.type}.`,
      );
    }

    const entryPrice = this.toNumber(signal.price);

    if (entryPrice === null || entryPrice <= 0) {
      throw new BadRequestException('Signal does not have a valid price.');
    }

    const paperAccount = await this.findActivePaperAccount();

    if (!paperAccount) {
      throw new BadRequestException('No active paper account was found.');
    }

    const currentBalance = this.toNumber(paperAccount.currentBalance);

    if (currentBalance === null || currentBalance <= 0) {
      throw new BadRequestException(
        'Paper account does not have available balance.',
      );
    }

    const openPosition = await this.findOpenPosition({
      strategyInstanceId: signal.strategyInstanceId,
      symbolId: signal.symbolId,
    });

    if (openPosition) {
      throw new BadRequestException(
        'There is already an open position for this strategy and symbol.',
      );
    }

    const riskAmount = currentBalance * (RISK_PERCENT / 100);
    const stopLossPrice = entryPrice * (1 - STOP_LOSS_PERCENT / 100);
    const takeProfitPrice = entryPrice * (1 + TAKE_PROFIT_PERCENT / 100);
    const riskPerUnit = entryPrice - stopLossPrice;
    const quantity = riskAmount / riskPerUnit;
    const notionalValue = quantity * entryPrice;

    const maxAllowedNotional = currentBalance;

if (notionalValue > maxAllowedNotional + 0.000001) {
  throw new BadRequestException(
    'Calculated position notional is greater than the paper account balance.',
  );
}

    const result = await this.prisma.$transaction(async (tx) => {
      const createdPositionRows = await tx.$queryRaw<CreatedPositionRow[]>`
        insert into positions (
          paper_account_id,
          strategy_instance_id,
          symbol_id,
          side,
          status,
          entry_price,
          quantity,
          notional_value,
          stop_loss_price,
          take_profit_price,
          opened_at
        )
        values (
          ${paperAccount.id}::uuid,
          ${signal.strategyInstanceId}::uuid,
          ${signal.symbolId}::uuid,
          'long',
          'open',
          ${entryPrice},
          ${quantity},
          ${notionalValue},
          ${stopLossPrice},
          ${takeProfitPrice},
          now()
        )
        returning id
      `;

      const positionId = createdPositionRows[0]?.id;

      if (!positionId) {
        throw new Error('Position was not created.');
      }

      const createdOrderRows = await tx.$queryRaw<CreatedOrderRow[]>`
        insert into orders (
          paper_account_id,
          position_id,
          strategy_instance_id,
          symbol_id,
          side,
          type,
          status,
          requested_price,
          executed_price,
          quantity,
          fee,
          spread,
          created_at,
          executed_at
        )
        values (
          ${paperAccount.id}::uuid,
          ${positionId}::uuid,
          ${signal.strategyInstanceId}::uuid,
          ${signal.symbolId}::uuid,
          'buy',
          'market',
          'filled',
          ${entryPrice},
          ${entryPrice},
          ${quantity},
          0,
          0,
          now(),
          now()
        )
        returning id
      `;

      const orderId = createdOrderRows[0]?.id;

      if (!orderId) {
        throw new Error('Order was not created.');
      }

      await tx.$executeRaw`
        update signals
        set status = 'executed',
            executed_at = now()
        where id = ${signal.id}::uuid
      `;

      return {
        orderId,
        positionId,
      };
    });

    return {
      signalId: signal.id,
      orderId: result.orderId,
      positionId: result.positionId,
      symbol: signal.symbol,
      timeframe: signal.timeframe,
      side: 'long',
      status: 'open',
      entryPrice: this.formatNumber(entryPrice, 8),
      quantity: this.formatNumber(quantity, 12),
      notionalValue: this.formatMoney(notionalValue),
      stopLossPrice: this.formatNumber(stopLossPrice, 8),
      takeProfitPrice: this.formatNumber(takeProfitPrice, 8),
      paperAccount: {
        id: paperAccount.id,
        name: paperAccount.name,
        currentBalance: this.formatMoney(currentBalance),
        currency: paperAccount.currency,
      },
      executedAt: new Date().toISOString(),
    };
  }

  private async findApprovedSignal(
    signalId: string,
  ): Promise<ApprovedSignalRow | null> {
    const rows = await this.prisma.$queryRaw<ApprovedSignalRow[]>`
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