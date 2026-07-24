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
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="hidden xl:flex items-center gap-4 bg-bg-card px-5 py-2.5 rounded-2xl border border-border-color shadow-sm">
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
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <AdminReisSwitcher
                                trips={trips}
                                activeTripId={activeTripId as number}
                            />
                            <Link
                                href="/beheer/reis/instellingen"
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-bg-card border border-border-color text-text-main rounded-xl text-xs font-semibold hover:border-theme-purple hover:bg-theme-purple/5 transition-all shadow-sm"
                            >
                                <Settings2 className="h-3.5 w-3.5" />
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
            <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">{label}</span>
            <span className={`text-sm font-semibold leading-none ${color}`}>{value}</span>
        </div>
    );
}

function Divider() {
    return <div className="w-px h-7 bg-border-color/40" />;
}

function NoTripsView() {
    return (
        <div className="py-20 max-w-2xl text-center mx-auto">
            <div className="bg-bg-card rounded-3xl p-12 shadow-2xl border border-border-color">
                <div className="h-24 w-24 rounded-full bg-theme-purple/10 text-theme-purple flex items-center justify-center mx-auto mb-8 border border-theme-purple/20">
                    <Plane className="h-12 w-12 rotate-45" />
                </div>
                <h2 className="text-3xl font-semibold text-theme-purple mb-2">Geen reizen gevonden</h2>
                <p className="text-text-muted font-semibold text-sm mb-10">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>
                <Link
                    href="/beheer/reis/instellingen"
                    className="inline-flex items-center gap-3 px-10 py-4 bg-theme-purple text-white rounded-2xl font-semibold text-sm shadow-xl transition-all hover:scale-[1.03] active:scale-95 group"
                >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Nieuwe reis aanmaken</span>
                </Link>
            </div>
        </div>
    );
}