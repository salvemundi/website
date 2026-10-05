import type { Metadata } from 'next';
import BeheerUnauthorized from '@/components/ui/beheer/BeheerUnauthorized';
import { Settings2, Plane, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import BeheerReisSwitcher from '@/components/ui/beheer/BeheerReisSwitcher';
import BeheerReisTableIsland from '@/components/islands/beheer/reis/BeheerReisTableIsland';
import ReisVisibilityToggle from '@/components/islands/beheer/reis/ReisVisibilityToggle';
import { getReisSiteSettings } from '@/server/actions/events/reis/reis-public.actions';
import { getBeheerTrips, getBeheerTripById } from '@/server/actions/beheer/reis/beheer-reis-core.actions';
import { getTripSignups, getTripSignupActivitiesAction } from '@/server/actions/beheer/reis/beheer-reis-signups.actions';
import { getTripActivities } from '@/server/queries/reis/beheer-reis.queries';
import { groupActivitiesBySignup } from '@/server/internal/reis/reis-mapping';
import { getFeatureFlagSettings } from '@/server/actions/beheer/beheer-utils.actions';
import { safeConsoleError } from '@/server/utils/logger';

interface AdminReisPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: AdminReisPageProps): Promise<Metadata> {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;
    let title = 'Beheer Reis | SV Salve Mundi';
    if (tripIdParam) {
        const tripsRes = await getBeheerTripById(Number(tripIdParam));
        if (tripsRes?.name) {
            title = `${tripsRes.name} - Aanmeldingen | SV Salve Mundi`;
        }
    }
    return { title };
}

async function loadReisAdminData(tripIdParam: string | undefined) {
    const [tripsRes, settingsRes, flagConfig] = await Promise.all([
        getBeheerTrips(),
        getReisSiteSettings(),
        getFeatureFlagSettings('/reis')
    ]);
    const trips = tripsRes;
    const reisSettings = settingsRes || { show: true };
    const canToggleVisibility = flagConfig.canToggleVisibility;

    if (trips.length === 0) {
        return { success: true as const, trips, noTrips: true as const };
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find((t) => t.id === activeTripId);
    if (!activeTrip) {
        return { success: false as const, error: 'Reis niet gevonden', notFound: true as const };
    }

    const [signups, allSignupSelections, allTripActivities] = await Promise.all([
        getTripSignups(activeTrip.id),
        getTripSignupActivitiesAction(activeTrip.id),
        getTripActivities(activeTrip.id)
    ]);

    const activitiesMap = groupActivitiesBySignup(signups, allSignupSelections);

    const stats = {
        total: signups.filter((s) => s.status !== 'cancelled').length,
        confirmed: signups.filter((s) => s.status === 'confirmed').length,
        waitlist: signups.filter((s) => s.status === 'waitlist').length,
        depositPaid: signups.filter((s) => s.deposit_paid).length,
        fullPaid: signups.filter((s) => s.full_payment_paid).length,
    };

    return {
        success: true as const,
        trips,
        reisSettings,
        canToggleVisibility,
        activeTrip,
        activeTripId,
        signups,
        allTripActivities,
        activitiesMap,
        stats,
        noTrips: false as const
    };
}

type AdminReisData = Awaited<ReturnType<typeof loadReisAdminData>>;

export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    let data: AdminReisData;
    try {
        data = await loadReisAdminData(tripIdParam);
    } catch (error: unknown) {
        safeConsoleError('[beheer/reis/page.tsx][AdminReisPage] Error loading admin trip data:', error);
        const message = error instanceof Error ? error.message : '';
        if (message.toLowerCase().includes('toegang') || message.toLowerCase().includes('unauthorized')) {
            return <BeheerUnauthorized title="Geen Toegang" />;
        }
        throw error;
    }

    if (!data.success) {
        return <BeheerUnauthorized title="Reis niet gevonden" description={data.error} />;
    }

    if (data.noTrips) {
        return (
            <BeheerPageShell title="Reis Beheer" backHref="/beheer">
                <NoTripsView />
            </BeheerPageShell>
        );
    }

    const {
        trips,
        reisSettings,
        canToggleVisibility,
        activeTrip,
        activeTripId,
        signups,
        allTripActivities,
        activitiesMap,
        stats
    } = data;

    return (
        <BeheerPageShell
            title={activeTrip.name ?? 'Reis naam onbekend'}
            backHref="/beheer"
            actions={
                <>
                    <div className="admin-action-header-row">
                        <div className="beheer-stat-strip hidden xl:flex">
                            <StatItem label="Aanmeldingen" value={stats.total} color="stat-val-main" />
                            <Divider />
                            <StatItem label="Bevestigd" value={stats.confirmed} color="stat-val-success" />
                            <Divider />
                            <StatItem label="Wachtlijst" value={stats.waitlist} color="stat-val-warning" />
                            <Divider />
                            <StatItem label="Aanbetaling" value={stats.depositPaid} color="stat-val-info" />
                            <Divider />
                            <StatItem label="Restbetaling" value={stats.fullPaid} color="stat-val-purple" />
                        </div>
                        <div className="admin-action-button-group">
                            <BeheerReisSwitcher
                                trips={trips}
                                activeTripId={activeTripId as number}
                            />
                            <Link
                                href="/beheer/reis/instellingen"
                                className="beheer-button-secondary flex-1 text-beheer-text sm:flex-none"
                            >
                                <Settings2 className="size-3.5 text-beheer-accent" />
                                <span className="hidden sm:inline">Instellingen</span>
                            </Link>
                            <ReisVisibilityToggle initialVisible={reisSettings.show} canToggle={canToggleVisibility} />
                        </div>
                    </div>
                </>
            }
        >
            <div className="pb-8">
                <BeheerReisTableIsland
                    trip={activeTrip}
                    initialSignups={signups}
                    initialSignupActivities={activitiesMap}
                    allTripActivities={allTripActivities}
                />
            </div>
        </BeheerPageShell>
    );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex flex-col items-center px-1">
            <span className="stat-label-muted">{label}</span>
            <span className={color}>{value}</span>
        </div>
    );
}

function Divider() {
    return <div className="v-divider-sm" />;
}

function NoTripsView() {
    return (
        <div className="mx-auto max-w-2xl py-20 text-center">
            <div className="no-trips-card">
                <div className="no-trips-icon-wrapper">
                    <Plane className="size-10 rotate-45 text-theme-purple" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-theme-purple">Geen reizen gevonden</h2>
                <p className="mb-8 text-sm font-medium text-beheer-text-muted">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>
                <Link
                    href="/beheer/reis/instellingen"
                    className="beheer-button-secondary beheer-button"
                >
                    <LayoutDashboard className="size-4" />
                    <span>Nieuwe reis aanmaken</span>
                </Link>
            </div>
        </div>
    );
}