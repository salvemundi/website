import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReisDeelnemerDetailIsland from '@/components/islands/admin/ReisDeelnemerDetailIsland';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Trip, TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { getTripSignup, getTripSignupActivitiesAction } from '@/server/actions/admin/reis-signups.actions';

interface PageProps {
    params: Promise<{ id: string }>;
}

interface RawSignupActivity {
    trip_signup_id: number | { id: number };
    trip_activity_id: number | { id: number };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const signupId = parseInt(id);

    try {
        const signup = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { id: { _eq: signupId } },
            fields: ['first_name', 'last_name'],
            limit: 1
        }));

        if (signup && signup[0]) {
            return {
                title: `Deelnemer: ${signup[0].first_name} ${signup[0].last_name} | SV Salve Mundi`
            };
        }
    } catch (_error) {
        // Silent catch for metadata resilience
    }

    return { title: 'Deelnemer Details | SV Salve Mundi' };
}

export default async function DeelnemerDetailPage({ params }: PageProps) {
    const { id } = await params;
    const signupId = parseInt(id);

    // NUCLEAR SSR: Fetch participant and trip data before flushing ANY part of the page
    const signup = await getTripSignup(signupId);
    if (!signup || !signup.trip_id) {
        notFound();
    }

    const tripId = (signup.trip_id && typeof signup.trip_id === 'object')
        ? (signup.trip_id as { id: number }).id
        : (signup.trip_id as number);
    // Fetch related data (trips for dropdown, activities for trip, and selected activities)
    const [trips, activities, signupActivities] = await Promise.all([
        getSystemDirectus().request(readItems('trips', {
            fields: ['id', 'name', 'start_date', 'max_participants', 'base_price', 'crew_discount', 'deposit_amount'],
            sort: ['-start_date']
        })),
        getSystemDirectus().request(readItems('trip_activities', {
            filter: { trip_id: { _eq: tripId } },
            fields: ['id', 'name', 'price', 'display_order', 'is_active', 'trip_id'],
            sort: ['display_order']
        })),
        getTripSignupActivitiesAction(tripId)
    ]);

    // Filter signupActivities for this specific participant with type safety
    const participantActivities = (signupActivities as unknown as RawSignupActivity[])
        .filter((sa) => {
            const saSignupId = typeof sa.trip_signup_id === 'object' ? sa.trip_signup_id.id : sa.trip_signup_id;
            return saSignupId === signupId;
        })
        .map((sa) => typeof sa.trip_activity_id === 'object' ? sa.trip_activity_id.id : sa.trip_activity_id);

    return (
        <div className="w-full">
            <ReisDeelnemerDetailIsland
                initialSignup={signup}
                trips={trips as unknown as Trip[]}
                allActivities={activities as unknown as TripActivity[]}
                initialSelectedActivities={participantActivities as number[]}
            />
        </div>
    );
}