import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import ReisDeelnemerDetailIsland from '@/components/islands/admin/ReisDeelnemerDetailIsland';
import { User } from 'lucide-react';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const signupId = parseInt(id);

    try {
        const signup = await getSystemDirectus().request(readItems('trip_signups', {
            filter: { id: { _eq: signupId } },
            fields: ['first_name', 'last_name'] as any,
            limit: 1
        }));

        if (signup && signup[0]) {
            return {
                title: `Deelnemer: ${signup[0].first_name} ${signup[0].last_name} | SV Salve Mundi`
            };
        }
    } catch (e) {}

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

    const tripId = signup.trip_id;

    // Fetch related data (trips for dropdown, activities for trip, and selected activities)
    const [trips, activities, signupActivities] = await Promise.all([
        getSystemDirectus().request(readItems('trips', {
            fields: ['id', 'name'] as any,
            sort: ['-event_date']
        })),
        getSystemDirectus().request(readItems('trip_activities', {
            filter: { trip_id: { _eq: tripId } },
            fields: ['id', 'name', 'price'] as any,
            sort: ['display_order']
        })),
        getTripSignupActivitiesAction(tripId)
    ]);
    
    // Filter signupActivities for this specific participant
    const participantActivities = signupActivities
        .filter((sa: any) => {
            const saSignupId = (sa.trip_signup_id && typeof sa.trip_signup_id === 'object') ? sa.trip_signup_id.id : sa.trip_signup_id;
            return saSignupId === signupId;
        })
        .map((a: any) => typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id);

    return (
        <div className="w-full">
            <ReisDeelnemerDetailIsland 
                initialSignup={signup}
                trips={trips as any}
                allActivities={activities as any}
                initialSelectedActivities={participantActivities}
            />
        </div>
    );
}


import { getTripSignup, getTripSignupActivitiesAction } from '@/server/actions/reis-admin-signups.actions';


