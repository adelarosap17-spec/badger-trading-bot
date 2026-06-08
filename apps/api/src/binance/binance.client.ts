import { Injectable } from '@nestjs/common';
import {
  BinanceInterval,
  BinanceKline,
  BinanceKlineResponse,
  BinanceKlineTuple,
} from './binance.types';

@Injectable()
export class BinanceClient {
  private readonly baseUrl =
    process.env.BINANCE_REST_BASE_URL ?? 'https://api.binance.com';

  async getKlines(params: {
    symbol: string;
    interval: BinanceInterval;
    limit: number;
  }): Promise<BinanceKlineResponse> {
    const url = new URL('/api/v3/klines', this.baseUrl);

    url.searchParams.set('symbol', params.symbol);
    url.searchParams.set('interval', params.interval);
    url.searchParams.set('limit', params.limit.toString());

    const response = await fetch(url);

    if (!response.ok) {
      const responseText = await response.text();

      throw new Error(
        `Binance klines request failed with status ${response.status}: ${responseText}`,
      );
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      throw new Error('Binance klines response is not an array.');
    }

    const klines = payload.map((item) => this.parseKlineTuple(item));

    return {
      symbol: params.symbol,
      interval: params.interval,
      total: klines.length,
      klines,
    };
  }

  private parseKlineTuple(value: unknown): BinanceKline {
    if (!this.isBinanceKlineTuple(value)) {
      throw new Error('Invalid Binance kline tuple received.');
    }

    return {
      openTime: new Date(value[0]),
      open: value[1],
      high: value[2],
      low: value[3],
      close: value[4],
      volume: value[5],
      closeTime: new Date(value[6]),
      quoteAssetVolume: value[7],
      tradeCount: value[8],
      takerBuyBaseVolume: value[9],
      takerBuyQuoteVolume: value[10],
    };
  }

  private isBinanceKlineTuple(value: unknown): value is BinanceKlineTuple {
    if (!Array.isArray(value)) {
      return false;
    }

    if (value.length < 12) {
      return false;
    }

    return (
      typeof value[0] === 'number' &&
      typeof value[1] === 'string' &&
      typeof value[2] === 'string' &&
      typeof value[3] === 'string' &&
      typeof value[4] === 'string' &&
      typeof value[5] === 'string' &&
      typeof value[6] === 'number' &&
      typeof value[7] === 'string' &&
      typeof value[8] === 'number' &&
      typeof value[9] === 'string' &&
      typeof value[10] === 'string' &&
      typeof value[11] === 'string'
    );
  }
}
