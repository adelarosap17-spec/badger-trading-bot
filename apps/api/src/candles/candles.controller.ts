import { Controller, Get, Query } from '@nestjs/common';
import { CandleResponse, CandlesService } from './candles.service';

@Controller('candles')
export class CandlesController {
  constructor(private readonly candlesService: CandlesService) {}

  @Get()
  async findCandles(
    @Query('symbol') symbol?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
  ): Promise<CandleResponse[]> {
    return this.candlesService.findCandles({
      symbol,
      timeframe,
      limit,
    });
  }
}
