import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { notFound } from 'next/navigation';
import { getActivityById } from '@/server/actions/events/activiteiten/activiteiten-public.actions';
import { getActivitySignups } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-core.actions';
import AttendanceIsland from '@/components/islands/activiteiten/AttendanceIsland';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import BeheerUnauthorized from '@/components/ui/beheer/BeheerUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';

export const metadata: Metadata = {
    title: 'Aanwezigheidsbeheer | SV Salve Mundi'
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AttendancePage({ params }: PageProps) {
    const { id } = await params;
    const { isAuthorized, user } = await checkBeheerAccess();

    if (!isAuthorized || !user) return notFound();

    const permissions = getPermissions(user.committees);
    if (!permissions.includes('activiteiten')) {
        return <BeheerUnauthorized title="Aanwezigheidsbeheer" backHref={`/beheer/activiteiten/${id}`} />;
    }

    const [activity, signups] = await Promise.all([
        getActivityById(id),
        getActivitySignups(id)
    ]);

    if (!activity) return notFound();

    const mappedSignups = signups.map(s => ({
        id: s.id || 0,
        participant_name: s.participant_name || 'Onbekend',
        participant_email: s.participant_email || 'Geen email',
        checked_in: !!s.checked_in,
        qr_token: s.qr_token || undefined,
        checked_in_at: s.checked_in_at || null
    }));

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href={`/beheer/activiteiten/${id}/aanmeldingen`}
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                Aanwezigheid
                            </Title>
                            <Text size="sm" c="dimmed">
                                Beheer de aanwezigheid voor &quot;{activity.name}&quot;.
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                <AttendanceIsland
                    eventId={id}
                    eventName={activity.name}
                    initialSignups={mappedSignups}
                />
            </Stack>
        </Container>
    );
}


