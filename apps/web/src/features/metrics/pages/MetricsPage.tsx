import { MetricSummaryCard } from "../components/MetricSummaryCard";
import { StrategyMetricCard } from "../components/StrategyMetricCard";
import {
   metricSummaries,
   strategyMetricSummaries,
} from "../mocks/metrics.mock";

export function MetricsPage() {
   return (
      <section>
         <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
               Metrics
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
               Performance Metrics
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
               Métricas principales para evaluar estrategias, operaciones paper,
               drawdown, rentabilidad y calidad del sistema.
            </p>
         </div>

         <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricSummaries.map((metric) => (
               <MetricSummaryCard
                  key={metric.id}
                  id={metric.id}
                  label={metric.label}
                  value={metric.value}
                  change={metric.change}
                  trend={metric.trend}
               />
            ))}
         </div>

         <div className="mt-6 grid gap-4">
            {strategyMetricSummaries.map((strategy) => (
               <StrategyMetricCard
                  key={strategy.id}
                  id={strategy.id}
                  strategyName={strategy.strategyName}
                  symbol={strategy.symbol}
                  timeframe={strategy.timeframe}
                  totalTrades={strategy.totalTrades}
                  winRate={strategy.winRate}
                  profitFactor={strategy.profitFactor}
                  maxDrawdown={strategy.maxDrawdown}
                  netPnl={strategy.netPnl}
                  expectancy={strategy.expectancy}
               />
            ))}
         </div>
      </section>
   );
}