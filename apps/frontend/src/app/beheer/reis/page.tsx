import { Suspense } from 'react';
import type { Metadata } from 'next';

// V7 Specifics
import AdminReisDashboardSkeleton from '@/components/ui/admin/AdminReisDashboardSkeleton';
import AdminReisSelectorIsland from '@/components/islands/admin/AdminReisSelectorIsland';
import AdminReisTableIsland from '@/components/islands/admin/AdminReisTableIsland';
import { Plane, Plus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getReisSiteSettings } from '@/server/actions/reis.actions';

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
            const trip = await getSystemDirectus().request(readItems('trips', {
                filter: { id: { _eq: Number(tripIdParam) } },
                fields: ['name'] as any,
                limit: 1
            }));
            if (trip && trip[0]) {
                title = `${trip[0].name} - Aanmeldingen | SV Salve Mundi`;
            }
        } catch (e) {
            // Fallback to default
        }
    }

    return { title };
}

export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    // We pass searchParams down to the content component which handles the actual fetching
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <AdminReisDashboardSkeleton />
                </div>
            }>
                <AdminReisDashboardContent searchParams={searchParams} />
            </Suspense>
        </main>
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
            getSystemDirectus().request(readItems('trips', {
                fields: ['id', 'name', 'event_date', 'start_date', 'end_date', 'allow_final_payments'] as any,
                sort: ['-event_date'],
                limit: -1
            })),
            getReisSiteSettings()
        ]);
        
        trips = tripsRes || [];
        reisSettings = settingsRes || { show: true };
    } catch (e) {
        console.error('[AdminReisPage] Error fetching dashboard data:', e);
    }

    if (!trips || trips.length === 0) {
        return (
            <>
                {/* Toolbar is now part of the island or dashboard skeleton should handle it */}
                <NoTripsView />
            </>
        );
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
                <Suspense fallback={<AdminReisDashboardSkeleton />} key={activeTrip.id}>
                    <AdminReisSignupsTable tripId={activeTrip.id} trip={activeTrip} />
                </Suspense>
            </div>
        </div>
    );
}


async function AdminReisSignupsTable({ tripId, trip }: { tripId: number, trip: any }) {
    // Fetch signups and their activities in parallel
    let signups: any[] = [];
    let allSignupActivities: any[] = [];
    
    try {
        [signups, allSignupActivities] = await Promise.all([
            getSystemDirectus().request(readItems('trip_signups', {
                filter: { trip_id: { _eq: tripId } },
                fields: [
                    'id', 'first_name', 'last_name', 'email', 'phone_number', 
                    'date_of_birth', 'id_document', 'document_number', 'allergies', 
                    'special_notes', 'willing_to_drive', 'role', 'status', 'deposit_paid', 
                    'deposit_paid_at', 'deposit_email_sent', 'full_payment_paid', 
                    'full_payment_paid_at', 'final_email_sent', 'created_at'
                ] as any,
                sort: ['-id'],
                limit: -1
            })),
            Promise.resolve([]) // Placeholder for proper sequential fetch
        ]);

        const signupIds = (signups || []).map(s => s.id);
        if (signupIds.length > 0) {
            allSignupActivities = await getSystemDirectus().request(readItems('trip_signup_activities', {
                filter: { 
                    trip_signup_id: { _in: signupIds } 
                },
                fields: ['id', 'trip_signup_id', 'selected_options', { trip_activity_id: ['id', 'name'] }] as any,
                limit: -1
            })).catch(() => []);
        }

    } catch (e: any) {
        console.error('[AdminReisSignupsTable] Error fetching signups data:', e.message, e?.errors || e);
    }

    // Initialize map for all signups to avoid "Loading..." state in UI
    const activitiesMap: Record<number, any[]> = {};
    (signups || []).forEach(s => {
        activitiesMap[s.id] = [];
    });

    // Group activities by signupId
    (allSignupActivities || []).forEach((sa: any) => {
        const signupId = typeof sa.trip_signup_id === 'object' ? (sa.trip_signup_id as any).id : sa.trip_signup_id;
        if (activitiesMap[signupId]) {
            activitiesMap[signupId].push(sa);
        }
    });

    const stats = {
        total: signups.filter((s: any) => s.status !== 'cancelled').length,
        confirmed: signups.filter((s: any) => s.status === 'confirmed' || s.status === 'registered').length,
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
