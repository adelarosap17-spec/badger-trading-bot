import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BinanceService } from '../binance/binance.service';
import { CoinbaseService } from '../coinbase/coinbase.service';
import { PrismaService } from '../database/prisma.service';

type MarketDataProvider = 'binance' | 'coinbase';

type SyncSymbolRow = {
  id: string;
  symbol: string;
};

type SyncTimeframeRow = {
  id: string;
  code: string;
};

type MarketDataSyncItem = {
  symbol: string;
  timeframe: string;
  provider: MarketDataProvider;
  status: 'synced' | 'failed';
  insertedCandles: number;
  skippedCandles: number;
  errorMessage: string | null;
};

export type MarketDataSyncRunResponse = {
  startedAt: string;
  finishedAt: string;
  syncEnabled: boolean;
  provider: MarketDataProvider;
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
    private readonly coinbaseService: CoinbaseService,
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
      `Market data sync finished. Provider=${result.provider}, Synced=${result.syncedPairs}, Failed=${result.failedPairs}`,
    );
  }

  async runSync(): Promise<MarketDataSyncRunResponse> {
    const startedAt = new Date();
    const limit = this.getSyncLimit();
    const provider = this.getMarketDataProvider();

    const symbols = await this.prisma.$queryRaw<SyncSymbolRow[]>`
  select id, symbol
  from symbols
  where is_active = true
  order by symbol asc
`;

    const timeframes = await this.prisma.$queryRaw<SyncTimeframeRow[]>`
  select id, code
  from timeframes
  where is_active = true
  order by duration_seconds asc
`;

    const items: MarketDataSyncItem[] = [];

    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          const result = await this.syncCandles({
            provider,
            symbol: symbol.symbol,
            timeframe: timeframe.code,
            limit: limit.toString(),
          });

          items.push({
            symbol: symbol.symbol,
            timeframe: timeframe.code,
            provider,
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
            provider,
            status: 'failed',
            insertedCandles: 0,
            skippedCandles: 0,
            errorMessage,
          });

          this.logger.error(
            `Failed syncing ${symbol.symbol} ${timeframe.code} with ${provider}: ${errorMessage}`,
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
      provider,
      limit,
      totalPairs: items.length,
      syncedPairs,
      failedPairs,
      items,
    };
  }

  private async syncCandles(params: {
    provider: MarketDataProvider;
    symbol: string;
    timeframe: string;
    limit: string;
  }): Promise<{ insertedCandles: number; skippedCandles: number }> {
    if (params.provider === 'coinbase') {
      return this.coinbaseService.syncCandles({
        symbol: params.symbol,
        timeframe: params.timeframe,
        limit: params.limit,
      });
    }

    return this.binanceService.syncCandles({
      symbol: params.symbol,
      timeframe: params.timeframe,
      limit: params.limit,
    });
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

    if (parsedLimit > 300) {
      return 300;
    }

    return parsedLimit;
  }

  private getMarketDataProvider(): MarketDataProvider {
    const provider = (process.env.MARKET_DATA_PROVIDER ?? 'binance')
      .trim()
      .toLowerCase();

    if (provider === 'coinbase') {
      return 'coinbase';
    }

    return 'binance';
  }
}
