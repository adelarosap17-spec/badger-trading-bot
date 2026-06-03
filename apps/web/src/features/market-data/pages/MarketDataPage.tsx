import { MarketSymbolCard } from "../components/MarketSymbolCard";
import { marketSymbolSummaries } from "../mocks/market-symbols.mock";

export function MarketDataPage() {
   return (
      <section>
         <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
               Market Data
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
               Market Data Monitor
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
               Estado inicial de símbolos, timeframes, precios, spread y última vela
               cerrada. Estos datos serán reemplazados por Binance y Supabase.
            </p>
         </div>

         <div className="grid gap-4 xl:grid-cols-2">
            {marketSymbolSummaries.map((item) => (
               <MarketSymbolCard
                  key={`${item.symbol}-${item.timeframe}`}
                  symbol={item.symbol}
                  timeframe={item.timeframe}
                  lastPrice={item.lastPrice}
                  spread={item.spread}
                  lastCandleClose={item.lastCandleClose}
                  status={item.status}
               />
            ))}
         </div>
      </section>
   );
}