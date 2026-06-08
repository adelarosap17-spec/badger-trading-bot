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
}
