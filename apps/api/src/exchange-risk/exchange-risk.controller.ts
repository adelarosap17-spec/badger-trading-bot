import { Body, Controller, Post } from '@nestjs/common';
import { ExchangeRiskService } from './exchange-risk.service';
import {
  ExchangeRiskMarketBuyRequest,
  ExchangeRiskMarketBuyResponse,
} from './exchange-risk.types';

@Controller('exchange-risk')
export class ExchangeRiskController {
  constructor(private readonly exchangeRiskService: ExchangeRiskService) {}

  @Post('testnet/evaluate-market-buy')
  async evaluateTestnetMarketBuy(
    @Body() request: ExchangeRiskMarketBuyRequest,
  ): Promise<ExchangeRiskMarketBuyResponse> {
    return this.exchangeRiskService.evaluateTestnetMarketBuy(request);
  }
}