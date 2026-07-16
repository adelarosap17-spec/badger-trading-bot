import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  PositionManagerItemResponse,
  PositionManagerRunResponse,
} from './position-manager.types';

type OpenPositionRow = {
  id: string;
  paperAccountId: string;
  strategyInstanceId: string;
  symbolId: string;
  symbol: string;
  side: string;
  entryPrice: unknown;
  quantity: unknown;
  stopLossPrice: unknown;
  takeProfitPrice: unknown;
};

type LatestCandleRow = {
  close: unknown;
};

type CreatedOrderRow = {
  id: string;
};

@Injectable()
export class PositionManagerService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateOpenPositions(): Promise<PositionManagerRunResponse> {
    const startedAt = new Date();

    const positions = await this.findOpenPositions();
    const items: PositionManagerItemResponse[] = [];

    for (const position of positions) {
      const result = await this.evaluatePosition(position);

      items.push(result);
    }

    const finishedAt = new Date();

    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      totalOpenPositions: positions.length,
      closedPositions: items.filter(
        (item) =>
          item.action === 'closed_take_profit' ||
          item.action === 'closed_stop_loss',
      ).length,
      keptOpenPositions: items.filter((item) => item.action === 'kept_open')
        .length,
      skippedPositions: items.filter((item) => item.action === 'skipped')
        .length,
      items,
    };
  }

  private async evaluatePosition(
    position: OpenPositionRow,
  ): Promise<PositionManagerItemResponse> {
    const entryPrice = this.toNumber(position.entryPrice);
    const quantity = this.toNumber(position.quantity);
    const stopLossPrice = this.toNumber(position.stopLossPrice);
    const takeProfitPrice = this.toNumber(position.takeProfitPrice);

    if (entryPrice === null || quantity === null) {
      return this.buildSkippedResponse({
        position,
        reason: 'Position does not have a valid entry price or quantity.',
      });
    }

    const latestClosePrice = await this.findLatestClosePrice(position.symbolId);

    if (latestClosePrice === null) {
      return this.buildSkippedResponse({
        position,
        reason: 'No closed candle price was found for this symbol.',
      });
    }

    if (position.side !== 'long') {
      return this.buildSkippedResponse({
        position,
        latestClosePrice,
        reason: 'Position Manager V1 only supports long positions.',
      });
    }

    if (takeProfitPrice !== null && latestClosePrice >= takeProfitPrice) {
      return this.closePosition({
        position,
        entryPrice,
        exitPrice: latestClosePrice,
        quantity,
        closeReason: 'take_profit',
        action: 'closed_take_profit',
        reason: 'Latest closed price reached or exceeded take profit.',
      });
    }

    if (stopLossPrice !== null && latestClosePrice <= stopLossPrice) {
      return this.closePosition({
        position,
        entryPrice,
        exitPrice: latestClosePrice,
        quantity,
        closeReason: 'stop_loss',
        action: 'closed_stop_loss',
        reason: 'Latest closed price reached or fell below stop loss.',
      });
    }

    return {
      positionId: position.id,
      symbol: position.symbol,
      side: position.side,
      action: 'kept_open',
      reason:
        'Position remains open because price has not reached stop loss or take profit.',
      entryPrice: this.formatPrice(entryPrice),
      latestClosePrice: this.formatPrice(latestClosePrice),
      exitPrice: null,
      quantity: this.formatQuantity(quantity),
      grossPnl: null,
      netPnl: null,
      stopLossPrice: this.formatNullablePrice(stopLossPrice),
      takeProfitPrice: this.formatNullablePrice(takeProfitPrice),
      orderId: null,
    };
  }

  private async closePosition(params: {
    position: OpenPositionRow;
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    closeReason: 'take_profit' | 'stop_loss';
    action: 'closed_take_profit' | 'closed_stop_loss';
    reason: string;
  }): Promise<PositionManagerItemResponse> {
    const grossPnl =
      (params.exitPrice - params.entryPrice) * params.quantity;
    const feesPaid = 0;
    const spreadCost = 0;
    const netPnl = grossPnl - feesPaid - spreadCost;

    const result = await this.prisma.$transaction(async (tx) => {
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
          ${params.position.paperAccountId}::uuid,
          ${params.position.id}::uuid,
          ${params.position.strategyInstanceId}::uuid,
          ${params.position.symbolId}::uuid,
          'sell',
          'market',
          'filled',
          ${params.exitPrice},
          ${params.exitPrice},
          ${params.quantity},
          ${feesPaid},
          ${spreadCost},
          now(),
          now()
        )
        returning id
      `;

      const orderId = createdOrderRows[0]?.id;

      if (!orderId) {
        throw new Error('Close order was not created.');
      }

      await tx.$executeRaw`
        update positions
        set status = 'closed',
            exit_price = ${params.exitPrice},
            closed_at = now(),
            gross_pnl = ${grossPnl},
            net_pnl = ${netPnl},
            fees_paid = ${feesPaid},
            spread_cost = ${spreadCost},
            close_reason = ${params.closeReason}
        where id = ${params.position.id}::uuid
      `;

      await tx.$executeRaw`
        update paper_accounts
        set current_balance = current_balance + ${netPnl}
        where id = ${params.position.paperAccountId}::uuid
      `;

      return {
        orderId,
      };
    });

    return {
      positionId: params.position.id,
      symbol: params.position.symbol,
      side: params.position.side,
      action: params.action,
      reason: params.reason,
      entryPrice: this.formatPrice(params.entryPrice),
      latestClosePrice: this.formatPrice(params.exitPrice),
      exitPrice: this.formatPrice(params.exitPrice),
      quantity: this.formatQuantity(params.quantity),
      grossPnl: this.formatSignedMoney(grossPnl),
      netPnl: this.formatSignedMoney(netPnl),
      stopLossPrice: this.formatNullablePrice(
        this.toNumber(params.position.stopLossPrice),
      ),
      takeProfitPrice: this.formatNullablePrice(
        this.toNumber(params.position.takeProfitPrice),
      ),
      orderId: result.orderId,
    };
  }

  private async findOpenPositions(): Promise<OpenPositionRow[]> {
    return this.prisma.$queryRaw<OpenPositionRow[]>`
      select
        pos.id,
        pos.paper_account_id as "paperAccountId",
        pos.strategy_instance_id as "strategyInstanceId",
        pos.symbol_id as "symbolId",
        sym.display_symbol as "symbol",
        pos.side,
        pos.entry_price as "entryPrice",
        pos.quantity,
        pos.stop_loss_price as "stopLossPrice",
        pos.take_profit_price as "takeProfitPrice"
      from positions pos
      join symbols sym on sym.id = pos.symbol_id
      where pos.status = 'open'
      order by pos.opened_at asc
    `;
  }

  private async findLatestClosePrice(symbolId: string): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<LatestCandleRow[]>`
      select close
      from candles
      where symbol_id = ${symbolId}::uuid
        and is_closed = true
      order by close_time desc
      limit 1
    `;

    return this.toNumber(rows[0]?.close);
  }

  private buildSkippedResponse(params: {
    position: OpenPositionRow;
    latestClosePrice?: number | null;
    reason: string;
  }): PositionManagerItemResponse {
    return {
      positionId: params.position.id,
      symbol: params.position.symbol,
      side: params.position.side,
      action: 'skipped',
      reason: params.reason,
      entryPrice: this.formatPrice(params.position.entryPrice),
      latestClosePrice:
        params.latestClosePrice === undefined
          ? null
          : this.formatNullablePrice(params.latestClosePrice),
      exitPrice: null,
      quantity: this.formatQuantity(params.position.quantity),
      grossPnl: null,
      netPnl: null,
      stopLossPrice: this.formatPrice(params.position.stopLossPrice),
      takeProfitPrice: this.formatPrice(params.position.takeProfitPrice),
      orderId: null,
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

  private formatPrice(value: unknown): string {
    const numericValue = this.toNumber(value);

    if (numericValue === null) {
      return 'N/A';
    }

    return `${numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })} USDT`;
  }

  private formatNullablePrice(value: number | null): string | null {
    if (value === null) {
      return null;
    }

    return this.formatPrice(value);
  }

  private formatQuantity(value: unknown): string {
    const numericValue = this.toNumber(value);

    if (numericValue === null) {
      return 'N/A';
    }

    return numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 12,
    });
  }

  private formatSignedMoney(value: number): string {
    const prefix = value >= 0 ? '+' : '';

    return `${prefix}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USDT`;
  }
}