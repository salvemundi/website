import React from 'react';

export default function SyncSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Card Skeleton */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 min-h-[480px]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
                                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="h-4 w-40 bg-slate-100 dark:bg-slate-700 rounded mb-4" />
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 w-28 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                <div className="h-[72px] bg-slate-50 dark:bg-white/5 rounded-2xl" />
                                <div className="h-[72px] bg-slate-50 dark:bg-white/5 rounded-2xl" />
                            </div>

                            <div className="h-16 w-full bg-slate-200 dark:bg-slate-700 rounded-2xl mt-4" />
                        </div>
                    </div>
                </div>

                {/* Individual Sync Card Skeleton */}
                <div>
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 h-full min-h-[480px]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 h-12 w-12 bg-slate-100 dark:bg-slate-700 rounded-2xl" />
                            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                        </div>
                        
                        <div className="space-y-3 mb-8">
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded" />
                            <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-700 rounded" />
                        </div>

                        <div className="space-y-4">
                            <div className="h-14 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-2xl" />
                            <div className="h-14 w-full bg-slate-100 dark:bg-slate-700 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Documentation Alert Skeleton */}
            <div className="bg-slate-100/50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] ring-1 ring-slate-200 dark:ring-slate-700/50 flex gap-6">
                <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="space-y-2 w-full">
                    <div className="h-5 w-64 bg-slate-300 dark:bg-slate-600 rounded" />
                    <div className="space-y-2 pt-2">
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
