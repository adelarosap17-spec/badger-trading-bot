import { Controller, Get, Post, Query } from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import {
  SavedStrategySignalResponse,
  StrategyEvaluationResponse,
} from './strategy.types';

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

  @Post('evaluate-and-save')
  async evaluateAndSaveSignal(
    @Query('symbol') symbol?: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string,
  ): Promise<SavedStrategySignalResponse> {
    return this.strategiesService.evaluateAndSaveSignal({
      symbol,
      timeframe,
      limit,
    });
  }
}
