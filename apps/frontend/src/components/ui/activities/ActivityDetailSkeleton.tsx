import React from 'react';

export default function ActivityDetailSkeleton() {
    return (
        <div className="w-full flex flex-col min-h-screen bg-[var(--bg-main)]">
            {/* Hero Banner Skeleton */}
            <div className="relative h-[45vh] min-h-[400px] w-full bg-[var(--bg-soft)] animate-pulse border-b border-[var(--border-color)]">
                <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 pb-12">
                    <div className="max-w-3xl space-y-4">
                        <div className="h-6 w-32 bg-[var(--theme-purple)]/10 rounded-full" />
                        <div className="h-16 w-3/4 bg-[var(--theme-purple)]/10 rounded-2xl" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton Grid */}
            <main className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Signup Form Skeleton */}
                    <div className="order-1 lg:order-1 h-[600px] rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-color)] animate-pulse shadow-2xl shadow-[var(--theme-purple)]/5 p-8 space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="h-8 w-32 bg-[var(--bg-soft)] rounded-lg" />
                            <div className="h-8 w-20 bg-[var(--bg-soft)] rounded-lg" />
                        </div>
                        <div className="space-y-6 flex-1">
                            <div className="h-14 w-full bg-[var(--bg-soft)] rounded-2xl" />
                            <div className="h-14 w-full bg-[var(--bg-soft)] rounded-2xl" />
                            <div className="h-14 w-full bg-[var(--bg-soft)] rounded-2xl" />
                        </div>
                        <div className="h-16 w-full bg-[var(--theme-purple)]/10 rounded-2xl" />
                    </div>

                    {/* Right Column: Info Tiles Skeleton */}
                    <div className="order-2 lg:order-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`h-24 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 animate-pulse flex items-center gap-4 ${i <= 2 ? 'sm:col-span-2' : ''}`}>
                                <div className="h-12 w-12 rounded-2xl bg-[var(--bg-soft)]" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-3 w-12 bg-[var(--bg-soft)] rounded" />
                                    <div className="h-4 w-24 bg-[var(--bg-soft)] rounded" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Description Skeleton */}
                    <div className="lg:col-span-2 order-3 pt-6">
                        <div className="h-96 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-8 animate-pulse space-y-6">
                            <div className="h-8 w-48 bg-[var(--bg-soft)] rounded-lg mb-8" />
                            <div className="space-y-3">
                                <div className="h-4 w-full bg-[var(--bg-soft)] rounded" />
                                <div className="h-4 w-full bg-[var(--bg-soft)] rounded" />
                                <div className="h-4 w-full bg-[var(--bg-soft)] rounded" />
                                <div className="h-4 w-2/3 bg-[var(--bg-soft)] rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
