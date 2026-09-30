import { Module } from '@nestjs/common';
import { BinanceModule } from '../binance/binance.module';
import { CoinbaseModule } from '../coinbase/coinbase.module';
import { MarketDataSyncController } from './market-data-sync.controller';
import { MarketDataSyncService } from './market-data-sync.service';

@Module({
  imports: [BinanceModule, CoinbaseModule],
  controllers: [MarketDataSyncController],
  providers: [MarketDataSyncService],
  exports: [MarketDataSyncService],
})
export class MarketDataSyncModule {}
