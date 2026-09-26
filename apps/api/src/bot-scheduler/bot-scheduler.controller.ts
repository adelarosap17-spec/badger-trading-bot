import { Controller, Get, Post } from '@nestjs/common';
import { BotSchedulerService } from './bot-scheduler.service';
import { BotSchedulerStatusResponse } from './bot-scheduler.types';

@Controller('bot-scheduler')
export class BotSchedulerController {
  constructor(private readonly botSchedulerService: BotSchedulerService) {}

  @Get('status')
  getStatus(): BotSchedulerStatusResponse {
    return this.botSchedulerService.getStatus();
  }

  @Post('run-now')
  async runNow(): Promise<BotSchedulerStatusResponse> {
    await this.botSchedulerService.runScheduledCycle();

    return this.botSchedulerService.getStatus();
  }
}