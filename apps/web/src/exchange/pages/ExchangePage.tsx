import { useEffect, useMemo, useState } from "react";
import { fetchExchangeDashboardData } from "../services/exchange.service.ts";
import type {
   BinanceAccountBalance,
   ExchangeDashboardData,
   ExchangeOrderSummaryResponse,
   ExchangePositionSummaryResponse,
} from "../types/exchange.types";

function getOrderSideClassName(side: string): string {
   if (side === "BUY") {
      return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
   }

   if (side === "SELL") {
      return "bg-rose-400/10 text-rose-300 ring-rose-400/20";
   }

   return "bg-white/10 text-slate-300 ring-white/10";
}

function getStatusClassName(status: string): string {
   if (status === "FILLED" || status === "open") {
      return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20";
   }

   if (status === "closed") {
      return "bg-slate-400/10 text-slate-300 ring-slate-400/20";
   }

   return "bg-amber-400/10 text-amber-300 ring-amber-400/20";
}

function formatDecimal(value: string | null, fallback = "N/A"): string {
   if (!value) {
      return fallback;
   }

   const numericValue = Number(value);

   if (!Number.isFinite(numericValue)) {
      return value;
   }

   return numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
   });
}

function formatQuantity(value: string | null, fallback = "N/A"): string {
   if (!value) {
      return fallback;
   }

   const numericValue = Number(value);

   if (!Number.isFinite(numericValue)) {
      return value;
   }

   return numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 12,
   });
}

function BalanceCard({ balance }: { balance: BinanceAccountBalance }) {
   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
         <div className="flex items-start justify-between gap-4">
            <div>
               <p className="text-sm text-slate-400">Asset</p>
               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {balance.asset}
               </h2>
            </div>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
               Testnet
            </span>
         </div>

         <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Free
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {formatQuantity(balance.free)}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Locked
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {formatQuantity(balance.locked)}
               </p>
            </div>
         </div>
      </article>
   );
}

function PositionCard({
   position,
}: {
   position: ExchangePositionSummaryResponse;
}) {
   const pnlClassName = position.estimatedPnl?.startsWith("-")
      ? "text-rose-300"
      : "text-emerald-300";

   return (
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
         <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm text-slate-400">
                  {position.exchange} • {position.mode}
               </p>

               <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {position.symbol}
               </h2>
            </div>

            <span
               className={[
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1",
                  getStatusClassName(position.status),
               ].join(" ")}
            >
               {position.status}
            </span>
         </div>

         <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Net Quantity
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {formatQuantity(position.netQuantity)} {position.baseAsset}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Avg Buy Price
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {formatDecimal(position.averageBuyPrice)} {position.quoteAsset}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Last Price
               </p>
               <p className="mt-2 text-base font-semibold text-white">
                  {formatDecimal(position.lastPrice)} {position.quoteAsset}
               </p>
            </div>

            <div>
               <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Estimated PnL
               </p>
               <p className={["mt-2 text-base font-semibold", pnlClassName].join(" ")}>
                  {position.estimatedPnl ?? "N/A"}{" "}
                  {position.estimatedPnlPercent ? `(${position.estimatedPnlPercent})` : ""}
               </p>
            </div>
         </div>
      </article>
   );
}

function OrderRow({ order }: { order: ExchangeOrderSummaryResponse }) {
   return (
      <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
         <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
               <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white">{order.symbol}</h3>

                  <span
                     className={[
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1",
                        getOrderSideClassName(order.side),
                     ].join(" ")}
                  >
                     {order.side}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-slate-300 ring-1 ring-white/10">
                     {order.status}
                  </span>
               </div>

               <p className="mt-2 text-xs text-slate-500">
                  External Order ID: {order.externalOrderId} • {order.createdAt}
               </p>
            </div>

            <div className="grid gap-3 text-right sm:grid-cols-3">
               <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                     Quote
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                     {formatDecimal(order.quoteOrderQty)}
                  </p>
               </div>

               <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                     Executed
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                     {formatQuantity(order.executedQty)}
                  </p>
               </div>

               <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                     Avg Price
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                     {formatDecimal(order.averagePrice)}
                  </p>
               </div>
            </div>
         </div>
      </article>
   );
}

export function ExchangePage() {
   const [data, setData] = useState<ExchangeDashboardData | null>(null);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadExchangeData(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const response = await fetchExchangeDashboardData();

            if (!isMounted) {
               return;
            }

            setData(response);
         } catch (error) {
            if (!isMounted) {
               return;
            }

            setErrorMessage(
               error instanceof Error
                  ? error.message
                  : "No se pudo cargar la información de Binance Testnet.",
            );
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadExchangeData();

      return () => {
         isMounted = false;
      };
   }, []);

   const mainBalances = useMemo(() => {
      if (!data) {
         return [];
      }

      const priorityAssets = ["USDT", "BTC", "ETH", "BNB"];

      return data.balance.balances
         .filter((balance) => priorityAssets.includes(balance.asset))
         .sort(
            (first, second) =>
               priorityAssets.indexOf(first.asset) -
               priorityAssets.indexOf(second.asset),
         );
   }, [data]);

   return (
      <section>
         <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
               <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
                  Exchange
               </p>

               <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
                  Binance Testnet
               </h1>

               <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
                  Balance, órdenes recientes y posiciones calculadas desde las
                  operaciones ejecutadas en Binance Spot Testnet.
               </p>
            </div>

            {data ? (
               <span
                  className={[
                     "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ring-1",
                     data.balance.canTrade
                        ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20"
                        : "bg-rose-400/10 text-rose-300 ring-rose-400/20",
                  ].join(" ")}
               >
                  {data.balance.canTrade ? "Can Trade" : "Trading Disabled"}
               </span>
            ) : null}
         </div>

         {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               Cargando datos reales de Binance Testnet...
            </div>
         ) : null}

         {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
               {errorMessage}
            </div>
         ) : null}

         {!isLoading && !errorMessage && data ? (
            <div className="space-y-8">
               <section>
                  <div className="mb-4">
                     <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                        Account
                     </p>

                     <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                        Testnet Balance
                     </h2>
                  </div>

                  {mainBalances.length === 0 ? (
                     <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                        No hay balances principales para mostrar.
                     </div>
                  ) : (
                     <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {mainBalances.map((balance) => (
                           <BalanceCard key={balance.asset} balance={balance} />
                        ))}
                     </div>
                  )}
               </section>

               <section>
                  <div className="mb-4">
                     <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                        Positions
                     </p>

                     <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                        Exchange Positions
                     </h2>
                  </div>

                  {data.positions.length === 0 ? (
                     <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                        No hay posiciones testnet todavía.
                     </div>
                  ) : (
                     <div className="grid gap-4">
                        {data.positions.map((position) => (
                           <PositionCard
                              key={`${position.exchange}-${position.mode}-${position.symbol}`}
                              position={position}
                           />
                        ))}
                     </div>
                  )}
               </section>

               <section>
                  <div className="mb-4">
                     <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
                        Orders
                     </p>

                     <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                        Recent Exchange Orders
                     </h2>
                  </div>

                  {data.orders.length === 0 ? (
                     <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
                        No hay órdenes testnet guardadas.
                     </div>
                  ) : (
                     <div className="grid gap-3">
                        {data.orders.map((order) => (
                           <OrderRow key={order.id} order={order} />
                        ))}
                     </div>
                  )}
               </section>
            </div>
         ) : null}
      </section>
   );
}