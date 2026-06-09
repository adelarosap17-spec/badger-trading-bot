import { Controller, Get, Query } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { StrategyEvaluationResponse } from './strategy.types';

@Controller('strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Get('evaluate')
  async evaluateStrategy(
    @Query('symbol') symbol?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
  ): Promise<StrategyEvaluationResponse> {
    return this.strategiesService.evaluateStrategy({
      symbol,
      timeframe,
      limit,
    });
  }
}
