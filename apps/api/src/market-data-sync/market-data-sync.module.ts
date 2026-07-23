import { Module } from '@nestjs/common';
import { BinanceModule } from '../binance/binance.module';
import { MarketDataSyncController } from './market-data-sync.controller';
import { MarketDataSyncService } from './market-data-sync.service';

@Module({
  imports: [BinanceModule],
  controllers: [MarketDataSyncController],
  providers: [MarketDataSyncService],
  exports: [MarketDataSyncService],
})
export class MarketDataSyncModule {}