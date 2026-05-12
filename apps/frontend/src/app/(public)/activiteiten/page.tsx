import React from 'react';
import ActivitiesBannerIsland from '@/components/islands/activities/ActivitiesBannerIsland';
import ActivitiesProviderIsland from '@/components/islands/activities/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/events/public-activiteit.actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Activiteiten | Salve Mundi',
    description: 'Bekijk alle komende en afgelopen activiteiten van studievereniging Salve Mundi.' };

import type { Activiteit } from '@salvemundi/validations/schema/activity.zod';

// Server component to fetch banner data
async function ActivitiesBannerData({ events, serverTime }: { events: Activiteit[], serverTime: string }) {
    return <ActivitiesBannerIsland events={events} serverTime={serverTime} />;
}

// Server component to fetch list data
async function ActivitiesListData({ events, serverTime }: { events: (Activiteit & { is_signed_up?: boolean })[], serverTime: string }) {
    return <ActivitiesProviderIsland events={events} serverTime={serverTime} />;
}


export default async function ActivitiesPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            {/* Semantic SEO Heading - Hidden but present for standards */}
            <h1 className="sr-only">Activiteiten Salve Mundi</h1>
            <ActivitiesContent />
        </div>
    );
}

async function ActivitiesContent() {
    const events = await getActivities();
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
