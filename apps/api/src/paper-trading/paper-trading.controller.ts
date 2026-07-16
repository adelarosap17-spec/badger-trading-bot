import { Controller, Post, Query } from '@nestjs/common';
import { PaperTradingService } from './paper-trading.service';
import { PaperTradeExecutionResponse } from './paper-trading.types';

@Controller('paper-trading')
export class PaperTradingController {
  constructor(private readonly paperTradingService: PaperTradingService) {}

  @Post('execute-signal')
  async executeSignal(
    @Query('signalId') signalId?: string,
  ): Promise<PaperTradeExecutionResponse> {
    return this.paperTradingService.executeSignal(signalId);
  }
}