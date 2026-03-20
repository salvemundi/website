import React from 'react';

export default function MemberListSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
            {/* Filters & Search Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl w-full md:w-auto h-12">
                     <div className="w-32 bg-white dark:bg-slate-800 rounded-lg m-0.5" />
                     <div className="w-32 bg-transparent rounded-lg m-0.5" />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
                    <div className="h-12 md:w-96 bg-slate-50 dark:bg-slate-900/50 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700/50" />
                    <div className="h-12 w-40 bg-orange-100 dark:bg-orange-900/20 rounded-xl" />
                </div>
            </div>

            {/* Desktop Table Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 overflow-hidden hidden md:block">
                <div className="h-14 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50" />
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 w-1/4">
                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                                    <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                                </div>
                            </div>
                            <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                            <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
                            <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
                            <div className="h-8 w-8 bg-slate-50 dark:bg-slate-900 rounded-lg mr-4" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Cards Skeleton */}
            <div className="md:hidden space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700/50">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-700" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                                </div>
                            </div>
                            <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                        </div>
                        <div className="h-16 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl mb-6" />
                        <div className="h-12 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                    </div>
                ))}
            </div>
        </div>
    );
}
