import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type CandleResponse = {
  id: string;
  symbol: string;
  timeframe: string;
  openTime: string;
  closeTime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  source: string;
  isClosed: boolean;
};

type FindCandlesParams = {
  symbol?: string;
  timeframe?: string;
  limit?: string;
};

@Injectable()
export class CandlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findCandles(params: FindCandlesParams): Promise<CandleResponse[]> {
    const symbolCode = params.symbol?.trim().toUpperCase();
    const timeframeCode = params.timeframe?.trim();
    const limit = this.parseLimit(params.limit);

    if (!symbolCode) {
      throw new BadRequestException('symbol query param is required.');
    }

    if (!timeframeCode) {
      throw new BadRequestException('timeframe query param is required.');
    }

    const symbol = await this.prisma.symbols.findFirst({
      where: {
        symbol: symbolCode,
        is_active: true,
      },
    });

    if (!symbol) {
      throw new BadRequestException(`Symbol ${symbolCode} was not found.`);
    }

    const timeframe = await this.prisma.timeframes.findFirst({
      where: {
        code: timeframeCode,
        is_active: true,
      },
    });

    if (!timeframe) {
      throw new BadRequestException(
        `Timeframe ${timeframeCode} was not found.`,
      );
    }

    const candles = await this.prisma.candles.findMany({
      where: {
        symbol_id: symbol.id,
        timeframe_id: timeframe.id,
        is_closed: true,
      },
      orderBy: {
        close_time: 'desc',
      },
      take: limit,
    });

    return candles.reverse().map((candle): CandleResponse => {
      return {
        id: candle.id,
        symbol: symbol.symbol,
        timeframe: timeframe.code,
        openTime: candle.open_time.toISOString(),
        closeTime: candle.close_time.toISOString(),
        open: candle.open.toString(),
        high: candle.high.toString(),
        low: candle.low.toString(),
        close: candle.close.toString(),
        volume: candle.volume.toString(),
        source: candle.source,
        isClosed: candle.is_closed,
      };
    });
  }

  private parseLimit(rawLimit: string | undefined): number {
    if (!rawLimit) {
      return 100;
    }

    const parsedLimit = Number(rawLimit);

    if (!Number.isInteger(parsedLimit)) {
      throw new BadRequestException('limit must be an integer.');
    }

    if (parsedLimit < 1) {
      throw new BadRequestException('limit must be greater than 0.');
    }

    if (parsedLimit > 500) {
      throw new BadRequestException('limit cannot be greater than 500.');
    }

    return parsedLimit;
  }
}
