import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';


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
import type { Trip, TripSignup, TripSignupActivity } from '@salvemundi/validations';



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
 * All data is pre-fetched on the server-side before flushing content to the client 
 * to ensure maximum stability and zero layout shift.
 */
export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    const { user } = await checkAdminAccess();
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    // Fetch initial trips and settings concurrently
    let trips: Trip[] = [];
    let reisSettings = { show: true };
    let errorMsg: string | null = null;
    
    try {
        const [tripsRes, settingsRes] = await Promise.all([
            getAdminTrips(),
            getReisSiteSettings()
        ]);
        
        trips = (tripsRes as unknown as Trip[]) || [];
        reisSettings = settingsRes || { show: true };
    } catch (e: unknown) {
        errorMsg = (e instanceof Error) ? e.message : 'Interne serverfout';
    }

    if (errorMsg === 'Forbidden: Reis Admin rechten vereist voor reisbeheer' || errorMsg === 'Niet geautoriseerd') {
        return (
            <AdminUnauthorized 
                title="Geen Toegang"
                description={errorMsg}
            />
        );
    }

    if (!trips || trips.length === 0) {
        return (
            <AdminPageShell
                title="Reis Beheer"
                subtitle="Beheer aanmeldingen, betalingen en activiteiten voor de studiereis"
                backHref="/beheer"
            >
                <NoTripsView />
            </AdminPageShell>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0]?.id;
    const activeTrip = trips.find((t) => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    // Now fetch signups and activities for the active trip concurrently
    let signups: TripSignup[] = [];
    let allSignupActivities: TripSignupActivity[] = [];
    
    try {
        const [sRes, saRes] = await Promise.all([
            getTripSignups(activeTrip.id as number),
            getTripSignupActivitiesAction(activeTrip.id as number)
        ]);
        signups = (sRes as unknown as TripSignup[]) || [];
        allSignupActivities = (saRes as unknown as TripSignupActivity[]) || [];
    } catch (e: unknown) {
        // Log or handle error
    }

    // Group activities by signupId
    const activitiesMap: Record<number, TripSignupActivity[]> = {};
    (signups || []).forEach(s => {
        activitiesMap[s.id as number] = [];
    });
    (allSignupActivities || []).forEach((sa) => {
        const signupId = (sa.trip_signup_id && typeof sa.trip_signup_id === 'object') ? (sa.trip_signup_id as Record<string, unknown>).id : sa.trip_signup_id;
        if (activitiesMap[signupId as number]) {
            activitiesMap[signupId as number].push(sa);
        }
    });

    const stats = {
        total: signups.filter((s) => s.status !== 'cancelled').length,
        confirmed: signups.filter((s) => s.status === 'confirmed').length,
        waitlist: signups.filter((s) => s.status === 'waitlist').length,
        depositPaid: signups.filter((s) => s.deposit_paid).length,
        fullPaid: signups.filter((s) => s.full_payment_paid).length,
    };

    return (
        <AdminPageShell
            title="Reis Beheer"
            subtitle="Beheer aanmeldingen, betalingen en activiteiten voor de studiereis"
            backHref="/beheer"
        >
            <div className="pb-20 space-y-8 animate-in fade-in duration-700">
                <AdminReisSelectorIsland 
                    trips={trips} 
                    initialSettings={reisSettings}
                />

                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-[var(--beheer-text)] tracking-tight">
                                {activeTrip.name}
                            </h2>
                            <p className="text-xs font-semibold text-[var(--beheer-text-muted)] tracking-widest uppercase opacity-70">
                                Overzicht van alle aanmeldingen
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--beheer-card-bg)] rounded-xl border border-[var(--beheer-border)] shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-[var(--beheer-active)] animate-pulse" />
                            <span className="text-[10px] font-bold text-[var(--beheer-text-muted)] tracking-widest uppercase">
                                Live Data
                            </span>
                        </div>
                    </div>

                    <AdminReisTableIsland
                        initialSignups={signups}
                        initialSignupActivities={activitiesMap}
                        trip={activeTrip as Trip}
                        stats={stats}
                    />
                </div>
            </div>
        </AdminPageShell>
    );
}

import { getTripSignups, getTripSignupActivitiesAction } from '@/server/actions/reis-admin-signups.actions';

function NoTripsView() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] p-12 shadow-xl border border-[var(--beheer-border)] animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <Plane className="h-10 w-10 rotate-45" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--beheer-text)] tracking-tight mb-2">Geen reizen gevonden</h2>
                <p className="text-[var(--beheer-text-muted)] font-medium text-base mb-8">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>
                
                <Link 
                    href="/beheer/reis/instellingen"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--beheer-accent)] text-white rounded-xl font-semibold tracking-widest text-base shadow-lg transition-all hover:scale-[1.02] active:scale-95 group"
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    <span>Nieuwe reis aanmaken</span>
                </Link>
            </div>
        </div>
    );
}
