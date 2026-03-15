import React from 'react';

export const CommitteeDetailSkeleton: React.FC = () => {
    return (
        <div className="space-y-12 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-64 md:h-96 w-full bg-[var(--bg-soft)] rounded-3xl" />
                    <div className="space-y-4">
                        <div className="h-10 w-1/3 bg-[var(--bg-soft)] rounded-lg" />
                        <div className="h-4 w-full bg-[var(--bg-soft)] rounded" />
                        <div className="h-4 w-full bg-[var(--bg-soft)] rounded" />
                        <div className="h-4 w-2/3 bg-[var(--bg-soft)] rounded" />
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="space-y-8">
                    <div className="h-32 w-full bg-[var(--bg-soft)] rounded-3xl" />
                    <div className="h-64 w-full bg-[var(--bg-soft)] rounded-3xl" />
                </div>
            </div>
        </div>
    );
};
