import type {
   PositionCloseReason,
   PositionSide,
   PositionStatus,
   PositionSummary,
} from "../types/position.types";

type PositionCardProps = PositionSummary;

const sideClassBySide: Record<PositionSide, string> = {
   long: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
   short: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
};

const statusClassByStatus: Record<PositionStatus, string> = {
   open: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20",
   closed: "bg-slate-400/10 text-slate-300 ring-slate-400/20",
   cancelled: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
};

const closeReasonLabelByReason: Record<PositionCloseReason, string> = {
   take_profit: "Take Profit",
   stop_loss: "Stop Loss",
   strategy_signal: "Strategy Signal",
   manual_close: "Manual Close",
   risk_limit: "Risk Limit",
   cancelled: "Cancelled",
};

function getPnlClassName(netPnl: string): string {
   if (netPnl.trim().startsWith("+")) {
      return "text-emerald-300";
   }

   if (netPnl.trim().startsWith("-")) {
      return "text-rose-300";
   }

   return "text-slate-300";
}

export function PositionCard({
   symbol,
   timeframe,
   strategyName,
   side,
   status,
   entryPrice,
   exitPrice,
   quantity,
   notionalValue,
   stopLossPrice,
   takeProfitPrice,
   netPnl,
   netPnlPercent,
   feesPaid,
   openedAt,
   closedAt,
   closeReason,
}: PositionCardProps) {
   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
         <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm text-slate-400">
                  {symbol} • {timeframe} • {strategyName}
               </p>

               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {side.toUpperCase()} Position
               </h2>
            </div>

            <div className="flex items-center gap-2">
               <span
                  className={[
                     "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                     sideClassBySide[side],
                  ].join(" ")}
               >
                  {side.toUpperCase()}
               </span>

               <span
                  className={[
                     "rounded-full px-3 py-1 text-xs font-semibold ring-1",
                     statusClassByStatus[status],
                  ].join(" ")}
               >
                  {status.toUpperCase()}
               </span>
            </div>
         </div>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Entry
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {entryPrice}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Exit
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {exitPrice ?? "Open"}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Size
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {notionalValue}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Quantity
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {quantity}
               </p>
            </div>
         </div>

         <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Stop Loss
               </p>
               <p className="mt-2 text-sm font-semibold text-rose-300">
                  {stopLossPrice}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Take Profit
               </p>
               <p className="mt-2 text-sm font-semibold text-emerald-300">
                  {takeProfitPrice}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Net PnL
               </p>
               <p
                  className={[
                     "mt-2 text-sm font-semibold",
                     getPnlClassName(netPnl),
                  ].join(" ")}
               >
                  {netPnl} • {netPnlPercent}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Fees
               </p>
               <p className="mt-2 text-sm font-semibold text-slate-300">
                  {feesPaid}
               </p>
            </div>
         </div>

         <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>Opened: {openedAt}</span>
            <span>Closed: {closedAt ?? "Still open"}</span>
            <span>
               Reason:{" "}
               {closeReason ? closeReasonLabelByReason[closeReason] : "N/A"}
            </span>
         </div>
      </article>
   );
}