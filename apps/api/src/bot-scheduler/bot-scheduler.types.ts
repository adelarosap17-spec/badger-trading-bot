export type BotSchedulerStatusResponse = {
  enabled: boolean;
  intervalMinutes: number;
  isRunning: boolean;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failed' | null;
  lastRunError: string | null;
};