import { Controller, Post } from '@nestjs/common';
import { PositionManagerRunResponse } from './position-manager.types';
import { PositionManagerService } from './position-manager.service';

@Controller('position-manager')
export class PositionManagerController {
  constructor(
    private readonly positionManagerService: PositionManagerService,
  ) {}

  @Post('evaluate-open-positions')
  async evaluateOpenPositions(): Promise<PositionManagerRunResponse> {
    return this.positionManagerService.evaluateOpenPositions();
  }
}