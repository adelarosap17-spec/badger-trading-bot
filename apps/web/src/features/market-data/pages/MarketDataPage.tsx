import { useEffect, useState } from "react";
import { IndicatorSummaryCard } from "../components/IndicatorSummaryCard";
import { MarketSymbolCard } from "../components/MarketSymbolCard";
import {
   fetchIndicatorSummary,
   fetchMarketDataSummaries,
   fetchMarketSymbols,
   fetchMarketTimeframes,
} from "../services/market-data.service";
import type {
   IndicatorSummaryResponse,
   MarketSymbolSummary,
} from "../types/market-data.types";

export function MarketDataPage() {
   const [marketSymbolSummaries, setMarketSymbolSummaries] = useState<
      MarketSymbolSummary[]
   >([]);
   const [indicatorSummaries, setIndicatorSummaries] = useState<
      IndicatorSummaryResponse[]
   >([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadMarketData(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const [marketSummaries, symbols, timeframes] = await Promise.all([
               fetchMarketDataSummaries(),
               fetchMarketSymbols(),
               fetchMarketTimeframes(),
            ]);

            const indicators = await Promise.all(
               symbols.flatMap((symbol) =>
                  timeframes.map((timeframe) =>
                     fetchIndicatorSummary({
                        symbol: symbol.symbol,
                        timeframe: timeframe.code,
                     }),
                  ),
               ),
            );

            if (!isMounted) {
               return;
            }

            setMarketSymbolSummaries(marketSummaries);
            setIndicatorSummaries(indicators);
         } catch (error) {
            if (!isMounted) {
               return;
            }

            setErrorMessage(
               error instanceof Error
                  ? error.message
                  : "No se pudo cargar Market Data.",
            );
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadMarketData();

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <section>
         <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
               Market Data
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
               Market Data Monitor
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
               Resumen de símbolos, temporalidades, última vela cerrada e indicadores
               técnicos calculados desde PostgreSQL mediante NestJS.
            </p>
         </div>

         {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               Cargando datos de mercado e indicadores...
            </div>
         ) : null}

         {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
               {errorMessage}
            </div>
         ) : null}

         {!isLoading && !errorMessage ? (
            <div className="space-y-10">
               <section>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                     <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                           OHLCV
                        </p>

                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                           Latest Candle Summary
                        </h2>
                     </div>

                     <p className="text-sm text-slate-400">
                        Últimas velas cerradas sincronizadas desde Binance.
                     </p>
                  </div>

                  {marketSymbolSummaries.length === 0 ? (
                     <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                        No hay datos de mercado sincronizados.
                     </div>
                  ) : (
                     <div className="grid gap-4 xl:grid-cols-2">
                        {marketSymbolSummaries.map((item) => (
                           <MarketSymbolCard
                              key={`${item.symbol}-${item.timeframe}`}
                              symbol={item.symbol}
                              timeframe={item.timeframe}
                              lastPrice={item.lastPrice}
                              spread={item.spread}
                              lastCandleClose={item.lastCandleClose}
                              status={item.status}
                           />
                        ))}
                     </div>
                  )}
               </section>

               <section>
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                     <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                           Indicators
                        </p>

                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                           EMA / RSI Snapshot
                        </h2>
                     </div>

                     <p className="text-sm text-slate-400">
                        EMA 9, EMA 21 y RSI 14 calculados desde velas cerradas.
                     </p>
                  </div>

                  {indicatorSummaries.length === 0 ? (
                     <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                        No hay indicadores disponibles.
                     </div>
                  ) : (
                     <div className="grid gap-4 xl:grid-cols-2">
                        {indicatorSummaries.map((item) => (
                           <IndicatorSummaryCard
                              key={`${item.symbol}-${item.timeframe}`}
                              symbol={item.symbol}
                              timeframe={item.timeframe}
                              candleCount={item.candleCount}
                              latestClose={item.latestClose}
                              ema9={item.ema9}
                              ema21={item.ema21}
                              rsi14={item.rsi14}
                           />
                        ))}
                     </div>
                  )}
               </section>
            </div>
         ) : null}
      </section>
   );
}