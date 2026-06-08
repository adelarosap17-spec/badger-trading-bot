import { useEffect, useMemo, useState } from "react";
import { MarketSymbolCard } from "../components/MarketSymbolCard";
import {
   fetchMarketSymbols,
   fetchMarketTimeframes,
} from "../services/market-data.service";
import type {
   MarketSymbolResponse,
   MarketSymbolSummary,
   MarketTimeframeResponse,
} from "../types/market-data.types";

export function MarketDataPage() {
   const [symbols, setSymbols] = useState<MarketSymbolResponse[]>([]);
   const [timeframes, setTimeframes] = useState<MarketTimeframeResponse[]>([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadMarketData(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const [symbolsResponse, timeframesResponse] = await Promise.all([
               fetchMarketSymbols(),
               fetchMarketTimeframes(),
            ]);

            if (!isMounted) {
               return;
            }

            setSymbols(symbolsResponse);
            setTimeframes(timeframesResponse);
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

   const marketSymbolSummaries = useMemo<MarketSymbolSummary[]>(() => {
      return symbols.flatMap((symbol) =>
         timeframes.map((timeframe) => ({
            symbol: symbol.displaySymbol,
            timeframe: timeframe.code,
            lastPrice: "Waiting for sync",
            spread: "N/A",
            lastCandleClose: "N/A",
            status: "pending",
         })),
      );
   }, [symbols, timeframes]);

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
               Símbolos y temporalidades cargados desde PostgreSQL mediante NestJS.
               Los precios, spread y velas se conectarán en el siguiente módulo.
            </p>
         </div>

         {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               Cargando datos de mercado...
            </div>
         ) : null}

         {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
               {errorMessage}
            </div>
         ) : null}

         {!isLoading && !errorMessage && marketSymbolSummaries.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               No hay símbolos o temporalidades activas configuradas.
            </div>
         ) : null}

         {!isLoading && !errorMessage && marketSymbolSummaries.length > 0 ? (
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
         ) : null}
      </section>
   );
}