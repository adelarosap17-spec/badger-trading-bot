import { Module } from '@nestjs/common';
import { PaperTradingController } from './paper-trading.controller';
import { PaperTradingService } from './paper-trading.service';

@Module({
  controllers: [PaperTradingController],
  providers: [PaperTradingService],
})
export class PaperTradingModule {}