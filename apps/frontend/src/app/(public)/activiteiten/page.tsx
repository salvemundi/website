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
        <div className="relative w-full flex flex-col" aria-busy="true">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black text-theme-purple dark:text-purple-400 tracking-tight opacity-50">
                    KOMENDE ACTIVITEITEN
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-12 w-32 bg-slate-100 dark:bg-slate-900/40" rounded="xl" />
                    <Skeleton className="h-12 w-36 bg-slate-100 dark:bg-slate-900/40" rounded="xl" />
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <div className="flex-1 space-y-8">
                    <div className="hidden md:flex rounded-2xl bg-slate-50 dark:bg-slate-900/20 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800/30">
                        <div className="px-6 py-3 flex items-center gap-3">
                            <Skeleton className="w-5 h-5 bg-theme-purple/20" rounded="full" />
                            <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                        </div>
                        <div className="px-6 py-3 flex items-center gap-3 border-l border-slate-200 dark:border-slate-800/30">
                            <Skeleton className="w-5 h-5 bg-theme-purple/20" rounded="full" />
                            <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                        </div>
                        <div className="px-6 py-3 flex items-center gap-3 border-l border-slate-200 dark:border-slate-800/30">
                            <Skeleton className="w-5 h-5 bg-theme-purple/20" rounded="full" />
                            <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800/10" rounded="full" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
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
