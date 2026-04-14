import React, { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import PageHeader from '@/components/ui/layout/PageHeader';
import ActivitiesBannerIsland from '@/components/islands/activities/ActivitiesBannerIsland';
import ActivitiesProviderIsland from '@/components/islands/activities/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/activiteit-actions';

// Server component to fetch banner data
async function ActivitiesBannerData({ session, events, serverTime }: { session: any, events: any[], serverTime: string }) {
    return <ActivitiesBannerIsland events={events} serverTime={serverTime} />;
}

// Server component to fetch list data
async function ActivitiesListData({ session, events, serverTime }: { session: any, events: any[], serverTime: string }) {
    return <ActivitiesProviderIsland events={events as any} serverTime={serverTime} />;
}

export default async function ActivitiesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    }).catch(() => null);

    const events = await getActivities().catch(() => []);
    const serverTime = new Date().toISOString();

    return (
        <div className="">
            <div className="w-full px-4 py-12 flex justify-center">
                <ActivitiesBannerData session={session} events={events} serverTime={serverTime} />
            </div>

            <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                <ActivitiesListData session={session} events={events} serverTime={serverTime} />
            </main>
        </div>
    );
}
