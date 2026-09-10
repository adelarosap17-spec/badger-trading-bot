import { Controller, Get } from '@nestjs/common';
import { ExchangePositionsService } from './exchange-positions.service';
import { ExchangePositionSummaryResponse } from './exchange-positions.types';

@Controller('exchange-positions')
export class ExchangePositionsController {
  constructor(
    private readonly exchangePositionsService: ExchangePositionsService,
  ) {}

  @Get('testnet')
  async findTestnetPositions(): Promise<ExchangePositionSummaryResponse[]> {
    return this.exchangePositionsService.findTestnetPositions();
  }
}