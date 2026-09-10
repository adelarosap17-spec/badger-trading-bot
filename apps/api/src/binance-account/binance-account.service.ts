import { createHmac } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BinanceAccountInfoResponse,
  BinanceTestnetBalanceResponse,
} from './binance-account.types';

@Injectable()
export class BinanceAccountService {
  constructor(private readonly configService: ConfigService) {}

  async getTestnetBalance(): Promise<BinanceTestnetBalanceResponse> {
    const accountInfo =
      await this.signedGet<BinanceAccountInfoResponse>('/v3/account');

    const balances = accountInfo.balances.filter((balance) => {
      const free = Number(balance.free);
      const locked = Number(balance.locked);

      return free > 0 || locked > 0;
    });

    return {
      mode: 'testnet',
      accountType: accountInfo.accountType,
      canTrade: accountInfo.canTrade,
      balances,
    };
  }

  private async signedGet<TResponse>(
    path: string,
    params: Record<string, string | number> = {},
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
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Binance testnet request failed: ${body}`);
    }

    return (await response.json()) as TResponse;
  }
}