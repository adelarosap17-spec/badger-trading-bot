import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SignalSummaryResponse } from './signal.types';

type SignalRow = {
  id: string;
  symbol: string;
  timeframe: string;
  strategyName: string | null;
  type: string;
  status: string;
  price: unknown;
  reason: string | null;
  indicatorsSnapshot: unknown;
  spreadPercent: unknown;
  createdAt: Date;
};

@Injectable()
export class SignalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestSignals(): Promise<SignalSummaryResponse[]> {
    const rows = await this.prisma.$queryRaw<SignalRow[]>`
      select
        sig.id,
        sym.display_symbol as "symbol",
        tf.code as "timeframe",
        coalesce(sd.name, si.name, 'Unknown Strategy') as "strategyName",
        sig.type,
        sig.status,
        sig.price,
        sig.reason,
        sig.indicators_snapshot as "indicatorsSnapshot",
        sig.spread_percent as "spreadPercent",
        sig.created_at as "createdAt"
      from signals sig
      join symbols sym on sym.id = sig.symbol_id
      join timeframes tf on tf.id = sig.timeframe_id
      left join strategy_instances si on si.id = sig.strategy_instance_id
      left join strategy_definitions sd on sd.id = si.strategy_definition_id
      order by sig.created_at desc
      limit 50
    `;

    return rows.map((row) => {
      const indicators = this.parseIndicatorsSnapshot(row.indicatorsSnapshot);

      return {
        id: row.id,
        symbol: row.symbol,
        timeframe: row.timeframe,
        strategyName: row.strategyName ?? 'Unknown Strategy',
        type: row.type,
        status: row.status,
        price: this.formatPrice(row.price),
        rsi: indicators.rsi14,
        emaFast: indicators.ema9,
        emaSlow: indicators.ema21,
        spread: this.formatSpread(row.spreadPercent),
        reason: row.reason ?? 'No reason provided.',
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  private parseIndicatorsSnapshot(value: unknown): {
    ema9: string;
    ema21: string;
    rsi14: string;
  } {
    if (!value || typeof value !== 'object') {
      return {
        ema9: 'N/A',
        ema21: 'N/A',
        rsi14: 'N/A',
      };
    }

    const snapshot = value as Record<string, unknown>;

    return {
      ema9: this.formatSnapshotValue(snapshot.ema9),
      ema21: this.formatSnapshotValue(snapshot.ema21),
      rsi14: this.formatSnapshotValue(snapshot.rsi14),
    };
  }

  private formatSnapshotValue(value: unknown): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (typeof value === 'number') {
      return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    return 'N/A';
  }

  private formatPrice(value: unknown): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    const numericValue = Number(value.toString());

    if (Number.isNaN(numericValue)) {
      return 'N/A';
    }

    return `${numericValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USDT`;
  }

  private formatSpread(value: unknown): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    const numericValue = Number(value.toString());

    if (Number.isNaN(numericValue)) {
      return 'N/A';
    }

    return `${numericValue.toFixed(3)}%`;
  }
}