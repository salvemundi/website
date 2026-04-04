import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import ReisDeelnemerDetailIsland from '@/components/islands/admin/ReisDeelnemerDetailIsland';
import { Loader2, User } from 'lucide-react';
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

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<DeelnemerDetailLoader />}>
                <DeelnemerDataWrapper signupId={signupId} />
            </Suspense>
        </main>
    );
}

import { getTripSignup, getTripSignupActivitiesAction } from '@/server/actions/reis-admin-signups.actions';

async function DeelnemerDataWrapper({ signupId }: { signupId: number }) {
    // 1. Fetch signup details using the direct-database action
    const signup = await getTripSignup(signupId);
    
    if (!signup || !signup.trip_id) {
        notFound();
    }

    const tripId = signup.trip_id;

    // 2. Fetch related data (trips for dropdown, activities for trip, and selected activities)
    // We can still use Directus for static metadata like trips and activity definitions, 
    // but we use the new action for the real-time signup activities.
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
            const saSignupId = typeof sa.trip_signup_id === 'object' ? sa.trip_signup_id.id : sa.trip_signup_id;
            return saSignupId === signupId;
        })
        .map((a: any) => typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id);

    return (
        <ReisDeelnemerDetailIsland 
            initialSignup={{ ...signup, date_created: signup.created_at } as any}
            trips={trips as any}
            allActivities={activities as any}
            initialSelectedActivities={(signupActivities || []).map((a: any) => 
                typeof a.trip_activity_id === 'object' ? a.trip_activity_id.id : a.trip_activity_id
            )}
        />
    );
}

function DeelnemerDetailLoader() {
    return (
        <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--beheer-accent)] mb-4" />
            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-xs">Deelnemer laden...</p>
        </div>
    );
}
