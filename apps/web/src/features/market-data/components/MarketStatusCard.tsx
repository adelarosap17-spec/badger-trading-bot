export function MarketStatusCard() {
   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
         <p className="text-sm text-slate-400">Market status</p>

         <h2 className="mt-2 text-2xl font-bold text-white">Waiting for sync</h2>

         <p className="mt-2 text-sm leading-6 text-slate-500">
            Binance and Supabase integration is not connected yet.
         </p>
      </article>
   );
}