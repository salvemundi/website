import type { Metadata } from 'next';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { Settings2, Plane, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminReisSwitcher from '@/components/ui/admin/AdminReisSwitcher';
import AdminReisTableIsland from '@/components/islands/admin/reis/AdminReisTableIsland';
import ReisVisibilityToggle from '@/components/islands/admin/reis/ReisVisibilityToggle';
import { getReisSiteSettings } from '@/server/actions/events/reis/reis-public.actions';
import { getAdminTrips, getAdminTripById } from '@/server/actions/admin/reis/admin-reis-core.actions';
import { getTripSignups, getTripSignupActivitiesAction } from '@/server/actions/admin/reis/admin-reis-signups.actions';
import { getTripActivities } from '@/server/queries/reis/admin-reis.queries';
import { groupActivitiesBySignup } from '@/server/internal/reis/reis-mapping';;;
import {
    tripSchema,
    tripSignupSchema,
    tripSignupActivitySchema,
    tripActivitySchema
} from '@salvemundi/validations';
import { getFeatureFlagSettings } from '@/server/actions/admin/admin-utils.actions';

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

async function loadReisAdminData(tripIdParam: string | undefined) {
    try {
        const [tripsRes, settingsRes, flagConfig] = await Promise.all([
            getAdminTrips(),
            getReisSiteSettings(),
            getFeatureFlagSettings('/reis')
        ]);
        const trips = tripSchema.array().parse(tripsRes);
        const reisSettings = settingsRes || { show: true };
        const canToggleVisibility = flagConfig.canToggleVisibility;

        if (trips.length === 0) {
            return { success: true as const, trips, noTrips: true as const };
        }

        const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
        const activeTrip = trips.find((t) => t.id === activeTripId);
        if (!activeTrip) {
            return { success: false as const, error: 'Reis niet gevonden' };
        }

        const [sRes, saRes, activitiesRes] = await Promise.all([
            getTripSignups(activeTrip.id as number),
            getTripSignupActivitiesAction(activeTrip.id as number),
            getTripActivities(activeTrip.id as number)
        ]);

        const signups = tripSignupSchema.array().parse(sRes);
        const allSignupSelections = tripSignupActivitySchema.array().parse(saRes);
        const allTripActivities = tripActivitySchema.array().parse(activitiesRes);
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
    } catch (error: unknown) {
        return { success: false as const, error: (error instanceof Error) ? error.message : 'Fout bij het laden van gegevens' };
    }
}

export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const data = await loadReisAdminData(tripIdParam);

    if (!data.success) {
        return <AdminUnauthorized title="Geen Toegang" description={data.error} />;
    }

    if (data.noTrips) {
        return (
            <AdminPageShell title="Reis Beheer" backHref="/beheer">
                <NoTripsView />
            </AdminPageShell>
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
        <AdminPageShell
            title={activeTrip.name ?? 'Reis'}
            backHref="/beheer"
            actions={
                <>
                    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                        <div className="hidden items-center gap-4 rounded-2xl border border-border-color bg-bg-card px-5 py-2.5 shadow-sm xl:flex">
                            <StatItem label="Aanmeldingen" value={stats.total} color="text-text-main" />
                            <Divider />
                            <StatItem label="Bevestigd" value={stats.confirmed} color="text-emerald-500" />
                            <Divider />
                            <StatItem label="Wachtlijst" value={stats.waitlist} color="text-amber-500" />
                            <Divider />
                            <StatItem label="Aanbetaling" value={stats.depositPaid} color="text-blue-500" />
                            <Divider />
                            <StatItem label="Restbetaling" value={stats.fullPaid} color="text-purple-500" />
                        </div>
                        <div className="flex w-full flex-wrap items-stretch gap-2 sm:items-center md:w-auto">
                            <AdminReisSwitcher
                                trips={trips}
                                activeTripId={activeTripId as number}
                            />
                            <Link
                                href="/beheer/reis/instellingen"
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-card px-4 py-2 text-xs font-semibold text-text-main shadow-sm transition-all hover:border-theme-purple hover:bg-theme-purple/5 sm:flex-none"
                            >
                                <Settings2 className="size-3.5" />
                                <span className="hidden sm:inline">Instellingen</span>
                            </Link>
                            <ReisVisibilityToggle initialVisible={reisSettings.show} canToggle={canToggleVisibility} />
                        </div>
                    </div>
                </>
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
            <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">{label}</span>
            <span className={`text-sm leading-none font-semibold ${color}`}>{value}</span>
        </div>
    );
}

function Divider() {
    return <div className="h-7 w-px bg-border-color/40" />;
}

function NoTripsView() {
    return (
        <div className="mx-auto max-w-2xl py-20 text-center">
            <div className="rounded-3xl border border-border-color bg-bg-card p-12 shadow-2xl">
                <div className="mx-auto mb-8 flex size-24 items-center justify-center rounded-full border border-theme-purple/20 bg-theme-purple/10 text-theme-purple">
                    <Plane className="size-12 rotate-45" />
                </div>
                <h2 className="mb-2 text-3xl font-semibold text-theme-purple">Geen reizen gevonden</h2>
                <p className="mb-10 text-sm font-semibold text-text-muted">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>
                <Link
                    href="/beheer/reis/instellingen"
                    className="group hover:scale-1.03 inline-flex items-center gap-3 rounded-2xl bg-theme-purple px-10 py-4 text-sm font-semibold text-white shadow-xl transition-all active:scale-95"
                >
                    <LayoutDashboard className="size-5" />
                    <span>Nieuwe reis aanmaken</span>
                </Link>
            </div>
        </div>
    );
}