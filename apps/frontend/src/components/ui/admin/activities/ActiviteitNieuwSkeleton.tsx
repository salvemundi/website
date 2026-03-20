import React from 'react';

export default function ActiviteitNieuwSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-pulse">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700/50">
                {/* Header Skeleton */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                            <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800 rounded-md" />
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-12">
                    {/* Visual Section Skeleton */}
                    <div className="space-y-6">
                        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="aspect-[21/9] w-full bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                    </div>

                    {/* Basic Info Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 md:col-span-2">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-12 w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl" />
                        </div>
                        <div className="space-y-4 md:col-span-2">
                            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-32 w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl" />
                        </div>
                    </div>

                    {/* Logistics Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl">
                        <div className="space-y-4">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                            <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        </div>
                    </div>

                    {/* Footer Actions Skeleton */}
                    <div className="flex flex-wrap items-center justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="h-12 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        <div className="h-12 w-48 bg-primary/20 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
