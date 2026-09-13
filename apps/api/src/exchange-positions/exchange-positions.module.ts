import { Module } from '@nestjs/common';
import { ExchangePositionsController } from './exchange-positions.controller';
import { ExchangePositionsService } from './exchange-positions.service';

@Module({
  controllers: [ExchangePositionsController],
  providers: [ExchangePositionsService],
  exports: [ExchangePositionsService],
})
export class ExchangePositionsModule {}