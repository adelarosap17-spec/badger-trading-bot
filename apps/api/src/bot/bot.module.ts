import { Module } from '@nestjs/common';
import { MarketDataSyncModule } from '../market-data-sync/market-data-sync.module';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { PositionManagerModule } from '../position-manager/position-manager.module';
import { RiskModule } from '../risk/risk.module';
import { StrategiesModule } from '../strategies/strategy.module';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';

@Module({
  imports: [
    MarketDataSyncModule,
    StrategiesModule,
    RiskModule,
    PaperTradingModule,
    PositionManagerModule,
  ],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}