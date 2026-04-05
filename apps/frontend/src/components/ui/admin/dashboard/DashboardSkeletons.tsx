import React from 'react';

/**
 * Universal Button Skeleton.
 * Matches the horizontal ActionCard layout. [Icon] [Text] [Value]
 */
export function ActionCardSkeleton() {
    return (
        <div className="w-full flex items-center gap-4 p-4 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] animate-pulse">
            {/* Left: Icon Placeholder */}
            <div className="p-3 w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
            
            {/* Middle: Text Placeholder */}
            <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded opacity-60" />
                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded opacity-30" />
            </div>

            {/* Right: Value Placeholder */}
            <div className="h-6 w-8 bg-slate-200 dark:bg-slate-800 rounded opacity-40 shrink-0" />
        </div>
    );
}

/**
 * Deprecated StatCardSkeleton, mapping to the new horizontal style.
 */
export function StatCardSkeleton() {
    return <ActionCardSkeleton />;
}

/**
 * Main Dashboard Skeleton.
 * Organized into 2 columns with section headers.
 */
export function HubSkeleton({ isLimitedAccess = false }: { isLimitedAccess?: boolean }) {
    return (
        <div className="space-y-12 animate-pulse">
            {[1, 2, 3].map((section) => (
                <div key={section} className="space-y-5">
                    {/* Section Header Placeholder */}
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl opacity-40" />
                        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded opacity-20" />
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-10" />
                    </div>
                    
                    {/* 2-Column Grid of Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <ActionCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * List Card Skeleton for Birthdays/Stickers/etc.
 */
export function ListCardSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="space-y-4">
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[var(--beheer-card-soft)]/50 rounded-xl">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ActivitySignupsSkeleton() {
    return <ListCardSkeleton rows={4} />;
}
