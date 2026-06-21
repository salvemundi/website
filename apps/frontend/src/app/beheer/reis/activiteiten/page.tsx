import type { Metadata } from 'next';
import ReisActiviteitenIsland from '@/components/islands/admin/ReisActiviteitenIsland';
import { getTrips, getTripActivities } from '@/server/queries/admin-reis.queries';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { getTripSignupActivitiesAction } from '@/server/actions/admin/reis-signups.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { safeConsoleError } from '@/server/utils/logger';

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
            if (trip[0]) {
                title = `${trip[0].name} - Activiteiten | SV Salve Mundi`;
            }
        } catch (error) {
            safeConsoleError('[ReisActiviteitenPage][generateMetadata]', error);
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
            actions={
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-(--beheer-card-soft) px-4 py-2 rounded-2xl border border-(--beheer-border)/50 shadow-sm mr-2">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1">Activiteiten</span>
                            <span className="text-sm font-bold text-(--beheer-accent) leading-none">{activities.length}</span>
                        </div>
                    </div>
                    <Link
                        href={`/beheer/reis?tripId=${activeTripId}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text) rounded-xl text-[11px] font-semibold hover:border-(--beheer-accent)/50 transition-all shadow-sm"
                    >
                        <Ticket className="h-3.5 w-3.5 text-(--beheer-accent)" />
                        Dashboard
                    </Link>
                </div>
            }
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