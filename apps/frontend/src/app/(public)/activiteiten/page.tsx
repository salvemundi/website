import React, { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import ActivitiesBannerIsland from '@/components/islands/activities/ActivitiesBannerIsland';
import ActivitiesProviderIsland from '@/components/islands/activities/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/activiteit-actions';

export const metadata = {
    title: 'Activiteiten | SV Salve Mundi',
    description: 'Bekijk alle activiteiten, trainingen en feesten van Salve Mundi.',
};

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage() {
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const sessionPromise = auth.api.getSession({ headers: await headers() });
    const activitiesPromise = getActivities(); // Use a single fetch for all
    
    const [session, events] = await Promise.all([
        sessionPromise.catch(() => null),
        activitiesPromise.catch(() => [])
    ]);
    
    // Stable server time for hydration-safe countdown and filtering
    const serverTime = new Date().toISOString();

    return (
        <PublicPageShell
            title="ACTIVITEITEN"
            subtitle="Bekijk alle activiteiten, trainingen en feesten van Salve Mundi."
            backgroundImage="/img/backgrounds/Kroto2025.jpg"
        >
            <div className="flex flex-col gap-12">
                <ActivitiesBannerIsland events={events as any} serverTime={serverTime} />
                <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                    <ActivitiesProviderIsland events={events as any} serverTime={serverTime} />
                </main>
            </div>
        </PublicPageShell>
    );
}
