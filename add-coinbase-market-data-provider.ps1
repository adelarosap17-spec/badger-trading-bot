$Root = "C:\dev\badger-trading-bot"

function Write-ProjectFile {
    param(
        [string]$RelativePath,
        [string]$Content
    )

    $FullPath = Join-Path $Root $RelativePath
    $Folder = Split-Path $FullPath -Parent

    if (!(Test-Path $Folder)) {
        New-Item -ItemType Directory -Path $Folder -Force | Out-Null
    }

    Set-Content -Path $FullPath -Value $Content -Encoding UTF8
    Write-Host "wrote $FullPath"
}

function Replace-InProjectFile {
    param(
        [string]$RelativePath,
        [string]$OldText,
        [string]$NewText
    )

    $FullPath = Join-Path $Root $RelativePath
    $Content = Get-Content -Path $FullPath -Raw

    if (-not $Content.Contains($OldText)) {
        throw "Expected text not found in $FullPath"
    }

    $Content = $Content.Replace($OldText, $NewText)
    Set-Content -Path $FullPath -Value $Content -Encoding UTF8
    Write-Host "updated $FullPath"
}

Write-ProjectFile "apps/api/src/coinbase/coinbase.module.ts" @'
import { Module } from '@nestjs/common';
import { CoinbaseService } from './coinbase.service';

@Module({
  providers: [CoinbaseService],
  exports: [CoinbaseService],
})
export class CoinbaseModule {}
'@

Write-ProjectFile "apps/api/src/coinbase/coinbase.service.ts" @'
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type CoinbaseProductId = 'BTC-USD' | 'ETH-USD';

type CoinbaseGranularity = 300 | 900 | 3600;

type CoinbaseCandleTuple = [
  number,
  number,
  number,
  number,
  number,
  number,
];

type CoinbaseCandle = {
  openTime: Date;
  closeTime: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};

type SyncCoinbaseCandlesParams = {
  symbol?: string;
  timeframe?: string;
  limit?: string;
};

export type SyncCoinbaseCandlesResponse = {
  symbol: string;
  timeframe: string;
  requestedLimit: number;
  receivedFromCoinbase: number;
  closedCandles: number;
  insertedCandles: number;
  skippedCandles: number;
};

@Injectable()
export class CoinbaseService {
  private readonly baseUrl =
    process.env.COINBASE_REST_BASE_URL ?? 'https://api.exchange.coinbase.com';

  constructor(private readonly prisma: PrismaService) {}

  async syncCandles(
    params: SyncCoinbaseCandlesParams,
  ): Promise<SyncCoinbaseCandlesResponse> {
    const symbolCode = this.parseSymbol(params.symbol);
    const timeframeCode = this.parseTimeframe(params.timeframe);
    const productId = this.mapSymbolToProductId(symbolCode);
    const granularity = this.mapTimeframeToGranularity(timeframeCode);
    const limit = this.parseLimit(params.limit, 1, 300);

    const symbol = await this.prisma.symbols.findFirst({
      where: {
        symbol: symbolCode,
        is_active: true,
      },
    });

    if (!symbol) {
      throw new BadRequestException(`Symbol ${symbolCode} was not found.`);
    }

    const timeframe = await this.prisma.timeframes.findFirst({
      where: {
        code: timeframeCode,
        is_active: true,
      },
    });

    if (!timeframe) {
      throw new BadRequestException(
        `Timeframe ${timeframeCode} was not found.`,
      );
    }

    const candles = await this.getProductCandles({
      productId,
      granularity,
      limit,
    });

    const now = Date.now();

    const closedCandles = candles.filter((candle) => {
      return candle.closeTime.getTime() < now;
    });

    if (closedCandles.length === 0) {
      return {
        symbol: symbolCode,
        timeframe: timeframeCode,
        requestedLimit: limit,
        receivedFromCoinbase: candles.length,
        closedCandles: 0,
        insertedCandles: 0,
        skippedCandles: 0,
      };
    }

    const createResult = await this.prisma.candles.createMany({
      data: closedCandles.map((candle) => ({
        symbol_id: symbol.id,
        timeframe_id: timeframe.id,
        open_time: candle.openTime,
        close_time: candle.closeTime,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        source: 'coinbase',
        is_closed: true,
      })),
      skipDuplicates: true,
    });

    return {
      symbol: symbolCode,
      timeframe: timeframeCode,
      requestedLimit: limit,
      receivedFromCoinbase: candles.length,
      closedCandles: closedCandles.length,
      insertedCandles: createResult.count,
      skippedCandles: closedCandles.length - createResult.count,
    };
  }

  private async getProductCandles(params: {
    productId: CoinbaseProductId;
    granularity: CoinbaseGranularity;
    limit: number;
  }): Promise<CoinbaseCandle[]> {
    const url = new URL(
      `/products/${params.productId}/candles`,
      this.baseUrl,
    );

    url.searchParams.set('granularity', params.granularity.toString());

    const response = await fetch(url);

    if (!response.ok) {
      const responseText = await response.text();

      throw new Error(
        `Coinbase candles request failed with status ${response.status}: ${responseText}`,
      );
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      throw new Error('Coinbase candles response is not an array.');
    }

    return payload
      .map((item) => this.parseCoinbaseCandleTuple(item, params.granularity))
      .slice(0, params.limit);
  }

  private parseCoinbaseCandleTuple(
    value: unknown,
    granularity: CoinbaseGranularity,
  ): CoinbaseCandle {
    if (!this.isCoinbaseCandleTuple(value)) {
      throw new Error('Invalid Coinbase candle tuple received.');
    }

    const openTime = new Date(value[0] * 1000);
    const closeTime = new Date((value[0] + granularity) * 1000);

    return {
      openTime,
      closeTime,
      low: value[1].toString(),
      high: value[2].toString(),
      open: value[3].toString(),
      close: value[4].toString(),
      volume: value[5].toString(),
    };
  }

  private isCoinbaseCandleTuple(value: unknown): value is CoinbaseCandleTuple {
    if (!Array.isArray(value)) {
      return false;
    }

    if (value.length < 6) {
      return false;
    }

    return (
      typeof value[0] === 'number' &&
      typeof value[1] === 'number' &&
      typeof value[2] === 'number' &&
      typeof value[3] === 'number' &&
      typeof value[4] === 'number' &&
      typeof value[5] === 'number'
    );
  }

  private parseSymbol(rawSymbol: string | undefined): string {
    const symbol = rawSymbol?.trim().toUpperCase();

    if (!symbol) {
      throw new BadRequestException('symbol query param is required.');
    }

    return symbol;
  }

  private parseTimeframe(rawTimeframe: string | undefined): string {
    const timeframe = rawTimeframe?.trim();

    if (!timeframe) {
      throw new BadRequestException('timeframe query param is required.');
    }

    return timeframe;
  }

  private parseLimit(
    rawLimit: string | undefined,
    min: number,
    max: number,
  ): number {
    if (!rawLimit) {
      return 100;
    }

    const limit = Number(rawLimit);

    if (!Number.isInteger(limit)) {
      throw new BadRequestException('limit must be an integer.');
    }

    if (limit < min) {
      throw new BadRequestException(
        `limit must be greater than or equal ${min}.`,
      );
    }

    if (limit > max) {
      throw new BadRequestException(`limit cannot be greater than ${max}.`);
    }

    return limit;
  }

  private mapSymbolToProductId(symbol: string): CoinbaseProductId {
    if (symbol === 'BTCUSDT') {
      return 'BTC-USD';
    }

    if (symbol === 'ETHUSDT') {
      return 'ETH-USD';
    }

    throw new BadRequestException(
      `Symbol ${symbol} is not supported by Coinbase market data provider.`,
    );
  }

  private mapTimeframeToGranularity(timeframe: string): CoinbaseGranularity {
    if (timeframe === '5m') {
      return 300;
    }

    if (timeframe === '15m') {
      return 900;
    }

    if (timeframe === '1h') {
      return 3600;
    }

    throw new BadRequestException(
      `Timeframe ${timeframe} is not supported by Coinbase market data provider.`,
    );
  }
}
'@

Write-ProjectFile "apps/api/src/market-data-sync/market-data-sync.module.ts" @'
import { Module } from '@nestjs/common';
import { BinanceModule } from '../binance/binance.module';
import { CoinbaseModule } from '../coinbase/coinbase.module';
import { MarketDataSyncController } from './market-data-sync.controller';
import { MarketDataSyncService } from './market-data-sync.service';

@Module({
  imports: [BinanceModule, CoinbaseModule],
  controllers: [MarketDataSyncController],
  providers: [MarketDataSyncService],
  exports: [MarketDataSyncService],
})
export class MarketDataSyncModule {}
'@

Write-ProjectFile "apps/api/src/market-data-sync/market-data-sync.service.ts" @'
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
'@

Replace-InProjectFile ".env.production.example" @'
MARKET_DATA_SYNC_ENABLED="false"
MARKET_DATA_SYNC_LIMIT="100"
'@ @'
MARKET_DATA_SYNC_ENABLED="false"
MARKET_DATA_SYNC_LIMIT="100"
MARKET_DATA_PROVIDER="coinbase"
COINBASE_REST_BASE_URL="https://api.exchange.coinbase.com"
'@

Replace-InProjectFile "docker-compose.prod.yml" @'
      MARKET_DATA_SYNC_ENABLED: ${MARKET_DATA_SYNC_ENABLED:-false}
      MARKET_DATA_SYNC_LIMIT: ${MARKET_DATA_SYNC_LIMIT:-100}
'@ @'
      MARKET_DATA_SYNC_ENABLED: ${MARKET_DATA_SYNC_ENABLED:-false}
      MARKET_DATA_SYNC_LIMIT: ${MARKET_DATA_SYNC_LIMIT:-100}
      MARKET_DATA_PROVIDER: ${MARKET_DATA_PROVIDER:-binance}
      COINBASE_REST_BASE_URL: ${COINBASE_REST_BASE_URL:-https://api.exchange.coinbase.com}
'@

Write-Host "Coinbase market data provider patch completed."