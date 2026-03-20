import React from 'react';

export default function MemberDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
            {/* Header Area Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 mb-12">
                <div className="h-24 w-24 rounded-3xl bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="space-y-3 flex-1">
                    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800 rounded-md" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-0.5">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-t-xl" />
                <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                <div className="h-10 w-28 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Cards Skeleton */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="h-64 bg-white dark:bg-slate-800 rounded-3xl p-8 ring-1 ring-slate-200 dark:ring-slate-700">
                        <div className="h-4 w-20 bg-slate-100 dark:bg-slate-900 mb-6 rounded" />
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900" />
                                    <div className="space-y-2">
                                        <div className="h-2 w-16 bg-slate-50 dark:bg-slate-900 rounded" />
                                        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-[400px] bg-white dark:bg-slate-800 rounded-3xl p-8 ring-1 ring-slate-200 dark:ring-slate-700">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900" />
                            <div className="space-y-2">
                                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-3 w-60 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
