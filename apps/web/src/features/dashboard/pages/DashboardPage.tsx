import { useEffect, useState } from "react";
import { fetchBotLogs, fetchBotStatus } from "../services/dashboard.service";
import type { BotLogResponse, BotStatusResponse } from "../types/dashboard.types";

function getStatusClassName(status: BotStatusResponse["status"]): string {
   if (status === "ready") {
      return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
   }

   if (status === "warning") {
      return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
   }

   return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
}

export function DashboardPage() {
   const [status, setStatus] = useState<BotStatusResponse | null>(null);
   const [logs, setLogs] = useState<BotLogResponse[]>([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadDashboard(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const [statusResponse, logsResponse] = await Promise.all([
               fetchBotStatus(),
               fetchBotLogs(),
            ]);

            if (!isMounted) {
               return;
            }

            setStatus(statusResponse);
            setLogs(logsResponse);
         } catch (error) {
            if (!isMounted) {
               return;
            }

            setErrorMessage(
               error instanceof Error
                  ? error.message
                  : "No se pudo cargar el dashboard.",
            );
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadDashboard();

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <section>
         <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
                  Dashboard
               </p>

               <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
                  Trading Bot Dashboard
               </h1>

               <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
                  Resumen general del bot, último ciclo operativo, señales,
                  posiciones, órdenes y logs recientes.
               </p>
            </div>

            {status ? (
               <span
                  className={[
                     "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ring-1",
                     getStatusClassName(status.status),
                  ].join(" ")}
               >
                  {status.status}
               </span>
            ) : null}
         </div>

         {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               Cargando estado real del bot...
            </div>
         ) : null}

         {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
               {errorMessage}
            </div>
         ) : null}

         {!isLoading && !errorMessage && status ? (
            <div className="space-y-6">
               <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                     <div>
                        <p className="text-sm text-slate-400">Last Cycle</p>

                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                           {status.lastCycleAt ?? "No cycle yet"}
                        </h2>
                     </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">
                     {status.lastCycleMessage ??
                        "Todavía no se ha ejecutado ningún ciclo del bot."}
                  </p>

                  {status.lastCycleSummary ? (
                     <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div>
                           <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Synced Pairs
                           </p>
                           <p className="mt-2 text-base font-semibold text-white">
                              {status.lastCycleSummary.syncedPairs}
                           </p>
                        </div>

                        <div>
                           <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Evaluations
                           </p>
                           <p className="mt-2 text-base font-semibold text-white">
                              {status.lastCycleSummary.successfulEvaluations}
                           </p>
                        </div>

                        <div>
                           <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Trades
                           </p>
                           <p className="mt-2 text-base font-semibold text-white">
                              {status.lastCycleSummary.executedTrades}
                           </p>
                        </div>

                        <div>
                           <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              Closed Positions
                           </p>
                           <p className="mt-2 text-base font-semibold text-white">
                              {status.lastCycleSummary.closedPositions}
                           </p>
                        </div>
                     </div>
                  ) : null}
               </article>

               <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                     <p className="text-sm text-slate-400">Open Positions</p>
                     <h2 className="mt-3 text-3xl font-bold text-white">
                        {status.counts.openPositions}
                     </h2>
                  </article>

                  <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                     <p className="text-sm text-slate-400">Generated Signals</p>
                     <h2 className="mt-3 text-3xl font-bold text-white">
                        {status.counts.generatedSignals}
                     </h2>
                  </article>

                  <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                     <p className="text-sm text-slate-400">Executed Signals</p>
                     <h2 className="mt-3 text-3xl font-bold text-white">
                        {status.counts.executedSignals}
                     </h2>
                  </article>

                  <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                     <p className="text-sm text-slate-400">Filled Orders</p>
                     <h2 className="mt-3 text-3xl font-bold text-white">
                        {status.counts.filledOrders}
                     </h2>
                  </article>
               </div>

               <section>
                  <div className="mb-4">
                     <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                        Logs
                     </p>

                     <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                        Recent Bot Logs
                     </h2>
                  </div>

                  <div className="grid gap-3">
                     {logs.length === 0 ? (
                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                           No hay logs todavía.
                        </div>
                     ) : (
                        logs.map((log) => (
                           <article
                              key={log.id}
                              className="rounded-2xl border border-white/10 bg-black/20 p-4"
                           >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                 <div>
                                    <p className="text-sm font-semibold text-white">
                                       {log.message}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                       {log.source} • {log.createdAt}
                                    </p>
                                 </div>

                                 <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-slate-300 ring-1 ring-white/10">
                                    {log.level}
                                 </span>
                              </div>
                           </article>
                        ))
                     )}
                  </div>
               </section>
            </div>
         ) : null}
      </section>
   );
}