import React from 'react';

export function StatCardSkeleton() {
    return (
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden animate-pulse border border-transparent dark:border-slate-700/50">
            <div className="absolute top-0 right-0 w-28 h-28 sm:w-32 sm:h-32 -mr-12 sm:-mr-16 -mt-12 sm:-mt-16 bg-white/5 rounded-full" />
            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-3">
                    <div className="flex-1 w-full sm:w-auto">
                        <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded mb-2 mx-auto sm:mx-0" />
                        <div className="h-8 w-24 bg-slate-300 dark:bg-slate-700 rounded mb-1 mx-auto sm:mx-0" />
                        <div className="h-3 w-32 bg-slate-300 dark:bg-slate-700 rounded mx-auto sm:mx-0" />
                    </div>
                    <div className="hidden sm:block w-10 h-10 bg-slate-300 dark:bg-slate-700 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function ActionCardSkeleton() {
    return (
        <div className="w-full flex items-center gap-4 p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse">
            <div className="p-2 w-10 h-10 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="flex-1">
                <div className="h-3 w-12 bg-slate-300 dark:bg-slate-700 rounded mb-1" />
                <div className="h-5 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
            </div>
        </div>
    );
}

export function ListCardSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="space-y-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-600 rounded" />
                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-600 rounded" />
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ActivitySignupsSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-600 rounded" />
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-8 bg-slate-200 dark:bg-slate-600 rounded" />
                            <div className="w-5 h-5 bg-slate-200 dark:bg-slate-600 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
