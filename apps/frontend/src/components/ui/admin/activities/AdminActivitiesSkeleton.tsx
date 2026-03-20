import React from 'react';

export function AdminActivitiesSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Actions Bar Skeleton */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-pulse">
                <div className="w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-200 dark:bg-slate-700 h-12 w-56 rounded-full"></div>
                        <div className="bg-slate-200 dark:bg-slate-700 h-10 w-24 rounded-full hidden sm:block"></div>
                    </div>
                    <div className="hidden sm:flex gap-2">
                        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Search Skeleton */}
            <div className="mb-8 animate-pulse">
                <div className="h-14 w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded-full shadow-sm"></div>
            </div>

            {/* List Skeleton matching layout exact dimensions */}
            <div className="grid grid-cols-1 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100 dark:border-slate-800 h-[220px] md:h-[180px]">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex items-start gap-5 mb-4">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl flex-shrink-0"></div>
                                    <div className="flex-1 space-y-3 pt-2">
                                        <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                        <div className="flex gap-4">
                                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                                <div className="flex gap-4">
                                    <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                    <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end items-end h-full pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                                <div className="h-11 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                <div className="h-11 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                <div className="h-11 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
