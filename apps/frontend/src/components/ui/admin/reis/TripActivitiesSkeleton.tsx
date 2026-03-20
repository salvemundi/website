import React from 'react';

export default function TripActivitiesSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
            {/* Trip Selector Skeleton */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 mb-8 border border-slate-100 dark:border-slate-700/50">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                <div className="h-12 w-full md:w-1/2 bg-slate-50 dark:bg-slate-900/50 rounded-xl" />
            </div>

            {/* Add Button Skeleton */}
            <div className="mb-8">
                <div className="h-12 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>

            {/* Activities Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700/50">
                        {/* Image Skeleton */}
                        <div className="h-48 w-full bg-slate-100 dark:bg-slate-900/50" />
                        
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-slate-50 dark:bg-slate-900/30 rounded" />
                                <div className="h-4 w-5/6 bg-slate-50 dark:bg-slate-900/30 rounded" />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <div className="h-10 flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                                <div className="h-10 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                            </div>
                            
                            <div className="h-10 w-full bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
