import type { IndicatorSummaryResponse } from "../types/market-data.types";

type IndicatorSummaryCardProps = IndicatorSummaryResponse;

function getRsiState(rsi14: string | null): {
   label: string;
   className: string;
} {
   if (!rsi14) {
      return {
         label: "No disponible",
         className: "text-slate-400",
      };
   }

   const rsiValue = Number(rsi14.replace(",", ""));

   if (Number.isNaN(rsiValue)) {
      return {
         label: "No disponible",
         className: "text-slate-400",
      };
   }

   if (rsiValue >= 70) {
      return {
         label: "Sobrecompra",
         className: "text-amber-300",
      };
   }

   if (rsiValue <= 30) {
      return {
         label: "Sobreventa",
         className: "text-rose-300",
      };
   }

   return {
      label: "Neutral",
      className: "text-emerald-300",
   };
}

function getTrendState(ema9: string | null, ema21: string | null): {
   label: string;
   className: string;
} {
   if (!ema9 || !ema21) {
      return {
         label: "Sin datos suficientes",
         className: "text-slate-400",
      };
   }

   const ema9Value = Number(ema9.replace(",", ""));
   const ema21Value = Number(ema21.replace(",", ""));

   if (Number.isNaN(ema9Value) || Number.isNaN(ema21Value)) {
      return {
         label: "Sin datos suficientes",
         className: "text-slate-400",
      };
   }

   if (ema9Value > ema21Value) {
      return {
         label: "Sesgo alcista",
         className: "text-emerald-300",
      };
   }

   if (ema9Value < ema21Value) {
      return {
         label: "Sesgo bajista",
         className: "text-rose-300",
      };
   }

   return {
      label: "Cruce neutro",
      className: "text-slate-300",
   };
}

export function IndicatorSummaryCard({
   symbol,
   timeframe,
   candleCount,
   latestClose,
   ema9,
   ema21,
   rsi14,
}: IndicatorSummaryCardProps) {
   const rsiState = getRsiState(rsi14);
   const trendState = getTrendState(ema9, ema21);

   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
         <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
               <p className="text-sm text-slate-400">{timeframe}</p>

               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {symbol}
               </h2>
            </div>

            <span
               className={[
                  "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/10",
                  trendState.className,
               ].join(" ")}
            >
               {trendState.label}
            </span>
         </div>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Latest Close
               </p>

               <p className="mt-2 text-base font-semibold text-white">
                  {latestClose}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  EMA 9
               </p>

               <p className="mt-2 text-base font-semibold text-white">
                  {ema9 ?? "N/A"}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  EMA 21
               </p>

               <p className="mt-2 text-base font-semibold text-white">
                  {ema21 ?? "N/A"}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  RSI 14
               </p>

               <p className="mt-2 text-base font-semibold text-white">
                  {rsi14 ?? "N/A"}
               </p>

               <p className={["mt-1 text-xs font-semibold", rsiState.className].join(" ")}>
                  {rsiState.label}
               </p>
            </div>
         </div>

         <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
               Candles Used
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
               {candleCount} velas cerradas usadas para calcular EMA 9, EMA 21 y RSI
               14.
            </p>
         </div>
      </article>
   );
}