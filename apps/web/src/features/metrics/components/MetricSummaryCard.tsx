import type { MetricSummary } from "../types/metric.types";

type MetricSummaryCardProps = MetricSummary;

const trendClassByTrend: Record<MetricSummary["trend"], string> = {
   positive: "text-emerald-300",
   negative: "text-rose-300",
   neutral: "text-slate-300",
};

export function MetricSummaryCard({
   label,
   value,
   change,
   trend,
}: MetricSummaryCardProps) {
   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
         <p className="text-sm text-slate-400">{label}</p>

         <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
         </h2>

         <p className={["mt-2 text-sm font-semibold", trendClassByTrend[trend]].join(" ")}>
            {change}
         </p>
      </article>
   );
}