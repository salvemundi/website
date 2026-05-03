import React from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import ActivitiesBannerIsland from '@/components/islands/activities/ActivitiesBannerIsland';
import ActivitiesProviderIsland from '@/components/islands/activities/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/activiteit-actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Activiteiten | Salve Mundi',
    description: 'Bekijk alle komende en afgelopen activiteiten van studievereniging Salve Mundi.',
};

import type { Session } from 'better-auth';
import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';

// Server component to fetch banner data
async function ActivitiesBannerData({ events, serverTime }: { events: Activiteit[], serverTime: string }) {
    return <ActivitiesBannerIsland events={events} serverTime={serverTime} />;
}

// Server component to fetch list data
async function ActivitiesListData({ events, serverTime }: { events: (Activiteit & { is_signed_up?: boolean })[], serverTime: string }) {
    return <ActivitiesProviderIsland events={events} serverTime={serverTime} />;
}

import { connection } from 'next/server';
import { Suspense } from 'react';

export default async function ActivitiesPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            {/* Semantic SEO Heading - Hidden but present for standards */}
            <h1 className="sr-only">Activiteiten Salve Mundi</h1>
            <Suspense fallback={<ActivitiesSkeleton />}>
                <ActivitiesContent />
            </Suspense>
        </div>
    );
}

function ActivitiesSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="w-full px-4 py-8 md:py-16 flex justify-center">
                <div className="w-full max-w-4xl h-[400px] bg-[var(--bg-card)] rounded-[3rem]" />
            </div>
            <main className="w-full px-4 py-8 sm:py-10 md:py-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-80 bg-[var(--bg-card)] rounded-3xl" />
                    ))}
                </div>
            </main>
        </div>
    );
}

async function ActivitiesContent() {
    await connection();
    const session = await auth.api.getSession({
        headers: await headers()
    }).catch(() => null);

    const events = await getActivities().catch(() => []);
    const serverTime = new Date().toISOString();

    return (
        <>
            <div className="w-full px-4 py-8 md:py-16 flex justify-center">
                <ActivitiesBannerData events={events} serverTime={serverTime} />
            </div>

            <main className="w-full px-4 py-8 sm:py-10 md:py-12 max-w-7xl mx-auto">
                <ActivitiesListData events={events} serverTime={serverTime} />
            </main>
        </>
    );
}
