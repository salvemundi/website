import React from 'react';

export default function SyncSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Card Skeleton */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-8 h-[400px]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-700" />
                            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                        </div>
                        <div className="space-y-6">
                            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 w-32 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl" />
                                <div className="h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl" />
                            </div>
                            <div className="h-14 w-full bg-slate-100 dark:bg-slate-700 rounded-2xl mt-4" />
                        </div>
                    </div>
                </div>

                {/* Single Sync Card Skeleton */}
                <div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-8 h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-700" />
                            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                        </div>
                        <div className="h-16 bg-slate-50 dark:bg-slate-900 rounded-xl mb-8" />
                        <div className="space-y-4">
                            <div className="h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl" />
                            <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Documentation Alert Skeleton */}
            <div className="bg-slate-100/50 dark:bg-slate-800/50 p-8 rounded-3xl ring-1 ring-slate-200 dark:ring-slate-700/50 flex gap-6">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="space-y-3 w-full">
                    <div className="h-4 w-48 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="h-16 bg-slate-100 dark:bg-slate-700/50 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
