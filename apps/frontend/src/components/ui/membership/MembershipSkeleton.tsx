import React from 'react';
import { Skeleton } from '../Skeleton';

export default function MembershipSkeleton() {
    return (
        <section className="w-full sm:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] shadow-xl p-6 sm:p-10" aria-busy="true">
            {/* LCP Optimization: Render title text natively in the skeleton */}
            <h1 className="text-4xl font-black text-theme-purple dark:text-purple-400 mb-8 tracking-tight opacity-50">
                INSCHRIJVEN
            </h1>

            <div className="space-y-4">
                {/* Form Fields Skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Skeleton className="h-4 w-20 mb-2" rounded="sm" />
                        <Skeleton className="h-12 w-full" rounded="xl" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-20 mb-2" rounded="sm" />
                        <Skeleton className="h-12 w-full" rounded="xl" />
                    </div>
                </div>

                <div>
                    <Skeleton className="h-4 w-12 mb-2" rounded="sm" />
                    <Skeleton className="h-12 w-full" rounded="xl" />
                </div>

                <div>
                    <Skeleton className="h-4 w-24 mb-2" rounded="sm" />
                    <Skeleton className="h-12 w-full" rounded="xl" />
                </div>

                <div>
                    <Skeleton className="h-4 w-28 mb-2" rounded="sm" />
                    <Skeleton className="h-12 w-full" rounded="xl" />
                </div>

                {/* Button Skeleton */}
                <Skeleton className="h-14 w-full mt-6" rounded="xl" variant="purple" />
            </div>
        </section>
    );
}
