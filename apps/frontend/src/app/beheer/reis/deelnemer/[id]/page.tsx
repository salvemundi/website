import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReisParticipantDetailIsland from '@/components/islands/admin/reis/ReisParticipantDetailIsland';
import { getTrips, getTripActivities } from '@/server/queries/reis/admin-reis.queries';
import { Trip, TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';
import { getTripSignup, getTripSignupActivitiesAction } from '@/server/actions/admin/reis/admin-reis-signups.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPermissions } from '@/shared/lib/permissions';
import { redirect } from 'next/navigation';

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
        const signup = await db.query.trip_signups.findFirst({
            where: eq(schema.trip_signups.id, signupId),
            columns: { first_name: true, last_name: true }
        });

        if (signup) {
            return {
                title: `Deelnemer: ${signup.first_name} ${signup.last_name} | SV Salve Mundi`
            };
        }
    } catch (error) {
        safeConsoleError('[page.tsx][generateMetadata] ', error);
    }

    return { title: 'Deelnemer Details | SV Salve Mundi' };
}

export default async function ReisParticipantPage({ params }: PageProps) {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');
    const permissions = getPermissions(session.user.committees);
    if (!permissions.includes('reis')) {
        return <AdminUnauthorized title="Deelnemer Details" backHref="/beheer/reis" />;
    }

    const { id } = await params;
    const signupId = parseInt(id);

    const signup = await getTripSignup(signupId);
    if (!signup || !signup.trip_id) {
        notFound();
    }

    const tripId = (signup.trip_id && typeof signup.trip_id === 'object')
        ? (signup.trip_id as { id: number }).id
        : (signup.trip_id as number);

    const [trips, activities, signupActivities] = await Promise.all([
        getTrips(),
        getTripActivities(tripId),
        getTripSignupActivitiesAction(tripId)
    ]);

    const participantActivities = (signupActivities as unknown as RawSignupActivity[])
        .filter((sa) => {
            const saSignupId = typeof sa.trip_signup_id === 'object' ? sa.trip_signup_id.id : sa.trip_signup_id;
            return saSignupId === signupId;
        })
        .map((sa) => typeof sa.trip_activity_id === 'object' ? sa.trip_activity_id.id : sa.trip_activity_id);

    return (
        <div className="w-full">
            <ReisParticipantDetailIsland
                initialSignup={signup}
                trips={trips as unknown as Trip[]}
                allActivities={activities as unknown as TripActivity[]}
                initialSelectedActivities={participantActivities as number[]}
            />
        </div>
    );
}