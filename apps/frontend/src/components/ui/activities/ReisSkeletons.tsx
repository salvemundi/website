import React from 'react';
import { Skeleton } from '../Skeleton';

export function ReisPageHeaderSkeleton() {
    return (
        <div className="flex flex-col w-full">
            <div className="w-full min-h-[400px] sm:min-h-[450px] md:min-h-[500px] bg-slate-200 dark:bg-slate-800/10 flex flex-col items-center justify-center relative overflow-hidden py-20 px-4">
                <div className="max-w-app mx-auto text-center opacity-30">
                    <h1 className="text-4xl font-black text-[var(--theme-purple)] dark:text-white sm:text-5xl md:text-6xl mb-6">
                        SALVE MUNDI REIS
                    </h1>
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-full max-w-2xl bg-theme-purple/10 mx-auto" rounded="full" />
                        <Skeleton className="h-5 w-4/5 max-w-xl bg-theme-purple/10 mx-auto" rounded="full" />
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-main)] to-transparent" />
            </div>
        </div>
    );
}

export function ReisFormSkeleton() {
    return (
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-[2rem] shadow-xl p-5 sm:p-6 md:p-8" aria-busy="true">
            {/* Title Space */}
            <Skeleton className="h-10 w-3/4 sm:w-1/2 bg-theme-purple/10 mb-8" rounded="lg" />

            {/* Form Fields Simulation */}
            <div className="flex flex-col gap-6">
                <Skeleton className="h-5 w-full bg-slate-200 dark:bg-slate-800/20" rounded="md" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                        <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800/10" rounded="xl" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                        <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800/10" rounded="xl" />
                    </div>
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                    <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800/10" rounded="xl" />
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                    <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800/10" rounded="xl" />
                </div>

                {/* Submit button */}
                <Skeleton className="h-14 w-full bg-theme-purple/20 rounded-xl mt-6" />
            </div>
        </section>
    );
}

export function ReisInfoSkeleton() {
    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8" aria-busy="true">
            {/* Image + Date Card */}
            <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-xl">
                {/* Image Placeholder */}
                <Skeleton className="w-full h-48 sm:h-64 md:h-80 bg-slate-200 dark:bg-slate-800/10" rounded="2xl" />

                {/* Date Placeholder */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/30">
                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 bg-theme-purple/10" rounded="full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-24 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                            <Skeleton className="h-5 w-full max-w-[200px] bg-theme-purple/10" rounded="md" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Card */}
            <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-xl">
                <Skeleton className="h-8 w-1/3 bg-theme-purple/10 mb-6" rounded="lg" />
                <div className="space-y-4">
                    <Skeleton className="h-4 w-full bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                    <Skeleton className="h-4 w-11/12 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                    <Skeleton className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                </div>
            </div>
        </div>
    );
}

export function ReisPageSkeleton() {
    return (
        <>
            <ReisPageHeaderSkeleton />
            <main className="relative overflow-hidden bg-background">
                <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <ReisFormSkeleton />
                        <ReisInfoSkeleton />
                    </div>
                </div>
            </main>
        </>
    );
}
