import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BinanceAccountService } from '../binance-account/binance-account.service';
import { ExchangePositionsService } from '../exchange-positions/exchange-positions.service';
import { PrismaService } from '../database/prisma.service';
import {
  ExchangeRiskMarketBuyRequest,
  ExchangeRiskMarketBuyResponse,
} from './exchange-risk.types';

type CountRow = {
  count: bigint;
};

@Injectable()
export class ExchangeRiskService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly binanceAccountService: BinanceAccountService,
    private readonly exchangePositionsService: ExchangePositionsService,
  ) {}

  async evaluateTestnetMarketBuy(
    request: ExchangeRiskMarketBuyRequest,
  ): Promise<ExchangeRiskMarketBuyResponse> {
    const symbol = request.symbol.trim().toUpperCase();
    const quoteOrderQty = request.quoteOrderQty.trim();

    const maxQuoteOrderQty = this.getMaxQuoteOrderQty();
    const maxDailyBuyOrders = this.getMaxDailyBuyOrders();
    const blockDuplicateOpenSymbol = this.getBlockDuplicateOpenSymbol();

    const symbolValid = /^[A-Z0-9]{5,20}$/.test(symbol);
    const numericQuoteOrderQty = Number(quoteOrderQty);
    const quoteOrderQtyValid =
      Number.isFinite(numericQuoteOrderQty) && numericQuoteOrderQty > 0;
    const quoteOrderQtyWithinLimit =
      quoteOrderQtyValid && numericQuoteOrderQty <= maxQuoteOrderQty;

    const balance = await this.binanceAccountService.getTestnetBalance();
    const availableUsdt = this.findAvailableAssetBalance(balance.balances, 'USDT');

    const positions =
      await this.exchangePositionsService.findTestnetPositions();

    const openPositionExists = positions.some(
      (position) => position.symbol === symbol && position.status === 'open',
    );

    const todayBuyOrders = await this.countTodayBuyOrders();

    const hasEnoughBalance =
      quoteOrderQtyValid && availableUsdt >= numericQuoteOrderQty;

    const duplicateOpenPositionAllowed =
      !blockDuplicateOpenSymbol || !openPositionExists;

    const dailyBuyLimitAllowed = todayBuyOrders < maxDailyBuyOrders;

    const reasons: string[] = [];

    if (!symbolValid) {
      reasons.push('Symbol format is invalid.');
    }

    if (!quoteOrderQtyValid) {
      reasons.push('quoteOrderQty must be greater than zero.');
    }

    if (!quoteOrderQtyWithinLimit) {
      reasons.push(
        `quoteOrderQty cannot be greater than ${maxQuoteOrderQty} USDT.`,
      );
    }

    if (!hasEnoughBalance) {
      reasons.push('Insufficient USDT balance.');
    }

    if (!duplicateOpenPositionAllowed) {
      reasons.push(`There is already an open testnet position for ${symbol}.`);
    }

    if (!dailyBuyLimitAllowed) {
      reasons.push(
        `Daily buy order limit reached. Limit: ${maxDailyBuyOrders}.`,
      );
    }

    return {
      decision: reasons.length === 0 ? 'approved' : 'rejected',
      symbol,
      quoteOrderQty,
      reasons,
      checks: {
        symbolValid,
        quoteOrderQtyValid,
        quoteOrderQtyWithinLimit,
        hasEnoughBalance,
        duplicateOpenPositionAllowed,
        dailyBuyLimitAllowed,
      },
      limits: {
        maxQuoteOrderQty: maxQuoteOrderQty.toString(),
        maxDailyBuyOrders,
      },
      currentState: {
        availableUsdt: availableUsdt.toString(),
        openPositionExists,
        todayBuyOrders,
      },
    };
  }

  private async countTodayBuyOrders(): Promise<number> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      select count(*) as count
      from exchange_orders
      where exchange = 'binance'
        and mode = 'testnet'
        and side = 'BUY'
        and status = 'FILLED'
        and created_at >= date_trunc('day', now())
    `;

    return Number(rows[0]?.count ?? 0);
  }

  private findAvailableAssetBalance(
    balances: { asset: string; free: string; locked: string }[],
    asset: string,
  ): number {
    const balance = balances.find((item) => item.asset === asset);

    if (!balance) {
      return 0;
    }

    const free = Number(balance.free);

    if (!Number.isFinite(free)) {
      return 0;
    }

    return free;
  }

  private getMaxQuoteOrderQty(): number {
    const value = Number(
      this.configService.get<string>('EXCHANGE_RISK_MAX_QUOTE_ORDER_QTY') ??
        '10',
    );

    if (!Number.isFinite(value) || value <= 0) {
      return 10;
    }

    return value;
  }

  private getMaxDailyBuyOrders(): number {
    const value = Number(
      this.configService.get<string>('EXCHANGE_RISK_MAX_DAILY_BUY_ORDERS') ??
        '5',
    );

    if (!Number.isInteger(value) || value <= 0) {
      return 5;
    }

    return value;
  }

  private getBlockDuplicateOpenSymbol(): boolean {
    return (
      this.configService.get<string>(
        'EXCHANGE_RISK_BLOCK_DUPLICATE_OPEN_SYMBOL',
      ) ?? 'true'
    ) === 'true';
  }
}