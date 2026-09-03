import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotCycleResponse } from '../../bot/bot.types';
import { TelegramSendResult } from './telegram-notification.type';

type TelegramApiResponse = {
  ok: boolean;
  description?: string;
};

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendBotCycleSummary(
    cycle: BotCycleResponse,
  ): Promise<TelegramSendResult> {
    const message = this.buildCycleMessage(cycle);

    return this.sendMessage(message);
  }

  async sendTestMessage(): Promise<TelegramSendResult> {
    return this.sendMessage(
      '✅ Badger Trading Bot Telegram notifications are working.',
    );
  }

  private async sendMessage(message: string): Promise<TelegramSendResult> {
    const enabled = this.configService.get<string>('TELEGRAM_ENABLED');
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (enabled !== 'true') {
      return {
        sent: false,
        reason: 'Telegram notifications are disabled.',
      };
    }

    if (!token || !chatId) {
      return {
        sent: false,
        reason: 'Telegram token or chat id is missing.',
      };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );

      const body = (await response.json()) as TelegramApiResponse;

      if (!response.ok || !body.ok) {
        const reason =
          body.description ?? `Telegram API returned ${response.status}.`;

        this.logger.warn(reason);

        return {
          sent: false,
          reason,
        };
      }

      return {
        sent: true,
        reason: null,
      };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown Telegram error.';

      this.logger.warn(`Telegram notification failed: ${reason}`);

      return {
        sent: false,
        reason,
      };
    }
  }

  private buildCycleMessage(cycle: BotCycleResponse): string {
    const durationMs =
      new Date(cycle.finishedAt).getTime() - new Date(cycle.startedAt).getTime();

    const hasWarnings =
      cycle.marketDataSync.failedPairs > 0 ||
      cycle.strategyEvaluation.failedEvaluations > 0 ||
      cycle.paperTrading.failedTrades > 0;

    const status = hasWarnings
      ? '⚠️ Completed with warnings'
      : '✅ Completed successfully';

    const executedItems = cycle.items.filter((item) => item.tradeExecuted);
    const rejectedItems = cycle.items.filter(
      (item) => item.riskDecision === 'rejected',
    );

    const executedText =
      executedItems.length > 0
        ? executedItems
            .map(
              (item) =>
                `• ${item.symbol} ${item.timeframe} ${item.signalType} → executed`,
            )
            .join('\n')
        : '• No trades executed';

    const rejectedText =
      rejectedItems.length > 0
        ? rejectedItems
            .map(
              (item) =>
                `• ${item.symbol} ${item.timeframe} ${item.signalType} → rejected`,
            )
            .join('\n')
        : '• No rejected signals';

    return [
      '<b>Badger Trading Bot</b>',
      status,
      '',
      `<b>Started:</b> ${cycle.startedAt}`,
      `<b>Finished:</b> ${cycle.finishedAt}`,
      `<b>Duration:</b> ${durationMs} ms`,
      '',
      '<b>Market Data</b>',
      `• Synced pairs: ${cycle.marketDataSync.syncedPairs}/${cycle.marketDataSync.totalPairs}`,
      `• Failed pairs: ${cycle.marketDataSync.failedPairs}`,
      '',
      '<b>Strategy Evaluation</b>',
      `• Successful: ${cycle.strategyEvaluation.successfulEvaluations}/${cycle.strategyEvaluation.totalEvaluations}`,
      `• Failed: ${cycle.strategyEvaluation.failedEvaluations}`,
      '',
      '<b>Risk</b>',
      `• Approved: ${cycle.risk.approved}`,
      `• Rejected: ${cycle.risk.rejected}`,
      `• Skipped: ${cycle.risk.skipped}`,
      '',
      '<b>Paper Trading</b>',
      `• Executed trades: ${cycle.paperTrading.executedTrades}`,
      `• Failed trades: ${cycle.paperTrading.failedTrades}`,
      '',
      '<b>Position Manager</b>',
      `• Open positions checked: ${cycle.positionManager.totalOpenPositions}`,
      `• Closed positions: ${cycle.positionManager.closedPositions}`,
      `• Kept open: ${cycle.positionManager.keptOpenPositions}`,
      '',
      '<b>Executed</b>',
      executedText,
      '',
      '<b>Rejected</b>',
      rejectedText,
    ].join('\n');
  }
}