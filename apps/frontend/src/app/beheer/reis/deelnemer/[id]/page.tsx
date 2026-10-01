import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReisParticipantDetailIsland from '@/components/islands/beheer/reis/ReisParticipantDetailIsland';
import { getTrips, getTripActivities } from '@/server/queries/reis/beheer-reis.queries';
import { getTripSignup, getTripSignupActivitiesAction } from '@/server/actions/beheer/reis/beheer-reis-signups.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";

interface PageProps {
    params: Promise<{ id: string }>;
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
    const { id } = await params;
    const signupId = parseInt(id);

    const signup = await getTripSignup(signupId);
    if (!signup || !signup.trip_id) {
        notFound();
    }

    const tripId = Number(signup.trip_id);

    const [trips, activities, signupActivities] = await Promise.all([
        getTrips(),
        getTripActivities(tripId),
        getTripSignupActivitiesAction(tripId)
    ]);

    const participantActivities = signupActivities
        .filter((sa) => sa.trip_signup_id === signupId && sa.trip_activity_id !== null)
        .map((sa) => sa.trip_activity_id as number);

    return (
        <div className="w-full">
            <ReisParticipantDetailIsland
                initialSignup={signup}
                trips={trips}
                allActivities={activities}
                initialSelectedActivities={participantActivities}
            />
        </div>
    );
}