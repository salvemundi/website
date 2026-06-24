import type { Metadata } from 'next';
import ReisActiviteitenIsland from '@/components/islands/admin/ReisActiviteitenIsland';
import { getTrips, getTripActivities } from '@/server/queries/admin-reis.queries';
import { notFound } from 'next/navigation';
import { getTripSignupActivitiesAction } from '@/server/actions/admin/reis-signups.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";

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
            const trip = await db.query.trips.findFirst({
                where: eq(schema.trips.id, Number(tripIdParam)),
                columns: { name: true }
            });
            if (trip && trip.name) {
                title = `${trip.name} - Activiteiten | SV Salve Mundi`;
            }
        } catch (error) {
            safeConsoleError('[page.tsx][generateMetadata] ', error);
        }
    }

    return { title };
}

export default async function ReisActiviteitenPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const trips = await getTrips();

    if (trips.length === 0) {
        return (
            <AdminPageShell title="Reis Activiteiten" backHref="/beheer/reis">
                <div className="py-20 text-center mx-auto">
                    <p className="text-(--beheer-text-muted) font-bold text-base">
                        Geen reizen gevonden.
                    </p>
                </div>
            </AdminPageShell>
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

    const signupsArray = allSignups as unknown as Signup[];
    signupsArray.forEach((s) => {
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
        <AdminPageShell
            title={`Reis Activiteiten — ${activeTrip.name}`}
            subtitle="Beheer activiteiten en inschrijvingen per activiteit"
            backHref="/beheer/reis"
        >
            <ReisActiviteitenIsland
                initialTrips={trips}
                initialActivities={activities}
                initialSelectedTripId={activeTripId}
                initialSignupsByActivity={signupsByActivityObj}
            />
        </AdminPageShell>
    );
}
