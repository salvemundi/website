import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/ui/layout/PageHeader';
import { getTripSignup, getTrips, getTripActivities, getSignupActivities } from '@/server/actions/admin-reis.actions';
import ReisDeelnemerDetailIsland from '@/components/islands/admin/ReisDeelnemerDetailIsland';
import { Loader2 } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
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
    const signup = await getTripSignup(signupId);
    
    if (!signup || !signup.trip_id) {
        notFound();
    }

    // Fetch related data
    const [trips, activities, signupActivities] = await Promise.all([
        getTrips(),
        getTripActivities(signup.trip_id),
        getSignupActivities(signupId)
    ]);

    return (
        <ReisDeelnemerDetailIsland 
            initialSignup={signup}
            trips={trips}
            allActivities={activities}
            initialSelectedActivities={signupActivities.map(a => 
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
