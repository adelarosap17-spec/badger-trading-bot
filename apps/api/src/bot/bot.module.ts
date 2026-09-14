import { Module } from '@nestjs/common';
import { BinanceOrdersModule } from '../binance-orders/binance-orders.module';
import { MarketDataSyncModule } from '../market-data-sync/market-data-sync.module';
import { TelegramNotificationModule } from '../notifications/telegram/telegram-notification.module';
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
    TelegramNotificationModule,
    BinanceOrdersModule,
  ],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}