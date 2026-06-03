type PlaceholderPageProps = {
   title: string;
   description: string;
};

export function PlaceholderPage({
   title,
   description,
}: PlaceholderPageProps) {
   return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20">
         <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Module
         </p>

         <h2 className="mt-4 text-3xl font-bold tracking-tight text-white">
            {title}
         </h2>

         <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            {description}
         </p>
      </section>
   );
}