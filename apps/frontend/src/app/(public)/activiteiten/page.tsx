export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import PageHeader from '@/components/ui/layout/PageHeader';
import ActivitiesBannerIsland from '@/components/islands/activities/ActivitiesBannerIsland';
import ActivityCardSkeleton from '@/components/ui/activities/ActivityCardSkeleton';
import ActivitiesProviderIsland from '@/components/islands/activities/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/activiteit-actions';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata = {
    title: 'Activiteiten | SV Salve Mundi',
    description: 'Bekijk alle evenementen, trainingen en feesten van Salve Mundi.',
};

async function ActivitiesBannerData() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const events = await getActivities(session?.user?.id);
    return <ActivitiesBannerIsland events={events} />;
}

async function ActivitiesListData() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    const events = await getActivities(session?.user?.id);
    return <ActivitiesProviderIsland events={events} />;
}

function ActivitiesListFallback() {
    return (
        <div className="relative w-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                {/* LCP Optimization: Render the exact same text natively in the skeleton so it's instantly visible */}
                <h2 className="text-3xl font-bold text-[var(--theme-purple)] dark:text-[var(--text-main)]">
                    Komende Activiteiten
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Exact button stubs using the right CSS tokens to prevent CLS */}
                    <Skeleton className="h-9 w-32" rounded="lg" />
                    <Skeleton className="h-9 w-36" rounded="lg" />
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <div className="flex-1 space-y-6">
                    <div className="hidden md:flex rounded-lg bg-[var(--bg-soft)] overflow-hidden shadow-sm border border-[var(--border-color)]">
                        <div className="px-4 py-2 flex items-center gap-2 select-none pointer-events-none">
                            <Skeleton className="w-4 h-4" rounded="sm" />
                            <Skeleton className="h-4 w-12" rounded="sm" />
                        </div>
                        <div className="px-4 py-2 flex items-center gap-2 select-none pointer-events-none">
                            <Skeleton className="w-4 h-4" rounded="sm" />
                            <Skeleton className="h-4 w-16" rounded="sm" />
                        </div>
                        <div className="px-4 py-2 flex items-center gap-2 select-none pointer-events-none">
                            <Skeleton className="w-4 h-4" rounded="sm" />
                            <Skeleton className="h-4 w-20" rounded="sm" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <ActivityCardSkeleton key={i} variant="list" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function ActivitiesPage() {
    return (
        <div className="">
            
            <PageHeader
                title="ACTIVITEITEN"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
                contentPadding="py-20"
                imageFilter="brightness(0.65)"
                variant="centered"
                description="Bekijk alle evenementen, trainingen en feesten van Salve Mundi."
            >
                {/* Fallback height approximately matches the FlipClock container to prevent CLS */}
                <Suspense fallback={<div className="h-[180px] w-full" />}>
                    <ActivitiesBannerData />
                </Suspense>
            </PageHeader>

            
            <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                <Suspense fallback={<ActivitiesListFallback />}>
                    <ActivitiesListData />
                </Suspense>
            </main>
        </div>
    );
}
