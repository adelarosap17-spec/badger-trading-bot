import { Module } from '@nestjs/common';
import { TelegramNotificationController } from './telegram-notification.controller';
import { TelegramNotificationService } from './telegram-notification.service';

@Module({
  controllers: [TelegramNotificationController],
  providers: [TelegramNotificationService],
  exports: [TelegramNotificationService],
})
export class TelegramNotificationModule {}