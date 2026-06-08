import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MarketDataModule } from './market-data/market-data.module';
import { CandlesModule } from './candles/candles.module';

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
  ],
})
export class AppModule {}
