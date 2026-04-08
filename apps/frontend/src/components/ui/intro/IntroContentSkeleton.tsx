import React from 'react';
import { Skeleton } from '../Skeleton';

export const IntroContentSkeleton = () => {
    return (
        <div className="flex flex-col w-full">
            {/* PageHeader Skeleton */}
            <Skeleton className="h-[300px] w-full bg-slate-200 dark:bg-slate-800/20" rounded="none" />

            <div className="px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto w-full">
                    {/* Left column: Info content */}
                    <div className="flex-1 space-y-6">
                        <Skeleton className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800/30" rounded="lg" />
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                            <Skeleton className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                            <Skeleton className="h-4 w-11/12 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                        </div>

                        <div className="pt-8">
                            <Skeleton className="h-8 w-1/2 bg-slate-200 dark:bg-slate-800/30 mb-4" rounded="lg" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                                <Skeleton className="h-4 w-4/5 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                            </div>
                        </div>

                        {/* Cursors/Images grid skeleton */}
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="aspect-video w-full bg-slate-200 dark:bg-slate-800/10" rounded="xl" />
                            ))}
                        </div>
                    </div>

                    {/* Right column: Form */}
                    <div className="flex-1 w-full">
                        <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Skeleton className="w-8 h-8 bg-theme-purple/20" rounded="full" />
                                <Skeleton className="h-8 w-1/2 bg-theme-purple/10" rounded="lg" />
                            </div>

                            <div className="space-y-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800/20" rounded="full" />
                                        <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800/10" rounded="xl" />
                                    </div>
                                ))}
                            </div>

                            <Skeleton className="h-14 w-full bg-theme-purple/20 rounded-xl mt-8" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
