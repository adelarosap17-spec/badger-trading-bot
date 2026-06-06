import type { StrategyMetricSummary } from "../types/metric.types";

type StrategyMetricCardProps = StrategyMetricSummary;

export function StrategyMetricCard({
   strategyName,
   symbol,
   timeframe,
   totalTrades,
   winRate,
   profitFactor,
   maxDrawdown,
   netPnl,
   expectancy,
}: StrategyMetricCardProps) {
   const isProfit = netPnl.trim().startsWith("+");

   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
         <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm text-slate-400">
                  {symbol} · {timeframe}
               </p>

               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {strategyName}
               </h2>
            </div>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
               {totalTrades} trades
            </span>
         </div>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Win Rate
               </p>
               <p className="mt-2 text-base font-semibold text-white">{winRate}</p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Profit Factor
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {profitFactor}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Max Drawdown
               </p>
               <p className="mt-2 text-base font-semibold text-rose-300">
                  {maxDrawdown}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Net PnL
               </p>
               <p
                  className={[
                     "mt-2 text-base font-semibold",
                     isProfit ? "text-emerald-300" : "text-rose-300",
                  ].join(" ")}
               >
                  {netPnl}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Expectancy
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {expectancy}
               </p>
            </div>
         </div>
      </article>
   );
}