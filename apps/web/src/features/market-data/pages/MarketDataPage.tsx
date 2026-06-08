import { useEffect, useState } from "react";
import { MarketSymbolCard } from "../components/MarketSymbolCard";
import { fetchMarketDataSummaries } from "../services/market-data.service";
import type { MarketSymbolSummary } from "../types/market-data.types";

export function MarketDataPage() {
   const [marketSymbolSummaries, setMarketSymbolSummaries] = useState<
      MarketSymbolSummary[]
   >([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadMarketDataSummaries(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const summaries = await fetchMarketDataSummaries();

            if (!isMounted) {
               return;
            }

            setMarketSymbolSummaries(summaries);
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

      void loadMarketDataSummaries();

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
               Resumen de símbolos, temporalidades y última vela cerrada cargada
               desde PostgreSQL mediante NestJS.
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
               No hay datos de mercado sincronizados.
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