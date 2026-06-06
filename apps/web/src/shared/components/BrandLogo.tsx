import badgerLogo from "../../assets/brand/badger-logo.png";

type BrandLogoProps = {
   size?: "sm" | "md" | "lg";
   showText?: boolean;
};

const sizeClassBySize: Record<NonNullable<BrandLogoProps["size"]>, string> = {
   sm: "h-8 w-8",
   md: "h-11 w-11",
   lg: "h-14 w-14",
};

export function BrandLogo({ size = "md", showText = true }: BrandLogoProps) {
   return (
      <div className="flex items-center gap-3">
         <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <img
               src={badgerLogo}
               alt="Badger trading bot logo"
               className={`${sizeClassBySize[size]} object-contain invert`}
            />
         </div>

         {showText ? (
            <div>
               <p className="text-lg font-black tracking-tight text-white">
                  BADGERBOT
               </p>

               <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-300/80">
                  Paper Trading
               </p>
            </div>
         ) : null}
      </div>
   );
}