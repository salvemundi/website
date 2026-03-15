import React from 'react';

export const CommitteeGridSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Bestuur Skeleton (Spans 2) */}
            <div className="md:col-span-2 h-[450px] rounded-3xl bg-[var(--bg-card)]/50 animate-pulse dark:border dark:border-white/10 shadow-lg">
                <div className="h-56 w-full rounded-t-3xl bg-[var(--bg-soft)]" />
                <div className="p-6 space-y-4">
                    <div className="h-8 w-1/3 bg-[var(--bg-soft)] rounded-lg" />
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-[var(--bg-soft)] rounded" />
                        <div className="h-4 w-5/6 bg-[var(--bg-soft)] rounded" />
                    </div>
                </div>
            </div>

            {/* Normal Skeletons */}
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[450px] rounded-3xl bg-[var(--bg-card)]/50 animate-pulse dark:border dark:border-white/10 shadow-lg">
                    <div className="h-56 w-full rounded-t-3xl bg-[var(--bg-soft)]" />
                    <div className="p-6 space-y-4">
                        <div className="h-8 w-2/3 bg-[var(--bg-soft)] rounded-lg" />
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-[var(--bg-soft)] rounded" />
                            <div className="h-4 w-2/3 bg-[var(--bg-soft)] rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
