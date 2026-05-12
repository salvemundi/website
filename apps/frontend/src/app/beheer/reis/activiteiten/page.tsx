import type { Metadata } from 'next';
import ReisActiviteitenIsland from '@/components/islands/admin/ReisActiviteitenIsland';
import { getTrips, getTripActivities } from '@/server/queries/admin-reis.queries';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { getTripSignupActivitiesAction } from '@/server/actions/admin/reis-signups.actions';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Signup {
    id: number;
    trip_activity_id: number | { id: number };
    trip_signup_id?: { id?: number; first_name: string; last_name: string; email: string };
    selected_options?: string | Record<string, boolean> | string[];
    [key: string]: unknown;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    let title = 'Reis activiteiten beheer | SV Salve Mundi';

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
        } catch (_error) { }
    }

    return { title };
}

export default async function ReisActiviteitenPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const trips = await getTrips();

    if (!trips || trips.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p className="text-[var(--beheer-text-muted)] font-bold text-base">
                    Geen reizen gevonden.
                </p>
            </div>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    const [activities, allSignups] = await Promise.all([
        getTripActivities(activeTripId),
        getTripSignupActivitiesAction(activeTripId)
    ]);

    const signupsByActivity = new Map<number, Signup[]>();

    (allSignups as unknown as Signup[] || []).forEach((s) => {
        const activityId = (s.trip_activity_id && typeof s.trip_activity_id === 'object')
            ? s.trip_activity_id.id
            : (s.trip_activity_id as number);

        if (!signupsByActivity.has(activityId)) {
            signupsByActivity.set(activityId, []);
        }

        signupsByActivity.get(activityId)?.push(s);
    });

    const signupsByActivityObj = Object.fromEntries(signupsByActivity.entries()) as unknown as Record<number, Signup[]>;

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-[var(--beheer-text)] tracking-tighter italic">
                    Reis <span className="text-[var(--beheer-accent)]">activiteiten</span>
                </h1>
                <p className="text-base font-medium text-[var(--beheer-text-muted)]">
                    Beheer de activiteiten en inschrijvingen voor {activeTrip.name}.
                </p>
            </div>

            <ReisActiviteitenIsland
                initialTrips={trips}
                initialActivities={activities}
                initialSelectedTripId={activeTripId}
                initialSignupsByActivity={signupsByActivityObj}
            />
        </div>
    );
}