import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ExchangePositionSummaryResponse } from './exchange-positions.types';

type ExchangePositionRow = {
  exchange: string;
  mode: string;
  symbol: string;
  boughtQuantity: unknown;
  soldQuantity: unknown;
  totalBuyQuote: unknown;
  totalSellQuote: unknown;
  lastPrice: unknown;
};

@Injectable()
export class ExchangePositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findTestnetPositions(): Promise<ExchangePositionSummaryResponse[]> {
    const rows = await this.prisma.$queryRaw<ExchangePositionRow[]>`
      with order_summary as (
        select
          exchange,
          mode,
          symbol,
          coalesce(sum(executed_qty) filter (where side = 'BUY'), 0) as bought_quantity,
          coalesce(sum(executed_qty) filter (where side = 'SELL'), 0) as sold_quantity,
          coalesce(sum(cumulative_quote_qty) filter (where side = 'BUY'), 0) as total_buy_quote,
          coalesce(sum(cumulative_quote_qty) filter (where side = 'SELL'), 0) as total_sell_quote
        from exchange_orders
        where exchange = 'binance'
          and mode = 'testnet'
          and status = 'FILLED'
        group by exchange, mode, symbol
      ),
      latest_prices as (
  select distinct on (s.symbol)
    s.symbol,
    c.close as last_price
  from symbols s
  join candles c on c.symbol_id = s.id
  order by s.symbol, c.open_time desc
)
      select
        os.exchange,
        os.mode,
        os.symbol,
        os.bought_quantity as "boughtQuantity",
        os.sold_quantity as "soldQuantity",
        os.total_buy_quote as "totalBuyQuote",
        os.total_sell_quote as "totalSellQuote",
        lp.last_price as "lastPrice"
      from order_summary os
      left join latest_prices lp on lp.symbol = os.symbol
      order by os.symbol asc
    `;

    return rows.map((row) => this.mapPosition(row));
  }

  private mapPosition(
    row: ExchangePositionRow,
  ): ExchangePositionSummaryResponse {
    const boughtQuantity = this.toNumber(row.boughtQuantity);
    const soldQuantity = this.toNumber(row.soldQuantity);
    const totalBuyQuote = this.toNumber(row.totalBuyQuote);
    const totalSellQuote = this.toNumber(row.totalSellQuote);
    const lastPrice = this.toNullableNumber(row.lastPrice);

    const netQuantity = boughtQuantity - soldQuantity;
    const averageBuyPrice =
      boughtQuantity > 0 ? totalBuyQuote / boughtQuantity : null;

    const estimatedValue =
      lastPrice !== null ? Math.max(netQuantity, 0) * lastPrice : null;

    const netCost =
      averageBuyPrice !== null ? Math.max(netQuantity, 0) * averageBuyPrice : 0;

    const estimatedPnl =
      estimatedValue !== null && averageBuyPrice !== null
        ? estimatedValue - netCost + totalSellQuote - this.getRealizedCost({
            soldQuantity,
            averageBuyPrice,
          })
        : null;

    const estimatedPnlPercent =
      estimatedPnl !== null && totalBuyQuote > 0
        ? (estimatedPnl / totalBuyQuote) * 100
        : null;

    return {
      exchange: row.exchange,
      mode: row.mode,
      symbol: row.symbol,
      baseAsset: this.resolveBaseAsset(row.symbol),
      quoteAsset: this.resolveQuoteAsset(row.symbol),
      boughtQuantity: this.formatDecimal(boughtQuantity, 12),
      soldQuantity: this.formatDecimal(soldQuantity, 12),
      netQuantity: this.formatDecimal(netQuantity, 12),
      totalBuyQuote: this.formatDecimal(totalBuyQuote, 12),
      totalSellQuote: this.formatDecimal(totalSellQuote, 12),
      averageBuyPrice:
        averageBuyPrice !== null ? this.formatDecimal(averageBuyPrice, 12) : null,
      lastPrice: lastPrice !== null ? this.formatDecimal(lastPrice, 12) : null,
      estimatedValue:
        estimatedValue !== null ? this.formatDecimal(estimatedValue, 12) : null,
      estimatedPnl:
        estimatedPnl !== null ? this.formatSignedDecimal(estimatedPnl, 12) : null,
      estimatedPnlPercent:
        estimatedPnlPercent !== null
          ? `${this.formatSignedDecimal(estimatedPnlPercent, 4)}%`
          : null,
      status: netQuantity > 0 ? 'open' : 'closed',
    };
  }

  private getRealizedCost(params: {
    soldQuantity: number;
    averageBuyPrice: number;
  }): number {
    return params.soldQuantity * params.averageBuyPrice;
  }

  private resolveBaseAsset(symbol: string): string {
    if (symbol.endsWith('USDT')) {
      return symbol.slice(0, -4);
    }

    return symbol;
  }

  private resolveQuoteAsset(symbol: string): string {
    if (symbol.endsWith('USDT')) {
      return 'USDT';
    }

    return 'UNKNOWN';
  }

  private toNumber(value: unknown): number {
    const numericValue = Number(value?.toString() ?? 0);

    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return numericValue;
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numericValue = Number(value.toString());

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return numericValue;
  }

  private formatDecimal(value: number, digits: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
    });
  }

  private formatSignedDecimal(value: number, digits: number): string {
    const prefix = value >= 0 ? '+' : '';

    return `${prefix}${this.formatDecimal(value, digits)}`;
  }
}