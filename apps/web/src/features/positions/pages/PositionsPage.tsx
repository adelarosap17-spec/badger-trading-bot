import { PositionCard } from "../components/PositionCard";
import { positionSummaries } from "../mocks/positions.mock";

export function PositionsPage() {
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

         <div className="grid gap-4">
            {positionSummaries.map((position) => (
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
      </section>
   );
}