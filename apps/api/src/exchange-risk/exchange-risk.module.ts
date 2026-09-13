import { Module } from '@nestjs/common';
import { BinanceAccountModule } from '../binance-account/binance-account.module';
import { ExchangePositionsModule } from '../exchange-positions/exchange-positions.module';
import { ExchangeRiskController } from './exchange-risk.controller';
import { ExchangeRiskService } from './exchange-risk.service';

@Module({
  imports: [BinanceAccountModule, ExchangePositionsModule],
  controllers: [ExchangeRiskController],
  providers: [ExchangeRiskService],
  exports: [ExchangeRiskService],
})
export class ExchangeRiskModule {}