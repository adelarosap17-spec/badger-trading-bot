import type {
   SignalStatus,
   SignalSummary,
   SignalType,
} from "../types/signal.types";

type SignalCardProps = SignalSummary;

const typeLabelByType: Record<SignalType, string> = {
   buy: "Buy",
   sell: "Sell",
   close_long: "Close Long",
   hold: "Hold",
};

const typeClassByType: Record<SignalType, string> = {
   buy: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
   sell: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
   close_long: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
   hold: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
};

const statusClassByStatus: Record<SignalStatus, string> = {
   generated: "text-cyan-300",
   approved: "text-emerald-300",
   rejected: "text-rose-300",
   executed: "text-emerald-300",
   ignored: "text-amber-300",
   expired: "text-slate-400",
};

export function SignalCard({
   symbol,
   timeframe,
   strategyName,
   type,
   status,
   price,
   rsi,
   emaFast,
   emaSlow,
   spread,
   reason,
   createdAt,
}: SignalCardProps) {
   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
         <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm text-slate-400">
                  {symbol} · {timeframe} · {strategyName}
               </p>

               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {typeLabelByType[type]} Signal
               </h2>
            </div>

            <div className="flex items-center gap-2">
               <span
                  className={[
                     "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                     typeClassByType[type],
                  ].join(" ")}
               >
                  {typeLabelByType[type]}
               </span>

               <span className={["text-xs font-semibold", statusClassByStatus[status]].join(" ")}>
                  {status.toUpperCase()}
               </span>
            </div>
         </div>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Price
               </p>
               <p className="mt-2 text-base font-semibold text-white">{price}</p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  RSI
               </p>
               <p className="mt-2 text-base font-semibold text-white">{rsi}</p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  EMA Fast
               </p>
               <p className="mt-2 text-base font-semibold text-white">{emaFast}</p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  EMA Slow
               </p>
               <p className="mt-2 text-base font-semibold text-white">{emaSlow}</p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Spread
               </p>
               <p className="mt-2 text-base font-semibold text-white">{spread}</p>
            </div>
         </div>

         <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
               Reason
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">{reason}</p>

            <p className="mt-3 text-xs text-slate-500">{createdAt}</p>
         </div>
      </article>
   );
}