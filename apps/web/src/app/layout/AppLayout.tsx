import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
   { label: "Dashboard", path: "/" },
   { label: "Market Data", path: "/market-data" },
   { label: "Strategies", path: "/strategies" },
   { label: "Signals", path: "/signals" },
   { label: "Positions", path: "/positions" },
   { label: "Metrics", path: "/metrics" },
];

export function AppLayout() {
   return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
         <div className="flex min-h-screen">
            <aside className="hidden w-72 border-r border-white/10 bg-slate-950/80 px-5 py-6 backdrop-blur lg:block">
               <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">
                     Paper Trading
                  </p>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">
                     Trading Bot
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                     Laboratorio técnico para estrategias, señales y métricas.
                  </p>
               </div>

               <nav className="space-y-2">
                  {navigationItems.map((item) => (
                     <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/"}
                        className={({ isActive }) =>
                           [
                              "flex rounded-2xl px-4 py-3 text-sm font-medium transition",
                              isActive
                                 ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"
                                 : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                           ].join(" ")
                        }
                     >
                        {item.label}
                     </NavLink>
                  ))}
               </nav>
            </aside>

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
               <div className="mx-auto max-w-7xl">
                  <Outlet />
               </div>
            </main>
         </div>
      </div>
   );
}