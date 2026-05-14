import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';


// V7 Specifics
import AdminReisTableIsland from '@/components/islands/admin/AdminReisTableIsland';
import { Ticket, Plus, Mail, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReisSiteSettings } from '@/server/actions/events/reis.actions';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { getAdminTrips, getAdminTripById } from '@/server/actions/admin/reis-core.actions';
import { getTripSignups, getTripSignupActivitiesAction } from '@/server/actions/admin/reis-signups.actions';
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
            const trip = await getAdminTripById(Number(tripIdParam)) as unknown as Trip;
            if (trip && trip.name) {
                title = `${trip.name} - Aanmeldingen | SV Salve Mundi`;
            }
        } catch (_error) {
            // Fallback to default
        }
    }

    return { title };
}

export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    const { user: _user } = await checkAdminAccess();
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    // Fetch initial trips and settings concurrently
    let trips: Trip[] = [];
    let _reisSettings = { show: true };
    let errorMsg: string | null = null;

    try {
        const [tripsRes, settingsRes] = await Promise.all([
            getAdminTrips(),
            getReisSiteSettings()
        ]);

        trips = (tripsRes as unknown as Trip[]) || [];
        _reisSettings = settingsRes || { show: true };
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
    } catch {
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
        fullPaid: signups.filter((s) => s.full_payment_paid).length
    };

    return (
        <AdminPageShell
            title={`Reis Beheer — ${activeTrip.name}`}
            subtitle="Beheer aanmeldingen, activiteiten en instellingen voor deze reis"
            backHref="/beheer"
            actions={
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="hidden xl:flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Aanmeldingen</span>
                            <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{stats.total}</span>
                        </div>
                        <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Bevestigd</span>
                            <span className="text-sm font-bold text-[var(--beheer-active)] leading-none">{stats.confirmed}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Trip Switcher - Logic moves here */}
                        <div className="relative group min-w-[160px]">
                            <select
                                defaultValue={activeTripId}
                                // This is a bit tricky in a Server Component without a client wrapper for the select
                                // But we can use a client component for just the switcher if needed
                                className="beheer-select w-full pr-8 py-1.5 text-xs font-semibold"
                            >
                                {trips.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {/* Note: Switcher logic will need a small client wrapper or we use the one in the island */}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Link
                                href="/beheer/reis/mail"
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl text-[11px] font-semibold hover:border-[var(--beheer-accent)]/50 transition-all shadow-sm"
                            >
                                <Mail className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                                Email
                            </Link>
                            <Link
                                href="/beheer/reis/instellingen"
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl text-[11px] font-semibold hover:border-[var(--beheer-accent)]/50 transition-all shadow-sm"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                                Instellingen
                            </Link>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="pb-8">
                <AdminReisTableIsland
                    title={activeTrip.name}
                    trip={activeTrip as Trip}
                    initialSignups={signups}
                    initialSignupActivities={activitiesMap}
                    allTripActivities={allTripActivities}
                />
            </div>
        </AdminPageShell>
    );
}

function NoTripsView() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] p-12 shadow-xl border border-[var(--beheer-border)]">
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
