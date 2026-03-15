import React from 'react';

export default function MembershipSkeleton() {
    return (
        <section className="w-full sm:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] shadow-xl p-6 sm:p-10 animate-pulse">
            {/* LCP Optimization: Render title text natively in the skeleton */}
            <h1 className="text-4xl font-black text-theme-purple dark:text-purple-400 mb-8 tracking-tight opacity-50">
                INSCHRIJVEN
            </h1>

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
    );
}
