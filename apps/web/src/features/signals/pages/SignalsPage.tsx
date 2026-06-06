import { SignalCard } from "../components/SignalCard";
import { signalSummaries } from "../mocks/signals.mock.ts";

export function SignalsPage() {
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

         <div className="grid gap-4">
            {signalSummaries.map((signal) => (
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
      </section>
   );
}