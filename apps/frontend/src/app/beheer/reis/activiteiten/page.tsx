import type { Metadata } from 'next';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import ReisActiviteitenIsland from '@/components/islands/admin/ReisActiviteitenIsland';
import { Layers } from 'lucide-react';
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
                fields: ['name'],
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
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    // NUCLEAR SSR: Fetch all data before flushing ANY part of the page
    const trips = await getTrips();

    if (!trips || trips.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p className="text-[var(--beheer-text-muted)] font-black tracking-widest text-base">Geen reizen gevonden.</p>
            </div>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    // Parallel fetch activities and all their signups for this trip using direct-database action
    const [activities, allSignups] = await Promise.all([
        getTripActivities(activeTripId),
        getTripSignupActivitiesAction(activeTripId)
    ]);

    // Group signups by activityId
    const signupsByActivity: Record<number, any[]> = {};
    (allSignups || []).forEach((s: any) => {
        const activityId = typeof s.trip_activity_id === 'object' ? s.trip_activity_id.id : s.trip_activity_id;
        if (!signupsByActivity[activityId]) signupsByActivity[activityId] = [];
        signupsByActivity[activityId].push(s);
    });

    return (
        <div className="w-full">
            <ReisActiviteitenIsland 
                initialTrips={trips} 
                initialActivities={activities}
                initialSelectedTripId={activeTripId}
                initialSignupsByActivity={signupsByActivity}
            />
        </div>
    );
}


import { getTripSignupActivitiesAction } from '@/server/actions/reis-admin-signups.actions';


