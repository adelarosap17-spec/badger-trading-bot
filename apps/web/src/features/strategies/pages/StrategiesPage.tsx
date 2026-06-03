import { StrategyCard } from "../components/StrategyCard";
import { strategySummaries } from "../mocks/strategies.mock";

export function StrategiesPage() {
   return (
      <section>
         <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
               Strategies
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
               Strategy Instances
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
               Configuración inicial de estrategias por símbolo y timeframe. Cada
               instancia podrá correr, pausarse y medirse de forma independiente.
            </p>
         </div>

         <div className="grid gap-4">
            {strategySummaries.map((strategy) => (
               <StrategyCard
                  key={strategy.id}
                  id={strategy.id}
                  name={strategy.name}
                  symbol={strategy.symbol}
                  timeframe={strategy.timeframe}
                  mode={strategy.mode}
                  status={strategy.status}
                  capitalAllocated={strategy.capitalAllocated}
                  riskPerTrade={strategy.riskPerTrade}
                  dailyLossLimit={strategy.dailyLossLimit}
                  dailyProfitTarget={strategy.dailyProfitTarget}
                  fastEmaPeriod={strategy.fastEmaPeriod}
                  slowEmaPeriod={strategy.slowEmaPeriod}
                  rsiPeriod={strategy.rsiPeriod}
               />
            ))}
         </div>
      </section>
   );
}