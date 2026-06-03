import type {
   StrategyStatus,
   StrategySummary,
} from "../types/strategy.types";

type StrategyCardProps = StrategySummary;

const statusLabelByStatus: Record<StrategyStatus, string> = {
   running: "Running",
   paused: "Paused",
   stopped: "Stopped",
   error: "Error",
};

const statusClassByStatus: Record<StrategyStatus, string> = {
   running: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
   paused: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
   stopped: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
   error: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
};

export function StrategyCard({
   name,
   symbol,
   timeframe,
   mode,
   status,
   capitalAllocated,
   riskPerTrade,
   dailyLossLimit,
   dailyProfitTarget,
   fastEmaPeriod,
   slowEmaPeriod,
   rsiPeriod,
}: StrategyCardProps) {
   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
         <div className="flex items-start justify-between gap-4">
            <div>
               <p className="text-sm text-slate-400">
                  {symbol} · {timeframe} · {mode.toUpperCase()}
               </p>

               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {name}
               </h2>
            </div>

            <span
               className={[
                  "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  statusClassByStatus[status],
               ].join(" ")}
            >
               {statusLabelByStatus[status]}
            </span>
         </div>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Capital
               </p>
               <p className="mt-2 text-lg font-semibold text-white">
                  {capitalAllocated}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Risk / Trade
               </p>
               <p className="mt-2 text-lg font-semibold text-white">
                  {riskPerTrade}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Daily Stop
               </p>
               <p className="mt-2 text-lg font-semibold text-white">
                  {dailyLossLimit}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Daily Target
               </p>
               <p className="mt-2 text-lg font-semibold text-white">
                  {dailyProfitTarget}
               </p>
            </div>
         </div>

         <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
               Parameters
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
               <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
                  EMA Fast: {fastEmaPeriod}
               </span>

               <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
                  EMA Slow: {slowEmaPeriod}
               </span>

               <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300">
                  RSI: {rsiPeriod}
               </span>
            </div>
         </div>
      </article>
   );
}