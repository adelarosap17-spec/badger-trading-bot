import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BinanceService } from '../binance/binance.service';
import { PrismaService } from '../database/prisma.service';

type MarketDataSyncItem = {
  symbol: string;
  timeframe: string;
  status: 'synced' | 'failed';
  insertedCandles: number;
  skippedCandles: number;
  errorMessage: string | null;
};

export type MarketDataSyncRunResponse = {
  startedAt: string;
  finishedAt: string;
  syncEnabled: boolean;
  limit: number;
  totalPairs: number;
  syncedPairs: number;
  failedPairs: number;
  items: MarketDataSyncItem[];
};

@Injectable()
export class MarketDataSyncService {
  private readonly logger = new Logger(MarketDataSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly binanceService: BinanceService,
  ) {}

  @Cron('0 */15 * * * *')
  async runScheduledSync(): Promise<void> {
    const isEnabled = this.isSyncEnabled();

    if (!isEnabled) {
      this.logger.log('Market data sync skipped because it is disabled.');
      return;
    }

    const result = await this.runSync();

    this.logger.log(
      `Market data sync finished. Synced=${result.syncedPairs}, Failed=${result.failedPairs}`,
    );
  }

  async runSync(): Promise<MarketDataSyncRunResponse> {
    const startedAt = new Date();
    const limit = this.getSyncLimit();

    const symbols = await this.prisma.symbols.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        symbol: 'asc',
      },
    });

    const timeframes = await this.prisma.timeframes.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        duration_seconds: 'asc',
      },
    });

    const items: MarketDataSyncItem[] = [];

    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          const result = await this.binanceService.syncCandles({
            symbol: symbol.symbol,
            timeframe: timeframe.code,
            limit: limit.toString(),
          });

          items.push({
            symbol: symbol.symbol,
            timeframe: timeframe.code,
            status: 'synced',
            insertedCandles: result.insertedCandles,
            skippedCandles: result.skippedCandles,
            errorMessage: null,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown sync error.';

          items.push({
            symbol: symbol.symbol,
            timeframe: timeframe.code,
            status: 'failed',
            insertedCandles: 0,
            skippedCandles: 0,
            errorMessage,
          });

          this.logger.error(
            `Failed syncing ${symbol.symbol} ${timeframe.code}: ${errorMessage}`,
          );
        }
      }
    }

    const finishedAt = new Date();
    const syncedPairs = items.filter((item) => item.status === 'synced').length;
    const failedPairs = items.filter((item) => item.status === 'failed').length;

    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      syncEnabled: this.isSyncEnabled(),
      limit,
      totalPairs: items.length,
      syncedPairs,
      failedPairs,
      items,
    };
  }

  private isSyncEnabled(): boolean {
    return process.env.MARKET_DATA_SYNC_ENABLED === 'true';
  }

  private getSyncLimit(): number {
    const rawLimit = process.env.MARKET_DATA_SYNC_LIMIT ?? '100';
    const parsedLimit = Number(rawLimit);

    if (!Number.isInteger(parsedLimit)) {
      return 100;
    }

    if (parsedLimit < 1) {
      return 100;
    }

    if (parsedLimit > 1000) {
      return 1000;
    }

    return parsedLimit;
  }
}
