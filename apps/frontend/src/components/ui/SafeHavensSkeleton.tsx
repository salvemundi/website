/**
 * Hoge-kwaliteit skeleton voor de Safe Havens pagina.
 * Matcht de bento-grid layout van de legacy opmaak om CLS te voorkomen.
 */
export default function SafeHavensSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16 animate-pulse">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:auto-rows-[minmax(160px,auto)]">

                {/* Intro Section Skeleton (Bento 1) */}
                <div className="lg:col-span-8 lg:row-span-2 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full">
                    <div className="flex items-start gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                        <div className="flex-1 space-y-4">
                            <div className="h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-700" />
                            <div className="space-y-2">
                                <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="h-4 w-11/12 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="h-4 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Topics Section Skeleton (Bento 2) */}
                <div className="lg:col-span-4 lg:row-span-2 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full">
                    <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-700 mb-6" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800/20" />
                        ))}
                    </div>
                </div>

                {/* Safe Havens List Skeleton (Bento 3) */}
                <div className="lg:col-span-8 lg:row-span-4 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full">
                    <div className="h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-700 mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-48 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/30" />
                        ))}
                    </div>
                </div>

                {/* External Help Skeleton (Bento 4) */}
                <div className="lg:col-span-4 lg:row-span-4 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full flex flex-col items-center">
                    <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-700 mb-5" />
                    <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-700 mb-6" />
                    <div className="space-y-4 w-full">
                        <div className="h-14 w-full rounded-xl bg-slate-200 dark:bg-slate-700" />
                        <div className="h-14 w-full rounded-xl bg-slate-200 dark:bg-slate-700" />
                        <div className="h-24 w-full rounded-xl bg-red-100/50 dark:bg-red-950/20" />
                    </div>
                </div>

            </div>
        </div>
    );
}
