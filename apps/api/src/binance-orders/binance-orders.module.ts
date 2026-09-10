import { Module } from '@nestjs/common';
import { BinanceOrdersController } from './binance-orders.controller';
import { BinanceOrdersService } from './binance-orders.service';

@Module({
  controllers: [BinanceOrdersController],
  providers: [BinanceOrdersService],
})
export class BinanceOrdersModule {}