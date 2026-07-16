import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PositionSummaryResponse } from './position.types';

type PositionRow = {
  id: string;
  symbol: string;
  timeframe: string | null;
  strategyName: string | null;
  side: string;
  status: string;
  entryPrice: unknown;
  exitPrice: unknown;
  quantity: unknown;
  notionalValue: unknown;
  stopLossPrice: unknown;
  takeProfitPrice: unknown;
  netPnl: unknown;
  feesPaid: unknown;
  openedAt: Date;
  closedAt: Date | null;
  closeReason: string | null;
  latestClose: unknown;
};

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestPositions(): Promise<PositionSummaryResponse[]> {
    const rows = await this.prisma.$queryRaw<PositionRow[]>`
      select
        pos.id,
        sym.display_symbol as "symbol",
        tf.code as "timeframe",
        coalesce(sd.name, si.name, 'Unknown Strategy') as "strategyName",
        pos.side,
        pos.status,
        pos.entry_price as "entryPrice",
        pos.exit_price as "exitPrice",
        pos.quantity,
        pos.notional_value as "notionalValue",
        pos.stop_loss_price as "stopLossPrice",
        pos.take_profit_price as "takeProfitPrice",
        pos.net_pnl as "netPnl",
        pos.fees_paid as "feesPaid",
        pos.opened_at as "openedAt",
        pos.closed_at as "closedAt",
        pos.close_reason as "closeReason",
        latest_candle.close as "latestClose"
      from positions pos
      join symbols sym on sym.id = pos.symbol_id
      left join strategy_instances si on si.id = pos.strategy_instance_id
      left join strategy_definitions sd on sd.id = si.strategy_definition_id
      left join timeframes tf on tf.id = si.timeframe_id
      left join lateral (
        select c.close
        from candles c
        where c.symbol_id = pos.symbol_id
          and c.is_closed = true
        order by c.close_time desc
        limit 1
      ) latest_candle on true
      order by pos.opened_at desc
      limit 50
    `;

    return rows.map((row) => {
      const entryPrice = this.toNumber(row.entryPrice);
      const exitPrice = this.toNumber(row.exitPrice);
      const quantity = this.toNumber(row.quantity);
      const netPnlFromDb = this.toNumber(row.netPnl);
      const latestClose = this.toNumber(row.latestClose);

      const calculatedOpenPnl = this.calculateOpenPnl({
        status: row.status,
        side: row.side,
        entryPrice,
        latestClose,
        quantity,
      });

      const netPnlValue =
        row.status === 'open' ? calculatedOpenPnl : netPnlFromDb;

      const netPnlPercent = this.calculatePnlPercent({
        netPnl: netPnlValue,
        notionalValue: this.toNumber(row.notionalValue),
      });

      return {
        id: row.id,
        symbol: row.symbol,
        timeframe: row.timeframe ?? 'N/A',
        strategyName: row.strategyName ?? 'Unknown Strategy',
        side: row.side,
        status: row.status,
        entryPrice: this.formatPrice(row.entryPrice),
        exitPrice: row.exitPrice === null ? null : this.formatPrice(row.exitPrice),
        quantity: this.formatQuantity(row.quantity),
        notionalValue: this.formatMoney(row.notionalValue),
        stopLossPrice: this.formatPrice(row.stopLossPrice),
        takeProfitPrice: this.formatPrice(row.takeProfitPrice),
        netPnl: this.formatSignedMoney(netPnlValue),
        netPnlPercent: this.formatSignedPercent(netPnlPercent),
        feesPaid: this.formatMoney(row.feesPaid),
        openedAt: row.openedAt.toISOString(),
        closedAt: row.closedAt ? row.closedAt.toISOString() : null,
        closeReason: row.closeReason,
      };
    });
  }

  private calculateOpenPnl(params: {
    status: string;
    side: string;
    entryPrice: number | null;
    latestClose: number | null;
    quantity: number | null;
  }): number | null {
    if (params.status !== 'open') {
      return null;
    }

    if (
      params.entryPrice === null ||
      params.latestClose === null ||
      params.quantity === null
    ) {
      return null;
    }

    if (params.side === 'long') {
      return (params.latestClose - params.entryPrice) * params.quantity;
    }

    if (params.side === 'short') {
      return (params.entryPrice - params.latestClose) * params.quantity;
    }

    return null;
  }

  private calculatePnlPercent(params: {
    netPnl: number | null;
    notionalValue: number | null;
  }): number | null {
    if (params.netPnl === null || params.notionalValue === null) {
      return null;
    }

    if (params.notionalValue <= 0) {
      return null;
    }

    return (params.netPnl / params.notionalValue) * 100;
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

  private formatMoney(value: unknown): string {
    const numericValue = this.toNumber(value);

    if (numericValue === null) {
      return 'N/A';
    }

    return `${numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USDT`;
  }

  private formatSignedMoney(value: number | null): string {
    if (value === null) {
      return 'N/A';
    }

    const prefix = value >= 0 ? '+' : '';

    return `${prefix}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USDT`;
  }

  private formatSignedPercent(value: number | null): string {
    if (value === null) {
      return 'N/A';
    }

    const prefix = value >= 0 ? '+' : '';

    return `${prefix}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }
}