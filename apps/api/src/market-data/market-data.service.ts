import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type MarketSymbolResponse = {
  id: string;
  symbol: string;
  displaySymbol: string;
  marketType: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  minNotional: string | null;
  isActive: boolean;
};

export type MarketTimeframeResponse = {
  id: string;
  code: string;
  label: string;
  durationSeconds: number;
  isActive: boolean;
};

export type MarketDataSummaryResponse = {
  symbol: string;
  timeframe: string;
  lastPrice: string;
  spread: string;
  lastCandleClose: string;
  status: 'synced' | 'pending' | 'error';
};

@Injectable()
export class MarketDataService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveSymbols(): Promise<MarketSymbolResponse[]> {
    const symbols = await this.prisma.symbols.findMany({
      where: {
        is_active: true,
      },
      orderBy: [
        {
          base_asset: 'asc',
        },
        {
          quote_asset: 'asc',
        },
      ],
    });

    return symbols.map((symbol) => ({
      id: symbol.id,
      symbol: symbol.symbol,
      displaySymbol: symbol.display_symbol,
      marketType: symbol.market_type,
      baseAsset: symbol.base_asset,
      quoteAsset: symbol.quote_asset,
      pricePrecision: symbol.price_precision,
      quantityPrecision: symbol.quantity_precision,
      minNotional: symbol.min_notional?.toString() ?? null,
      isActive: symbol.is_active,
    }));
  }

  async findActiveTimeframes(): Promise<MarketTimeframeResponse[]> {
    const timeframes = await this.prisma.timeframes.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        duration_seconds: 'asc',
      },
    });

    return timeframes.map((timeframe) => ({
      id: timeframe.id,
      code: timeframe.code,
      label: timeframe.label,
      durationSeconds: timeframe.duration_seconds,
      isActive: timeframe.is_active,
    }));
  }

  async findMarketDataSummaries(): Promise<MarketDataSummaryResponse[]> {
    const symbols = await this.prisma.symbols.findMany({
      where: {
        is_active: true,
      },
      orderBy: [
        {
          base_asset: 'asc',
        },
        {
          quote_asset: 'asc',
        },
      ],
    });

    const timeframes = await this.prisma.timeframes.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        duration_seconds: 'asc',
      },
    });

    const summaries = await Promise.all(
      symbols.flatMap((symbol) =>
        timeframes.map(
          async (timeframe): Promise<MarketDataSummaryResponse> => {
            const lastCandle = await this.prisma.candles.findFirst({
              where: {
                symbol_id: symbol.id,
                timeframe_id: timeframe.id,
                is_closed: true,
              },
              orderBy: {
                close_time: 'desc',
              },
            });

            if (!lastCandle) {
              return {
                symbol: symbol.display_symbol,
                timeframe: timeframe.code,
                lastPrice: 'Waiting for sync',
                spread: 'N/A',
                lastCandleClose: 'N/A',
                status: 'pending',
              };
            }

            const closePrice = Number(lastCandle.close).toLocaleString(
              'en-US',
              {
                minimumFractionDigits: symbol.price_precision,
                maximumFractionDigits: symbol.price_precision,
              },
            );

            return {
              symbol: symbol.display_symbol,
              timeframe: timeframe.code,
              lastPrice: `${closePrice} ${symbol.quote_asset}`,
              spread: '0.012%',
              lastCandleClose: `${closePrice} ${symbol.quote_asset}`,
              status: 'synced',
            };
          },
        ),
      ),
    );

    return summaries;
  }
}
