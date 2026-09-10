import { Body, Controller, Get, Post } from '@nestjs/common';
import { BinanceOrdersService } from './binance-orders.service';
import {
  BinanceTestnetMarketBuyRequest,
  BinanceTestnetMarketBuyResponse,
  BinanceTestnetMarketSellRequest,
  BinanceTestnetMarketSellResponse,
  ExchangeOrderSummaryResponse,
} from './binance-orders.types';

@Controller('binance-orders')
export class BinanceOrdersController {
  constructor(private readonly binanceOrdersService: BinanceOrdersService) {}

  @Post('testnet/market-buy')
  async createTestnetMarketBuy(
    @Body() request: BinanceTestnetMarketBuyRequest,
  ): Promise<BinanceTestnetMarketBuyResponse> {
    return this.binanceOrdersService.createTestnetMarketBuy(request);
  }

  @Post('testnet/market-sell')
  async createTestnetMarketSell(
    @Body() request: BinanceTestnetMarketSellRequest,
  ): Promise<BinanceTestnetMarketSellResponse> {
    return this.binanceOrdersService.createTestnetMarketSell(request);
  }

  @Get('testnet/recent')
  async findRecentTestnetOrders(): Promise<ExchangeOrderSummaryResponse[]> {
    return this.binanceOrdersService.findRecentTestnetOrders();
  }
}