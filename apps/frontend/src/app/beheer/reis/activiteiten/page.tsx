import type { Metadata } from 'next';
import ReisActivitiesIsland from '@/components/islands/beheer/reis/ReisActivitiesIsland';
import type { Signup } from '@/components/islands/beheer/reis/ReisActivitySignupsModal';
import { getTrips, getTripActivities } from '@/server/queries/reis/beheer-reis.queries';
import { notFound } from 'next/navigation';
import { getTripSignupActivitiesAction } from '@/server/actions/beheer/reis/beheer-reis-signups.actions';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
            <BeheerPageShell title="Reis Activiteiten" backHref="/beheer/reis">
                <div className="mx-auto py-20 text-center">
                    <p className="text-base font-bold text-(--beheer-text-muted)">
                        Geen reizen gevonden.
                    </p>
                </div>
            </BeheerPageShell>
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

    allSignups.forEach((s) => {
        const activityId = s.trip_activity_id;
        if (!activityId) return;

        const existing = signupsByActivity.get(activityId);
        if (existing) {
            existing.push(s);
        } else {
            signupsByActivity.set(activityId, [s]);
        }
    });

    const signupsByActivityObj = Object.fromEntries(signupsByActivity.entries());

    return (
        <BeheerPageShell title="Reis Activiteiten" hideToolbar={true}>
            <ReisActivitiesIsland
                initialTrips={trips}
                initialActivities={activities}
                initialSelectedTripId={activeTripId}
                initialSignupsByActivity={signupsByActivityObj}
                tripName={activeTrip.name || 'Onbekende reis'}
            />
        </BeheerPageShell>
    );
}
