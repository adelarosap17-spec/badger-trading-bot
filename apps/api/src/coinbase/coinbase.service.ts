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
