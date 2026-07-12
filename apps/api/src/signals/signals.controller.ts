import { Controller, Get } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalSummaryResponse } from './signal.types';

@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get()
  async findLatestSignals(): Promise<SignalSummaryResponse[]> {
    return this.signalsService.findLatestSignals();
  }
}