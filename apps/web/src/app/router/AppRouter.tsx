import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { MarketDataPage } from "../../features/market-data/pages/MarketDataPage";
import { MetricsPage } from "../../features/metrics/pages/MetricsPage";
import { PositionsPage } from "../../features/positions/pages/PositionsPage";
import { SignalsPage } from "../../features/signals/pages/SignalsPage";
import { StrategiesPage } from "../../features/strategies/pages/StrategiesPage";

const router = createBrowserRouter([
   {
      path: "/",
      element: <AppLayout />,
      children: [
         { index: true, element: <DashboardPage /> },
         { path: "market-data", element: <MarketDataPage /> },
         { path: "strategies", element: <StrategiesPage /> },
         { path: "signals", element: <SignalsPage /> },
         { path: "positions", element: <PositionsPage /> },
         { path: "metrics", element: <MetricsPage /> },
      ],
   },
]);

export function AppRouter() {
   return <RouterProvider router={router} />;
}