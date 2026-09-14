import { Module } from '@nestjs/common';
import { ExchangeRiskModule } from '../exchange-risk/exchange-risk.module';
import { BinanceOrdersController } from './binance-orders.controller';
import { BinanceOrdersService } from './binance-orders.service';

@Module({
  imports: [ExchangeRiskModule],
  controllers: [BinanceOrdersController],
  providers: [BinanceOrdersService],
  exports: [BinanceOrdersService],
})
export class BinanceOrdersModule {}