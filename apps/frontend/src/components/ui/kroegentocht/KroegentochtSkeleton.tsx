import React from 'react';

/**
 * Dimension-perfect skeleton voor de Kroegentocht pagina.
 * Matcht de exacte padding, gaps en max-width van de interactieve componenten.
 */
export function KroegentochtTicketsSkeleton() {
    return (
        <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 mb-8 animate-pulse">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />
            <div className="h-4 w-full max-w-2xl bg-slate-100 dark:bg-slate-900 rounded-md mb-8" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/10 h-80" />
                ))}
            </div>
        </section>
    );
}

export function KroegentochtFormSkeleton() {
    return (
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 animate-pulse">
            <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8" />
            
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-900 rounded-md" />
                        <div className="h-12 w-full bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10" />
                    </div>
                ))}
                <div className="h-32 w-full bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10" />
                <div className="h-14 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
        </section>
    );
}

export function KroegentochtInfoSkeleton() {
    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg">
                    <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6" />
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-slate-50 dark:bg-white/5 rounded-md" />
                        <div className="h-4 w-5/6 bg-slate-50 dark:bg-white/5 rounded-md" />
                        <div className="h-4 w-4/6 bg-slate-50 dark:bg-white/5 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function KroegentochtSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 md:py-12">
            <KroegentochtFormSkeleton />
            <div className="mt-8 flex flex-col lg:flex-row gap-8">
                <KroegentochtFormSkeleton />
                <KroegentochtInfoSkeleton />
            </div>
        </div>
    );
}
