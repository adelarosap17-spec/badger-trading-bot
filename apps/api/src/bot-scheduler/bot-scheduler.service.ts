import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BotService } from '../bot/bot.service';
import { BotSchedulerStatusResponse } from './bot-scheduler.types';

@Injectable()
export class BotSchedulerService {
  private readonly logger = new Logger(BotSchedulerService.name);

  private isRunning = false;
  private lastRunAt: Date | null = null;
  private lastRunStatus: 'success' | 'failed' | null = null;
  private lastRunError: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly botService: BotService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    if (!this.shouldRunNow()) {
      return;
    }

    await this.runScheduledCycle();
  }

  async runScheduledCycle(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Scheduled bot cycle skipped because another cycle is already running.');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('Starting scheduled bot cycle.');

      await this.botService.runCycle();

      this.lastRunAt = new Date();
      this.lastRunStatus = 'success';
      this.lastRunError = null;

      this.logger.log('Scheduled bot cycle completed successfully.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown scheduler error.';

      this.lastRunAt = new Date();
      this.lastRunStatus = 'failed';
      this.lastRunError = errorMessage;

      this.logger.error(`Scheduled bot cycle failed: ${errorMessage}`);
    } finally {
      this.isRunning = false;
    }
  }

  getStatus(): BotSchedulerStatusResponse {
    return {
      enabled: this.isEnabled(),
      intervalMinutes: this.getIntervalMinutes(),
      isRunning: this.isRunning,
      lastRunAt: this.lastRunAt ? this.lastRunAt.toISOString() : null,
      lastRunStatus: this.lastRunStatus,
      lastRunError: this.lastRunError,
    };
  }

  private shouldRunNow(): boolean {
    if (!this.lastRunAt) {
      return true;
    }

    const intervalMinutes = this.getIntervalMinutes();
    const elapsedMs = Date.now() - this.lastRunAt.getTime();
    const intervalMs = intervalMinutes * 60 * 1000;

    return elapsedMs >= intervalMs;
  }

  private isEnabled(): boolean {
    return (
      this.configService.get<string>('BOT_AUTO_RUN_ENABLED') ?? 'false'
    ) === 'true';
  }

  private getIntervalMinutes(): number {
    const value = Number(
      this.configService.get<string>('BOT_AUTO_RUN_INTERVAL_MINUTES') ?? '15',
    );

    if (!Number.isFinite(value) || value < 1) {
      return 15;
    }

    return Math.floor(value);
  }
}