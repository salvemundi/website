import React from 'react';

export default function MembershipSkeleton() {
    return (
        <div className="flex flex-col sm:flex-row gap-6 px-6 py-8 sm:py-10 md:py-12 animate-pulse">
            {/* Left Column: Form/Status Area */}
            <section className="w-full sm:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-lg p-6 sm:p-8">
                {/* Title Skeleton */}
                <div className="h-10 w-48 bg-purple-200 dark:bg-purple-800/40 rounded-lg mb-6" />

                <div className="space-y-4">
                    {/* Form Fields Skeletons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="h-4 w-20 bg-purple-100 dark:bg-purple-900/40 rounded mb-2" />
                            <div className="h-12 w-full bg-purple-50 dark:bg-white/10 rounded-xl border border-purple-100 dark:border-white/20" />
                        </div>
                        <div>
                            <div className="h-4 w-20 bg-purple-100 dark:bg-purple-900/40 rounded mb-2" />
                            <div className="h-12 w-full bg-purple-50 dark:bg-white/10 rounded-xl border border-purple-100 dark:border-white/20" />
                        </div>
                    </div>

                    <div>
                        <div className="h-4 w-12 bg-purple-100 dark:bg-purple-900/20 rounded mb-2" />
                        <div className="h-12 w-full bg-purple-50 dark:bg-white/5 rounded-xl border border-purple-100 dark:border-white/10" />
                    </div>

                    <div>
                        <div className="h-4 w-24 bg-purple-100 dark:bg-purple-900/20 rounded mb-2" />
                        <div className="h-12 w-full bg-purple-50 dark:bg-white/5 rounded-xl border border-purple-100 dark:border-white/10" />
                    </div>

                    <div>
                        <div className="h-4 w-28 bg-purple-100 dark:bg-purple-900/20 rounded mb-2" />
                        <div className="h-12 w-full bg-purple-50 dark:bg-white/5 rounded-xl border border-purple-100 dark:border-white/10" />
                    </div>

                    {/* Button Skeleton */}
                    <div className="h-14 w-full bg-purple-200 dark:bg-purple-800/50 rounded-xl mt-6 shadow-sm" />
                </div>
            </section>

            {/* Right Column: Info Cards Area */}
            <aside className="w-full sm:w-1/2 flex flex-col gap-6">
                <div className="w-full text-center bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl p-6 shadow-sm">
                    <div className="h-8 w-40 bg-purple-200 dark:bg-purple-900/30 rounded-lg mx-auto mb-4" />
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-purple-100 dark:bg-purple-900/20 rounded mx-auto" />
                        <div className="h-4 w-5/6 bg-purple-100 dark:bg-purple-900/20 rounded mx-auto" />
                        <div className="h-4 w-4/6 bg-purple-100 dark:bg-purple-900/20 rounded mx-auto" />
                    </div>
                </div>
            </aside>
        </div>
    );
}
