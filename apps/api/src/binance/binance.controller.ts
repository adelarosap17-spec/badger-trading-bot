import { Controller, Get, Post, Query } from '@nestjs/common';
import { BinanceService } from './binance.service';
import {
  BinanceKlineResponse,
  SyncBinanceCandlesResponse,
} from './binance.types';

@Controller('binance')
export class BinanceController {
  constructor(private readonly binanceService: BinanceService) {}

  @Get('klines')
  async getKlines(
    @Query('symbol') symbol?: string,
    @Query('interval') interval?: string,
    @Query('limit') limit?: string,
  ): Promise<BinanceKlineResponse> {
    return this.binanceService.getKlines({
      symbol,
      interval,
      limit,
    });
  }

  @Post('sync-candles')
  async syncCandles(
    @Query('symbol') symbol?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
  ): Promise<SyncBinanceCandlesResponse> {
    return this.binanceService.syncCandles({
      symbol,
      timeframe,
      limit,
    });
  }
}
