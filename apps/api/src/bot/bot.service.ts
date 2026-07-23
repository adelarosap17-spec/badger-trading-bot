import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MarketDataSyncService } from '../market-data-sync/market-data-sync.service';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { PositionManagerService } from '../position-manager/position-manager.service';
import { RiskService } from '../risk/risk.service';
import { StrategiesService } from '../strategies/strategies.service';
import {
  BotCycleResponse,
  BotCycleSignalItem,
  BotLogResponse,
  BotStatusResponse,
} from './bot.types';

type ActiveSymbolRow = {
  symbol: string;
};

type ActiveTimeframeRow = {
  code: string;
};

type CountRow = {
  count: bigint;
};

type BotLogRow = {
  id: string;
  level: string;
  source: string;
  message: string;
  metadata: unknown;
  createdAt: Date;
};

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketDataSyncService: MarketDataSyncService,
    private readonly strategiesService: StrategiesService,
    private readonly riskService: RiskService,
    private readonly paperTradingService: PaperTradingService,
    private readonly positionManagerService: PositionManagerService,
  ) {}

  async runCycle(): Promise<BotCycleResponse> {
    const startedAt = new Date();
    const items: BotCycleSignalItem[] = [];

    const marketDataSync = await this.marketDataSyncService.runSync();

    const symbols = await this.findActiveSymbols();
    const timeframes = await this.findActiveTimeframes();

    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        const item = await this.processStrategyPair({
          symbol: symbol.symbol,
          timeframe: timeframe.code,
        });

        items.push(item);
      }
    }

    const positionManager =
      await this.positionManagerService.evaluateOpenPositions();

    const finishedAt = new Date();

    const successfulEvaluations = items.filter(
      (item) => item.signalId !== null && item.errorMessage === null,
    ).length;

    const failedEvaluations = items.filter(
      (item) => item.signalId === null && item.errorMessage !== null,
    ).length;

    const approved = items.filter(
      (item) => item.riskDecision === 'approved',
    ).length;

    const rejected = items.filter(
      (item) => item.riskDecision === 'rejected',
    ).length;

    const riskSkipped = items.filter(
      (item) => item.riskDecision === null,
    ).length;

    const executedTrades = items.filter((item) => item.tradeExecuted).length;

    const failedTrades = items.filter(
      (item) =>
        item.riskDecision === 'approved' &&
        !item.tradeExecuted &&
        item.errorMessage !== null,
    ).length;

    const skippedTrades = items.filter(
      (item) => item.riskDecision !== 'approved',
    ).length;

    const response: BotCycleResponse = {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      marketDataSync: {
        totalPairs: marketDataSync.totalPairs,
        syncedPairs: marketDataSync.syncedPairs,
        failedPairs: marketDataSync.failedPairs,
      },
      strategyEvaluation: {
        totalEvaluations: symbols.length * timeframes.length,
        successfulEvaluations,
        failedEvaluations,
      },
      risk: {
        approved,
        rejected,
        skipped: riskSkipped,
      },
      paperTrading: {
        executedTrades,
        skippedTrades,
        failedTrades,
      },
      positionManager: {
        totalOpenPositions: positionManager.totalOpenPositions,
        closedPositions: positionManager.closedPositions,
        keptOpenPositions: positionManager.keptOpenPositions,
        skippedPositions: positionManager.skippedPositions,
      },
      items,
    };

    await this.saveCycleLog(response);

    return response;
  }

  async getStatus(): Promise<BotStatusResponse> {
    const [lastCycle, openPositions, generatedSignals, approvedSignals, executedSignals, rejectedSignals, filledOrders] =
      await Promise.all([
        this.findLastCycleLog(),
        this.countOpenPositions(),
        this.countSignalsByStatus('generated'),
        this.countSignalsByStatus('approved'),
        this.countSignalsByStatus('executed'),
        this.countSignalsByStatus('rejected'),
        this.countOrdersByStatus('filled'),
      ]);

    const metadata = this.parseCycleMetadata(lastCycle?.metadata);

    const hasCycleError =
      metadata !== null &&
      (metadata.marketDataSync.failedPairs > 0 ||
        metadata.strategyEvaluation.failedEvaluations > 0 ||
        metadata.paperTrading.failedTrades > 0);

    return {
      status: hasCycleError ? 'warning' : 'ready',
      lastCycleAt: lastCycle ? lastCycle.createdAt.toISOString() : null,
      lastCycleMessage: lastCycle?.message ?? null,
      lastCycleSummary: metadata
        ? {
            syncedPairs: metadata.marketDataSync.syncedPairs,
            failedPairs: metadata.marketDataSync.failedPairs,
            successfulEvaluations:
              metadata.strategyEvaluation.successfulEvaluations,
            failedEvaluations: metadata.strategyEvaluation.failedEvaluations,
            approvedSignals: metadata.risk.approved,
            rejectedSignals: metadata.risk.rejected,
            executedTrades: metadata.paperTrading.executedTrades,
            closedPositions: metadata.positionManager.closedPositions,
          }
        : null,
      counts: {
        openPositions,
        generatedSignals,
        approvedSignals,
        executedSignals,
        rejectedSignals,
        filledOrders,
      },
    };
  }

  async getLogs(): Promise<BotLogResponse[]> {
    const rows = await this.prisma.$queryRaw<BotLogRow[]>`
      select
        id,
        level,
        source,
        message,
        metadata,
        created_at as "createdAt"
      from bot_logs
      order by created_at desc
      limit 25
    `;

    return rows.map((row) => ({
      id: row.id,
      level: row.level,
      source: row.source,
      message: row.message,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private async processStrategyPair(params: {
    symbol: string;
    timeframe: string;
  }): Promise<BotCycleSignalItem> {
    try {
      const savedSignal = await this.strategiesService.evaluateAndSaveSignal({
        symbol: params.symbol,
        timeframe: params.timeframe,
      });

      const baseItem: BotCycleSignalItem = {
        symbol: params.symbol,
        timeframe: params.timeframe,
        signalId: savedSignal.signalId,
        signalType: savedSignal.decision,
        signalStatus: savedSignal.signalStatus,
        riskDecision: null,
        tradeExecuted: false,
        orderId: null,
        positionId: null,
        errorMessage: null,
      };

      const riskResult = await this.riskService.evaluateSignal(
        savedSignal.signalId,
      );

      baseItem.riskDecision = riskResult.decision;
      baseItem.signalStatus = riskResult.newSignalStatus;

      if (riskResult.decision !== 'approved') {
        return baseItem;
      }

      try {
        const paperTrade = await this.paperTradingService.executeSignal(
          savedSignal.signalId,
        );

        return {
          ...baseItem,
          tradeExecuted: true,
          orderId: paperTrade.orderId,
          positionId: paperTrade.positionId,
          signalStatus: 'executed',
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown paper trade error.';

        this.logger.warn(
          `Paper trade failed for ${params.symbol} ${params.timeframe}: ${errorMessage}`,
        );

        return {
          ...baseItem,
          tradeExecuted: false,
          errorMessage,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown bot cycle error.';

      this.logger.error(
        `Strategy pair failed for ${params.symbol} ${params.timeframe}: ${errorMessage}`,
      );

      return {
        symbol: params.symbol,
        timeframe: params.timeframe,
        signalId: null,
        signalType: null,
        signalStatus: null,
        riskDecision: null,
        tradeExecuted: false,
        orderId: null,
        positionId: null,
        errorMessage,
      };
    }
  }

  private async saveCycleLog(response: BotCycleResponse): Promise<void> {
    const hasWarnings =
      response.marketDataSync.failedPairs > 0 ||
      response.strategyEvaluation.failedEvaluations > 0 ||
      response.paperTrading.failedTrades > 0;

    const level = hasWarnings ? 'warning' : 'info';

    const message = `Bot cycle completed: ${response.marketDataSync.syncedPairs}/${response.marketDataSync.totalPairs} pairs synced, ${response.strategyEvaluation.successfulEvaluations}/${response.strategyEvaluation.totalEvaluations} strategies evaluated, ${response.paperTrading.executedTrades} trades executed, ${response.positionManager.closedPositions} positions closed.`;

    await this.prisma.$executeRaw`
      insert into bot_logs (
        level,
        source,
        message,
        metadata
      )
      values (
        ${level},
        'bot-cycle',
        ${message},
        ${JSON.stringify(response)}::jsonb
      )
    `;
  }

  private async findLastCycleLog(): Promise<BotLogRow | null> {
    const rows = await this.prisma.$queryRaw<BotLogRow[]>`
      select
        id,
        level,
        source,
        message,
        metadata,
        created_at as "createdAt"
      from bot_logs
      where source = 'bot-cycle'
      order by created_at desc
      limit 1
    `;

    return rows[0] ?? null;
  }

  private parseCycleMetadata(value: unknown): BotCycleResponse | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as BotCycleResponse;
  }

  private async countOpenPositions(): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      select count(*) as count
      from positions
      where status = 'open'
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async countSignalsByStatus(status: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      select count(*) as count
      from signals
      where status = ${status}
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async countOrdersByStatus(status: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      select count(*) as count
      from orders
      where status = ${status}
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private async findActiveSymbols(): Promise<ActiveSymbolRow[]> {
    return this.prisma.$queryRaw<ActiveSymbolRow[]>`
      select symbol
      from symbols
      where is_active = true
      order by symbol asc
    `;
  }

  private async findActiveTimeframes(): Promise<ActiveTimeframeRow[]> {
    return this.prisma.$queryRaw<ActiveTimeframeRow[]>`
      select code
      from timeframes
      where is_active = true
      order by duration_seconds asc
    `;
  }
}