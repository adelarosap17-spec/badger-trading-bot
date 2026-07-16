import { Controller, Get } from '@nestjs/common';
import { PositionSummaryResponse } from './position.types';
import { PositionsService } from './positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  async findLatestPositions(): Promise<PositionSummaryResponse[]> {
    return this.positionsService.findLatestPositions();
  }
}