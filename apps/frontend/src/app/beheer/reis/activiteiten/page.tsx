import { Suspense } from 'react';
import type { Metadata } from 'next';
import PageHeader from '@/components/ui/layout/PageHeader';
import ReisActiviteitenIsland from '@/components/islands/admin/ReisActiviteitenIsland';
import { Loader2 } from 'lucide-react';
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Suspense fallback={
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-purple-600" />
                </div>
            }>
                <ReisActiviteitenLoader searchParams={searchParams} />
            </Suspense>
        </div>
    );
}

async function ReisActiviteitenLoader({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const trips = await getSystemDirectus().request(readItems('trips', {
        fields: ['id', 'name'] as any,
        sort: ['-event_date']
    }));

    if (!trips || trips.length === 0) {
        return (
            <>
                <PageHeader title="Trip Activiteiten Beheer" backLink="/beheer/reis" />
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-slate-500">Geen reizen gevonden.</p>
                </div>
            </>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    // Parallel fetch activities and all their signups for this trip
    const [activities, allSignups] = await Promise.all([
        getSystemDirectus().request(readItems('trip_activities', {
            filter: { trip_id: { _eq: activeTripId } },
            fields: ['id', 'name', 'description', 'price', 'display_order', 'max_participants', 'max_selections', 'is_active', 'image', 'options'] as any,
            sort: ['display_order', 'name']
        })),
        getSystemDirectus().request(readItems('trip_signup_activities', {
            filter: { 
                trip_activity_id: { 
                    trip_id: { _eq: activeTripId }
                } 
            },
            fields: ['id', 'trip_activity_id', 'selected_options', { trip_signup_id: ['id', 'first_name', 'middle_name', 'last_name', 'email'] }] as any,
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
        <>
            <PageHeader 
                title={`Activiteiten: ${activeTrip.name}`} 
                description="Beheer de optionele activiteiten en kosten voor reizen"
                backLink="/beheer/reis"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
            />
            <ReisActiviteitenIsland 
                initialTrips={trips as any} 
                initialActivities={activities as any}
                initialSelectedTripId={activeTripId}
                initialSignupsByActivity={signupsByActivity}
            />
        </>
    );
}
