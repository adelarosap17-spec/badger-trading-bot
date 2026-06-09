import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BinanceClient } from './binance.client';
import {
  BinanceInterval,
  BinanceKlineResponse,
  SyncBinanceCandlesResponse,
} from './binance.types';

type BinanceKlineQueryParams = {
  symbol?: string;
  interval?: string;
  limit?: string;
};

type SyncCandlesQueryParams = {
  symbol?: string;
  timeframe?: string;
  limit?: string;
};

const supportedIntervals: BinanceInterval[] = ['5m', '15m', '1h'];

@Injectable()
export class BinanceService {
  constructor(
    private readonly binanceClient: BinanceClient,
    private readonly prisma: PrismaService,
  ) {}

  async getKlines(
    params: BinanceKlineQueryParams,
  ): Promise<BinanceKlineResponse> {
    const symbol = this.parseSymbol(params.symbol);
    const interval = this.parseInterval(params.interval);
    const limit = this.parseLimit(params.limit, 1, 1000);

    return this.binanceClient.getKlines({
      symbol,
      interval,
      limit,
    });
  }

  async syncCandles(
    params: SyncCandlesQueryParams,
  ): Promise<SyncBinanceCandlesResponse> {
    const symbolCode = this.parseSymbol(params.symbol);
    const timeframeCode = this.parseTimeframe(params.timeframe);
    const interval = this.parseInterval(timeframeCode);
    const limit = this.parseLimit(params.limit, 1, 1000);

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

    const response = await this.binanceClient.getKlines({
      symbol: symbolCode,
      interval,
      limit,
    });

    const now = Date.now();

    const closedKlines = response.klines.filter((kline) => {
      return kline.closeTime.getTime() < now;
    });

    if (closedKlines.length === 0) {
      return {
        symbol: symbolCode,
        timeframe: timeframeCode,
        requestedLimit: limit,
        receivedFromBinance: response.total,
        closedCandles: 0,
        insertedCandles: 0,
        skippedCandles: 0,
      };
    }

    const createResult = await this.prisma.candles.createMany({
      data: closedKlines.map((kline) => ({
        symbol_id: symbol.id,
        timeframe_id: timeframe.id,
        open_time: kline.openTime,
        close_time: kline.closeTime,
        open: kline.open,
        high: kline.high,
        low: kline.low,
        close: kline.close,
        volume: kline.volume,
        source: 'binance',
        is_closed: true,
      })),
      skipDuplicates: true,
    });

    return {
      symbol: symbolCode,
      timeframe: timeframeCode,
      requestedLimit: limit,
      receivedFromBinance: response.total,
      closedCandles: closedKlines.length,
      insertedCandles: createResult.count,
      skippedCandles: closedKlines.length - createResult.count,
    };
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

  private parseInterval(rawInterval: string | undefined): BinanceInterval {
    const interval = rawInterval?.trim() as BinanceInterval | undefined;

    if (!interval) {
      throw new BadRequestException('interval query param is required.');
    }

    if (!supportedIntervals.includes(interval)) {
      throw new BadRequestException(
        `interval must be one of: ${supportedIntervals.join(', ')}.`,
      );
    }

    return interval;
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
}
