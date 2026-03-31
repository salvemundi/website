import { Suspense } from 'react';
import type { Metadata } from 'next';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import ReisActiviteitenIsland from '@/components/islands/admin/ReisActiviteitenIsland';
import { Loader2, Layers } from 'lucide-react';
import { getTrips, getTripActivities } from '@/server/queries/admin-reis.queries';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;
    
    let title = 'Trip Activiteiten Beheer | SV Salve Mundi';
    
    if (tripIdParam) {
        try {
            const trip = await getSystemDirectus().request(readItems('trips', {
                filter: { id: { _eq: Number(tripIdParam) } },
                fields: ['name'] as any,
                limit: 1
            }));
            if (trip && trip[0]) {
                title = `${trip[0].name} - Activiteiten | SV Salve Mundi`;
            }
        } catch (e) {}
    }

    return { title };
}

export default async function ReisActiviteitenPage({ searchParams }: PageProps) {
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin h-12 w-12 text-[var(--beheer-accent)] mb-4" />
                    <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-xs">Activiteiten laden...</p>
                </div>
            }>
                <ReisActiviteitenLoader searchParams={searchParams} />
            </Suspense>
        </main>
    );
}

async function ReisActiviteitenLoader({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const trips = await getTrips();

    if (!trips || trips.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-xs">Geen reizen gevonden.</p>
            </div>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    // Parallel fetch activities and all their signups for this trip
    const [activities, allSignups] = await Promise.all([
        getTripActivities(activeTripId),
        getSystemDirectus().request(readItems('trip_signup_activities', {
            filter: { 
                trip_activity_id: { 
                    trip_id: { _eq: activeTripId }
                } 
            },
            fields: ['id', 'trip_activity_id', 'selected_options', { trip_signup_id: ['id', 'first_name', 'last_name', 'email'] }] as any,
            limit: -1
        }))
    ]);

    // Group signups by activityId
    const signupsByActivity: Record<number, any[]> = {};
    (allSignups || []).forEach((s: any) => {
        const activityId = typeof s.trip_activity_id === 'object' ? s.trip_activity_id.id : s.trip_activity_id;
        if (!signupsByActivity[activityId]) signupsByActivity[activityId] = [];
        signupsByActivity[activityId].push(s);
    });

    return (
        <ReisActiviteitenIsland 
            initialTrips={trips as any} 
            initialActivities={activities as any}
            initialSelectedTripId={activeTripId}
            initialSignupsByActivity={signupsByActivity}
        />
    );
}
