import { useEffect, useState } from "react";
import { MetricSummaryCard } from "../components/MetricSummaryCard";
import { StrategyMetricCard } from "../components/StrategyMetricCard";
import { fetchMetrics } from "../service/metrics.service";
import type { MetricsResponse } from "../types/metric.types";

export function MetricsPage() {
   const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadMetrics(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const response = await fetchMetrics();

            if (!isMounted) {
               return;
            }

            setMetrics(response);
         } catch (error) {
            if (!isMounted) {
               return;
            }

            setErrorMessage(
               error instanceof Error
                  ? error.message
                  : "No se pudieron cargar las métricas.",
            );
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadMetrics();

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <section>
         <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
               Metrics
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
               Performance Metrics
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
               Métricas principales para evaluar estrategias, operaciones paper,
               rentabilidad y calidad del sistema.
            </p>
         </div>

         {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               Cargando métricas reales desde PostgreSQL...
            </div>
         ) : null}

         {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
               {errorMessage}
            </div>
         ) : null}

         {!isLoading && !errorMessage && metrics ? (
            <>
               <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {metrics.summaries.map((metric) => (
                     <MetricSummaryCard
                        key={metric.id}
                        id={metric.id}
                        label={metric.label}
                        value={metric.value}
                        change={metric.change}
                        trend={metric.trend}
                     />
                  ))}
               </div>

               <div className="mt-6 grid gap-4">
                  {metrics.strategies.length === 0 ? (
                     <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                        No hay métricas por estrategia todavía.
                     </div>
                  ) : (
                     metrics.strategies.map((strategy) => (
                        <StrategyMetricCard
                           key={strategy.id}
                           id={strategy.id}
                           strategyName={strategy.strategyName}
                           symbol={strategy.symbol}
                           timeframe={strategy.timeframe}
                           totalTrades={strategy.totalTrades}
                           winRate={strategy.winRate}
                           profitFactor={strategy.profitFactor}
                           maxDrawdown={strategy.maxDrawdown}
                           netPnl={strategy.netPnl}
                           expectancy={strategy.expectancy}
                        />
                     ))
                  )}
               </div>
            </>
         ) : null}
      </section>
   );
}