import type { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import BeheerUnauthorized from '@/components/ui/beheer/BeheerUnauthorized';
import { notFound } from 'next/navigation';
import Link from '@/components/ui/Link';
import ActiviteitAanmeldingenIsland, { type Signup, type AdminEvent } from '@/components/islands/beheer/activities/ActiviteitAanmeldingenIsland';
import {
    getActivityByIdInternal,
    getActivitySignupsInternal
} from '@/server/queries/activiteiten/beheer-activiteiten.queries';

export const metadata: Metadata = {
    title: 'Activiteit Aanmeldingen | SV Salve Mundi'
};

export default async function AanmeldingenPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getEnrichedSession();
    if (!session) return <BeheerUnauthorized title="Activiteit Aanmeldingen" />;

    const user = session.user;
    const hasAccess = !!user.permissions?.includes('activiteiten');

    const eventData = await getActivityByIdInternal(id);

    if (!eventData) return notFound();

    if (!hasAccess) {
        return (
            <BeheerUnauthorized
                title="Activiteit Aanmeldingen"
                description="Je hebt geen rechten om deze aanmeldingen te bekijken. Dit gedeelte is alleen voor commissieleden, bestuur of ICT."
            />
        );
    }

    const event: AdminEvent = {
        id: eventData.id,
        name: eventData.name,
        price_members: Number(eventData.price_members),
        max_sign_ups: eventData.max_sign_ups
    };

    const dbSignups = await getActivitySignupsInternal(id);

    const signups: Signup[] = dbSignups.map(s => ({
        id: s.id,
        participant_name: s.participant_name || 'Onbekend',
        participant_email: s.participant_email || '-',
        participant_phone: s.participant_phone,
        payment_status: s.payment_status || 'open',
        amount_paid: s.amount_paid,
        created_at: s.created_at || new Date().toISOString(),
        checked_in: !!s.checked_in,
        is_member: !!s.is_member,
        directus_relations: s.directus_relations as unknown as Signup['directus_relations']
    }));

    const totalSignups = signups.length;
    const checkedInCount = signups.filter(s => s.checked_in).length;
    const spotsLeft = event.max_sign_ups ? event.max_sign_ups - totalSignups : null;

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer/activiteiten"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                Aanmeldingen
                            </Title>
                            <Text size="sm" c="dimmed">
                                Lijst van deelnemers voor &quot;{event.name}&quot;
                            </Text>
                        </Stack>
                    </Group>

                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href={`/beheer/activiteiten/${id}/scanner`}
                            size="sm"
                            visibleFrom="md"
                        >
                            Scanner
                        </Button>
                        <Paper withBorder px="md" py="xs" visibleFrom="md">
                            <Group gap="md" wrap="nowrap">
                                <Stack gap={2} align="center" px={4}>
                                    <Text size="xs" c="dimmed" fw={600} lh={1}>Totaal</Text>
                                    <Text size="sm" fw={700} lh={1}>{totalSignups}</Text>
                                </Stack>
                                <Divider orientation="vertical" />
                                <Stack gap={2} align="center" px={4}>
                                    <Text size="xs" c="dimmed" fw={600} lh={1}>Ingecheckt</Text>
                                    <Text size="sm" fw={700} lh={1} c="success">{checkedInCount}</Text>
                                </Stack>
                                {spotsLeft !== null && (
                                    <>
                                        <Divider orientation="vertical" />
                                        <Stack gap={2} align="center" px={4}>
                                            <Text size="xs" c="dimmed" fw={600} lh={1}>Plekken over</Text>
                                            <Text size="sm" fw={700} lh={1}>{spotsLeft}</Text>
                                        </Stack>
                                    </>
                                )}
                            </Group>
                        </Paper>
                    </Group>
                </Group>

                <ActiviteitAanmeldingenIsland
                    event={event}
                    initialSignups={signups}
                    canAccessEdit={!!user.permissions?.includes('activiteiten:edit')}
                />
            </Stack>
        </Container>
    );
}