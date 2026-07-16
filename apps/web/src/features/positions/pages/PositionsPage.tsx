import { useEffect, useState } from "react";
import { PositionCard } from "../components/PositionCard";
import { fetchPositions } from "../services/positions.service";
import type { PositionSummary } from "../types/position.types";

export function PositionsPage() {
   const [positions, setPositions] = useState<PositionSummary[]>([]);
   const [isLoading, setIsLoading] = useState<boolean>(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      async function loadPositions(): Promise<void> {
         try {
            setIsLoading(true);
            setErrorMessage(null);

            const response = await fetchPositions();

            if (!isMounted) {
               return;
            }

            setPositions(response);
         } catch (error) {
            if (!isMounted) {
               return;
            }

            setErrorMessage(
               error instanceof Error
                  ? error.message
                  : "No se pudieron cargar las posiciones.",
            );
         } finally {
            if (isMounted) {
               setIsLoading(false);
            }
         }
      }

      void loadPositions();

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <section>
         <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
               Positions
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
               Paper Positions
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">
               Operaciones paper abiertas y cerradas. Aquí se visualiza entrada,
               salida, riesgo, objetivo, PnL neto y motivo de cierre.
            </p>
         </div>

         {isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               Cargando posiciones reales desde PostgreSQL...
            </div>
         ) : null}

         {errorMessage ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-rose-200">
               {errorMessage}
            </div>
         ) : null}

         {!isLoading && !errorMessage && positions.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-slate-300">
               No hay posiciones paper todavía. Ejecuta una señal aprobada para abrir
               la primera posición simulada.
            </div>
         ) : null}

         {!isLoading && !errorMessage && positions.length > 0 ? (
            <div className="grid gap-4">
               {positions.map((position) => (
                  <PositionCard
                     key={position.id}
                     id={position.id}
                     symbol={position.symbol}
                     timeframe={position.timeframe}
                     strategyName={position.strategyName}
                     side={position.side}
                     status={position.status}
                     entryPrice={position.entryPrice}
                     exitPrice={position.exitPrice}
                     quantity={position.quantity}
                     notionalValue={position.notionalValue}
                     stopLossPrice={position.stopLossPrice}
                     takeProfitPrice={position.takeProfitPrice}
                     netPnl={position.netPnl}
                     netPnlPercent={position.netPnlPercent}
                     feesPaid={position.feesPaid}
                     openedAt={position.openedAt}
                     closedAt={position.closedAt}
                     closeReason={position.closeReason}
                  />
               ))}
            </div>
         ) : null}
      </section>
   );
}