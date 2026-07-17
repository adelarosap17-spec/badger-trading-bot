import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  MetricsResponse,
  MetricSummaryResponse,
  MetricTrend,
  StrategyMetricSummaryResponse,
} from './metrics.types';

type AccountRow = {
  initialBalance: unknown;
  currentBalance: unknown;
  currency: string;
};

type CountRow = {
  status: string;
  count: bigint;
};

type StrategyMetricRow = {
  id: string;
  strategyName: string | null;
  symbol: string;
  timeframe: string | null;
  totalTrades: bigint;
  winningTrades: bigint;
  losingTrades: bigint;
  grossProfit: unknown;
  grossLoss: unknown;
  netPnl: unknown;
};

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<MetricsResponse> {
    const [account, positionCounts, signalCounts, orderCounts, strategies] =
      await Promise.all([
        this.findAccount(),
        this.countPositionsByStatus(),
        this.countSignalsByStatus(),
        this.countOrdersByStatus(),
        this.findStrategyMetrics(),
      ]);

    const summaries = this.buildMetricSummaries({
      account,
      positionCounts,
      signalCounts,
      orderCounts,
    });

    return {
      summaries,
      strategies,
    };
  }

  private async findAccount(): Promise<AccountRow | null> {
    const rows = await this.prisma.$queryRaw<AccountRow[]>`
      select
        initial_balance as "initialBalance",
        current_balance as "currentBalance",
        currency
      from paper_accounts
      where status = 'active'
      order by created_at asc
      limit 1
    `;

    return rows[0] ?? null;
  }

  private async countPositionsByStatus(): Promise<Record<string, number>> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      select status, count(*) as count
      from positions
      group by status
    `;

    return this.toCountMap(rows);
  }

  private async countSignalsByStatus(): Promise<Record<string, number>> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      select status, count(*) as count
      from signals
      group by status
    `;

    return this.toCountMap(rows);
  }

  private async countOrdersByStatus(): Promise<Record<string, number>> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      select status, count(*) as count
      from orders
      group by status
    `;

    return this.toCountMap(rows);
  }

  private async findStrategyMetrics(): Promise<StrategyMetricSummaryResponse[]> {
    const rows = await this.prisma.$queryRaw<StrategyMetricRow[]>`
      select
        si.id,
        coalesce(sd.name, si.name, 'Unknown Strategy') as "strategyName",
        sym.display_symbol as "symbol",
        tf.code as "timeframe",
        count(pos.id) filter (where pos.status = 'closed') as "totalTrades",
        count(pos.id) filter (
          where pos.status = 'closed'
            and coalesce(pos.net_pnl, 0) > 0
        ) as "winningTrades",
        count(pos.id) filter (
          where pos.status = 'closed'
            and coalesce(pos.net_pnl, 0) < 0
        ) as "losingTrades",
        coalesce(sum(pos.net_pnl) filter (
          where pos.status = 'closed'
            and coalesce(pos.net_pnl, 0) > 0
        ), 0) as "grossProfit",
        coalesce(abs(sum(pos.net_pnl) filter (
          where pos.status = 'closed'
            and coalesce(pos.net_pnl, 0) < 0
        )), 0) as "grossLoss",
        coalesce(sum(pos.net_pnl) filter (where pos.status = 'closed'), 0) as "netPnl"
      from strategy_instances si
      left join strategy_definitions sd on sd.id = si.strategy_definition_id
      left join symbols sym on sym.id = si.symbol_id
      left join timeframes tf on tf.id = si.timeframe_id
      left join positions pos on pos.strategy_instance_id = si.id
      group by si.id, sd.name, si.name, sym.display_symbol, tf.code
      order by sym.display_symbol asc, tf.code asc
    `;

    return rows.map((row) => {
      const totalTrades = Number(row.totalTrades);
      const winningTrades = Number(row.winningTrades);
      const grossProfit = this.toNumber(row.grossProfit) ?? 0;
      const grossLoss = this.toNumber(row.grossLoss) ?? 0;
      const netPnl = this.toNumber(row.netPnl) ?? 0;

      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const profitFactor =
        grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? null : 0;
      const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;

      return {
        id: row.id,
        strategyName: row.strategyName ?? 'Unknown Strategy',
        symbol: row.symbol,
        timeframe: row.timeframe ?? 'N/A',
        totalTrades,
        winRate: `${this.formatNumber(winRate, 1)}%`,
        profitFactor:
          profitFactor === null ? '∞' : this.formatNumber(profitFactor, 2),
        maxDrawdown: 'N/A',
        netPnl: this.formatSignedMoney(netPnl),
        expectancy: this.formatSignedMoney(expectancy),
      };
    });
  }

  private buildMetricSummaries(params: {
    account: AccountRow | null;
    positionCounts: Record<string, number>;
    signalCounts: Record<string, number>;
    orderCounts: Record<string, number>;
  }): MetricSummaryResponse[] {
    const initialBalance = this.toNumber(params.account?.initialBalance) ?? 0;
    const currentBalance = this.toNumber(params.account?.currentBalance) ?? 0;
    const totalPnl = currentBalance - initialBalance;
    const totalPnlPercent =
      initialBalance > 0 ? (totalPnl / initialBalance) * 100 : 0;

    const totalPositions = this.sumCounts(params.positionCounts);
    const openPositions = params.positionCounts.open ?? 0;
    const closedPositions = params.positionCounts.closed ?? 0;

    const generatedSignals = params.signalCounts.generated ?? 0;
    const approvedSignals = params.signalCounts.approved ?? 0;
    const rejectedSignals = params.signalCounts.rejected ?? 0;
    const executedSignals = params.signalCounts.executed ?? 0;

    const totalOrders = this.sumCounts(params.orderCounts);
    const filledOrders = params.orderCounts.filled ?? 0;

    return [
      {
        id: 'current-balance',
        label: 'Current Balance',
        value: this.formatMoney(currentBalance),
        change: `${this.formatSignedPercent(totalPnlPercent)} from initial`,
        trend: this.getTrend(totalPnl),
      },
      {
        id: 'net-pnl',
        label: 'Net PnL',
        value: this.formatSignedMoney(totalPnl),
        change: this.formatSignedPercent(totalPnlPercent),
        trend: this.getTrend(totalPnl),
      },
      {
        id: 'positions',
        label: 'Positions',
        value: totalPositions.toString(),
        change: `${openPositions} open • ${closedPositions} closed`,
        trend: openPositions > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'orders',
        label: 'Orders',
        value: totalOrders.toString(),
        change: `${filledOrders} filled`,
        trend: filledOrders > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'signals-generated',
        label: 'Signals Generated',
        value: generatedSignals.toString(),
        change: `${executedSignals} executed`,
        trend: generatedSignals > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'signals-approved',
        label: 'Signals Approved',
        value: approvedSignals.toString(),
        change: `${rejectedSignals} rejected`,
        trend: approvedSignals > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'executed-signals',
        label: 'Executed Signals',
        value: executedSignals.toString(),
        change: 'Paper trading executions',
        trend: executedSignals > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'account-currency',
        label: 'Currency',
        value: params.account?.currency ?? 'USDT',
        change: 'Paper account',
        trend: 'neutral',
      },
    ];
  }

  private toCountMap(rows: CountRow[]): Record<string, number> {
    return rows.reduce<Record<string, number>>((accumulator, row) => {
      accumulator[row.status] = Number(row.count);
      return accumulator;
    }, {});
  }

  private sumCounts(counts: Record<string, number>): number {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }

  private getTrend(value: number): MetricTrend {
    if (value > 0) {
      return 'positive';
    }

    if (value < 0) {
      return 'negative';
    }

    return 'neutral';
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

  private formatSignedMoney(value: number): string {
    const prefix = value >= 0 ? '+' : '';

    return `${prefix}${this.formatNumber(value, 2)} USDT`;
  }

  private formatSignedPercent(value: number): string {
    const prefix = value >= 0 ? '+' : '';

    return `${prefix}${this.formatNumber(value, 2)}%`;
  }

  private formatNumber(value: number, fractionDigits: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
}