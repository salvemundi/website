import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getActivityById } from '@/server/actions/activities.actions';
import ActivityDetailIsland from '@/components/islands/activities/ActivityDetailIsland';
import EventSignupIsland from '@/components/islands/activities/EventSignupIsland';
import ActivityDetailSkeleton from '@/components/ui/activities/ActivityDetailSkeleton';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const activity = await getActivityById(id);

    if (!activity) return { title: 'Activiteit niet gevonden' };

    return {
        title: `${activity.titel} | Salve Mundi`,
        description: activity.beschrijving?.substring(0, 160) || 'Kom ook naar deze activiteit van Salve Mundi!',
    };
}

import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

async function ActivityData({ id }: { id: string }) {
    const [activity, session] = await Promise.all([
        getActivityById(id),
        auth.api.getSession({
            headers: await headers()
        })
    ]);

    if (!activity) notFound();

    const isPast = new Date(activity.datum_start) < new Date();
    
    // Server-side authoritative price determination
    const isMember = session?.user?.membership_status === 'active';
    const price = isMember ? (activity.price_members ?? 0) : (activity.price_non_members ?? 0);

    return (
        <ActivityDetailIsland activity={activity}>
            <EventSignupIsland 
                eventId={Number(activity.id)}
                price={price}
                eventDate={activity.datum_start}
                description={activity.beschrijving || ''}
                isPast={isPast}
                eventName={activity.titel}
                initialUser={session?.user || null}
            />
        </ActivityDetailIsland>
    );
}

export default async function PageActivityId({ params }: PageProps) {
    const { id } = await params;

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<ActivityDetailSkeleton />}>
                <ActivityData id={id} />
            </Suspense>
        </main>
    );
}
