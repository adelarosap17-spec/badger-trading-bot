import { Controller, Post, Query } from '@nestjs/common';
import { RiskEvaluationResponse } from './risk.types';
import { RiskService } from './risk.service'

@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('evaluate-signal')
  async evaluateSignal(
    @Query('signalId') signalId?: string,
  ): Promise<RiskEvaluationResponse> {
    return this.riskService.evaluateSignal(signalId);
  }
}