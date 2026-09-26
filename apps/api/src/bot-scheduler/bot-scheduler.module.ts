import { Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';
import { BotSchedulerController } from './bot-scheduler.controller';
import { BotSchedulerService } from './bot-scheduler.service';

@Module({
  imports: [BotModule],
  controllers: [BotSchedulerController],
  providers: [BotSchedulerService],
})
export class BotSchedulerModule {}