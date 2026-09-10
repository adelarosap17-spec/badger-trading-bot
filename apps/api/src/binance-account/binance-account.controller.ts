import { Controller, Get } from '@nestjs/common';
import { BinanceAccountService } from './binance-account.service';
import { BinanceTestnetBalanceResponse } from './binance-account.types';

@Controller('binance-account')
export class BinanceAccountController {
  constructor(private readonly binanceAccountService: BinanceAccountService) {}

  @Get('testnet/balance')
  async getTestnetBalance(): Promise<BinanceTestnetBalanceResponse> {
    return this.binanceAccountService.getTestnetBalance();
  }
}