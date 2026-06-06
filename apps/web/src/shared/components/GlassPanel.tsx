import type { ReactNode } from "react";

type GlassPanelProps = {
   children: ReactNode;
   className?: string;
};

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
   return (
      <div
         className={[
            "rounded-[2rem] border border-white/15 bg-white/[0.045]",
            "shadow-2xl shadow-black/30 backdrop-blur-xl",
            "ring-1 ring-white/10",
            className,
         ].join(" ")}
      >
         {children}
      </div>
   );
}