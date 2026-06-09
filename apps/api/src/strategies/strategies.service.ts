import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  SavedStrategySignalResponse,
  StrategyDecision,
  StrategyEvaluationResponse,
} from './strategy.types';

type EvaluateStrategyParams = {
  symbol?: string;
  timeframe?: string;
  limit?: string;
};

type StrategyEvaluationInternalResult = StrategyEvaluationResponse & {
  symbolId: string;
  timeframeId: string;
  candleId: string | null;
  latestCloseValue: number | null;
};

@Injectable()
export class StrategiesService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateStrategy(
    params: EvaluateStrategyParams,
  ): Promise<StrategyEvaluationResponse> {
    const evaluation = await this.evaluateStrategyInternal(params);

    return this.toPublicEvaluation(evaluation);
  }

  async evaluateAndSaveSignal(
    params: EvaluateStrategyParams,
  ): Promise<SavedStrategySignalResponse> {
    const evaluation = await this.evaluateStrategyInternal(params);

    const strategyInstance = await this.findOrCreateStrategyInstance({
      symbolId: evaluation.symbolId,
      timeframeId: evaluation.timeframeId,
      symbol: evaluation.symbol,
      timeframe: evaluation.timeframe,
    });

    const signal = await this.prisma.signals.create({
      data: {
        strategy_instance_id: strategyInstance.id,
        symbol_id: evaluation.symbolId,
        timeframe_id: evaluation.timeframeId,
        candle_id: evaluation.candleId,
        type: evaluation.decision,
        status: this.getSignalStatus(evaluation.decision),
        price: evaluation.latestCloseValue,
        reason: evaluation.reason,
        indicators_snapshot: {
          ema9: evaluation.ema9,
          ema21: evaluation.ema21,
          rsi14: evaluation.rsi14,
          latestClose: evaluation.latestClose,
          candleCount: evaluation.candleCount,
        },
        spread_percent: null,
      },
    });

    return {
      ...this.toPublicEvaluation(evaluation),
      signalId: signal.id,
      signalStatus: signal.status,
      savedAt: signal.created_at.toISOString(),
    };
  }

  private async evaluateStrategyInternal(
    params: EvaluateStrategyParams,
  ): Promise<StrategyEvaluationInternalResult> {
    const symbolCode = this.parseSymbol(params.symbol);
    const timeframeCode = this.parseTimeframe(params.timeframe);
    const limit = this.parseLimit(params.limit);

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
    const latestCandle = orderedCandles.at(-1);

    if (latestClose === undefined) {
      return {
        symbolId: symbol.id,
        timeframeId: timeframe.id,
        candleId: null,
        symbol: symbol.symbol,
        timeframe: timeframe.code,
        strategyName: 'EMA RSI Crossover',
        candleCount: closes.length,
        latestClose: 'N/A',
        latestCloseValue: null,
        ema9: null,
        ema21: null,
        rsi14: null,
        decision: 'hold',
        reason: 'No hay velas cerradas suficientes para evaluar la estrategia.',
        evaluatedAt: new Date().toISOString(),
      };
    }

    const ema9 = this.calculateEma(closes, 9);
    const ema21 = this.calculateEma(closes, 21);
    const rsi14 = this.calculateRsi(closes, 14);

    const evaluation = this.evaluateEmaRsiCrossover({
      ema9,
      ema21,
      rsi14,
    });

    return {
      symbolId: symbol.id,
      timeframeId: timeframe.id,
      candleId: latestCandle?.id ?? null,
      symbol: symbol.symbol,
      timeframe: timeframe.code,
      strategyName: 'EMA RSI Crossover',
      candleCount: closes.length,
      latestClose: this.formatNumber(latestClose, symbol.price_precision),
      latestCloseValue: latestClose,
      ema9: this.formatNullableNumber(ema9, symbol.price_precision),
      ema21: this.formatNullableNumber(ema21, symbol.price_precision),
      rsi14: this.formatNullableNumber(rsi14, 2),
      decision: evaluation.decision,
      reason: evaluation.reason,
      evaluatedAt: new Date().toISOString(),
    };
  }

  private async findOrCreateStrategyInstance(params: {
    symbolId: string;
    timeframeId: string;
    symbol: string;
    timeframe: string;
  }) {
    const strategyDefinition = await this.prisma.strategy_definitions.findFirst(
      {
        where: {
          code: 'EMA_RSI_CROSSOVER',
          is_active: true,
        },
      },
    );

    if (!strategyDefinition) {
      throw new BadRequestException(
        'Strategy definition EMA_RSI_CROSSOVER was not found.',
      );
    }

    const existingInstance = await this.prisma.strategy_instances.findFirst({
      where: {
        strategy_definition_id: strategyDefinition.id,
        symbol_id: params.symbolId,
        timeframe_id: params.timeframeId,
        mode: 'paper',
      },
    });

    if (existingInstance) {
      return existingInstance;
    }

    return this.prisma.strategy_instances.create({
      data: {
        strategy_definition_id: strategyDefinition.id,
        symbol_id: params.symbolId,
        timeframe_id: params.timeframeId,
        name: `${strategyDefinition.name} - ${params.symbol} - ${params.timeframe}`,
        mode: 'paper',
        status: 'running',
        settings: {
          fastEmaPeriod: 9,
          slowEmaPeriod: 21,
          rsiPeriod: 14,
          rsiMin: 35,
          rsiMax: 70,
        },
        risk_settings: {
          riskPerTradePercent: 1,
          dailyLossLimitPercent: 3,
          dailyProfitTargetPercent: 5,
        },
        capital_allocated: 100,
        is_active: true,
      },
    });
  }

  private getSignalStatus(decision: StrategyDecision): string {
    if (decision === 'hold') {
      return 'ignored';
    }

    return 'generated';
  }

  private toPublicEvaluation(
    evaluation: StrategyEvaluationInternalResult,
  ): StrategyEvaluationResponse {
    return {
      symbol: evaluation.symbol,
      timeframe: evaluation.timeframe,
      strategyName: evaluation.strategyName,
      candleCount: evaluation.candleCount,
      latestClose: evaluation.latestClose,
      ema9: evaluation.ema9,
      ema21: evaluation.ema21,
      rsi14: evaluation.rsi14,
      decision: evaluation.decision,
      reason: evaluation.reason,
      evaluatedAt: evaluation.evaluatedAt,
    };
  }

  private evaluateEmaRsiCrossover(params: {
    ema9: number | null;
    ema21: number | null;
    rsi14: number | null;
  }): {
    decision: StrategyDecision;
    reason: string;
  } {
    if (
      params.ema9 === null ||
      params.ema21 === null ||
      params.rsi14 === null
    ) {
      return {
        decision: 'hold',
        reason:
          'No hay datos suficientes para calcular EMA 9, EMA 21 y RSI 14 de forma confiable.',
      };
    }

    if (
      params.ema9 > params.ema21 &&
      params.rsi14 >= 35 &&
      params.rsi14 <= 70
    ) {
      return {
        decision: 'buy',
        reason:
          'EMA 9 está por encima de EMA 21 y RSI 14 está dentro del rango operativo 35-70.',
      };
    }

    if (params.ema9 < params.ema21) {
      return {
        decision: 'close_long',
        reason:
          'EMA 9 está por debajo de EMA 21, lo que indica pérdida de momentum alcista.',
      };
    }

    if (params.rsi14 > 70) {
      return {
        decision: 'hold',
        reason:
          'RSI 14 está por encima de 70, indicando posible sobrecompra. Se evita entrada nueva.',
      };
    }

    if (params.rsi14 < 35) {
      return {
        decision: 'hold',
        reason:
          'RSI 14 está por debajo de 35, indicando debilidad o posible sobreventa. Se espera confirmación.',
      };
    }

    return {
      decision: 'hold',
      reason:
        'Las condiciones actuales no cumplen una señal clara de entrada o salida.',
    };
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

  private parseSymbol(rawSymbol: string | undefined): string {
    const symbol = rawSymbol?.trim().toUpperCase();

    if (!symbol) {
      throw new BadRequestException('symbol query param is required.');
    }

    return symbol;
  }

  private parseTimeframe(rawTimeframe: string | undefined): string {
    const timeframe = rawTimeframe?.trim();

    if (!timeframe) {
      throw new BadRequestException('timeframe query param is required.');
    }

    return timeframe;
  }

  private parseLimit(rawLimit: string | undefined): number {
    if (!rawLimit) {
      return 100;
    }

    const limit = Number(rawLimit);

    if (!Number.isInteger(limit)) {
      throw new BadRequestException('limit must be an integer.');
    }

    if (limit < 21) {
      throw new BadRequestException('limit must be at least 21.');
    }

    if (limit > 500) {
      throw new BadRequestException('limit cannot be greater than 500.');
    }

    return limit;
  }

  private formatNullableNumber(
    value: number | null,
    fractionDigits: number,
  ): string | null {
    if (value === null) {
      return null;
    }

    return this.formatNumber(value, fractionDigits);
  }

  private formatNumber(value: number, fractionDigits: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
}
