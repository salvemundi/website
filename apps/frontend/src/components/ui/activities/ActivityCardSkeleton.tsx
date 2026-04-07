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
                className="w-full rounded-2xl bg-[var(--bg-card)] dark:border dark:border-[var(--color-white)]/10 p-5 shadow-sm"
                aria-busy="true"
                aria-hidden="false"
            >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <div className="flex-1 min-w-[200px] space-y-3">
                        <Skeleton className="h-4 w-24" variant="purple" rounded="md" />
                        <Skeleton className="h-6 w-3/4" variant="purple" rounded="md" />
                        <Skeleton className="h-4 w-1/2" rounded="md" />
                    </div>

                    <div className="flex items-center gap-6 md:gap-10">
                        <div className="space-y-2 text-right">
                            <Skeleton className="h-3 w-16 ml-auto" rounded="sm" />
                            <Skeleton className="h-4 w-24" variant="purple" rounded="sm" />
                        </div>
                        <Skeleton className="h-14 w-20 border border-[var(--border-color)]" rounded="xl" />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--border-color)]/5">
                    <Skeleton className="h-9 w-24" rounded="full" />
                    <Skeleton className="h-9 w-28" variant="purple" rounded="full" />
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full rounded-[1.75rem] bg-[var(--bg-card)] dark:border dark:border-[var(--color-white)]/10 p-5 shadow-sm"
            aria-busy="true"
            aria-hidden="false"
        >
            {/* Image Placeholder matches ActiviteitCard h-44 sm:h-48 */}
            <Skeleton className="h-44 sm:h-48 mb-5 shadow-inner" rounded="2xl" />

            <div className="space-y-4">
                <Skeleton className="h-7 w-3/4" variant="purple" rounded="lg" />
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" rounded="full" />
                        <Skeleton className="h-4 w-1/3" rounded="md" />
                    </div>
                    <Skeleton className="h-4 w-1/2 ml-6" rounded="md" />
                </div>

                <Skeleton className="h-16 w-full" rounded="lg" />

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-10" rounded="sm" />
                        <Skeleton className="h-6 w-16" variant="purple" rounded="sm" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10" rounded="full" />
                        <Skeleton className="h-10 w-10" rounded="full" />
                    </div>
                </div>
            </div>
        </div>
    );
}


