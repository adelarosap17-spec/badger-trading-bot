import { Module } from '@nestjs/common';
import { BinanceClient } from './binance.client';
import { BinanceController } from './binance.controller';
import { BinanceService } from './binance.service';

@Module({
  controllers: [BinanceController],
  providers: [BinanceClient, BinanceService],
  exports: [BinanceService],
})
export class BinanceModule {}
