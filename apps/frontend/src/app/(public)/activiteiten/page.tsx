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

async function ActivitiesBannerData({ session }: { session: any }) {
    const events = await getActivities(session?.user?.id);
    return <ActivitiesBannerIsland events={events as any} />;
}

async function ActivitiesListData({ session }: { session: any }) {
    const events = await getActivities(session?.user?.id);
    return <ActivitiesProviderIsland events={events as any} />;
}

export default async function ActivitiesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <PublicPageShell
            title="ACTIVITEITEN"
            subtitle="Bekijk alle activiteiten, trainingen en feesten van Salve Mundi."
            backgroundImage="/img/backgrounds/Kroto2025.jpg"
        >
            <div className="flex flex-col gap-12">
                <ActivitiesBannerData session={session} />
                <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                    <ActivitiesListData session={session} />
                </main>
            </div>
        </PublicPageShell>
    );
}
