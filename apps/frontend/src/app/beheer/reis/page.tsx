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
            title={activeTrip.name ?? 'Reis'}
            backHref="/beheer"
            actions={
                <>
                    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                        <div className="hidden items-center gap-4 rounded-2xl border border-(--beheer-border) bg-(--beheer-card-bg) px-5 py-2.5 shadow-sm xl:flex">
                            <StatItem label="Aanmeldingen" value={stats.total} color="text-(--beheer-text)" />
                            <Divider />
                            <StatItem label="Bevestigd" value={stats.confirmed} color="text-emerald-600 dark:text-emerald-400" />
                            <Divider />
                            <StatItem label="Wachtlijst" value={stats.waitlist} color="text-amber-600 dark:text-amber-400" />
                            <Divider />
                            <StatItem label="Aanbetaling" value={stats.depositPaid} color="text-blue-600 dark:text-blue-400" />
                            <Divider />
                            <StatItem label="Restbetaling" value={stats.fullPaid} color="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex w-full flex-wrap items-stretch gap-2 sm:items-center md:w-auto">
                            <BeheerReisSwitcher
                                trips={trips}
                                activeTripId={activeTripId as number}
                            />
                            <Link
                                href="/beheer/reis/instellingen"
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2 text-xs font-semibold text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 hover:bg-(--beheer-accent)/5 sm:flex-none"
                            >
                                <Settings2 className="size-3.5 text-(--beheer-accent)" />
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
            <span className="mb-1 text-[10px] font-bold tracking-wider text-(--beheer-text-muted) uppercase">{label}</span>
            <span className={`text-sm font-semibold tabular-nums ${color}`}>{value}</span>
        </div>
    );
}

function Divider() {
    return <div className="h-7 w-px bg-(--beheer-border)/40" />;
}

function NoTripsView() {
    return (
        <div className="mx-auto max-w-2xl py-20 text-center">
            <div className="rounded-3xl border border-(--beheer-border) bg-(--beheer-card-bg) p-12 shadow-xl">
                <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl border border-purple-500/10 bg-purple-500/5 text-purple-700 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                    <Plane className="size-10 rotate-45 text-purple-500 dark:text-purple-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-purple-700 dark:text-purple-300">Geen reizen gevonden</h2>
                <p className="mb-8 text-sm font-medium text-(--beheer-text-muted)">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>
                <Link
                    href="/beheer/reis/instellingen"
                    className="beheer-button inline-flex items-center gap-2 rounded-xl border border-white/10 bg-(--beheer-accent) px-8 py-3 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                >
                    <LayoutDashboard className="size-4" />
                    <span>Nieuwe reis aanmaken</span>
                </Link>
            </div>
        </div>
    );
}