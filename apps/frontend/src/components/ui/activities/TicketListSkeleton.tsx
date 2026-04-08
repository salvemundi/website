import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function TicketListSkeleton() {
    return (
        <div className="space-y-12">
            {/* Search & Stats Section Skeleton */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="h-14 w-full md:w-96 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-14 w-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div 
                        key={i}
                        className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] space-y-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-2 w-12 opacity-50" />
                            </div>
                        </div>
                        
                        <Skeleton className="h-6 w-3/4" />
                        
                        <div className="space-y-2 border-t border-[var(--border-color)]/30 pt-4">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
