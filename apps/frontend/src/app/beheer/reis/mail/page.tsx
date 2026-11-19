import type { Metadata } from 'next';
import ReisMailIsland from '@/components/islands/beheer/reis/ReisMailIsland';
import { notFound } from 'next/navigation';
import { type Trip, type TripSignup } from '@salvemundi/validations';
import Link from '@/components/ui/Link';
import { ChevronLeft, Ticket } from 'lucide-react';
import { Button, Center, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { getTripsForMail, getTripSignupsForMail } from '@/server/queries/reis/beheer-reis.queries';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
    title: 'Reis Mail Beheer | SV Salve Mundi'
};

export default async function ReisMailPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const tripsRaw = await getTripsForMail();
    const trips = tripsRaw as unknown as Trip[];

    if (trips.length === 0) {
        return (
            <Container size="xl" py="lg">
                <Stack gap="lg">
                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Group gap="md" wrap="wrap">
                            <Button
                                component={Link}
                                href="/beheer/reis"
                                variant="default"
                                size="sm"
                                leftSection={<ChevronLeft size={16} />}
                            >
                                Terug
                            </Button>
                            <Title order={1} size="h2" c="brand">
                                Reis Mail
                            </Title>
                        </Group>
                    </Group>

                    <Paper withBorder p="xl" radius="lg">
                        <Center py="xl">
                            <Text fw={700} c="dimmed" fs="italic">
                                Geen reizen gevonden.
                            </Text>
                        </Center>
                    </Paper>
                </Stack>
            </Container>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : (trips[0].id as number);
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    const signupsRaw = await getTripSignupsForMail(activeTripId);
    const signups = signupsRaw as unknown as TripSignup[];

    const confirmedCount = signups.filter(s => s.status === 'confirmed').length;
    const unpaidCount = signups.filter(s => s.status !== 'cancelled' && !s.full_payment_paid).length;

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer/reis"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                Reis Mail — {activeTrip.name}
                            </Title>
                            <Text size="sm" c="dimmed">
                                Verstuur bulk e-mails naar groepen reizigers
                            </Text>
                        </Stack>
                    </Group>

                    <Group gap="md" wrap="wrap">
                        <Paper withBorder px="md" py="xs" radius="lg" visibleFrom="md">
                            <Group gap="md" wrap="nowrap">
                                <Stack gap={2} align="center" px={4}>
                                    <Text size="xs" c="dimmed" fw={600} lh={1}>Bevestigde Reizigers</Text>
                                    <Text size="sm" fw={700} lh={1} c="success">{confirmedCount}</Text>
                                </Stack>
                                <Divider orientation="vertical" />
                                <Stack gap={2} align="center" px={4}>
                                    <Text size="xs" c="dimmed" fw={600} lh={1}>Openstaande Betalingen</Text>
                                    <Text size="sm" fw={700} lh={1} c="error">{unpaidCount}</Text>
                                </Stack>
                            </Group>
                        </Paper>
                        <Button
                            component={Link}
                            href={`/beheer/reis?tripId=${activeTripId}`}
                            variant="default"
                            size="sm"
                            leftSection={<Ticket size={14} />}
                        >
                            Dashboard
                        </Button>
                    </Group>
                </Group>

                <ReisMailIsland
                    trips={trips}
                    initialSignups={signups}
                    initialSelectedTripId={activeTripId}
                />
            </Stack>
        </Container>
    );
}