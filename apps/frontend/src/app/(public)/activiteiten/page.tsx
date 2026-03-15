import { Suspense } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import ActivitiesBannerIsland from '@/components/islands/ActivitiesBannerIsland';
import ActivityCardSkeleton from '@/components/ui/ActivityCardSkeleton';
import ActivitiesProviderIsland from '@/components/islands/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/activities.actions';

export const metadata = {
    title: 'Activiteiten | SV Salve Mundi',
    description: 'Bekijk alle evenementen, trainingen en feesten van Salve Mundi.',
};

// Component that fetches data for the top banner (FlipClock)
async function ActivitiesBannerData() {
    const events = await getActivities();
    return <ActivitiesBannerIsland events={events} />;
}

// Component that fetches data for the activities list/grid/calendar
async function ActivitiesListData() {
    const events = await getActivities();
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

                <div className="flex flex-wrap items-center gap-3 animate-pulse">
                    {/* Exact button stubs using the right CSS tokens to prevent CLS */}
                    <button disabled className="px-4 py-2 text-sm font-semibold bg-[var(--bg-soft)] text-transparent rounded-lg border border-[var(--border-color)] shadow-sm flex items-center gap-2 select-none pointer-events-none">
                        📅 Sync Agenda
                    </button>

                    <button disabled className="px-4 py-2 text-sm font-semibold bg-[var(--bg-soft)] text-transparent rounded-lg border border-[var(--border-color)] select-none pointer-events-none">
                        Toon Afgelopen
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                <div className="flex-1 space-y-6">
                    <div className="hidden md:flex rounded-lg bg-[var(--bg-soft)] overflow-hidden shadow-sm border border-[var(--border-color)] animate-pulse">
                        <div className="px-4 py-2 text-sm font-semibold text-transparent flex items-center gap-2 select-none pointer-events-none">
                            <span className="w-4 h-4 bg-[var(--color-purple-900)]/10 rounded-sm"></span>Lijst
                        </div>
                        <div className="px-4 py-2 text-sm font-semibold text-transparent flex items-center gap-2 select-none pointer-events-none">
                            <span className="w-4 h-4 bg-[var(--color-purple-900)]/10 rounded-sm"></span>Kaarten
                        </div>
                        <div className="px-4 py-2 text-sm font-semibold text-transparent flex items-center gap-2 select-none pointer-events-none">
                            <span className="w-4 h-4 bg-[var(--color-purple-900)]/10 rounded-sm"></span>Kalender
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <ActivityCardSkeleton key={i} />
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
            {/* 1. Header Shell: Static text and background render instantly */}
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

            {/* 3. Main Content: Static container + Suspended list */}
            <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                <Suspense fallback={<ActivitiesListFallback />}>
                    <ActivitiesListData />
                </Suspense>
            </main>
        </div>
    );
}
