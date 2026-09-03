import { Controller, Post } from '@nestjs/common';
import { TelegramNotificationService } from './telegram-notification.service';
import { TelegramSendResult } from './telegram-notification.type';

@Controller('notifications/telegram')
export class TelegramNotificationController {
  constructor(
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  @Post('test')
  async sendTestMessage(): Promise<TelegramSendResult> {
    return this.telegramNotificationService.sendTestMessage();
  }
}