import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type IndicatorSummaryResponse = {
  symbol: string;
  timeframe: string;
  candleCount: number;
  latestClose: string;
  ema9: string | null;
  ema21: string | null;
  rsi14: string | null;
};

type FindIndicatorSummaryParams = {
  symbol?: string;
  timeframe?: string;
  limit?: string;
};

@Injectable()
export class IndicatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findIndicatorSummary(
    params: FindIndicatorSummaryParams,
  ): Promise<IndicatorSummaryResponse> {
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

    const orderedCandles = candles.reverse();
    const closes = orderedCandles.map((candle) => Number(candle.close));
    const latestClose = closes.at(-1);

    return {
      symbol: symbol.symbol,
      timeframe: timeframe.code,
      candleCount: closes.length,
      latestClose:
        latestClose !== undefined
          ? this.formatPrice(latestClose, symbol.price_precision)
          : 'N/A',
      ema9: this.formatNullableNumber(
        this.calculateEma(closes, 9),
        symbol.price_precision,
      ),
      ema21: this.formatNullableNumber(
        this.calculateEma(closes, 21),
        symbol.price_precision,
      ),
      rsi14: this.formatNullableNumber(this.calculateRsi(closes, 14), 2),
    };
  }

  private parseLimit(rawLimit: string | undefined): number {
    if (!rawLimit) {
      return 100;
    }

    const parsedLimit = Number(rawLimit);

    if (!Number.isInteger(parsedLimit)) {
      throw new BadRequestException('limit must be an integer.');
    }

    if (parsedLimit < 21) {
      throw new BadRequestException('limit must be at least 21.');
    }

    if (parsedLimit > 500) {
      throw new BadRequestException('limit cannot be greater than 500.');
    }

    return parsedLimit;
  }

  private calculateEma(values: number[], period: number): number | null {
    if (values.length < period) {
      return null;
    }

    const multiplier = 2 / (period + 1);
    const initialValues = values.slice(0, period);
    const initialAverage =
      initialValues.reduce((sum, value) => sum + value, 0) / period;

    return values.slice(period).reduce((ema, value) => {
      return (value - ema) * multiplier + ema;
    }, initialAverage);
  }

  private calculateRsi(values: number[], period: number): number | null {
    if (values.length <= period) {
      return null;
    }

    const changes = values.slice(1).map((value, index) => {
      return value - values[index];
    });

    const initialChanges = changes.slice(0, period);

    let averageGain =
      initialChanges
        .filter((change) => change > 0)
        .reduce((sum, change) => sum + change, 0) / period;

    let averageLoss =
      Math.abs(
        initialChanges
          .filter((change) => change < 0)
          .reduce((sum, change) => sum + change, 0),
      ) / period;

    for (const change of changes.slice(period)) {
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      averageGain = (averageGain * (period - 1) + gain) / period;
      averageLoss = (averageLoss * (period - 1) + loss) / period;
    }

    if (averageLoss === 0) {
      return 100;
    }

    const relativeStrength = averageGain / averageLoss;

    return 100 - 100 / (1 + relativeStrength);
  }

  private formatNullableNumber(
    value: number | null,
    fractionDigits: number,
  ): string | null {
    if (value === null) {
      return null;
    }

    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }

  private formatPrice(value: number, fractionDigits: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
}
