import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BinanceOrdersService } from '../binance-orders/binance-orders.service';
import { PrismaService } from '../database/prisma.service';
import { MarketDataSyncService } from '../market-data-sync/market-data-sync.service';
import { TelegramNotificationService } from '../notifications/telegram/telegram-notification.service';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { PositionManagerService } from '../position-manager/position-manager.service';
import { RiskService } from '../risk/risk.service';
import { StrategiesService } from '../strategies/strategies.service';
import {
  BotCycleResponse,
  BotCycleSignalItem,
  BotLogResponse,
  BotStatusResponse,
  BotTradingMode,
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
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly marketDataSyncService: MarketDataSyncService,
    private readonly strategiesService: StrategiesService,
    private readonly riskService: RiskService,
    private readonly paperTradingService: PaperTradingService,
    private readonly positionManagerService: PositionManagerService,
    private readonly telegramNotificationService: TelegramNotificationService,
    private readonly binanceOrdersService: BinanceOrdersService,
  ) {}

  async runCycle(): Promise<BotCycleResponse> {
    const tradingMode = this.getTradingMode();
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
          tradingMode,
        });

        items.push(item);
      }
    }

    const positionManager =
      tradingMode === 'paper'
        ? await this.positionManagerService.evaluateOpenPositions()
        : {
            totalOpenPositions: 0,
            closedPositions: 0,
            keptOpenPositions: 0,
            skippedPositions: 0,
          };

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

    const executedPaperTrades = items.filter(
      (item) => item.tradeExecuted && item.executionVenue === 'paper',
    ).length;

    const failedPaperTrades = items.filter(
      (item) =>
        item.executionVenue === 'paper' &&
        item.riskDecision === 'approved' &&
        !item.tradeExecuted &&
        item.errorMessage !== null,
    ).length;

    const executedExchangeOrders = items.filter(
      (item) =>
        item.tradeExecuted && item.executionVenue === 'binance-testnet',
    ).length;

    const failedExchangeOrders = items.filter(
      (item) =>
        item.executionVenue === 'binance-testnet' &&
        item.riskDecision === 'approved' &&
        !item.tradeExecuted &&
        item.errorMessage !== null,
    ).length;

    const skippedPaperTrades =
      tradingMode === 'paper'
        ? items.filter((item) => item.riskDecision !== 'approved').length
        : 0;

    const skippedExchangeOrders =
      tradingMode === 'testnet'
        ? items.filter((item) => !item.tradeExecuted).length
        : 0;

    const response: BotCycleResponse = {
      tradingMode,
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
        executedTrades: executedPaperTrades,
        skippedTrades: skippedPaperTrades,
        failedTrades: failedPaperTrades,
      },
      exchangeTrading: {
        executedOrders: executedExchangeOrders,
        skippedOrders: skippedExchangeOrders,
        failedOrders: failedExchangeOrders,
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
    await this.sendTelegramCycleSummary(response);

    return response;
  }

  async getStatus(): Promise<BotStatusResponse> {
    const [
      lastCycle,
      openPositions,
      generatedSignals,
      approvedSignals,
      executedSignals,
      rejectedSignals,
      filledOrders,
    ] = await Promise.all([
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
        metadata.paperTrading.failedTrades > 0 ||
        metadata.exchangeTrading.failedOrders > 0);

    return {
      status: hasCycleError ? 'warning' : 'ready',
      lastCycleAt: lastCycle ? lastCycle.createdAt.toISOString() : null,
      lastCycleMessage: lastCycle?.message ?? null,
      lastCycleSummary: metadata
        ? {
            tradingMode: metadata.tradingMode,
            syncedPairs: metadata.marketDataSync.syncedPairs,
            failedPairs: metadata.marketDataSync.failedPairs,
            successfulEvaluations:
              metadata.strategyEvaluation.successfulEvaluations,
            failedEvaluations: metadata.strategyEvaluation.failedEvaluations,
            approvedSignals: metadata.risk.approved,
            rejectedSignals: metadata.risk.rejected,
            executedPaperTrades: metadata.paperTrading.executedTrades,
            executedExchangeOrders:
              metadata.exchangeTrading.executedOrders,
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
    tradingMode: BotTradingMode;
  }): Promise<BotCycleSignalItem> {
    try {
      const savedSignal = await this.strategiesService.evaluateAndSaveSignal({
        symbol: params.symbol,
        timeframe: params.timeframe,
      });

      if (params.tradingMode === 'testnet') {
        return this.processTestnetSignal({
          symbol: params.symbol,
          timeframe: params.timeframe,
          signalId: savedSignal.signalId,
          signalType: savedSignal.decision,
          signalStatus: savedSignal.signalStatus,
        });
      }

      return this.processPaperSignal({
        symbol: params.symbol,
        timeframe: params.timeframe,
        signalId: savedSignal.signalId,
        signalType: savedSignal.decision,
        signalStatus: savedSignal.signalStatus,
      });
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
        tradingMode: params.tradingMode,
        riskDecision: null,
        tradeExecuted: false,
        executionVenue: null,
        orderId: null,
        positionId: null,
        exchangeOrderId: null,
        errorMessage,
      };
    }
  }

  private async processPaperSignal(params: {
    symbol: string;
    timeframe: string;
    signalId: string;
    signalType: string;
    signalStatus: string;
  }): Promise<BotCycleSignalItem> {
    const baseItem: BotCycleSignalItem = {
      symbol: params.symbol,
      timeframe: params.timeframe,
      signalId: params.signalId,
      signalType: params.signalType,
      signalStatus: params.signalStatus,
      tradingMode: 'paper',
      riskDecision: null,
      tradeExecuted: false,
      executionVenue: null,
      orderId: null,
      positionId: null,
      exchangeOrderId: null,
      errorMessage: null,
    };

    const riskResult = await this.riskService.evaluateSignal(params.signalId);

    baseItem.riskDecision = riskResult.decision;
    baseItem.signalStatus = riskResult.newSignalStatus;

    if (riskResult.decision !== 'approved') {
      return baseItem;
    }

    try {
      const paperTrade = await this.paperTradingService.executeSignal(
        params.signalId,
      );

      return {
        ...baseItem,
        tradeExecuted: true,
        executionVenue: 'paper',
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
        executionVenue: 'paper',
        tradeExecuted: false,
        errorMessage,
      };
    }
  }

  private async processTestnetSignal(params: {
    symbol: string;
    timeframe: string;
    signalId: string;
    signalType: string;
    signalStatus: string;
  }): Promise<BotCycleSignalItem> {
    const baseItem: BotCycleSignalItem = {
      symbol: params.symbol,
      timeframe: params.timeframe,
      signalId: params.signalId,
      signalType: params.signalType,
      signalStatus: params.signalStatus,
      tradingMode: 'testnet',
      riskDecision: null,
      tradeExecuted: false,
      executionVenue: 'binance-testnet',
      orderId: null,
      positionId: null,
      exchangeOrderId: null,
      errorMessage: null,
    };

    if (params.signalType !== 'buy') {
      return {
        ...baseItem,
        riskDecision: 'skipped',
        errorMessage: `Testnet execution supports buy signals only for now. Received ${params.signalType}.`,
      };
    }

    try {
      const quoteOrderQty = this.getTestnetQuoteOrderQty();

      const exchangeOrder =
        await this.binanceOrdersService.createTestnetMarketBuy({
          symbol: params.symbol,
          quoteOrderQty,
        });

      return {
        ...baseItem,
        riskDecision: exchangeOrder.riskDecision,
        tradeExecuted: true,
        exchangeOrderId: exchangeOrder.exchangeOrderId,
        signalStatus: 'executed',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown Binance testnet trade error.';

      this.logger.warn(
        `Binance testnet trade failed for ${params.symbol} ${params.timeframe}: ${errorMessage}`,
      );

      return {
        ...baseItem,
        riskDecision: 'rejected',
        tradeExecuted: false,
        errorMessage,
      };
    }
  }

  private async saveCycleLog(response: BotCycleResponse): Promise<void> {
    const hasWarnings =
      response.marketDataSync.failedPairs > 0 ||
      response.strategyEvaluation.failedEvaluations > 0 ||
      response.paperTrading.failedTrades > 0 ||
      response.exchangeTrading.failedOrders > 0;

    const level = hasWarnings ? 'warning' : 'info';

    const message = `Bot cycle completed in ${response.tradingMode} mode: ${response.marketDataSync.syncedPairs}/${response.marketDataSync.totalPairs} pairs synced, ${response.strategyEvaluation.successfulEvaluations}/${response.strategyEvaluation.totalEvaluations} strategies evaluated, ${response.paperTrading.executedTrades} paper trades executed, ${response.exchangeTrading.executedOrders} exchange orders executed, ${response.positionManager.closedPositions} paper positions closed.`;

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

  private async sendTelegramCycleSummary(
    response: BotCycleResponse,
  ): Promise<void> {
    const result =
      await this.telegramNotificationService.sendBotCycleSummary(response);

    if (!result.sent && result.reason) {
      this.logger.warn(`Telegram cycle notification skipped: ${result.reason}`);
    }
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

    const metadata = value as Partial<BotCycleResponse>;

    if (!metadata.exchangeTrading) {
      return {
        tradingMode: metadata.tradingMode ?? 'paper',
        startedAt: metadata.startedAt ?? '',
        finishedAt: metadata.finishedAt ?? '',
        marketDataSync: metadata.marketDataSync ?? {
          totalPairs: 0,
          syncedPairs: 0,
          failedPairs: 0,
        },
        strategyEvaluation: metadata.strategyEvaluation ?? {
          totalEvaluations: 0,
          successfulEvaluations: 0,
          failedEvaluations: 0,
        },
        risk: metadata.risk ?? {
          approved: 0,
          rejected: 0,
          skipped: 0,
        },
        paperTrading: metadata.paperTrading ?? {
          executedTrades: 0,
          skippedTrades: 0,
          failedTrades: 0,
        },
        exchangeTrading: {
          executedOrders: 0,
          skippedOrders: 0,
          failedOrders: 0,
        },
        positionManager: metadata.positionManager ?? {
          totalOpenPositions: 0,
          closedPositions: 0,
          keptOpenPositions: 0,
          skippedPositions: 0,
        },
        items: metadata.items ?? [],
      };
    }

    return metadata as BotCycleResponse;
  }

  private getTradingMode(): BotTradingMode {
    const value = this.configService.get<string>('BOT_TRADING_MODE') ?? 'paper';

    if (value === 'testnet') {
      return 'testnet';
    }

    return 'paper';
  }

  private getTestnetQuoteOrderQty(): string {
    const value =
      this.configService.get<string>('BOT_TESTNET_QUOTE_ORDER_QTY') ?? '10';

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return '10';
    }

    return value;
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