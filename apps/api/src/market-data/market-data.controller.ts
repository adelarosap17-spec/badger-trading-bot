import { Controller, Get } from '@nestjs/common';
import {
  MarketDataService,
  MarketDataSummaryResponse,
  MarketSymbolResponse,
  MarketTimeframeResponse,
} from './market-data.service';

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('symbols')
  async findActiveSymbols(): Promise<MarketSymbolResponse[]> {
    return this.marketDataService.findActiveSymbols();
  }

  @Get('timeframes')
  async findActiveTimeframes(): Promise<MarketTimeframeResponse[]> {
    return this.marketDataService.findActiveTimeframes();
  }

  @Get('summaries')
  async findMarketDataSummaries(): Promise<MarketDataSummaryResponse[]> {
    return this.marketDataService.findMarketDataSummaries();
  }
}
