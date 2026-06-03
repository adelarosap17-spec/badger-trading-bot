import type {
   MarketSyncStatus,
   MarketSymbolSummary,
} from "../types/market-data.types";

type MarketSymbolCardProps = MarketSymbolSummary;

const statusLabelByStatus: Record<MarketSyncStatus, string> = {
   synced: "Synced",
   pending: "Pending",
   error: "Error",
};

const statusClassByStatus: Record<MarketSyncStatus, string> = {
   synced: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
   pending: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
   error: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
};

export function MarketSymbolCard({
   symbol,
   timeframe,
   lastPrice,
   spread,
   lastCandleClose,
   status,
}: MarketSymbolCardProps) {
   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
         <div className="flex items-start justify-between gap-4">
            <div>
               <p className="text-sm text-slate-400">{timeframe}</p>

               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {symbol}
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

         <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Last Price
               </p>
               <p className="mt-2 text-lg font-semibold text-white">{lastPrice}</p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Spread
               </p>
               <p className="mt-2 text-lg font-semibold text-white">{spread}</p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Last Candle Close
               </p>
               <p className="mt-2 text-lg font-semibold text-white">
                  {lastCandleClose}
               </p>
            </div>
         </div>
      </article>
   );
}