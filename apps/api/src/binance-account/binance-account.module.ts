import { Module } from '@nestjs/common';
import { BinanceAccountController } from './binance-account.controller';
import { BinanceAccountService } from './binance-account.service';

@Module({
  controllers: [BinanceAccountController],
  providers: [BinanceAccountService],
})
export class BinanceAccountModule {}