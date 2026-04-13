import { Suspense } from 'react';
import type { Metadata } from 'next';

// V7 Specifics
import AdminReisSelectorIsland from '@/components/islands/admin/AdminReisSelectorIsland';
import AdminReisTableIsland from '@/components/islands/admin/AdminReisTableIsland';
import { Plane, Plus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReisSiteSettings } from '@/server/actions/reis.actions';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import { getAdminTrips, getAdminTripById } from '@/server/actions/reis-admin-core.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const dynamic = 'force-dynamic';

interface AdminReisPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: AdminReisPageProps): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;
    
    let title = 'Beheer Reis | SV Salve Mundi';
    
    if (tripIdParam) {
        try {
            const trip = await getAdminTripById(Number(tripIdParam));
            if (trip) {
                title = `${trip.name} - Aanmeldingen | SV Salve Mundi`;
            }
        } catch (e) {
            // Fallback to default
        }
    }

    return { title };
}

/**
 * AdminReisPage: Zero-Drift Modernization.
 * Migrated to AdminPageShell for consistent sidebar/toolbar rendering.
 * Uses nested Suspense with AdminReisSelectorIsland and AdminReisTableIsland 
 * to ensure immediate layout rendering while data streams in from the database.
 */
export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    const { user } = await checkAdminAccess();

    return (
        <AdminPageShell
            title="Reis Beheer"
            subtitle="Beheer aanmeldingen, betalingen en activiteiten voor de studiereis"
            backHref="/beheer"
        >
            <Suspense fallback={
                <div className="space-y-0">
                    <AdminReisSelectorIsland isLoading={true} />
                    <div className="container mx-auto px-4 py-8 max-w-7xl">
                        <AdminReisTableIsland isLoading={true} initialSignups={[]} initialSignupActivities={{}} trip={{} as any} />
                    </div>
                </div>
            }>
                <AdminReisDashboardContent searchParams={searchParams} />
            </Suspense>
        </AdminPageShell>
    );
}

/**
 * Internal Server Component to handle the sequential data fetching.
 */
async function AdminReisDashboardContent({ searchParams }: AdminReisPageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    let trips: any[] = [];
    let reisSettings = { show: true };
    
    try {
        const [tripsRes, settingsRes] = await Promise.all([
            getAdminTrips(),
            getReisSiteSettings()
        ]);
        
        trips = tripsRes || [];
        reisSettings = settingsRes || { show: true };
    } catch (e) {
        
    }

    if (!trips || trips.length === 0) {
        return <NoTripsView />;
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find((t) => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    return (
        <div className="min-h-screen pb-20">
            <AdminReisSelectorIsland 
                trips={trips} 
                initialSettings={reisSettings}
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Nested suspense for the signups table to allow the selector to render early */}
                <Suspense fallback={<AdminReisTableIsland isLoading={true} initialSignups={[]} initialSignupActivities={{}} trip={activeTrip} />} key={activeTrip.id}>
                    <AdminReisSignupsTable tripId={activeTrip.id} trip={activeTrip} />
                </Suspense>
            </div>
        </div>
    );
}


import { getTripSignups, getTripSignupActivitiesAction } from '@/server/actions/reis-admin-signups.actions';

async function AdminReisSignupsTable({ tripId, trip }: { tripId: number, trip: any }) {
    // Fetch signups and their activities in parallel
    let signups: any[] = [];
    let allSignupActivities: any[] = [];
    
    try {
        [signups, allSignupActivities] = await Promise.all([
            getTripSignups(tripId),
            getTripSignupActivitiesAction(tripId)
        ]);
    } catch (e: any) {
        
    }

    // Initialize map for all signups to avoid "Loading..." state in UI
    const activitiesMap: Record<number, any[]> = {};
    (signups || []).forEach(s => {
        activitiesMap[s.id] = [];
    });

    // Group activities by signupId
    (allSignupActivities || []).forEach((sa: any) => {
        const signupId = (sa.trip_signup_id && typeof sa.trip_signup_id === 'object') ? (sa.trip_signup_id as any).id : sa.trip_signup_id;
        if (activitiesMap[signupId]) {
            activitiesMap[signupId].push(sa);
        }
    });

    const stats = {
        total: signups.filter((s: any) => s.status !== 'cancelled').length,
        confirmed: signups.filter((s: any) => s.status === 'confirmed').length,
        waitlist: signups.filter((s: any) => s.status === 'waitlist').length,
        depositPaid: signups.filter((s: any) => s.deposit_paid).length,
        fullPaid: signups.filter((s: any) => s.full_payment_paid).length,
    };

    return (
        <AdminReisTableIsland
            initialSignups={(signups || []).map(s => ({ ...s, date_created: s.created_at })) as any}
            initialSignupActivities={activitiesMap}
            trip={trip}
            stats={stats}
        />
    );
}

function NoTripsView() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] p-12 shadow-xl border border-[var(--beheer-border)] animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <Plane className="h-10 w-10 rotate-45" />
                </div>
                <h2 className="text-3xl font-black text-[var(--beheer-text)] uppercase tracking-tighter mb-2">Geen reizen gevonden</h2>
                <p className="text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest text-xs mb-8">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>
                
                <Link 
                    href="/beheer/reis/instellingen"
                    className="inline-flex items-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] transition-all hover:scale-[1.02] active:scale-95 group"
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    <span>Nieuwe reis aanmaken</span>
                </Link>
            </div>
        </div>
    );
}
