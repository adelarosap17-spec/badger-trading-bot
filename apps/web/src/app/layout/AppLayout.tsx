import { NavLink, Outlet } from "react-router-dom";
import tradingBackground from "../../assets/backgrounds/trading-dashboard-bg.png";
import { BrandLogo } from "../../shared/components/BrandLogo";
import { GlassPanel } from "../../shared/components/GlassPanel";

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
      <div className="relative min-h-screen overflow-hidden text-slate-100">
         <div
            className="fixed inset-0 -z-30 bg-no-repeat"
            style={{
               backgroundImage: `url(${tradingBackground})`,
               backgroundSize: "170% auto",
               backgroundPosition: "88% center",
            }}
         />

         <div className="fixed inset-0 -z-20 bg-slate-950/10" />

         <div className="fixed inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,0.7)_0%,rgba(2,6,23,0.28)_34%,rgba(2,6,23,0.02)_100%)]" />

         <aside className="fixed left-4 top-4 z-20 hidden h-[calc(100vh-2rem)] w-72 lg:block">
            <GlassPanel className="flex h-full flex-col bg-black/20 p-4">
               <div className="px-2 py-3">
                  <BrandLogo />
               </div>

               <nav className="mt-8 space-y-2">
                  {navigationItems.map((item) => (
                     <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/"}
                        className={({ isActive }) =>
                           [
                              "flex rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200",
                              isActive
                                 ? "bg-white/14 text-white shadow-lg shadow-emerald-950/30 ring-1 ring-white/15"
                                 : "text-slate-300 hover:bg-white/10 hover:text-white",
                           ].join(" ")
                        }
                     >
                        {item.label}
                     </NavLink>
                  ))}
               </nav>

               <div className="mt-auto">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4 shadow-inner shadow-white/5">
                     <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />

                        <p className="text-sm font-semibold text-white">Bot Status</p>
                     </div>

                     <p className="mt-2 text-xs leading-5 text-slate-400">
                        All systems ready for paper trading setup.
                     </p>
                  </div>
               </div>
            </GlassPanel>
         </aside>

         <main className="h-screen overflow-y-auto px-4 py-4 lg:ml-80">
            <div className="min-h-full rounded-[2rem] border border-white/10 bg-black/5 p-5 backdrop-blur-[2px] sm:p-6 lg:p-7">
               <Outlet />
            </div>
         </main>
      </div>
   );
}