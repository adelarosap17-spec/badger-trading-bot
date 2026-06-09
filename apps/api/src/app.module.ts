import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BinanceModule } from './binance/binance.module';
import { CandlesModule } from './candles/candles.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IndicatorsModule } from './indicators/indicators.module';
import { MarketDataModule } from './market-data/market-data.module';
import { MarketDataSyncModule } from './market-data-sync/market-data-sync.module';
import { StrategiesModule } from './strategies/strategy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
    MarketDataModule,
    CandlesModule,
    IndicatorsModule,
    BinanceModule,
    MarketDataSyncModule,
    StrategiesModule,
  ],
})
export class AppModule {}
