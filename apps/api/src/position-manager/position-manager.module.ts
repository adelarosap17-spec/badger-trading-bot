import { Module } from '@nestjs/common';
import { PositionManagerController } from './position-manager.controller';
import { PositionManagerService } from './position-manager.service';

@Module({
  controllers: [PositionManagerController],
  providers: [PositionManagerService],
  exports: [PositionManagerService],
})
export class PositionManagerModule {}