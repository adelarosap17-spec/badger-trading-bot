import { Controller, Get, Query } from '@nestjs/common';
import {
  IndicatorSummaryResponse,
  IndicatorsService,
} from './indicators.service';

@Controller('indicators')
export class IndicatorsController {
  constructor(private readonly indicatorsService: IndicatorsService) {}

  @Get()
  async findIndicatorSummary(
    @Query('symbol') symbol?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
  ): Promise<IndicatorSummaryResponse> {
    return this.indicatorsService.findIndicatorSummary({
      symbol,
      timeframe,
      limit,
    });
  }
}
