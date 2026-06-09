import { Controller, Post } from '@nestjs/common';
import {
  MarketDataSyncRunResponse,
  MarketDataSyncService,
} from './market-data-sync.service';

@Controller('market-data-sync')
export class MarketDataSyncController {
  constructor(private readonly marketDataSyncService: MarketDataSyncService) {}

  @Post('run')
  async runSync(): Promise<MarketDataSyncRunResponse> {
    return this.marketDataSyncService.runSync();
  }
}
