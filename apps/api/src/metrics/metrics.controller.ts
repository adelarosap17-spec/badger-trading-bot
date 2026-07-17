import { Controller, Get } from '@nestjs/common';
import { MetricsResponse } from './metrics.types';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics(): Promise<MetricsResponse> {
    return this.metricsService.getMetrics();
  }
}