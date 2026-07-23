import { Controller, Get, Post } from '@nestjs/common';
import { BotService } from './bot.service';
import {
  BotCycleResponse,
  BotLogResponse,
  BotStatusResponse,
} from './bot.types';

@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post('run-cycle')
  async runCycle(): Promise<BotCycleResponse> {
    return this.botService.runCycle();
  }

  @Get('status')
  async getStatus(): Promise<BotStatusResponse> {
    return this.botService.getStatus();
  }

  @Get('logs')
  async getLogs(): Promise<BotLogResponse[]> {
    return this.botService.getLogs();
  }
}