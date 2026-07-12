import { useEffect, useState } from "react";
import { SignalCard } from "../components/SignalCard";
import { fetchSignals } from "../services/signals.service";
import type { SignalSummary } from "../types/signal.types";

export function SignalsPage() {
   const [signals, setSignals] = useState<SignalSummary[]>([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadSignals(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const response = await fetchSignals();

            if (!isMounted) {
               return;
            }

            setSignals(response);
         } catch (error) {
            if (!isMounted) {
               return;
            }

            setErrorMessage(
               error instanceof Error
                  ? error.message
                  : "No se pudieron cargar las señales.",
            );
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadSignals();

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <section>
         <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
               Signals
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
               Strategy Signals
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
               Señales generadas por las estrategias. Una señal puede ser ejecutada,
               ignorada o rechazada por reglas de riesgo.
            </p>
         </div>

         {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               Cargando señales reales desde PostgreSQL...
            </div>
         ) : null}

         {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
               {errorMessage}
            </div>
         ) : null}

         {!isLoading && !errorMessage && signals.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               No hay señales guardadas todavía. Ejecuta una evaluación de estrategia
               para generar la primera señal.
            </div>
         ) : null}

         {!isLoading && !errorMessage && signals.length > 0 ? (
            <div className="grid gap-4">
               {signals.map((signal) => (
                  <SignalCard
                     key={signal.id}
                     id={signal.id}
                     symbol={signal.symbol}
                     timeframe={signal.timeframe}
                     strategyName={signal.strategyName}
                     type={signal.type}
                     status={signal.status}
                     price={signal.price}
                     rsi={signal.rsi}
                     emaFast={signal.emaFast}
                     emaSlow={signal.emaSlow}
                     spread={signal.spread}
                     reason={signal.reason}
                     createdAt={signal.createdAt}
                  />
               ))}
            </div>
         ) : null}
      </section>
   );
}