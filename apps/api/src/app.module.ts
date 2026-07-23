import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BinanceModule } from './binance/binance.module';
import { CandlesModule } from './candles/candles.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IndicatorsModule } from './indicators/indicators.module';
import { MarketDataModule } from './market-data/market-data.module';
import { PaperTradingModule } from './paper-trading/paper-trading.module';
import { PositionsModule } from './positions/positions.module';
import { RiskModule } from './risk/risk.module';
import { MarketDataSyncModule } from './market-data-sync/market-data-sync.module';
import { SignalsModule } from './signals/signals.module';
import { StrategiesModule } from './strategies/strategy.module';
import { PositionManagerModule } from './position-manager/position-manager.module';
import { MetricsModule } from './metrics/metrics.module';
import { BotModule } from './bot/bot.module';

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
    SignalsModule,
    RiskModule,
    PaperTradingModule,
    PositionsModule,
    PositionManagerModule,
    MetricsModule,
    BotModule,
  ],
})
export class AppModule {}