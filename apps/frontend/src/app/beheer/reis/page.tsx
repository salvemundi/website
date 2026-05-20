import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { Mail, Settings2, Plane, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminTripSwitcher from '@/components/ui/admin/AdminTripSwitcher';
import AdminReisTableIsland from '@/components/islands/admin/AdminReisTableIsland';
import ReisVisibilityToggle from '@/components/islands/admin/reis/ReisVisibilityToggle';

import { getReisSiteSettings } from '@/server/actions/events/reis.actions';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { getAdminTrips, getAdminTripById } from '@/server/actions/admin/reis-core.actions';
import { getTripSignups, getTripSignupActivitiesAction } from '@/server/actions/admin/reis-signups.actions';
import { getTripActivities } from '@/server/queries/admin-reis.queries';
import { groupActivitiesBySignup } from '@/server/utils/reis-mapping';

import {
    tripSchema,
    tripSignupSchema,
    tripSignupActivitySchema,
    tripActivitySchema
} from '@salvemundi/validations';

interface AdminReisPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: AdminReisPageProps): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    let title = 'Beheer Reis | SV Salve Mundi';

    if (tripIdParam) {
        const tripsRes = await getAdminTripById(Number(tripIdParam));
        if (tripsRes) {
            const trip = tripSchema.parse(tripsRes);
            if (trip.name) {
                title = `${trip.name} - Aanmeldingen | SV Salve Mundi`;
            }
        }
    }

    return { title };
}

export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    try {
        await checkAdminAccess();
    } catch (e: unknown) {
        const msg = (e instanceof Error) ? e.message : 'Niet geautoriseerd';
        return <AdminUnauthorized title="Geen Toegang" description={msg} />;
    }

    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const [tripsRes, settingsRes] = await Promise.all([
        getAdminTrips(),
        getReisSiteSettings()
    ]);

    const trips = tripSchema.array().parse(tripsRes);
    const _reisSettings = settingsRes || { show: true };

    if (trips.length === 0) {
        return (
            <AdminPageShell title="Reis Beheer" backHref="/beheer">
                <NoTripsView />
            </AdminPageShell>
        );
    }

    // 3. Determine active trip
    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find((t) => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    // 4. Fetch trip-specific data concurrently (Nuclear SSR)
    const [sRes, saRes, activitiesRes] = await Promise.all([
        getTripSignups(activeTrip.id as number),
        getTripSignupActivitiesAction(activeTrip.id as number),
        getTripActivities(activeTrip.id as number)
    ]);

    // Validation - Throwing here is desired if data is corrupt
    const signups = tripSignupSchema.array().parse(sRes);
    const allSignupSelections = tripSignupActivitySchema.array().parse(saRes);
    const allTripActivities = tripActivitySchema.array().parse(activitiesRes);

    // 5. Group activities for the island
    const activitiesMap = groupActivitiesBySignup(signups, allSignupSelections);

    // 6. Detailed Stats (Old Logic preserved, New Styling applied)
    const stats = {
        total: signups.filter((s) => s.status !== 'cancelled').length,
        confirmed: signups.filter((s) => s.status === 'confirmed').length,
        waitlist: signups.filter((s) => s.status === 'waitlist').length,
        depositPaid: signups.filter((s) => s.deposit_paid).length,
        fullPaid: signups.filter((s) => s.full_payment_paid).length,
    };

    return (
        <AdminPageShell
            title={activeTrip.name}
            backHref="/beheer"
            actions={
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="hidden xl:flex items-center gap-4 bg-[var(--beheer-card-bg)] px-5 py-2.5 rounded-2xl border border-[var(--beheer-border)] shadow-sm">
                        <StatItem label="Aanmeldingen" value={stats.total} color="text-[var(--beheer-text)]" />
                        <Divider />
                        <StatItem label="Bevestigd" value={stats.confirmed} color="text-emerald-500" />
                        <Divider />
                        <StatItem label="Wachtlijst" value={stats.waitlist} color="text-amber-500" />
                        <Divider />
                        <StatItem label="Aanbetaling" value={stats.depositPaid} color="text-blue-500" />
                        <Divider />
                        <StatItem label="Restbetaling" value={stats.fullPaid} color="text-purple-500" />
                    </div>

                    <div className="flex items-center gap-2">
                        <AdminTripSwitcher
                            trips={trips}
                            activeTripId={activeTripId as number}
                        />

                        <div className="flex items-center gap-1.5">
                            <Link
                                href="/beheer/reis/mail"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl text-xs font-semibold hover:border-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all shadow-sm"
                            >
                                <Mail className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Mailen</span>
                            </Link>
                            <Link
                                href="/beheer/reis/instellingen"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl text-xs font-semibold hover:border-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all shadow-sm"
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Instellingen</span>
                            </Link>
                        </div>

                        <ReisVisibilityToggle initialVisible={_reisSettings.show} />
                    </div>
                </div>
            }
        >
            <div className="pb-8">
                <AdminReisTableIsland
                    trip={activeTrip}
                    initialSignups={signups}
                    initialSignupActivities={activitiesMap}
                    allTripActivities={allTripActivities}
                />
            </div>
        </AdminPageShell>
    );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex flex-col items-center px-1">
            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">{label}</span>
            <span className={`text-sm font-semibold leading-none ${color}`}>{value}</span>
        </div>
    );
}

function Divider() {
    return <div className="w-px h-7 bg-[var(--beheer-border)]/40" />;
}

function NoTripsView() {
    return (
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] p-12 shadow-2xl border border-[var(--beheer-border)]">
                <div className="h-24 w-24 rounded-full bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center mx-auto mb-8 border border-[var(--beheer-accent)]/20">
                    <Plane className="h-12 w-12 rotate-45" />
                </div>
                <h2 className="text-3xl font-semibold text-[var(--beheer-text)] mb-2">Geen reizen gevonden</h2>
                <p className="text-[var(--beheer-text-muted)] font-semibold text-sm mb-10">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>

                <Link
                    href="/beheer/reis/instellingen"
                    className="inline-flex items-center gap-3 px-10 py-4 bg-[var(--beheer-accent)] text-white rounded-2xl font-semibold text-sm shadow-xl transition-all hover:scale-[1.03] active:scale-95 group"
                >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Nieuwe reis aanmaken</span>
                </Link>
            </div>
        </div>
    );
}
