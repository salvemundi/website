import React from 'react';
import { Skeleton } from '../Skeleton';

interface ActivityCardSkeletonProps {
    variant?: 'grid' | 'list';
}

/**
 * Skeleton voor de ActiviteitCard.
 * Gebruikt de centrale Skeleton primitive om CLS te voorkomen en consistentie te behouden.
 */
export default function ActivityCardSkeleton({ variant = 'grid' }: ActivityCardSkeletonProps) {
    if (variant === 'list') {
        return (
            <div
                className="w-full rounded-2xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-5 shadow-sm"
                aria-busy="true"
            >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <div className="flex-1 min-w-[200px] space-y-3">
                        <Skeleton className="h-3 w-20 bg-theme-purple/20" rounded="full" />
                        <Skeleton className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800/30" rounded="lg" />
                        <Skeleton className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                    </div>

                    <div className="flex items-center gap-6 md:gap-10">
                        <div className="space-y-2 text-right">
                            <Skeleton className="h-3 w-16 ml-auto bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                            <Skeleton className="h-8 w-24 bg-theme-purple/10" rounded="lg" />
                        </div>
                        <Skeleton className="h-16 w-20 bg-slate-200 dark:bg-slate-800/10 lg:w-24 lg:h-16" rounded="xl" />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-color)]/10">
                    <Skeleton className="h-10 w-24 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                    <Skeleton className="h-10 w-32 bg-theme-purple/20" rounded="full" />
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full rounded-[2rem] bg-[var(--bg-card)] dark:border dark:border-white/10 p-5 shadow-lg"
            aria-busy="true"
        >
            <Skeleton className="h-44 sm:h-48 mb-6 bg-slate-200 dark:bg-slate-800/10" rounded="2xl" />

            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800/30" rounded="lg" />
                
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 bg-theme-purple/20" rounded="full" />
                        <Skeleton className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                    </div>
                    <Skeleton className="h-4 w-1/2 ml-7 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                </div>

                <div className="py-2">
                    <Skeleton className="h-16 w-full bg-slate-200 dark:bg-slate-800/5" rounded="xl" />
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-[var(--border-color)]/10">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-10 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                        <Skeleton className="h-8 w-16 bg-theme-purple/10" rounded="lg" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                        <Skeleton className="h-10 w-10 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                    </div>
                </div>
            </div>
        </div>
    );
}


