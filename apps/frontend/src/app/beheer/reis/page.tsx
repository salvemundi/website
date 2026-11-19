import type { Metadata } from 'next';
import BeheerUnauthorized from '@/components/ui/beheer/BeheerUnauthorized';
import { Settings2, Plane, LayoutDashboard, ChevronLeft } from 'lucide-react';
import Link from '@/components/ui/Link';
import { Button, Card, Center, Container, Divider, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
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
            <Container size="xl" py="lg">
                <Stack gap="lg">
                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Group gap="md" wrap="wrap">
                            <Button
                                component={Link}
                                href="/beheer"
                                variant="default"
                                size="sm"
                                leftSection={<ChevronLeft size={16} />}
                            >
                                Terug
                            </Button>
                            <Title order={1} size="h2" c="brand">
                                Reis Beheer
                            </Title>
                        </Group>
                    </Group>

                    <NoTripsView />
                </Stack>
            </Container>
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
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            {activeTrip.name ?? 'Reis'}
                        </Title>
                    </Group>

                    <Group gap="md" wrap="wrap">
                        <Paper withBorder px="md" py="xs" radius="lg" visibleFrom="xl">
                            <Group gap="md" wrap="nowrap">
                                <StatItem label="Aanmeldingen" value={stats.total} />
                                <Divider orientation="vertical" />
                                <StatItem label="Bevestigd" value={stats.confirmed} color="success" />
                                <Divider orientation="vertical" />
                                <StatItem label="Wachtlijst" value={stats.waitlist} color="accent" />
                                <Divider orientation="vertical" />
                                <StatItem label="Aanbetaling" value={stats.depositPaid} color="brand" />
                                <Divider orientation="vertical" />
                                <StatItem label="Restbetaling" value={stats.fullPaid} color="brand" />
                            </Group>
                        </Paper>

                        <Group gap="xs" wrap="wrap">
                            <BeheerReisSwitcher
                                trips={trips}
                                activeTripId={activeTripId as number}
                            />
                            <Button
                                component={Link}
                                href="/beheer/reis/instellingen"
                                variant="default"
                                size="sm"
                                leftSection={<Settings2 size={14} />}
                            >
                                Instellingen
                            </Button>
                            <ReisVisibilityToggle initialVisible={reisSettings.show} canToggle={canToggleVisibility} />
                        </Group>
                    </Group>
                </Group>

                <BeheerReisTableIsland
                    trip={activeTrip}
                    initialSignups={signups}
                    initialSignupActivities={activitiesMap}
                    allTripActivities={allTripActivities}
                />
            </Stack>
        </Container>
    );
}

function StatItem({ label, value, color }: { label: string; value: number; color?: string }) {
    return (
        <Stack gap={2} align="center" px={4}>
            <Text size="xs" c="dimmed" fw={700} tt="uppercase" lh={1}>
                {label}
            </Text>
            <Text size="sm" fw={700} lh={1} c={color} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {value}
            </Text>
        </Stack>
    );
}

function NoTripsView() {
    return (
        <Center py="xl">
            <Card withBorder radius="lg" padding="xl" maw={560} w="100%" ta="center">
                <Stack align="center" gap="md" py="lg">
                    <ThemeIcon size={64} radius="lg" variant="light" color="brand">
                        <Plane size={32} />
                    </ThemeIcon>
                    <Title order={2} size="h3" c="brand">
                        Geen reizen gevonden
                    </Title>
                    <Text size="sm" c="dimmed">
                        Er zijn momenteel geen actieve of geplande reizen in het systeem.
                    </Text>
                    <Button
                        component={Link}
                        href="/beheer/reis/instellingen"
                        color="accent"
                        leftSection={<LayoutDashboard size={16} />}
                    >
                        Nieuwe reis aanmaken
                    </Button>
                </Stack>
            </Card>
        </Center>
    );
}