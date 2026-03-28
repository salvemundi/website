import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PageHeader from '@/components/ui/layout/PageHeader';
import ReisDeelnemerDetailIsland from '@/components/islands/admin/ReisDeelnemerDetailIsland';
import { Loader2 } from 'lucide-react';
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
            <PageHeader 
                title="Deelnemer Bewerken" 
                backLink="/beheer/reis"
            />
            
            <Suspense fallback={<DeelnemerDetailLoader />}>
                <DeelnemerDataWrapper signupId={signupId} />
            </Suspense>
        </main>
    );
}

async function DeelnemerDataWrapper({ signupId }: { signupId: number }) {
    const directus = getSystemDirectus();

    // 1. Fetch signup details
    const signups = await directus.request(readItems('trip_signups', {
        filter: { id: { _eq: signupId } },
        fields: [
            'id', 'first_name', 'last_name', 'email', 'phone_number', 
            'date_of_birth', 'id_document', 'document_number', 'allergies', 
            'special_notes', 'willing_to_drive', 'role', 'status', 'deposit_paid', 
            'deposit_paid_at', 'full_payment_paid', 'full_payment_paid_at', 'created_at',
            { trip_id: ['id', 'name'] }
        ] as any,
        limit: 1
    }));

    const signup = signups?.[0];
    
    if (!signup || !signup.trip_id) {
        notFound();
    }

    const tripId = typeof (signup as any).trip_id === 'object' ? (signup as any).trip_id.id : (signup as any).trip_id;

    // 2. Fetch related data (trips for dropdown, activities for trip, and selected activities)
    const [trips, activities, signupActivities] = await Promise.all([
        directus.request(readItems('trips', {
            fields: ['id', 'name'] as any,
            sort: ['-event_date']
        })),
        directus.request(readItems('trip_activities', {
            filter: { trip_id: { _eq: tripId } },
            fields: ['id', 'name', 'price'] as any,
            sort: ['display_order']
        })),
        directus.request(readItems('trip_signup_activities', {
            filter: { trip_signup_id: { _eq: signupId } },
            fields: ['trip_activity_id'] as any,
            limit: -1
        }))
    ]);

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
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--theme-purple)] mb-4" />
            <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Gegevens laden...</p>
        </div>
    );
}
