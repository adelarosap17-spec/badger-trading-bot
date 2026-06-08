import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const marketProviders = await this.prisma.market_providers.count();

    return {
      status: 'ok',
      database: 'connected',
      marketProviders,
    };
  }
}