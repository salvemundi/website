import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';


// V7 Specifics
import AdminReisTableIsland from '@/components/islands/admin/AdminReisTableIsland';
import { Ticket, Plus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReisSiteSettings } from '@/server/actions/reis.actions';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import { getAdminTrips, getAdminTripById } from '@/server/actions/reis-admin-core.actions';
import { getTripSignups, getTripSignupActivitiesAction } from '@/server/actions/reis-admin-signups.actions';
import { getTripActivities } from '@/server/queries/admin-reis.queries';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import type { Trip, TripSignup, TripSignupActivity, TripActivity } from '@salvemundi/validations';



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
    let allSignupSelections: TripSignupActivity[] = [];
    let allTripActivities: TripActivity[] = [];
    
    try {
        const [sRes, saRes, activitiesRes] = await Promise.all([
            getTripSignups(activeTrip.id as number),
            getTripSignupActivitiesAction(activeTrip.id as number),
            getTripActivities(activeTrip.id as number)
        ]);
        signups = (sRes as unknown as TripSignup[]) || [];
        allSignupSelections = (saRes as unknown as TripSignupActivity[]) || [];
        allTripActivities = (activitiesRes as unknown as TripActivity[]) || [];
    } catch (e: unknown) {
        // Log or handle error
    }

    // Group activities by signupId
    const activitiesMap: Record<number, TripSignupActivity[]> = {};
    (signups || []).forEach(s => {
        activitiesMap[s.id as number] = [];
    });
    (allSignupSelections || []).forEach((sa) => {
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
            title={`Reis Beheer — ${activeTrip.name}`}
            backHref="/beheer"
            hideToolbar={true}
        >
            <div className="pb-8 space-y-2 animate-in fade-in duration-700">
                <AdminReisTableIsland
                    title={`Reis Beheer — ${activeTrip.name}`}
                    backHref="/beheer"
                    initialSignups={signups}
                    initialSignupActivities={activitiesMap}
                    allTripActivities={allTripActivities}
                    trip={activeTrip as Trip}
                    trips={trips}
                    stats={stats}
                />
            </div>
        </AdminPageShell>
    );
}

function NoTripsView() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] p-12 shadow-xl border border-[var(--beheer-border)] animate-in fade-in zoom-in duration-500">
                <div className="h-20 w-20 rounded-full bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center mx-auto mb-6 shadow-glow">
                    <Ticket className="h-10 w-10" />
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
