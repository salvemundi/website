import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Hoge-kwaliteit skeleton voor de Safe Havens pagina.
 * Deze skeleton matcht de bento-grid layout van de overzichtspagina om CLS te voorkomen.
 */
export default function SafeHavensSkeleton() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:auto-rows-[minmax(160px,auto)]">

                {/* Intro Section Skeleton (Bento 1) */}
                <div className="lg:col-span-8 lg:row-span-2 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full">
                    <div className="flex items-start gap-6">
                        <Skeleton className="h-16 w-16 shrink-0" rounded="2xl" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-10 w-64" rounded="xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" rounded="full" />
                                <Skeleton className="h-4 w-11/12" rounded="full" />
                                <Skeleton className="h-4 w-4/5" rounded="full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Topics Section Skeleton (Bento 2) */}
                <div className="lg:col-span-4 lg:row-span-2 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full">
                    <Skeleton className="h-8 w-48 mb-6" rounded="xl" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" rounded="xl" />
                        ))}
                    </div>
                </div>

                {/* Safe Havens List Skeleton (Bento 3) */}
                <div className="lg:col-span-8 lg:row-span-4 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full">
                    <Skeleton className="h-10 w-64 mb-8" rounded="xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-48 w-full" rounded="2xl" />
                        ))}
                    </div>
                </div>

                {/* External Help Skeleton (Bento 4) */}
                <div className="lg:col-span-4 lg:row-span-4 rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg h-full flex flex-col items-center">
                    <Skeleton className="h-16 w-16 mb-5" rounded="2xl" />
                    <Skeleton className="h-8 w-48 mb-6" rounded="xl" />
                    <div className="space-y-4 w-full">
                        <Skeleton className="h-14 w-full" rounded="xl" />
                        <Skeleton className="h-14 w-full" rounded="xl" />
                        <Skeleton className="h-24 w-full bg-red-100/10 dark:bg-red-950/20" rounded="xl" />
                    </div>
                </div>

            </div>
        </div>
    );
}
