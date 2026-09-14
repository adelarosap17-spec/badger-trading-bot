import { createHmac } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { ExchangeRiskService } from '../exchange-risk/exchange-risk.service';
import {
  BinanceOrderResponse,
  BinanceTestnetMarketBuyRequest,
  BinanceTestnetMarketBuyResponse,
  BinanceTestnetMarketSellRequest,
  BinanceTestnetMarketSellResponse,
  ExchangeOrderSummaryResponse,
} from './binance-orders.types';

type ExchangeOrderRow = {
  id: string;
  exchange: string;
  mode: string;
  symbol: string;
  side: string;
  type: string;
  status: string;
  quoteOrderQty: unknown;
  executedQty: unknown;
  cumulativeQuoteQty: unknown;
  averagePrice: unknown;
  externalOrderId: string;
  externalClientOrderId: string | null;
  createdAt: Date;
};

@Injectable()
export class BinanceOrdersService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly exchangeRiskService: ExchangeRiskService,
  ) {}

  async createTestnetMarketBuy(
    request: BinanceTestnetMarketBuyRequest,
  ): Promise<BinanceTestnetMarketBuyResponse> {
    const symbol = request.symbol.trim().toUpperCase();
    const quoteOrderQty = request.quoteOrderQty.trim();

    const riskResult = await this.exchangeRiskService.evaluateTestnetMarketBuy({
      symbol,
      quoteOrderQty,
    });

    if (riskResult.decision !== 'approved') {
      throw new BadRequestException({
        message: 'Exchange risk guard rejected the market buy.',
        reasons: riskResult.reasons,
        checks: riskResult.checks,
        limits: riskResult.limits,
        currentState: riskResult.currentState,
      });
    }

    const order = await this.signedPost<BinanceOrderResponse>('/v3/order', {
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty,
      newOrderRespType: 'FULL',
    });

    const exchangeOrderId = await this.saveExchangeOrder({
      mode: 'testnet',
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quoteOrderQty,
      order,
    });

    return {
      mode: 'testnet',
      symbol,
      quoteOrderQty,
      riskDecision: 'approved',
      exchangeOrderId,
      order,
    };
  }

  async createTestnetMarketSell(
    request: BinanceTestnetMarketSellRequest,
  ): Promise<BinanceTestnetMarketSellResponse> {
    const symbol = request.symbol.trim().toUpperCase();
    const quantity = request.quantity.trim();

    this.validateMarketSellRequest({ symbol, quantity });

    const order = await this.signedPost<BinanceOrderResponse>('/v3/order', {
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity,
      newOrderRespType: 'FULL',
    });

    const exchangeOrderId = await this.saveExchangeOrder({
      mode: 'testnet',
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quoteOrderQty: null,
      order,
    });

    return {
      mode: 'testnet',
      symbol,
      quantity,
      exchangeOrderId,
      order,
    };
  }

  async findRecentTestnetOrders(): Promise<ExchangeOrderSummaryResponse[]> {
    const rows = await this.prisma.$queryRaw<ExchangeOrderRow[]>`
      select
        id,
        exchange,
        mode,
        symbol,
        side,
        type,
        status,
        quote_order_qty as "quoteOrderQty",
        executed_qty as "executedQty",
        cumulative_quote_qty as "cumulativeQuoteQty",
        average_price as "averagePrice",
        external_order_id as "externalOrderId",
        external_client_order_id as "externalClientOrderId",
        created_at as "createdAt"
      from exchange_orders
      where exchange = 'binance'
        and mode = 'testnet'
      order by created_at desc
      limit 25
    `;

    return rows.map((row) => ({
      id: row.id,
      exchange: row.exchange,
      mode: row.mode,
      symbol: row.symbol,
      side: row.side,
      type: row.type,
      status: row.status,
      quoteOrderQty: this.toNullableString(row.quoteOrderQty),
      executedQty: this.toNullableString(row.executedQty),
      cumulativeQuoteQty: this.toNullableString(row.cumulativeQuoteQty),
      averagePrice: this.toNullableString(row.averagePrice),
      externalOrderId: row.externalOrderId,
      externalClientOrderId: row.externalClientOrderId,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private async saveExchangeOrder(params: {
    mode: 'testnet';
    symbol: string;
    side: string;
    type: string;
    quoteOrderQty: string | null;
    order: BinanceOrderResponse;
  }): Promise<string> {
    const averagePrice = this.calculateAveragePrice(params.order);

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      insert into exchange_orders (
        exchange,
        mode,
        symbol,
        side,
        type,
        status,
        quote_order_qty,
        executed_qty,
        cumulative_quote_qty,
        average_price,
        external_order_id,
        external_client_order_id,
        raw_response
      )
      values (
        'binance',
        ${params.mode},
        ${params.symbol},
        ${params.side},
        ${params.type},
        ${params.order.status},
        ${params.quoteOrderQty}::numeric,
        ${params.order.executedQty}::numeric,
        ${params.order.cummulativeQuoteQty}::numeric,
        ${averagePrice}::numeric,
        ${String(params.order.orderId)},
        ${params.order.clientOrderId},
        ${JSON.stringify(params.order)}::jsonb
      )
      returning id
    `;

    return rows[0].id;
  }

  private calculateAveragePrice(order: BinanceOrderResponse): string {
    const executedQty = Number(order.executedQty);
    const cumulativeQuoteQty = Number(order.cummulativeQuoteQty);

    if (
      !Number.isFinite(executedQty) ||
      !Number.isFinite(cumulativeQuoteQty) ||
      executedQty <= 0
    ) {
      return '0';
    }

    return (cumulativeQuoteQty / executedQty).toString();
  }

  private validateMarketSellRequest(
    request: BinanceTestnetMarketSellRequest,
  ): void {
    if (!request.symbol) {
      throw new BadRequestException('symbol is required.');
    }

    if (!/^[A-Z0-9]{5,20}$/.test(request.symbol)) {
      throw new BadRequestException('symbol format is invalid.');
    }

    const quantity = Number(request.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be greater than zero.');
    }

    if (quantity > 1) {
      throw new BadRequestException(
        'quantity cannot be greater than 1 unit in this test endpoint.',
      );
    }
  }

  private async signedPost<TResponse>(
    path: string,
    params: Record<string, string | number>,
  ): Promise<TResponse> {
    const apiKey = this.configService.get<string>('BINANCE_TESTNET_API_KEY');
    const apiSecret = this.configService.get<string>(
      'BINANCE_TESTNET_API_SECRET',
    );
    const baseUrl =
      this.configService.get<string>('BINANCE_TESTNET_BASE_URL') ??
      'https://testnet.binance.vision/api';

    if (!apiKey || !apiSecret) {
      throw new Error('Binance testnet API credentials are missing.');
    }

    const timestamp = Date.now();

    const queryParams = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)]),
      ),
      timestamp: String(timestamp),
      recvWindow: '5000',
    });

    const signature = createHmac('sha256', apiSecret)
      .update(queryParams.toString())
      .digest('hex');

    queryParams.set('signature', signature);

    const response = await fetch(`${baseUrl}${path}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Binance testnet order failed: ${body}`);
    }

    return (await response.json()) as TResponse;
  }

  private toNullableString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return value.toString();
  }
}