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
    description: 'Bekijk alle activiteiten, trainingen en feesten van Salve Mundi.',
};

async function ActivitiesBannerData({ session }: { session: any }) {
    const events = await getActivities(session?.user?.id);
    return <ActivitiesBannerIsland events={events} />;
}

async function ActivitiesListData({ session }: { session: any }) {
    const events = await getActivities(session?.user?.id);
    return <ActivitiesProviderIsland events={events} />;
}



export default async function ActivitiesPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <div className="">
            <PageHeader
                title="ACTIVITEITEN"
                backgroundImage="/img/backgrounds/Kroto2025.jpg"
                contentPadding="py-20"
                imageFilter="brightness(0.65)"
                variant="centered"
                description="Bekijk alle activiteiten, trainingen en feesten van Salve Mundi."
            >
                <Suspense fallback={<ActivitiesBannerIsland isLoading events={[]} />}>
                    <ActivitiesBannerData session={session} />
                </Suspense>
            </PageHeader>

            <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                <Suspense fallback={<ActivitiesProviderIsland isLoading />}>
                    <ActivitiesListData session={session} />
                </Suspense>
            </main>
        </div>
    );
}
